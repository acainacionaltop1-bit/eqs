import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const pushinpayRoutes = new Hono<{ Bindings: Env }>();

// Schema for checkout request
const checkoutSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  cpf: z.string().optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  vip_level: z.number().int().min(1).max(6).optional()
});

// Create PIX QR Code
pushinpayRoutes.post('/checkout', zValidator('json', checkoutSchema), async (c) => {
  try {
    const { name, phone, email, cpf, amount, description, vip_level } = c.req.valid('json');
    const pushinPayApiKey = c.env.PUSHIN_PAY_API_KEY;
    
    if (!pushinPayApiKey) {
      return c.json({ error: 'Pushin Pay API key not configured' }, 500);
    }

    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const amountInCents = Math.round(amount * 100);

    // Create QR Code via Pushin Pay API
    const pushinPayResponse = await (globalThis as any).fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pushinPayApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: amountInCents,
        webhook_url: `${new (globalThis as any).URL(c.req.url).origin}/api/pushinpay/webhook`,
        split_rules: []
      }),
    });

    if (!pushinPayResponse.ok) {
      return c.json({ error: 'Error generating QR code. Check API credentials.' }, 400);
    }

    const pushinPayData = await pushinPayResponse.json();

    // Save transaction to database
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    
    await c.env.DB.prepare(`
      INSERT INTO pushin_transactions (
        user_id, qr_code_id, amount, vip_level, status, expires_at,
        user_email, user_name, user_cpf, user_phone, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      pushinPayData.id,
      amount,
      vip_level || null,
      'pending',
      expiresAt.toISOString(),
      email,
      name,
      cpf || null,
      phone,
      description
    ).run();

    return c.json({
      qrCode: pushinPayData.qr_code_base64,
      pixKey: pushinPayData.qr_code,
      transactionId: pushinPayData.id,
      status: pushinPayData.status,
      expiresAt: expiresAt.toISOString(),
      amount
    });

  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Check transaction status
pushinpayRoutes.get('/transaction/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId');
    
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions WHERE qr_code_id = ?
    `).bind(transactionId).first();

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({
      id: transaction.qr_code_id,
      status: transaction.status,
      amount: transaction.amount,
      vip_level: transaction.vip_level,
      expires_at: transaction.expires_at,
      processed_at: transaction.processed_at,
      payer_name: transaction.payer_name
    });

  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Webhook to receive payment confirmations
pushinpayRoutes.post('/webhook', async (c) => {
  try {
    const webhook = await c.req.json();

    const transaction = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions WHERE qr_code_id = ?
    `).bind(webhook.id).first();

    if (!transaction) {
      return c.text('Transaction not found', 404);
    }

    let newStatus = 'pending';
    if (webhook.status === 'paid') {
      newStatus = 'approved';
    } else if (webhook.status === 'expired') {
      newStatus = 'cancelled';
    }

    // Update transaction status
    await c.env.DB.prepare(`
      UPDATE pushin_transactions 
      SET status = ?, processed_at = ?, end_to_end_id = ?, payer_name = ?, payer_document = ?
      WHERE qr_code_id = ?
    `).bind(
      newStatus,
      new Date().toISOString(),
      webhook.end_to_end_id || null,
      webhook.payer_name || null,
      webhook.payer_national_registration || null,
      webhook.id
    ).run();

    // If payment approved, activate VIP plan
    if (newStatus === 'approved' && transaction.vip_level) {
      // Update user's VIP status
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      await c.env.DB.prepare(`
        INSERT INTO vip_purchases (
          user_id, vip_level, purchase_date, amount, payment_status,
          payment_reference, expires_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        transaction.user_id,
        transaction.vip_level,
        new Date().toISOString(),
        transaction.amount,
        'completed',
        webhook.id,
        expiresAt.toISOString(),
        true
      ).run();

      // Update user's daily limit based on VIP level
      const vipLimits: Record<number, number> = {
        1: 15, 2: 20, 3: 25, 4: 30, 5: 35, 6: 40
      };
      
      const newLimit = vipLimits[transaction.vip_level] || 15;
      
      await c.env.DB.prepare(`
        UPDATE users SET daily_limit = ? WHERE id = ?
      `).bind(newLimit, transaction.user_id).run();
    }

    return c.text('OK', 200);

  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { pushinpayRoutes };
