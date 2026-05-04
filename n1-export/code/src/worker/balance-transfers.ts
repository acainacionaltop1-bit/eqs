import { Hono } from 'hono';

interface BalanceTransferRequest {
  user_email: string;
  amount: number;
  reason: string;
  type: 'add' | 'subtract';
}

export const balanceTransfersRouter = new Hono<{ Bindings: Env }>();

// Helper function to get admin user
async function getAdminUserFromContext(c: any, DB: any) {
  // Get user from context (already authenticated by adminMiddleware)
  const mochaUser = c.get('user');
  if (!mochaUser) {
    throw new Error('Usuário não encontrado no contexto');
  }

  // Try to find user in database by email
  let adminUser = await DB.prepare(
    'SELECT id, email, name, is_admin FROM users WHERE email = ?'
  ).bind(mochaUser.email).first();

  // If user doesn't exist in our database, create them
  if (!adminUser) {
    const affiliateCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await DB.prepare(`
      INSERT INTO users (email, name, affiliate_code, current_balance, total_earnings, total_videos_watched, daily_videos_watched, bonus_videos, level, daily_limit, is_admin, auth_provider)
      VALUES (?, ?, ?, 2.0, 0.0, 0, 0, 0, 1, 10, 1, 'google')
    `).bind(
      mochaUser.email,
      mochaUser.google_user_data?.name || mochaUser.email,
      affiliateCode
    ).run();

    adminUser = await DB.prepare(
      'SELECT id, email, name, is_admin FROM users WHERE id = ?'
    ).bind(result.meta.last_row_id).first();
  }

  // Ensure user is admin
  if (!adminUser.is_admin) {
    throw new Error('Usuário não tem permissões de administrador');
  }

  return adminUser;
}

// Create balance transfer
balanceTransfersRouter.post('/', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json() as BalanceTransferRequest;
    const { user_email, amount, reason, type } = body;
    
    // Validate required fields
    if (!user_email || !amount || !reason || !type) {
      return c.json({ error: 'Campos obrigatórios: user_email, amount, reason, type' }, 400);
    }
    
    if (amount <= 0) {
      return c.json({ error: 'O valor deve ser maior que zero' }, 400);
    }
    
    if (!['add', 'subtract'].includes(type)) {
      return c.json({ error: 'Tipo deve ser "add" ou "subtract"' }, 400);
    }
    
    // Get admin user (with better error handling)
    let adminUser;
    try {
      adminUser = await getAdminUserFromContext(c, DB);
    } catch (error: any) {
      return c.json({ error: error.message }, 401);
    }
    
    // Find target user - try multiple strategies
    let targetUser;
    
    // Strategy 1: Exact match
    targetUser = await DB.prepare(
      'SELECT id, email, name, current_balance FROM users WHERE email = ?'
    ).bind(user_email).first();
    
    // Strategy 2: Case insensitive match if exact match fails
    if (!targetUser) {
      targetUser = await DB.prepare(
        'SELECT id, email, name, current_balance FROM users WHERE email COLLATE NOCASE = ?'
      ).bind(user_email).first();
    }
    
    // Strategy 3: Trimmed and case insensitive if still not found
    if (!targetUser) {
      const cleanEmail = user_email.trim();
      targetUser = await DB.prepare(
        'SELECT id, email, name, current_balance FROM users WHERE TRIM(email) COLLATE NOCASE = ?'
      ).bind(cleanEmail).first();
    }
    
    if (!targetUser) {
      // For debugging - show available users
      const sampleUsers = await DB.prepare(
        'SELECT email FROM users WHERE email LIKE ? OR email LIKE ? LIMIT 10'
      ).bind(`%${user_email.substring(0, 5)}%`, `%${user_email.split('@')[0]}%`).all();
      
      return c.json({ 
        error: `Usuário com email "${user_email}" não encontrado.`,
        suggestion: 'Verifique se o email está escrito corretamente.',
        similar_users: sampleUsers.results?.map((u: any) => u.email) || []
      }, 404);
    }
    
    const previousBalance = targetUser.current_balance || 0;
    let newBalance: number;
    
    if (type === 'add') {
      newBalance = previousBalance + amount;
    } else {
      newBalance = previousBalance - amount;
      // Don't allow negative balance (unless specifically needed)
      if (newBalance < 0) {
        return c.json({ error: 'Operação resultaria em saldo negativo' }, 400);
      }
    }
    
    // Start transaction-like operations
    try {
      // Update user balance
      await DB.prepare(
        'UPDATE users SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(newBalance, targetUser.id).run();
      
      // Create transfer record
      const transferResult = await DB.prepare(`
        INSERT INTO balance_transfers (
          user_id, user_email, user_name, admin_id, admin_email, admin_name,
          type, amount, previous_balance, new_balance, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        targetUser.id,
        targetUser.email,
        targetUser.name || null,
        adminUser.id,
        adminUser.email,
        adminUser.name,
        type,
        amount,
        previousBalance,
        newBalance,
        reason
      ).run();
      
      // Create notification for user
      await DB.prepare(`
        INSERT INTO notifications (
          user_id, title, message, type, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        targetUser.id,
        type === 'add' ? '💰 Saldo Adicionado' : '💸 Ajuste no Saldo',
        `${type === 'add' ? 'Foram adicionados' : 'Foram deduzidos'} R$ ${amount.toFixed(2)} ${type === 'add' ? 'ao' : 'do'} seu saldo. Motivo: ${reason}`,
        type === 'add' ? 'success' : 'info'
      ).run();
      
      return c.json({
        success: true,
        message: `Transferência realizada com sucesso`,
        transfer: {
          id: transferResult.meta.last_row_id,
          user_email,
          type,
          amount,
          previous_balance: previousBalance,
          new_balance: newBalance,
          reason
        }
      });
      
    } catch (error) {
      return c.json({ error: 'Erro ao executar transferência' }, 500);
    }
    
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Get balance transfers history
balanceTransfersRouter.get('/', async (c) => {
  const { DB } = c.env;
  
  try {
    // Get admin user (with better error handling)
    try {
      await getAdminUserFromContext(c, DB);
    } catch (error: any) {
      return c.json({ error: error.message }, 401);
    }
    
    // Get transfers with limit
    const transfers = await DB.prepare(`
      SELECT 
        bt.*,
        u.name as user_name,
        admin.name as admin_name
      FROM balance_transfers bt
      LEFT JOIN users u ON bt.user_id = u.id
      LEFT JOIN users admin ON bt.admin_id = admin.id
      ORDER BY bt.created_at DESC
      LIMIT 100
    `).all();
    
    return c.json(transfers.results || []);
    
  } catch (error) {
    return c.json({ error: 'Erro ao buscar histórico de transferências' }, 500);
  }
});

// Get balance transfer stats
balanceTransfersRouter.get('/stats', async (c) => {
  const { DB } = c.env;
  
  try {
    // Get admin user (with better error handling)
    try {
      await getAdminUserFromContext(c, DB);
    } catch (error: any) {
      return c.json({ error: error.message }, 401);
    }
    
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_transfers,
        COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE 0 END), 0) as total_added,
        COALESCE(SUM(CASE WHEN type = 'subtract' THEN amount ELSE 0 END), 0) as total_subtracted,
        COUNT(DISTINCT user_id) as unique_users_affected,
        COUNT(DISTINCT admin_id) as unique_admins
      FROM balance_transfers
    `).first();
    
    return c.json(stats || {
      total_transfers: 0,
      total_added: 0,
      total_subtracted: 0,
      unique_users_affected: 0,
      unique_admins: 0
    });
    
  } catch (error) {
    return c.json({ error: 'Erro ao buscar estatísticas' }, 500);
  }
});
