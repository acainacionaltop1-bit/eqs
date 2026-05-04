// Test endpoint to simulate webhook payment confirmation
// This is for testing purposes only

import { Hono } from 'hono';

const webhookTestRoutes = new Hono<{ Bindings: Env }>();

// Simulate pushinpay webhook for testing
webhookTestRoutes.post('/simulate-payment/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId');
    
    // Find the transaction
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions WHERE qr_code_id = ?
    `).bind(transactionId).first();

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Simulate webhook payload
    const webhookPayload = {
      id: transactionId,
      status: 'paid',
      end_to_end_id: `E${Date.now()}`,
      payer_name: 'Teste Usuário',
      payer_national_registration: '12345678901'
    };

    // Call the webhook endpoint directly
    const webhookResponse = await (globalThis as any).fetch(`${c.req.header('origin') || 'http://localhost:5173'}/api/pushinpay/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await webhookResponse.json();

    return c.json({
      success: true,
      message: 'Payment simulation sent to webhook',
      webhook_response: result,
      simulated_payload: webhookPayload
    });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export { webhookTestRoutes };
