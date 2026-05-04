import { Hono } from "hono";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { 
  WithdrawRequestSchema, 
  VideoWatchRequestSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
  type DashboardStats,
  type SpinResult,
  type AffiliateInfo
} from "../shared/types";
import { pushinpayRoutes } from './pushinpay';
import { webhookTestRoutes } from './webhook-test';
import { balanceTransfersRouter } from './balance-transfers';
import { liveActivitiesRouter } from './live-activities';

const app = new Hono<{ Bindings: Env }>();

// Get live activities for ticker
app.get("/api/live-activities", async (c) => {
  try {
    const activities = await c.env.DB.prepare(`
      SELECT id, activity_type, user_name, message, amount, level_info, created_at
      FROM live_activities 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all();

    return c.json(activities.results || []);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch live activities" }, 500);
  }
});

// Helper function to mask username
function maskUsername(name: string): string {
  if (!name || name.length <= 2) {
    return "Usuario*****";
  }
  
  // Take half of the name characters and add asterisks
  const halfLength = Math.ceil(name.length / 2);
  const firstPart = name.substring(0, halfLength);
  return `${firstPart}*****`;
}

// Helper function to create live activity
async function createLiveActivity(
  db: any, 
  activityType: string, 
  userName: string, 
  message: string, 
  amount?: number, 
  levelInfo?: string
) {
  try {
    const maskedName = maskUsername(userName);
    
    await db.prepare(`
      INSERT INTO live_activities (activity_type, user_name, message, amount, level_info)
      VALUES (?, ?, ?, ?, ?)
    `).bind(activityType, maskedName, message, amount || null, levelInfo || null).run();

    // Keep only the last 50 activities to prevent database bloat
    await db.prepare(`
      DELETE FROM live_activities 
      WHERE id NOT IN (
        SELECT id FROM live_activities 
        ORDER BY created_at DESC 
        LIMIT 50
      )
    `).run();
  } catch (error) {
    // Silently fail - live activities are not critical
  }
}

// Get available videos (public endpoint for featured video) - MUST be before :fileName route
app.get("/api/videos/featured", async (c) => {
  try {
    // This endpoint shows videos for logged-out users, so only show non-bonus-only videos
    const videos = await c.env.DB.prepare(`
      SELECT v.*, 
             CASE WHEN vq.id IS NOT NULL THEN 1 ELSE 0 END as has_question,
             vq.question, vq.correct_answer, vq.wrong_answer
      FROM videos v
      LEFT JOIN video_questions vq ON v.id = vq.video_id
      WHERE v.is_active = 1 
        AND v.is_home_featured = 1 
        AND v.video_url IS NOT NULL
        AND (v.target_bonus_users_only != 1 OR v.target_bonus_users_only IS NULL)
      ORDER BY v.created_at DESC
      LIMIT 5
    `).all();

    const formattedVideos = videos.results.map((video: any) => ({
      ...video,
      has_question: video.has_question === 1,
      question: video.has_question === 1 ? {
        id: video.id,
        question: video.question,
        correct_answer: video.correct_answer,
        wrong_answer: video.wrong_answer
      } : null
    }));

    return c.json(formattedVideos);
  } catch (error: any) {
    // console.error('Error fetching featured videos:', error);
    return c.json({ error: "Failed to fetch videos", details: error.message }, 500);
  }
});

// All upload functionality removed - only external video URLs supported

// Helper functions
function generateAffiliateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function getLevelInfo(userId: number, db: any) {
  // Check for custom daily limit first
  const user = await db.prepare(
    "SELECT custom_daily_limit, affiliate_code FROM users WHERE id = ?"
  ).bind(userId).first();

  // Check if user has active affiliates - if so, limit to 5 videos per day
  const hasAffiliates = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE referred_by = ? AND total_videos_watched > 0"
  ).bind(user.affiliate_code).first();

  // Check for intermediate plan first
  const intermediatePurchase = await db.prepare(`
    SELECT ip.daily_limit, ip.name
    FROM intermediate_purchases ipurch
    JOIN intermediate_plans ip ON ipurch.plan_id = ip.id
    WHERE ipurch.user_id = ? AND ipurch.is_active = 1 AND ipurch.payment_status = 'completed'
    ORDER BY ipurch.created_at DESC 
    LIMIT 1
  `).bind(userId).first();

  if (intermediatePurchase) {
    let dailyLimit = user.custom_daily_limit || intermediatePurchase.daily_limit;
    // If user has affiliates, limit to 5 videos per day
    if (hasAffiliates && hasAffiliates.count > 0) {
      dailyLimit = 5;
    }
    return { 
      level: 2, 
      title: intermediatePurchase.name, 
      dailyLimit: dailyLimit 
    };
  }

  // Get the highest active VIP level for the user
  const vipPurchase = await db.prepare(`
    SELECT vip_level 
    FROM vip_purchases 
    WHERE user_id = ? AND is_active = 1 AND payment_status = 'completed'
    ORDER BY vip_level DESC 
    LIMIT 1
  `).bind(userId).first();

  if (!vipPurchase) {
    // No VIP purchase, remain at level 1 (Iniciante) with 10 videos per day
    let dailyLimit = user.custom_daily_limit || 10;
    // If user has affiliates, limit to 5 videos per day
    if (hasAffiliates && hasAffiliates.count > 0) {
      dailyLimit = 5;
    }
    return { level: 1, title: "Iniciante", dailyLimit: dailyLimit };
  }

  const vipLevel = vipPurchase.vip_level;
  
  // Map VIP levels to user levels and benefits
  let defaultLimit;
  switch (vipLevel) {
    case 1: defaultLimit = 15; break;
    case 2: defaultLimit = 20; break;
    case 3: defaultLimit = 25; break;
    case 4: defaultLimit = 30; break;
    case 5: defaultLimit = 35; break;
    case 6: defaultLimit = 40; break;
    default: defaultLimit = 10; break;
  }

  let dailyLimit = user.custom_daily_limit || defaultLimit;
  // If user has affiliates, limit to 5 videos per day
  if (hasAffiliates && hasAffiliates.count > 0) {
    dailyLimit = 5;
  }

  switch (vipLevel) {
    case 1: return { level: 3, title: "VIP 1", dailyLimit: dailyLimit };
    case 2: return { level: 4, title: "VIP 2", dailyLimit: dailyLimit };
    case 3: return { level: 5, title: "VIP 3", dailyLimit: dailyLimit };
    case 4: return { level: 6, title: "VIP 4", dailyLimit: dailyLimit };
    case 5: return { level: 7, title: "VIP 5", dailyLimit: dailyLimit };
    case 6: return { level: 8, title: "VIP 6", dailyLimit: dailyLimit };
    default: return { level: 1, title: "Iniciante", dailyLimit: dailyLimit };
  }
}

function getProgressToNextLevel(currentLevel: number, vipLevel: number | null): number {
  if (currentLevel === 1 && !vipLevel) {
    // Iniciante level - progress only comes from purchasing VIP
    return 0;
  }
  
  // For VIP users, they've reached their purchased level
  return 100;
}

async function getOrCreateUser(email: string, name: string, db: any) {
  try {
    const existingUser = await db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email).first();
    
    if (existingUser) {
      return existingUser;
    }

    const affiliateCode = generateAffiliateCode();
    const result = await db.prepare(`
      INSERT INTO users (email, name, affiliate_code, current_balance, total_earnings, total_videos_watched, daily_videos_watched, bonus_videos, level, daily_limit)
      VALUES (?, ?, ?, 2.0, 0.0, 0, 0, 0, 1, 10)
    `).bind(email, name, affiliateCode).run();
    
    return await db.prepare("SELECT * FROM users WHERE id = ?").bind(result.meta.last_row_id).first();
  } catch (error: any) {
    throw new Error(`Failed to get or create user: ${error.message}`);
  }
}

// Process VIP purchase automatically via webhook
async function processVipPurchaseFromWebhook(
  userEmail: string,
  amount: number,
  paymentId: string,
  provider: string,
  db: any
): Promise<{ success: boolean; message: string; vip_level?: number }> {
  try {
    // Get webhook config for this provider
    const webhookConfig = await db.prepare(
      "SELECT * FROM webhook_configs WHERE provider = ? AND is_active = 1"
    ).bind(provider).first();

    if (!webhookConfig) {
      throw new Error(`No active webhook config found for provider: ${provider}`);
    }

    // Parse VIP level mapping
    let vipLevelMapping: Record<string, number> = {};
    if (webhookConfig.vip_level_mapping) {
      try {
        vipLevelMapping = JSON.parse(webhookConfig.vip_level_mapping);
      } catch (e) {
        throw new Error('Invalid VIP level mapping configuration');
      }
    }

    // Determine VIP level based on amount
    const vipLevel = vipLevelMapping[amount.toString()];
    if (!vipLevel) {
      throw new Error(`No VIP level mapping found for amount: R$ ${amount}`);
    }

    // Find user
    const user = await db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(userEmail).first();

    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already has this VIP level
    const existingPurchase = await db.prepare(
      "SELECT id FROM vip_purchases WHERE user_id = ? AND vip_level = ? AND is_active = 1"
    ).bind(user.id, vipLevel).first();

    if (existingPurchase) {
      throw new Error(`User already has VIP ${vipLevel} active`);
    }

    // Check if payment was already processed
    const existingPayment = await db.prepare(
      "SELECT id FROM vip_purchases WHERE payment_reference = ? AND payment_status = 'completed'"
    ).bind(paymentId).first();

    if (existingPayment) {
      throw new Error(`Payment ${paymentId} already processed`);
    }

    // Deactivate lower VIP levels
    await db.prepare(
      "UPDATE vip_purchases SET is_active = 0, updated_at = datetime('now') WHERE user_id = ? AND vip_level < ?"
    ).bind(user.id, vipLevel).run();

    // Create VIP purchase record
    await db.prepare(`
      INSERT INTO vip_purchases (user_id, vip_level, purchase_date, amount, payment_status, payment_reference, is_active)
      VALUES (?, ?, ?, ?, 'completed', ?, 1)
    `).bind(user.id, vipLevel, today, amount, paymentId).run();

    // Update user level AND daily_limit
    const levelInfo = await getLevelInfo(user.id, db);
    await db.prepare(
      "UPDATE users SET level = ?, daily_limit = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(levelInfo.level, levelInfo.dailyLimit, user.id).run();

    return {
      success: true,
      message: `VIP ${vipLevel} activated for ${userEmail}`,
      vip_level: vipLevel
    };
  } catch (error: any) {
    throw error;
  }
}

// Custom auth middleware for email/password users
async function customAuthMiddleware(c: any, next: any) {
  try {
    // Try Mocha auth first
    const mochaSessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    if (mochaSessionToken) {
      try {
        return await authMiddleware(c, next);
      } catch (mochaError: any) {
        // Fall through to custom auth
      }
    }

    // Try custom session token
    const customSessionToken = getCookie(c, 'nextfund_session');
    if (!customSessionToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE session_token = ? AND session_expires_at > datetime('now')"
    ).bind(customSessionToken).first();

    if (!user) {
      return c.json({ error: "Invalid or expired session" }, 401);
    }

    // Auto-renew session on each request (15 minutes from now)
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await c.env.DB.prepare(
      "UPDATE users SET session_expires_at = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(newExpiresAt, user.id).run();

    // Renew cookie
    setCookie(c, 'nextfund_session', customSessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 15 * 60, // 15 minutes
    });

    // Set user in context
    c.set('user', {
      email: user.email,
      google_user_data: { name: user.name }
    });

    return next();
  } catch (error: any) {
    return c.json({ 
      error: "Authentication failed", 
      details: error.message 
    }, 500);
  }
}

// Register with email/password
app.post("/api/auth/register", zValidator('json', RegisterRequestSchema), async (c) => {
  const { name, email, password, affiliate_code } = c.req.valid('json');

  try {
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userAffiliateCode = generateAffiliateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Check if affiliate code is valid
    let bonusVideos = 0;
    if (affiliate_code) {
      const referrer = await c.env.DB.prepare(
        "SELECT id, bonus_videos FROM users WHERE affiliate_code = ?"
      ).bind(affiliate_code).first();
      
      if (referrer) {
        bonusVideos = 3; // Give 3 bonus videos for using affiliate code
        // Give referrer 1 bonus video
        await c.env.DB.prepare(
          "UPDATE users SET bonus_videos = bonus_videos + 1 WHERE id = ?"
        ).bind(referrer.id).run();
      }
    }

    // Create user
    await c.env.DB.prepare(`
      INSERT INTO users (email, name, password_hash, auth_provider, affiliate_code, session_token, session_expires_at, referred_by, bonus_videos, current_balance, total_earnings, total_videos_watched, daily_videos_watched, level, daily_limit)
      VALUES (?, ?, ?, 'email', ?, ?, ?, ?, ?, 2.0, 0.0, 0, 0, 1, 10)
    `).bind(email, name, passwordHash, userAffiliateCode, sessionToken, expiresAt, affiliate_code || null, bonusVideos).run();

    // Create live activity for new registration
    await createLiveActivity(
      c.env.DB,
      'registration',
      name,
      `${maskUsername(name)} acabou de se cadastrar!`
    );

    // Create live activity for new registration
    await createLiveActivity(
      c.env.DB,
      'registration',
      name,
      `${maskUsername(name)} acabou de se cadastrar!`
    );

    // Set session cookie
    setCookie(c, 'nextfund_session', sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 15 * 60, // 15 minutes
    });

    return c.json({ 
      success: true, 
      user: { 
        email: email, 
        name: name,
        bonus_videos: bonusVideos 
      } 
    });
  } catch (error: any) {
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Forgot password
app.post("/api/auth/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email é obrigatório" }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      "SELECT id, email, name, password_hash FROM users WHERE email = ?"
    ).bind(email).first();

    if (!user) {
      // Don't reveal if email exists or not
      return c.json({ success: true, message: "Se o email existir, um código de recuperação será gerado" });
    }

    // Only allow password reset for email users
    if (!user.password_hash) {
      return c.json({ error: "Esta conta usa login do Google. Use a opção 'Continuar com Google'" }, 400);
    }

    // Generate reset token (6 digits for easy copying)
    const token = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Invalidate any existing tokens for this user
    await c.env.DB.prepare(
      "UPDATE password_reset_tokens SET is_used = true WHERE user_id = ? AND is_used = false"
    ).bind(user.id).run();

    // Create new reset token
    await c.env.DB.prepare(`
      INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(user.id, email, token, expiresAt).run();

    return c.json({ 
      success: true, 
      token: token,
      message: "Código de recuperação gerado com sucesso"
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao processar solicitação" }, 500);
  }
});

// Verify reset token
app.get("/api/auth/reset-password/:token", async (c) => {
  try {
    const token = c.req.param('token');

    const resetRecord = await c.env.DB.prepare(`
      SELECT pr.*, u.email, u.name 
      FROM password_reset_tokens pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.token = ? AND pr.is_used = false AND pr.expires_at > datetime('now')
    `).bind(token).first();

    if (!resetRecord) {
      return c.json({ error: "Código inválido ou expirado" }, 400);
    }

    return c.json({ 
      success: true, 
      email: resetRecord.email,
      name: resetRecord.name
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao verificar código" }, 500);
  }
});

// Reset password
app.post("/api/auth/reset-password", async (c) => {
  try {
    const { token, password } = await c.req.json();

    if (!token || !password) {
      return c.json({ error: "Código e nova senha são obrigatórios" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "A senha deve ter pelo menos 6 caracteres" }, 400);
    }

    const resetRecord = await c.env.DB.prepare(`
      SELECT pr.*, u.id as user_id 
      FROM password_reset_tokens pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.token = ? AND pr.is_used = false AND pr.expires_at > datetime('now')
    `).bind(token).first();

    if (!resetRecord) {
      return c.json({ error: "Código inválido ou expirado" }, 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and clear sessions
    await c.env.DB.prepare(`
      UPDATE users SET 
        password_hash = ?, 
        session_token = NULL, 
        session_expires_at = NULL,
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(passwordHash, resetRecord.user_id).run();

    // Mark token as used
    await c.env.DB.prepare(
      "UPDATE password_reset_tokens SET is_used = true, updated_at = datetime('now') WHERE id = ?"
    ).bind(resetRecord.id).run();

    return c.json({ 
      success: true, 
      message: "Senha alterada com sucesso" 
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao alterar senha" }, 500);
  }
});

// Login with email/password
app.post("/api/auth/login", zValidator('json', LoginRequestSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    // Find user
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email).first();

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // If user doesn't have password_hash (Google user), don't allow email login
    if (!user.password_hash) {
      return c.json({ error: "Please use Google login for this account" }, 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Generate new session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Update session
    await c.env.DB.prepare(
      "UPDATE users SET session_token = ?, session_expires_at = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(sessionToken, expiresAt, user.id).run();

    // Set session cookie
    setCookie(c, 'nextfund_session', sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 15 * 60, // 15 minutes
    });

    return c.json({ 
      success: true, 
      user: { 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (error: any) {
    return c.json({ error: "Login failed" }, 500);
  }
});

// Obtain redirect URL from the Mocha Users Service
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

// Exchange the code for a session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get the current user object for the frontend
app.get("/api/users/me", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    // Create or update user in our database
    await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );
    
    return c.json(user);
  } catch (error: any) {
    return c.json({ 
      error: "Database error", 
      details: error.message 
    }, 500);
  }
});

// Call this from the frontend to log out the user
app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  const customSessionToken = getCookie(c, 'nextfund_session');

  if (typeof sessionToken === 'string') {
    try {
      await deleteSession(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
    } catch (error) {
      // Ignore errors
    }
  }

  if (customSessionToken) {
    try {
      const user = await c.env.DB.prepare(
        "SELECT id FROM users WHERE session_token = ?"
      ).bind(customSessionToken).first();
      
      if (user) {
        await c.env.DB.prepare(
          "UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE id = ?"
        ).bind(user.id).run();
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // Clear both cookies
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  setCookie(c, 'nextfund_session', '', {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Get dashboard stats
app.get("/api/dashboard/stats", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const today = new Date().toISOString().split('T')[0];
    const levelInfo = await getLevelInfo(dbUser.id, c.env.DB);
    
    // Get current VIP level for progress calculation
    const vipPurchase = await c.env.DB.prepare(`
      SELECT vip_level 
      FROM vip_purchases 
      WHERE user_id = ? AND is_active = 1 AND payment_status = 'completed'
      ORDER BY vip_level DESC 
      LIMIT 1
    `).bind(dbUser.id).first();
    
    // Check if user can spin today
    const canSpinToday = dbUser.last_spin_date !== today;

    const stats: DashboardStats = {
      current_balance: parseFloat(dbUser.current_balance) || 0,
      total_earnings: parseFloat(dbUser.total_earnings) || 0,
      daily_videos_watched: dbUser.last_video_date === today ? dbUser.daily_videos_watched : 0,
      daily_limit: levelInfo.dailyLimit,
      level: levelInfo.level,
      level_title: levelInfo.title,
      progress_to_next_level: getProgressToNextLevel(levelInfo.level, vipPurchase?.vip_level || null),
      total_videos_watched: dbUser.total_videos_watched,
      bonus_videos: dbUser.bonus_videos,
      can_spin_today: canSpinToday,
    };

    return c.json(stats);
  } catch (error: any) {
    return c.json({ 
      error: "Database error", 
      details: error.message 
    }, 500);
  }
});

// This endpoint was moved up above the :fileName route to prevent conflicts

// Get home videos for admin
app.get("/api/admin/home-videos", adminMiddleware, async (c) => {
  try {
    const videos = await c.env.DB.prepare(`
      SELECT v.*, 
             CASE 
               WHEN EXISTS (SELECT 1 FROM user_custom_videos ucv WHERE ucv.video_id = v.id AND ucv.is_active = 1) 
               THEN 'specific'
               ELSE 'all'
             END as target_users,
             (SELECT COUNT(*) FROM user_custom_videos ucv WHERE ucv.video_id = v.id AND ucv.is_active = 1) as assigned_users_count
      FROM videos v 
      WHERE v.is_home_featured = 1 AND v.video_url IS NOT NULL 
      ORDER BY v.created_at DESC
    `).all();

    // For videos sent to specific users, get the user names
    const videosWithUserInfo = await Promise.all(
      videos.results.map(async (video: any) => {
        if (video.target_users === 'specific') {
          const assignedUsers = await c.env.DB.prepare(`
            SELECT u.name, u.email 
            FROM user_custom_videos ucv 
            JOIN users u ON ucv.user_id = u.id 
            WHERE ucv.video_id = ? AND ucv.is_active = 1
            ORDER BY u.name ASC
          `).bind(video.id).all();
          
          return {
            ...video,
            assigned_users: assignedUsers.results
          };
        }
        return {
          ...video,
          assigned_users: []
        };
      })
    );

    return c.json(videosWithUserInfo);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch home videos" }, 500);
  }
});

// Add video (supports YouTube and Vimeo)
app.post("/api/admin/videos/add", adminMiddleware, async (c) => {
  try {
    const {
      title,
      description,
      video_url,
      thumbnail_url,
      duration_seconds,
      reward_amount,
      question,
      correct_answer,
      wrong_answer,
      is_home_featured,
      category,
      target_users,
      selected_user_ids
    } = await c.req.json();

    if (!video_url) {
      return c.json({ error: "Video URL is required" }, 400);
    }

    // Detect platform and extract video ID
    const videoInfo = await detectVideoPlatformAndFetchInfo(video_url);
    
    if (!videoInfo.success) {
      return c.json({ error: videoInfo.error || "Failed to detect video platform" }, 400);
    }

    if (!videoInfo.data) {
      return c.json({ error: "No video data detected" }, 400);
    }

    const detectedInfo = videoInfo.data;
    let videoId: string;
    let videoPlatform: string;
    let embedUrl: string;

    if (detectedInfo.platform === 'youtube') {
      videoId = detectedInfo.video_id;
      videoPlatform = 'youtube';
      embedUrl = detectedInfo.embed_url;
    } else if (detectedInfo.platform === 'vimeo') {
      videoId = detectedInfo.video_id;
      videoPlatform = 'vimeo';
      embedUrl = detectedInfo.embed_url;
    } else {
      // For generic platforms, use the detected info directly
      videoId = detectedInfo.video_id;
      videoPlatform = detectedInfo.platform;
      embedUrl = detectedInfo.embed_url;
    }

    // Use provided values or fallback to detected info
    const finalTitle = title || detectedInfo.title;
    const finalDescription = description || detectedInfo.description;
    const finalThumbnail = thumbnail_url || detectedInfo.thumbnail_url;
    const finalDuration = duration_seconds || detectedInfo.duration_seconds;

    // Insert video into database
    const result = await c.env.DB.prepare(`
      INSERT INTO videos (title, description, youtube_id, video_platform, video_url, embed_url, thumbnail_url, duration_seconds, reward_amount, category, is_active, is_home_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      finalTitle,
      finalDescription || null,
      videoId,
      videoPlatform,
      video_url,
      embedUrl,
      finalThumbnail || null,
      finalDuration || 60,
      reward_amount || 2.0,
      category || null,
      is_home_featured ? 1 : 0
    ).run();

    // Log video addition for debugging
    // console.log('Video added to database:', {
    //   id: result.meta.last_row_id,
    //   title: finalTitle,
    //   video_url: video_url,
    //   embed_url: embedUrl,
    //   platform: videoPlatform,
    //   video_id: videoId
    // });

    const dbVideoId = result.meta.last_row_id;

    // Add question if provided
    if (question && correct_answer && wrong_answer) {
      await c.env.DB.prepare(`
        INSERT INTO video_questions (video_id, question, correct_answer, wrong_answer)
        VALUES (?, ?, ?, ?)
      `).bind(
        dbVideoId,
        question,
        correct_answer,
        wrong_answer
      ).run();
    }

    // Handle bonus-only videos
    if (target_users === 'bonus_only') {
      // Update video to target bonus users only
      await c.env.DB.prepare(
        "UPDATE videos SET target_bonus_users_only = 1 WHERE id = ?"
      ).bind(dbVideoId).run();
    }

    // Handle video assignments to specific users
    if (target_users === 'specific' && selected_user_ids && selected_user_ids.length > 0) {
      // Get current admin user for assignment tracking
      const currentUser = c.get("user");
      if (currentUser) {
        const adminUser = await getOrCreateUser(
          currentUser.email,
          currentUser.google_user_data?.name || currentUser.email,
          c.env.DB
        );

        // Assign video to selected users
        for (const userId of selected_user_ids) {
          // Verify user exists
          const targetUser = await c.env.DB.prepare(
            "SELECT id FROM users WHERE id = ?"
          ).bind(userId).first();

          if (targetUser) {
            // Add to user_custom_videos
            await c.env.DB.prepare(`
              INSERT INTO user_custom_videos (user_id, video_id, assigned_by_admin_id)
              VALUES (?, ?, ?)
            `).bind(userId, dbVideoId, adminUser.id).run();

            // Ensure user has custom video settings
            await c.env.DB.prepare(`
              INSERT OR REPLACE INTO user_custom_settings (
                user_id, has_custom_videos, managed_by_admin_id, created_at, updated_at
              ) VALUES (
                ?, 1, ?, 
                COALESCE((SELECT created_at FROM user_custom_settings WHERE user_id = ?), datetime('now')),
                datetime('now')
              )
            `).bind(userId, adminUser.id, userId).run();
          }
        }
      }
    }

    let responseMessage = detectedInfo.message;
    if (target_users === 'bonus_only') {
      responseMessage += " Vídeo disponível apenas para usuários com vídeos bônus.";
    } else if (target_users === 'specific' && selected_user_ids && selected_user_ids.length > 0) {
      responseMessage += ` Vídeo atribuído a ${selected_user_ids.length} usuário(s) específico(s).`;
    } else {
      responseMessage += " Vídeo disponível para todos os usuários.";
    }

    return c.json({ 
      success: true, 
      video_id: dbVideoId, 
      video_url: video_url,
      platform: videoPlatform,
      detected_info: detectedInfo,
      message: responseMessage,
      target_users: target_users || 'all',
      assigned_users_count: target_users === 'specific' ? (selected_user_ids?.length || 0) : null
    });
  } catch (error: any) {
    return c.json({ error: "Failed to add video: " + error.message }, 500);
  }
});

// Update home video status
app.patch("/api/admin/home-videos/:id", adminMiddleware, async (c) => {
  const videoId = parseInt(c.req.param('id'));
  const { is_active } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE videos SET is_active = ?, updated_at = datetime('now') WHERE id = ? AND is_home_featured = 1"
    ).bind(is_active, videoId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update home video" }, 500);
  }
});

// Delete home video
app.delete("/api/admin/home-videos/:id", adminMiddleware, async (c) => {
  const videoId = parseInt(c.req.param('id'));

  try {
    // Delete associated data first
    await c.env.DB.prepare("DELETE FROM video_questions WHERE video_id = ?").bind(videoId).run();
    await c.env.DB.prepare("DELETE FROM video_question_answers WHERE video_id = ?").bind(videoId).run();
    await c.env.DB.prepare("DELETE FROM video_watches WHERE video_id = ?").bind(videoId).run();
    
    // Delete the video
    await c.env.DB.prepare("DELETE FROM videos WHERE id = ? AND is_home_featured = 1").bind(videoId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete home video" }, 500);
  }
});

// Get available videos (excluding home featured ones for missions page - ALL VIDEO PLATFORMS)
app.get("/api/videos", customAuthMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }
    
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    // Check if user has custom video mode enabled
    const customSettings = await c.env.DB.prepare(
      "SELECT custom_video_mode FROM user_custom_settings WHERE user_id = ?"
    ).bind(dbUser.id).first();

    let videosQuery: string;
    let queryParams: any[] = [];

    if (customSettings && customSettings.custom_video_mode) {
      // User only sees assigned custom videos
      videosQuery = `
        SELECT v.*, 
               CASE WHEN vq.id IS NOT NULL THEN 1 ELSE 0 END as has_question,
               vq.question, vq.correct_answer, vq.wrong_answer
        FROM videos v
        INNER JOIN user_custom_videos ucv ON v.id = ucv.video_id
        LEFT JOIN video_questions vq ON v.id = vq.video_id
        WHERE v.is_active = 1 
          AND ucv.user_id = ?
          AND ucv.is_active = 1
          AND v.video_url IS NOT NULL
          AND (ucv.expires_at IS NULL OR ucv.expires_at > datetime('now'))
          -- Check bonus-only videos: user must have bonus videos to see them
          AND (v.target_bonus_users_only != 1 OR ? > 0)
        ORDER BY ucv.assigned_at DESC
      `;
      queryParams = [dbUser.id, dbUser.bonus_videos || 0];
    } else {
      // Show videos that are either:
      // 1. Not assigned to specific users (public videos)
      // 2. Assigned specifically to this user
      // 3. Bonus-only videos (only if user has bonus videos)
      videosQuery = `
        SELECT DISTINCT v.*, 
               CASE WHEN vq.id IS NOT NULL THEN 1 ELSE 0 END as has_question,
               vq.question, vq.correct_answer, vq.wrong_answer
        FROM videos v
        LEFT JOIN video_questions vq ON v.id = vq.video_id
        LEFT JOIN user_custom_videos ucv ON v.id = ucv.video_id AND ucv.is_active = 1
        WHERE v.is_active = 1 
          AND (v.is_home_featured = 0 OR v.is_home_featured IS NULL)
          AND v.video_url IS NOT NULL
          -- Check bonus-only videos: user must have bonus videos to see them
          AND (v.target_bonus_users_only != 1 OR ? > 0)
          AND (
            -- Video has no custom assignments (public video)
            NOT EXISTS (SELECT 1 FROM user_custom_videos ucv2 WHERE ucv2.video_id = v.id AND ucv2.is_active = 1)
            OR 
            -- Video is assigned to this specific user
            (ucv.user_id = ? AND ucv.is_active = 1 AND (ucv.expires_at IS NULL OR ucv.expires_at > datetime('now')))
          )
        ORDER BY v.created_at DESC
      `;
      queryParams = [dbUser.bonus_videos || 0, dbUser.id];
    }

    const videos = await c.env.DB.prepare(videosQuery).bind(...queryParams).all();

    const formattedVideos = videos.results.map((video: any) => ({
      ...video,
      has_question: video.has_question === 1,
      question: video.has_question === 1 ? {
        id: video.id,
        question: video.question,
        correct_answer: video.correct_answer,
        wrong_answer: video.wrong_answer
      } : null
    }));

    return c.json(formattedVideos);
  } catch (error) {
    return c.json({ error: "Failed to fetch videos" }, 500);
  }
});

// Watch a video
app.post("/api/videos/watch", customAuthMiddleware, zValidator('json', VideoWatchRequestSchema), async (c) => {
  const user = c.get("user");
  const { video_id, question_answer } = c.req.valid('json');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const today = new Date().toISOString().split('T')[0];
    const dailyWatched = dbUser.last_video_date === today ? dbUser.daily_videos_watched : 0;
    const levelInfo = await getLevelInfo(dbUser.id, c.env.DB);
    
    // Check if user can watch more videos
    if (dailyWatched >= levelInfo.dailyLimit && dbUser.bonus_videos <= 0) {
      return c.json({ error: "Daily limit reached" }, 400);
    }

    // Get video details
    const video = await c.env.DB.prepare(
      "SELECT * FROM videos WHERE id = ? AND is_active = 1"
    ).bind(video_id).first();
    
    if (!video) {
      return c.json({ error: "Video not found" }, 404);
    }

    // Check if video has a question and if answer was provided
    const question = await c.env.DB.prepare(
      "SELECT * FROM video_questions WHERE video_id = ?"
    ).bind(video_id).first();
    
    let questionCorrect = true; // Default to true if no question
    
    if (question) {
      if (!question_answer) {
        return c.json({ error: "Question answer required" }, 400);
      }
      
      questionCorrect = question_answer === question.correct_answer;
      
      // Record the answer
      await c.env.DB.prepare(`
        INSERT INTO video_question_answers (user_id, video_id, question_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?, ?)
      `).bind(dbUser.id, video_id, question.id, question_answer, questionCorrect ? 1 : 0).run();
    }

    // Calculate earnings based on VIP level and question correctness
    const vipPurchase = await c.env.DB.prepare(`
      SELECT vip_level 
      FROM vip_purchases 
      WHERE user_id = ? AND is_active = 1 AND payment_status = 'completed'
      ORDER BY vip_level DESC 
      LIMIT 1
    `).bind(dbUser.id).first();
    
    const vipLevel = vipPurchase?.vip_level || 0;
    
    // VIP bonus multipliers
    let rewardMultiplier = 1; // Default for non-VIP users
    if (vipLevel === 1) rewardMultiplier = 1.0;
    else if (vipLevel === 2) rewardMultiplier = 1.1; // 10% bonus
    else if (vipLevel === 3) rewardMultiplier = 1.15; // 15% bonus
    else if (vipLevel === 4) rewardMultiplier = 1.2; // 20% bonus
    else if (vipLevel === 5) rewardMultiplier = 1.25; // 25% bonus
    else if (vipLevel === 6) rewardMultiplier = 1.3; // 30% bonus
    
    let earnings = parseFloat(video.reward_amount) * rewardMultiplier;
    
    // Reduce earnings if question was answered incorrectly
    if (question && !questionCorrect) {
      earnings = earnings * 0.5; // 50% of normal earnings for wrong answer
    }

    // Update user stats
    const isUsingBonusVideo = dailyWatched >= levelInfo.dailyLimit;
    const newDailyWatched = isUsingBonusVideo ? dailyWatched : dailyWatched + 1;
    const newBonusVideos = isUsingBonusVideo ? Math.max(0, dbUser.bonus_videos - 1) : dbUser.bonus_videos;

    await c.env.DB.prepare(`
      UPDATE users SET 
        current_balance = current_balance + ?,
        total_earnings = total_earnings + ?,
        total_videos_watched = total_videos_watched + 1,
        daily_videos_watched = ?,
        bonus_videos = ?,
        last_video_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(earnings, earnings, newDailyWatched, newBonusVideos, today, dbUser.id).run();

    // Record the watch
    await c.env.DB.prepare(`
      INSERT INTO video_watches (user_id, video_id, earnings, watch_date)
      VALUES (?, ?, ?, ?)
    `).bind(dbUser.id, video_id, earnings, today).run();

    // Create live activity for video watch (occasionally, not for every video to avoid spam)
    if (Math.random() < 0.1) { // 10% chance to create activity
      await createLiveActivity(
        c.env.DB,
        'video_watch',
        dbUser.name || user.email,
        `${maskUsername(dbUser.name || user.email)} assistiu um vídeo e ganhou R$ ${earnings.toFixed(2)}!`,
        earnings
      );
    }

    let message = `Parabéns! Você ganhou R$ ${earnings.toFixed(2)}!`;
    if (question && !questionCorrect) {
      message = `Resposta incorreta. Você ganhou R$ ${earnings.toFixed(2)} (50% do valor normal).`;
    }

    return c.json({ 
      success: true, 
      earnings,
      message
    });
  } catch (error: any) {
    return c.json({ error: "Failed to watch video" }, 500);
  }
});

// Get withdrawals
app.get("/api/withdrawals", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const withdrawals = await c.env.DB.prepare(
      "SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(dbUser.id).all();

    return c.json(withdrawals.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch withdrawals" }, 500);
  }
});

// Create withdrawal request
app.post("/api/withdrawals", customAuthMiddleware, zValidator('json', WithdrawRequestSchema), async (c) => {
  const user = c.get("user");
  const { amount, pix_key } = c.req.valid('json');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const currentBalance = parseFloat(dbUser.current_balance);
    if (currentBalance < amount) {
      return c.json({ error: "Insufficient balance" }, 400);
    }

    if (amount < 20) {
      return c.json({ error: "Minimum withdrawal amount is R$20" }, 400);
    }

    // Check if user has VIP or Intermediate plan to allow withdrawals
    const levelInfo = await getLevelInfo(dbUser.id, c.env.DB);
    
    if (levelInfo.level < 2) {
      return c.json({ error: "Você precisa ter um plano Intermediário ou VIP para fazer saques" }, 400);
    }

    // Check minimum withdrawal amount based on user plan
    const intermediatePurchase = await c.env.DB.prepare(`
      SELECT ip.minimum_withdrawal
      FROM intermediate_purchases ipurch
      JOIN intermediate_plans ip ON ipurch.plan_id = ip.id
      WHERE ipurch.user_id = ? AND ipurch.is_active = 1 AND ipurch.payment_status = 'completed'
      ORDER BY ipurch.created_at DESC 
      LIMIT 1
    `).bind(dbUser.id).first();

    const minimumWithdrawal = intermediatePurchase ? intermediatePurchase.minimum_withdrawal : 20;
    
    if (amount < minimumWithdrawal) {
      return c.json({ error: `Minimum withdrawal amount is R$${minimumWithdrawal}` }, 400);
    }

    // Create withdrawal request
    await c.env.DB.prepare(`
      INSERT INTO withdrawals (user_id, amount, pix_key)
      VALUES (?, ?, ?)
    `).bind(dbUser.id, amount, pix_key).run();

    // Deduct amount from balance
    await c.env.DB.prepare(
      "UPDATE users SET current_balance = current_balance - ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(amount, dbUser.id).run();

    // Create live activity for withdrawal request
    await createLiveActivity(
      c.env.DB,
      'withdrawal',
      dbUser.name || user.email,
      `${maskUsername(dbUser.name || user.email)} solicitou saque de R$ ${amount.toFixed(2)}`,
      amount
    );

    // Create notification for withdrawal request
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).bind(
      dbUser.id,
      '💳 Saque Solicitado',
      `Sua solicitação de saque de R$ ${amount.toFixed(2)} para a chave PIX ${pix_key.substring(0, 10)}... foi recebida e está em análise. Você será notificado quando for processada.`,
      'info'
    ).run();

    return c.json({ success: true, message: "Withdrawal request created successfully" });
  } catch (error: any) {
    return c.json({ error: "Failed to create withdrawal" }, 500);
  }
});

// Spin wheel
app.post("/api/spin", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const today = new Date().toISOString().split('T')[0];
    
    if (dbUser.last_spin_date === today) {
      return c.json({ error: "You already spun today" }, 400);
    }

    // Generate random result
    const rand = Math.random();
    let result: SpinResult;
    let updateQuery = `UPDATE users SET last_spin_date = ?, updated_at = datetime('now')`;
    let updateParams = [today];

    if (rand < 0.1) {
      // 10% chance - money prize
      const amount = Math.random() < 0.5 ? 5 : 10;
      result = {
        prize_type: 'money',
        prize_value: amount,
        message: `Parabéns! Você ganhou R$ ${amount.toFixed(2)}!`
      };
      
      updateQuery += `, current_balance = current_balance + ?`;
      updateParams.push(amount.toString());
    } else if (rand < 0.4) {
      // 30% chance - bonus video
      const videos = Math.random() < 0.7 ? 1 : 2;
      result = {
        prize_type: 'video',
        prize_value: videos,
        message: `Você ganhou ${videos} vídeo${videos > 1 ? 's' : ''} bônus!`
      };
      
      updateQuery += `, bonus_videos = bonus_videos + ?`;
      updateParams.push(videos.toString());
    } else {
      // 60% chance - nothing
      result = {
        prize_type: 'nothing',
        prize_value: null,
        message: 'Que pena! Tente novamente amanhã.'
      };
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(dbUser.id);

    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();

    // Record spin result
    await c.env.DB.prepare(`
      INSERT INTO spin_results (user_id, prize_type, prize_value, spin_date)
      VALUES (?, ?, ?, ?)
    `).bind(dbUser.id, result.prize_type, result.prize_value, today).run();

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: "Failed to spin wheel" }, 500);
  }
});

// Get affiliate info
app.get("/api/affiliate", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    // Get referred users
    const referredUsers = await c.env.DB.prepare(
      "SELECT name, email, total_videos_watched, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC"
    ).bind(dbUser.affiliate_code).all();

    const referredCount = referredUsers.results.length;
    const bonusVideosEarned = referredCount; // 1 bonus video per active referral

    const affiliateInfo: AffiliateInfo = {
      affiliate_code: dbUser.affiliate_code,
      referred_count: referredCount,
      bonus_videos_earned: bonusVideosEarned,
      referred_users: referredUsers.results,
      affiliate_link: `https://nextfund.online/cadastro?ref=${dbUser.affiliate_code}`
    };

    return c.json(affiliateInfo);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch affiliate info" }, 500);
  }
});

// Get ranking
app.get("/api/ranking", customAuthMiddleware, async (c) => {
  try {
    const ranking = await c.env.DB.prepare(`
      SELECT u.name, u.email, u.level, u.total_videos_watched, u.total_earnings,
             COALESCE(vp.vip_level, 0) as vip_level,
             (u.total_videos_watched * 15 + u.total_earnings * 1 + COALESCE(vp.vip_level, 0) * 500) as total_points
      FROM users u
      LEFT JOIN (
        SELECT user_id, MAX(vip_level) as vip_level
        FROM vip_purchases 
        WHERE is_active = 1 AND payment_status = 'completed'
        GROUP BY user_id
      ) vp ON u.id = vp.user_id
      WHERE (u.is_admin = 0 OR u.is_admin IS NULL)
      ORDER BY total_points DESC, u.total_videos_watched DESC, vip_level DESC, u.total_earnings DESC
      LIMIT 100
    `).all();

    return c.json(ranking.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch ranking" }, 500);
  }
});

// Get user notifications
app.get("/api/notifications", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const notifications = await c.env.DB.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(dbUser.id).all();

    return c.json(notifications.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

// Mark notification as read
app.patch("/api/notifications/:id/read", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  const notificationId = parseInt(c.req.param('id'));
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    await c.env.DB.prepare(`
      UPDATE notifications 
      SET is_read = true, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, dbUser.id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// Mark all notifications as read
app.post("/api/notifications/mark-all-read", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    await c.env.DB.prepare(`
      UPDATE notifications 
      SET is_read = true, updated_at = datetime('now')
      WHERE user_id = ? AND is_read = false
    `).bind(dbUser.id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to mark all notifications as read" }, 500);
  }
});

// Renew session endpoint
app.post("/api/auth/renew-session", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  return c.json({ success: true, message: "Session renewed" });
});

// Get chat messages for authenticated user
app.get("/api/support/chat/messages", customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const messages = await c.env.DB.prepare(`
      SELECT id, user_email, user_name, message, admin_reply, admin_name, status, replied_at, created_at
      FROM chat_messages 
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 50
    `).bind(dbUser.id).all();

    return c.json(messages.results || []);
  } catch (error: any) {
    return c.json({ error: 'Erro ao buscar mensagens' }, 500);
  }
});

// Send chat message from authenticated user
app.post("/api/support/chat", customAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }
    
    const { message } = await c.req.json();

    if (!message || message.trim().length < 1) {
      return c.json({ error: "Mensagem é obrigatória" }, 400);
    }

    if (message.trim().length > 500) {
      return c.json({ error: "Mensagem muito longa (máximo 500 caracteres)" }, 400);
    }

    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    // Insert chat message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, user_email, user_name, message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(
      dbUser.id, 
      user.email, 
      user.google_user_data?.name || user.email,
      message.trim()
    ).run();

    return c.json({ 
      success: true, 
      message: "Mensagem enviada com sucesso!" 
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao enviar mensagem" }, 500);
  }
});

// Send chat message from support page (public endpoint)
app.post("/api/support/contact", async (c) => {
  try {
    const { name, email, message } = await c.req.json();

    if (!name || !email || !message) {
      return c.json({ error: "Nome, email e mensagem são obrigatórios" }, 400);
    }

    if (message.trim().length < 10) {
      return c.json({ error: "A mensagem deve ter pelo menos 10 caracteres" }, 400);
    }

    // Find user if exists
    let userId = null;
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();
    
    if (user) {
      userId = user.id;
    }

    // Insert chat message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, user_email, user_name, message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(userId, email, name, message.trim()).run();

    return c.json({ 
      success: true, 
      message: "Sua mensagem foi enviada com sucesso! Responderemos em breve." 
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao enviar mensagem" }, 500);
  }
});

// Admin - Get chat messages
app.get("/api/admin/chat", adminMiddleware, async (c) => {
  try {
    const { status = 'all', limit = '50' } = c.req.query();
    
    let query = `
      SELECT cm.*, u.is_admin, u.level
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
    `;
    let params: any[] = [];
    
    if (status && status !== 'all') {
      query += " WHERE cm.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY cm.created_at DESC LIMIT ?";
    params.push(parseInt(limit as string));

    const messages = await c.env.DB.prepare(query).bind(...params).all();

    // Get stats
    const stats = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE status = 'pending'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE status = 'replied'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM chat_messages").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE DATE(created_at) = DATE('now')").first(),
    ]);

    return c.json({
      messages: messages.results || [],
      stats: {
        pending: stats[0]?.count || 0,
        replied: stats[1]?.count || 0,
        total: stats[2]?.count || 0,
        today: stats[3]?.count || 0,
      }
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao buscar mensagens" }, 500);
  }
});

// Admin - Reply to chat message
app.patch("/api/admin/chat/:id/reply", adminMiddleware, async (c) => {
  const messageId = parseInt(c.req.param('id'));
  const { reply } = await c.req.json();
  
  try {
    if (!reply || reply.trim().length < 5) {
      return c.json({ error: "A resposta deve ter pelo menos 5 caracteres" }, 400);
    }

    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Admin user not found" }, 401);
    }
    
    const adminUser = await getOrCreateUser(
      currentUser.email,
      currentUser.google_user_data?.name || currentUser.email,
      c.env.DB
    );

    // Get original message
    const originalMessage = await c.env.DB.prepare(
      "SELECT user_id, user_email, user_name, message FROM chat_messages WHERE id = ?"
    ).bind(messageId).first();

    if (!originalMessage) {
      return c.json({ error: "Mensagem não encontrada" }, 404);
    }

    // Update message with reply
    await c.env.DB.prepare(`
      UPDATE chat_messages SET 
        admin_reply = ?,
        admin_id = ?,
        admin_name = ?,
        status = 'replied',
        replied_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      reply.trim(),
      adminUser.id,
      adminUser.name || adminUser.email,
      messageId
    ).run();

    // Create notification for user if they have an account
    if (originalMessage.user_id) {
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).bind(
        originalMessage.user_id,
        '💬 Resposta do Suporte',
        `Recebemos sua mensagem: "${originalMessage.message.substring(0, 50)}..." Nossa resposta: ${reply.substring(0, 100)}${reply.length > 100 ? '...' : ''}`,
        'info'
      ).run();
    }

    return c.json({ 
      success: true, 
      message: "Resposta enviada com sucesso!" 
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao enviar resposta" }, 500);
  }
});

// Admin - Mark chat message as read
app.patch("/api/admin/chat/:id/read", adminMiddleware, async (c) => {
  const messageId = parseInt(c.req.param('id'));
  
  try {
    await c.env.DB.prepare(`
      UPDATE chat_messages SET 
        is_read = true,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(messageId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Erro ao marcar como lida" }, 500);
  }
});

// Admin - Delete chat message
app.delete("/api/admin/chat/:id", adminMiddleware, async (c) => {
  const messageId = parseInt(c.req.param('id'));
  
  try {
    await c.env.DB.prepare("DELETE FROM chat_messages WHERE id = ?").bind(messageId).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Erro ao deletar mensagem" }, 500);
  }
});

// Apply coupon
app.post("/api/coupons/apply", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  const { code } = await c.req.json();
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    if (!code || !code.trim()) {
      return c.json({ error: "Código do cupom é obrigatório" }, 400);
    }

    const couponCode = code.trim().toUpperCase();

    // Find coupon
    const coupon = await c.env.DB.prepare(
      "SELECT * FROM coupons WHERE code = ? AND is_active = 1"
    ).bind(couponCode).first();

    if (!coupon) {
      return c.json({ 
        success: false, 
        message: "Cupom não encontrado ou inválido" 
      });
    }

    // Check if coupon is expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return c.json({ 
        success: false, 
        message: "Este cupom expirou" 
      });
    }

    // Check if coupon has reached max uses
    if (coupon.current_uses >= coupon.max_uses) {
      return c.json({ 
        success: false, 
        message: "Este cupom já foi usado o número máximo de vezes" 
      });
    }

    // Check if user has already used this coupon
    const existingUse = await c.env.DB.prepare(
      "SELECT id FROM coupon_uses WHERE user_id = ? AND coupon_id = ?"
    ).bind(dbUser.id, coupon.id).first();

    if (existingUse) {
      return c.json({ 
        success: false, 
        message: "Você já utilizou este cupom" 
      });
    }

    // Apply coupon based on type
    let discountApplied = coupon.discount_value;
    let updateQuery = "";
    let updateParams: any[] = [];

    if (coupon.discount_type === 'money') {
      // Add money to balance
      updateQuery = "UPDATE users SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = ?";
      updateParams = [discountApplied, dbUser.id];
    } else if (coupon.discount_type === 'bonus_videos') {
      // Add bonus videos
      updateQuery = "UPDATE users SET bonus_videos = bonus_videos + ?, updated_at = datetime('now') WHERE id = ?";
      updateParams = [discountApplied, dbUser.id];
    } else if (coupon.discount_type === 'percentage') {
      // For percentage, we'll store the percentage value for future use
      // This could be applied to next purchase, but for now we'll treat it as money
      const moneyBonus = Math.min(discountApplied, 50); // Cap at R$50
      updateQuery = "UPDATE users SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = ?";
      updateParams = [moneyBonus, dbUser.id];
      discountApplied = moneyBonus;
    }

    // Update user account
    if (updateQuery) {
      await c.env.DB.prepare(updateQuery).bind(...updateParams).run();
    }

    // Record coupon use
    await c.env.DB.prepare(`
      INSERT INTO coupon_uses (user_id, coupon_id, discount_applied)
      VALUES (?, ?, ?)
    `).bind(dbUser.id, coupon.id, discountApplied).run();

    // Update coupon usage count
    await c.env.DB.prepare(
      "UPDATE coupons SET current_uses = current_uses + 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(coupon.id).run();

    // Create notification
    let notificationTitle = "🎫 Cupom Aplicado!";
    let notificationMessage = "";
    
    if (coupon.discount_type === 'money') {
      notificationMessage = `Cupom ${couponCode} aplicado com sucesso! Você ganhou R$ ${discountApplied.toFixed(2)} em sua carteira.`;
    } else if (coupon.discount_type === 'bonus_videos') {
      notificationMessage = `Cupom ${couponCode} aplicado com sucesso! Você ganhou ${discountApplied} vídeo${discountApplied > 1 ? 's' : ''} bônus.`;
    } else if (coupon.discount_type === 'percentage') {
      notificationMessage = `Cupom ${couponCode} aplicado com sucesso! Você ganhou R$ ${discountApplied.toFixed(2)} de bônus.`;
    }

    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).bind(dbUser.id, notificationTitle, notificationMessage, 'success').run();

    return c.json({
      success: true,
      message: "Cupom aplicado com sucesso!",
      discount_applied: discountApplied,
      discount_type: coupon.discount_type,
      coupon: {
        code: coupon.code,
        description: coupon.description
      }
    });
  } catch (error: any) {
    return c.json({ error: "Erro ao aplicar cupom" }, 500);
  }
});

// Get coupon history
app.get("/api/coupons/history", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const history = await c.env.DB.prepare(`
      SELECT cu.*, c.code, c.description, c.discount_type
      FROM coupon_uses cu
      JOIN coupons c ON cu.coupon_id = c.id
      WHERE cu.user_id = ?
      ORDER BY cu.applied_at DESC
    `).bind(dbUser.id).all();

    const formattedHistory = history.results.map((use: any) => ({
      id: use.id,
      coupon_id: use.coupon_id,
      discount_applied: use.discount_applied,
      applied_at: use.applied_at,
      coupon: {
        code: use.code,
        description: use.description,
        discount_type: use.discount_type
      }
    }));

    return c.json(formattedHistory);
  } catch (error: any) {
    return c.json({ error: "Erro ao buscar histórico de cupons" }, 500);
  }
});

// Get announcements for user
app.get("/api/announcements", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    // Get active announcements that user hasn't seen yet
    const announcements = await c.env.DB.prepare(`
      SELECT a.*
      FROM admin_announcements a
      WHERE a.is_active = 1 
        AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
        AND (
          (a.target_new_users = 1 AND datetime(?, '+7 days') > datetime('now')) 
          OR a.target_all_users = 1
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_announcement_views uav 
          WHERE uav.user_id = ? AND uav.announcement_id = a.id
        )
      ORDER BY a.priority DESC, a.created_at DESC
    `).bind(dbUser.created_at, dbUser.id).all();

    return c.json(announcements.results || []);
  } catch (error: any) {
    return c.json({ error: "Erro ao buscar anúncios" }, 500);
  }
});

// Mark announcement as viewed
app.post("/api/announcements/:id/view", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  const announcementId = parseInt(c.req.param('id'));
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    // Check if already viewed
    const existingView = await c.env.DB.prepare(
      "SELECT id FROM user_announcement_views WHERE user_id = ? AND announcement_id = ?"
    ).bind(dbUser.id, announcementId).first();

    if (!existingView) {
      await c.env.DB.prepare(`
        INSERT INTO user_announcement_views (user_id, announcement_id)
        VALUES (?, ?)
      `).bind(dbUser.id, announcementId).run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Erro ao marcar anúncio como visto" }, 500);
  }
});

// Admin - Get all announcements
app.get("/api/admin/announcements", adminMiddleware, async (c) => {
  try {
    const announcements = await c.env.DB.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM user_announcement_views uav WHERE uav.announcement_id = a.id) as views_count
      FROM admin_announcements a
      ORDER BY a.created_at DESC
    `).all();

    return c.json(announcements.results || []);
  } catch (error: any) {
    return c.json({ error: "Erro ao buscar anúncios" }, 500);
  }
});

// Admin - Create announcement
app.post("/api/admin/announcements", adminMiddleware, async (c) => {
  try {
    const {
      title,
      content,
      target_new_users,
      target_all_users,
      priority,
      expires_at
    } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: "Título e conteúdo são obrigatórios" }, 400);
    }

    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Admin user not found" }, 401);
    }
    
    const adminUser = await getOrCreateUser(
      currentUser.email,
      currentUser.google_user_data?.name || currentUser.email,
      c.env.DB
    );

    await c.env.DB.prepare(`
      INSERT INTO admin_announcements (
        title, content, target_new_users, target_all_users, priority, expires_at,
        created_by_admin_id, created_by_admin_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      content,
      target_new_users || false,
      target_all_users || false,
      priority || 1,
      expires_at || null,
      adminUser.id,
      adminUser.name || adminUser.email
    ).run();

    return c.json({ success: true, message: "Anúncio criado com sucesso!" });
  } catch (error: any) {
    return c.json({ error: "Erro ao criar anúncio" }, 500);
  }
});

// Admin - Update announcement
app.patch("/api/admin/announcements/:id", adminMiddleware, async (c) => {
  const announcementId = parseInt(c.req.param('id'));
  
  try {
    const {
      title,
      content,
      target_new_users,
      target_all_users,
      priority,
      expires_at,
      is_active
    } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE admin_announcements SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        target_new_users = COALESCE(?, target_new_users),
        target_all_users = COALESCE(?, target_all_users),
        priority = COALESCE(?, priority),
        expires_at = COALESCE(?, expires_at),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title,
      content,
      target_new_users,
      target_all_users,
      priority,
      expires_at,
      is_active,
      announcementId
    ).run();

    return c.json({ success: true, message: "Anúncio atualizado com sucesso!" });
  } catch (error: any) {
    return c.json({ error: "Erro ao atualizar anúncio" }, 500);
  }
});

// Admin - Delete announcement
app.delete("/api/admin/announcements/:id", adminMiddleware, async (c) => {
  const announcementId = parseInt(c.req.param('id'));

  try {
    // Delete views first
    await c.env.DB.prepare("DELETE FROM user_announcement_views WHERE announcement_id = ?").bind(announcementId).run();
    
    // Delete announcement
    await c.env.DB.prepare("DELETE FROM admin_announcements WHERE id = ?").bind(announcementId).run();

    return c.json({ success: true, message: "Anúncio deletado com sucesso!" });
  } catch (error: any) {
    return c.json({ error: "Erro ao deletar anúncio" }, 500);
  }
});

// Admin middleware
async function adminMiddleware(c: any, next: any) {
  await customAuthMiddleware(c, () => {});
  
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const dbUser = await getOrCreateUser(
    user.email, 
    user.google_user_data?.name || user.email,
    c.env.DB
  );

  if (!dbUser.is_admin) {
    return c.json({ error: "Admin access required" }, 403);
  }

  return next();
}

// Get VIP payment links
app.get("/api/admin/vip-links", adminMiddleware, async (c) => {
  try {
    const links = await c.env.DB.prepare(
      "SELECT * FROM vip_payment_links ORDER BY vip_level ASC"
    ).all();

    return c.json(links.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch VIP payment links" }, 500);
  }
});

// Update VIP payment link
app.patch("/api/admin/vip-links/:level", adminMiddleware, async (c) => {
  const level = parseInt(c.req.param('level'));
  const { payment_url, is_active } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE vip_payment_links SET payment_url = ?, is_active = ?, updated_at = datetime('now') WHERE vip_level = ?"
    ).bind(payment_url, is_active, level).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update VIP payment link" }, 500);
  }
});

// Get public VIP payment links
app.get("/api/vip-links", async (c) => {
  try {
    const links = await c.env.DB.prepare(
      "SELECT vip_level, payment_url FROM vip_payment_links WHERE is_active = 1 AND payment_url != ''"
    ).all();

    return c.json(links.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch VIP payment links" }, 500);
  }
});

// Process VIP purchase (webhook or manual confirmation)
app.post("/api/admin/vip-purchases", adminMiddleware, async (c) => {
  try {
    const { user_email, vip_level, amount, payment_reference, payment_status = 'completed' } = await c.req.json();

    if (!user_email || !vip_level || !amount) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(user_email).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already has this VIP level
    const existingPurchase = await c.env.DB.prepare(
      "SELECT id FROM vip_purchases WHERE user_id = ? AND vip_level = ? AND is_active = 1"
    ).bind(user.id, vip_level).first();

    if (existingPurchase) {
      return c.json({ error: "User already has this VIP level" }, 400);
    }

    // Deactivate lower VIP levels
    await c.env.DB.prepare(
      "UPDATE vip_purchases SET is_active = 0, updated_at = datetime('now') WHERE user_id = ? AND vip_level < ?"
    ).bind(user.id, vip_level).run();

    // Create VIP purchase record
    await c.env.DB.prepare(`
      INSERT INTO vip_purchases (user_id, vip_level, purchase_date, amount, payment_status, payment_reference, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(user.id, vip_level, today, amount, payment_status, payment_reference || null).run();

    // Update user level AND daily_limit in users table
    const levelInfo = await getLevelInfo(user.id, c.env.DB);
    await c.env.DB.prepare(
      "UPDATE users SET level = ?, daily_limit = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(levelInfo.level, levelInfo.dailyLimit, user.id).run();

    return c.json({ 
      success: true, 
      message: `VIP ${vip_level} purchase recorded for ${user_email}`,
      new_level: levelInfo.level,
      level_title: levelInfo.title
    });
  } catch (error: any) {
    return c.json({ error: "Failed to process VIP purchase" }, 500);
  }
});

// Get user's VIP purchases
app.get("/api/vip-purchases", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const purchases = await c.env.DB.prepare(`
      SELECT vip_level, purchase_date, amount, payment_status, is_active
      FROM vip_purchases 
      WHERE user_id = ? 
      ORDER BY vip_level DESC
    `).bind(dbUser.id).all();

    return c.json(purchases.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch VIP purchases" }, 500);
  }
});

// Get user's intermediate purchases
app.get("/api/intermediate-purchases", customAuthMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const purchases = await c.env.DB.prepare(`
      SELECT ip.name, ipurch.purchase_date, ipurch.amount, ipurch.payment_status, ipurch.is_active
      FROM intermediate_purchases ipurch
      JOIN intermediate_plans ip ON ipurch.plan_id = ip.id
      WHERE ipurch.user_id = ? 
      ORDER BY ipurch.created_at DESC
    `).bind(dbUser.id).all();

    return c.json(purchases.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch intermediate purchases" }, 500);
  }
});

// Admin - Get all VIP purchases
app.get("/api/admin/vip-purchases", adminMiddleware, async (c) => {
  try {
    const purchases = await c.env.DB.prepare(`
      SELECT vp.*, u.email as user_email, u.name as user_name
      FROM vip_purchases vp
      JOIN users u ON vp.user_id = u.id
      ORDER BY vp.created_at DESC
    `).all();

    return c.json(purchases.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch VIP purchases" }, 500);
  }
});

// Admin - Get all intermediate purchases
app.get("/api/admin/intermediate-purchases", adminMiddleware, async (c) => {
  try {
    const purchases = await c.env.DB.prepare(`
      SELECT ip.*, u.email as user_email, u.name as user_name, iplan.name
      FROM intermediate_purchases ip
      JOIN users u ON ip.user_id = u.id
      LEFT JOIN intermediate_plans iplan ON ip.plan_id = iplan.id
      ORDER BY ip.created_at DESC
    `).all();

    return c.json(purchases.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch intermediate purchases" }, 500);
  }
});

// Admin - Get all Pushin Pay transactions
app.get("/api/admin/pushin-transactions", adminMiddleware, async (c) => {
  try {
    const transactions = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions
      ORDER BY created_at DESC
      LIMIT 500
    `).all();

    return c.json(transactions.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch Pushin Pay transactions" }, 500);
  }
});

// Admin - Get ranking for management
app.get("/api/admin/ranking", adminMiddleware, async (c) => {
  try {
    const ranking = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.level, u.total_videos_watched, u.total_earnings,
             COALESCE(vp.vip_level, 0) as vip_level,
             (u.total_videos_watched * 15 + u.total_earnings * 1 + COALESCE(vp.vip_level, 0) * 500) as total_points
      FROM users u
      LEFT JOIN (
        SELECT user_id, MAX(vip_level) as vip_level
        FROM vip_purchases 
        WHERE is_active = 1 AND payment_status = 'completed'
        GROUP BY user_id
      ) vp ON u.id = vp.user_id
      WHERE (u.is_admin = 0 OR u.is_admin IS NULL)
      ORDER BY total_points DESC, u.total_videos_watched DESC, vip_level DESC, u.total_earnings DESC
      LIMIT 100
    `).all();

    return c.json(ranking.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch admin ranking" }, 500);
  }
});

// Admin - Get ranking statistics
app.get("/api/admin/ranking/stats", adminMiddleware, async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [totalUsers, topScorer, avgPoints, activeToday] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE (is_admin = 0 OR is_admin IS NULL)").first(),
      c.env.DB.prepare(`
        SELECT MAX(u.total_videos_watched * 15 + u.total_earnings * 1 + COALESCE(vp.vip_level, 0) * 500) as max_points
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(vip_level) as vip_level
          FROM vip_purchases 
          WHERE is_active = 1 AND payment_status = 'completed'
          GROUP BY user_id
        ) vp ON u.id = vp.user_id
        WHERE (u.is_admin = 0 OR u.is_admin IS NULL)
      `).first(),
      c.env.DB.prepare(`
        SELECT AVG(u.total_videos_watched * 15 + u.total_earnings * 1 + COALESCE(vp.vip_level, 0) * 500) as avg_points
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(vip_level) as vip_level
          FROM vip_purchases 
          WHERE is_active = 1 AND payment_status = 'completed'
          GROUP BY user_id
        ) vp ON u.id = vp.user_id
        WHERE (u.is_admin = 0 OR u.is_admin IS NULL)
      `).first(),
      c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE (is_admin = 0 OR is_admin IS NULL) 
        AND last_video_date = ?
      `).bind(today).first()
    ]);

    return c.json({
      total_users: totalUsers?.count || 0,
      top_scorer: topScorer?.max_points || 0,
      average_points: avgPoints?.avg_points || 0,
      active_today: activeToday?.count || 0
    });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch ranking stats" }, 500);
  }
});

// Admin - Generate fake users for ranking
app.post("/api/admin/ranking/generate-fake", adminMiddleware, async (c) => {
  try {
    const { count = 5 } = await c.req.json();
    
    if (count < 1 || count > 50) {
      return c.json({ error: "Count must be between 1 and 50" }, 400);
    }

    const fakeNames = [
      'Ana Silva', 'Bruno Costa', 'Carla Mendes', 'Diego Santos', 'Elena Rodriguez',
      'Felipe Oliveira', 'Gabriela Lima', 'Henrique Alves', 'Isabela Rocha', 'João Pereira',
      'Kamila Ferreira', 'Lucas Martins', 'Marina Souza', 'Nicolas Barbosa', 'Olivia Castro',
      'Pedro Nascimento', 'Quintana Vieira', 'Rafael Cardoso', 'Sophia Torres', 'Thiago Moura',
      'Ursula Dias', 'Vitor Ribeiro', 'Wendy Campos', 'Xavier Gomes', 'Yasmin Correia',
      'Zara Monteiro', 'Andre Pinto', 'Beatriz Cunha', 'Carlos Freitas', 'Daniela Lopes',
      'Eduardo Reis', 'Fernanda Azevedo', 'Gustavo Melo', 'Helena Nunes', 'Igor Teixeira',
      'Julia Ramos', 'Kevin Machado', 'Larissa Duarte', 'Marcos Carvalho', 'Natalia Farias',
      'Otavio Moreira', 'Patricia Siqueira', 'Quentin Borges', 'Renata Cavalcanti', 'Samuel Aguiar',
      'Tatiana Prado', 'Ulisses Fonseca', 'Vanessa Porto', 'Wallace Miranda', 'Ximena Brito'
    ];

    // Get current top real users to calculate competitive stats
    const topRealUsers = await c.env.DB.prepare(`
      SELECT u.total_videos_watched, u.total_earnings,
             COALESCE(vp.vip_level, 0) as vip_level,
             (u.total_videos_watched * 15 + u.total_earnings * 1 + COALESCE(vp.vip_level, 0) * 500) as total_points
      FROM users u
      LEFT JOIN (
        SELECT user_id, MAX(vip_level) as vip_level
        FROM vip_purchases 
        WHERE is_active = 1 AND payment_status = 'completed'
        GROUP BY user_id
      ) vp ON u.id = vp.user_id
      WHERE (u.is_admin = 0 OR u.is_admin IS NULL) AND (u.is_fake = 0 OR u.is_fake IS NULL)
      ORDER BY total_points DESC
      LIMIT 10
    `).all();

    // Calculate competitive baseline for top 3 positions
    const realUsers = topRealUsers.results || [];
    const topUserPoints = realUsers.length > 0 ? realUsers[0].total_points : 0;
    const secondUserPoints = realUsers.length > 1 ? realUsers[1].total_points : 0;
    const thirdUserPoints = realUsers.length > 2 ? realUsers[2].total_points : 0;

    // Generate user data strategically to dominate top 3
    const userData = [];
    for (let i = 0; i < count; i++) {
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const email = `fake.${name.toLowerCase().replace(' ', '.')}${Math.floor(Math.random() * 10000)}@nextfund.fake`;
      
      let videosWatched, totalEarnings, vipLevel;
      
      if (i === 0) {
        // First fake user - guarantee top 1 position with strategic calculation
        const targetPoints = Math.max(topUserPoints + 1500, 6000); // Ensure significant lead
        vipLevel = 6; // VIP 6 gives 3000 points (6 * 500)
        
        // Formula: points = videos * 15 + earnings * 1 + vip * 500
        // Rearranging: videos * 15 + earnings = targetPoints - (vip * 500)
        // Let's set earnings = videos * 2.5 (realistic ratio)
        // So: videos * 15 + videos * 2.5 = targetPoints - 3000
        // Therefore: videos * 17.5 = targetPoints - 3000
        const remainingPoints = targetPoints - (vipLevel * 500);
        videosWatched = Math.ceil(remainingPoints / 17.5);
        totalEarnings = videosWatched * 2.5;
        
        // Add some buffer to ensure dominance
        videosWatched = Math.max(300, videosWatched + 50);
        totalEarnings = videosWatched * 2.5;
        
      } else if (i === 1) {
        // Second fake user - guarantee top 2 position
        const targetPoints = Math.max(Math.max(secondUserPoints, topUserPoints * 0.85) + 800, 5000);
        vipLevel = 5; // VIP 5 gives 2500 points (5 * 500)
        
        const remainingPoints = targetPoints - (vipLevel * 500);
        videosWatched = Math.ceil(remainingPoints / 17);
        totalEarnings = videosWatched * 2.3;
        
        videosWatched = Math.max(250, videosWatched + 30);
        totalEarnings = videosWatched * 2.3;
        
      } else if (i === 2) {
        // Third fake user - guarantee top 3 position
        const targetPoints = Math.max(Math.max(thirdUserPoints, topUserPoints * 0.75) + 500, 4000);
        vipLevel = 4; // VIP 4 gives 2000 points (4 * 500)
        
        const remainingPoints = targetPoints - (vipLevel * 500);
        videosWatched = Math.ceil(remainingPoints / 16.5);
        totalEarnings = videosWatched * 2.1;
        
        videosWatched = Math.max(200, videosWatched + 20);
        totalEarnings = videosWatched * 2.1;
        
      } else {
        // Other users - competitive but not necessarily top 3
        vipLevel = Math.random() < 0.4 ? Math.floor(Math.random() * 4) + 1 : 0;
        videosWatched = Math.floor(Math.random() * 180) + 20;
        totalEarnings = videosWatched * (1.5 + Math.random() * 1.5);
      }
      
      // Ensure proper rounding and minimum values
      videosWatched = Math.max(10, Math.round(videosWatched));
      totalEarnings = Math.max(videosWatched * 1.5, Math.round(totalEarnings * 100) / 100);
      
      // Calculate user level based on VIP level
      let level = 1;
      if (vipLevel > 0) {
        level = Math.min(8, 2 + vipLevel);
      } else {
        level = Math.min(5, Math.floor(videosWatched / 50) + 1);
      }
      
      // Calculate exact points using the ACTUAL ranking formula
      const calculatedPoints = videosWatched * 15 + totalEarnings * 1 + vipLevel * 500;
      
      userData.push({
        name,
        email,
        videosWatched,
        totalEarnings,
        level,
        vipLevel,
        calculatedPoints
      });
    }

    // Sort by calculated points descending to ensure proper ranking
    userData.sort((a, b) => b.calculatedPoints - a.calculatedPoints);

    const createdUsers = [];

    for (let i = 0; i < userData.length; i++) {
      const user = userData[i];
      const affiliateCode = generateAffiliateCode();
      
      try {
        // Create fake user with is_fake = true
        const result = await c.env.DB.prepare(`
          INSERT INTO users (
            email, name, affiliate_code, current_balance, total_earnings, 
            total_videos_watched, daily_videos_watched, bonus_videos, level, daily_limit, is_fake
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
          user.email, user.name, affiliateCode, 
          Math.round(user.totalEarnings * 0.8 * 100) / 100, // 80% of earnings as current balance
          Math.round(user.totalEarnings * 100) / 100, // Round to 2 decimal places
          user.videosWatched,
          Math.floor(Math.random() * 10), // Random daily videos (0-9)
          Math.floor(Math.random() * 3), // Random bonus videos (0-2)
          user.level,
          user.level >= 3 ? 15 + (user.level - 3) * 5 : 10 // Higher levels get more daily videos
        ).run();

        const userId = result.meta.last_row_id;

        // Create VIP purchase if user has VIP level
        if (user.vipLevel > 0) {
          const vipAmount = user.vipLevel * 150; // R$150 per VIP level
          const today = new Date().toISOString().split('T')[0];
          
          await c.env.DB.prepare(`
            INSERT INTO vip_purchases (
              user_id, vip_level, purchase_date, amount, payment_status, 
              payment_reference, is_active
            )
            VALUES (?, ?, ?, ?, 'completed', ?, 1)
          `).bind(
            userId, user.vipLevel, today, vipAmount, `FAKE_${Date.now()}_${userId}`
          ).run();
        }

        // Generate realistic video watch history
        const watchCount = Math.min(user.videosWatched, 100); // Create watch history for up to 100 videos
        let totalWatchEarnings = 0;
        
        for (let j = 0; j < watchCount; j++) {
          const daysAgo = Math.floor(Math.random() * 30); // Random day in last 30 days
          const watchDate = new Date();
          watchDate.setDate(watchDate.getDate() - daysAgo);
          const dateStr = watchDate.toISOString().split('T')[0];
          
          // Calculate realistic earnings per video based on level/VIP
          const earningsPerVideo = 2.0 + (user.vipLevel * 0.1); // Base + VIP bonus
          totalWatchEarnings += earningsPerVideo;
          
          await c.env.DB.prepare(`
            INSERT INTO video_watches (user_id, video_id, earnings, watch_date)
            VALUES (?, 1, ?, ?)
          `).bind(userId, earningsPerVideo, dateStr).run();
        }

        createdUsers.push({
          id: userId,
          name: user.name,
          email: user.email,
          level: user.level,
          vip_level: user.vipLevel,
          videos_watched: user.videosWatched,
          total_earnings: user.totalEarnings,
          calculated_points: user.calculatedPoints,
          ranking_position: i + 1 // Position in ranking (1 = top)
        });
      } catch (dbError: any) {
        // Skip this user if email already exists
        continue;
      }
    }

    return c.json({ 
      success: true, 
      message: `${createdUsers.length} usuários fake criados com pontuação correta! Os ${Math.min(3, createdUsers.length)} primeiros foram configurados para dominar o top 3 do ranking.`,
      users: createdUsers,
      top_user: createdUsers[0] ? {
        name: createdUsers[0].name,
        videos_watched: createdUsers[0].videos_watched,
        total_earnings: createdUsers[0].total_earnings,
        vip_level: createdUsers[0].vip_level,
        total_points: createdUsers[0].calculated_points,
        position: 1
      } : null,
      strategy_used: {
        analyzed_real_users: realUsers.length,
        top_real_user_points: topUserPoints,
        guaranteed_top_3: Math.min(3, count),
        formula_used: "pontos = (vídeos × 15) + (ganhos × 1) + (vip_level × 500)",
        note: "Corrigida a fórmula de cálculo - agora os pontos são consistentes com a matemática do ranking"
      }
    });
  } catch (error: any) {
    return c.json({ error: "Failed to generate fake users" }, 500);
  }
});

// Admin - Reset ranking (clear all user progress and delete fake users)
app.post("/api/admin/ranking/reset", adminMiddleware, async (c) => {
  try {
    // First, get IDs of fake users to delete completely
    const fakeUsers = await c.env.DB.prepare(`
      SELECT id FROM users WHERE is_fake = 1
    `).all();

    const fakeUserIds = fakeUsers.results.map((user: any) => user.id);

    // Delete all data related to fake users
    if (fakeUserIds.length > 0) {
      const placeholders = fakeUserIds.map(() => '?').join(',');
      
      // Delete fake user related data
      await c.env.DB.prepare(`
        DELETE FROM video_watches WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM vip_purchases WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM intermediate_purchases WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM spin_results WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM withdrawals WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM notifications WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM coupon_uses WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM user_custom_videos WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM user_custom_settings WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM pushin_transactions WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      await c.env.DB.prepare(`
        DELETE FROM video_question_answers WHERE user_id IN (${placeholders})
      `).bind(...fakeUserIds).run();

      // Finally, delete the fake users themselves
      await c.env.DB.prepare(`
        DELETE FROM users WHERE is_fake = 1
      `).run();
    }

    // Reset real user stats (non-admin, non-fake users)
    await c.env.DB.prepare(`
      UPDATE users SET 
        total_videos_watched = 0,
        total_earnings = 0,
        current_balance = 2.0,
        daily_videos_watched = 0,
        bonus_videos = 0,
        level = 1,
        daily_limit = 10,
        last_video_date = NULL,
        last_spin_date = NULL,
        updated_at = datetime('now')
      WHERE (is_admin = 0 OR is_admin IS NULL) AND (is_fake = 0 OR is_fake IS NULL)
    `).run();

    // Clear video watch history for real users
    await c.env.DB.prepare(`
      DELETE FROM video_watches 
      WHERE user_id IN (
        SELECT id FROM users WHERE (is_admin = 0 OR is_admin IS NULL) AND (is_fake = 0 OR is_fake IS NULL)
      )
    `).run();

    // Clear VIP purchases for real users
    await c.env.DB.prepare(`
      UPDATE vip_purchases SET is_active = 0, updated_at = datetime('now')
      WHERE user_id IN (
        SELECT id FROM users WHERE (is_admin = 0 OR is_admin IS NULL) AND (is_fake = 0 OR is_fake IS NULL)
      )
    `).run();

    // Clear intermediate purchases for real users
    await c.env.DB.prepare(`
      UPDATE intermediate_purchases SET is_active = 0, updated_at = datetime('now')
      WHERE user_id IN (
        SELECT id FROM users WHERE (is_admin = 0 OR is_admin IS NULL) AND (is_fake = 0 OR is_fake IS NULL)
      )
    `).run();

    // Clear spin results for real users
    await c.env.DB.prepare(`
      DELETE FROM spin_results 
      WHERE user_id IN (
        SELECT id FROM users WHERE (is_admin = 0 OR is_admin IS NULL) AND (is_fake = 0 OR is_fake IS NULL)
      )
    `).run();

    // Clear withdrawals for real users
    await c.env.DB.prepare(`
      DELETE FROM withdrawals 
      WHERE user_id IN (
        SELECT id FROM users WHERE (is_admin = 0 OR is_admin IS NULL) AND (is_fake = 0 OR is_fake IS NULL)
      )
    `).run();

    return c.json({ 
      success: true, 
      message: `Ranking resetado com sucesso! ${fakeUserIds.length} usuários fake foram completamente removidos do sistema.`
    });
  } catch (error: any) {
    return c.json({ error: "Failed to reset ranking" }, 500);
  }
});

// Admin - Adjust user points
app.post("/api/admin/ranking/adjust/:userId", adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const { adjustment } = await c.req.json();
    
    if (!userId || typeof adjustment !== 'number') {
      return c.json({ error: "Invalid userId or adjustment value" }, 400);
    }

    // Get current user data
    const user = await c.env.DB.prepare(
      "SELECT total_videos_watched, total_earnings FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Calculate new values based on point adjustment
    // Points = (videos * 10) + (earnings * 2)
    // We'll adjust earnings since it's more flexible
    const currentEarningsPoints = user.total_earnings * 2;
    const newEarningsPoints = Math.max(0, currentEarningsPoints + adjustment);
    const newEarnings = newEarningsPoints / 2;

    // Update user earnings and balance
    await c.env.DB.prepare(`
      UPDATE users SET 
        total_earnings = ?,
        current_balance = current_balance + ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(newEarnings, adjustment / 2, userId).run();

    return c.json({ 
      success: true, 
      message: `Points adjusted by ${adjustment}`,
      new_earnings: newEarnings
    });
  } catch (error: any) {
    return c.json({ error: "Failed to adjust user points" }, 500);
  }
});

// Admin - Update Pushin Pay transaction status
app.patch("/api/admin/pushin-transactions/:id", adminMiddleware, async (c) => {
  const transactionId = parseInt(c.req.param('id'));
  const { status } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE pushin_transactions SET status = ?, processed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).bind(status, transactionId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update transaction status" }, 500);
  }
});

// Admin - Process intermediate purchase
app.post("/api/admin/intermediate-purchases", adminMiddleware, async (c) => {
  try {
    const { user_email, amount, payment_reference, payment_status = 'completed' } = await c.req.json();

    if (!user_email || !amount) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(user_email).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const today = new Date().toISOString().split('T')[0];

    // Get current user data to check videos watched today
    const currentUser = await c.env.DB.prepare(
      "SELECT daily_videos_watched, last_video_date, daily_limit FROM users WHERE id = ?"
    ).bind(user.id).first();
    
    const videosWatchedToday = (currentUser.last_video_date === today) ? currentUser.daily_videos_watched : 0;
    const currentLimit = currentUser.daily_limit || 10;
    
    // Deactivate any existing intermediate purchases
    await c.env.DB.prepare(
      "UPDATE intermediate_purchases SET is_active = 0, updated_at = datetime('now') WHERE user_id = ?"
    ).bind(user.id).run();
    
    // Get or create the intermediate plan
    let plan = await c.env.DB.prepare(
      "SELECT * FROM intermediate_plans WHERE name = 'Intermediário' LIMIT 1"
    ).first();
    
    if (!plan) {
      // Create the intermediate plan if it doesn't exist
      await c.env.DB.prepare(`
        INSERT INTO intermediate_plans (name, price, daily_limit, minimum_withdrawal, is_active)
        VALUES ('Intermediário', 0.50, 12, 20.0, 1)
      `).run();
      
      plan = await c.env.DB.prepare(
        "SELECT * FROM intermediate_plans WHERE name = 'Intermediário' LIMIT 1"
      ).first();
    }
    
    if (plan) {
      // Create intermediate purchase record
      await c.env.DB.prepare(`
        INSERT INTO intermediate_purchases (user_id, plan_id, purchase_date, amount, payment_status, payment_reference, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).bind(user.id, plan.id, today, amount, payment_status, payment_reference || null).run();
      
      // Update user level and daily_limit
      await c.env.DB.prepare(
        "UPDATE users SET level = 2, daily_limit = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(plan.daily_limit, user.id).run();
      
      // Calculate bonus videos for today
      const newDailyLimit = plan.daily_limit;
      const bonusVideosToday = Math.max(0, newDailyLimit - Math.max(videosWatchedToday, currentLimit));
      
      if (bonusVideosToday > 0) {
        // Add bonus videos for the remaining videos today
        await c.env.DB.prepare(
          "UPDATE users SET bonus_videos = bonus_videos + ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(bonusVideosToday, user.id).run();
      }
      
      // Create success notification for user
      const bonusMessage = bonusVideosToday > 0 ? 
        ` Você ganhou ${bonusVideosToday} vídeos bônus para hoje. Amanhã você terá ${newDailyLimit} vídeos completos.` : 
        ` A partir de amanhã você terá ${newDailyLimit} vídeos por dia.`;
        
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).bind(
        user.id,
        'Plano Intermediário Ativado! 🎉',
        `Seu plano Intermediário foi ativado manualmente por um administrador. Agora você pode fazer saques a partir de R$ 20.${bonusMessage}`,
        'success'
      ).run();

      return c.json({ 
        success: true, 
        message: `Intermediate plan activated for ${user_email}`,
        new_level: 2,
        level_title: 'Intermediário'
      });
    } else {
      return c.json({ error: "Failed to create or find intermediate plan" }, 500);
    }
  } catch (error: any) {
    return c.json({ error: "Failed to process intermediate purchase" }, 500);
  }
});

// Admin - Get all coupons
app.get("/api/admin/coupons", adminMiddleware, async (c) => {
  try {
    const coupons = await c.env.DB.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM coupon_uses WHERE coupon_id = c.id) as total_uses
      FROM coupons c
      ORDER BY c.created_at DESC
    `).all();

    return c.json(coupons.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch coupons" }, 500);
  }
});

// Admin - Create coupon
app.post("/api/admin/coupons", adminMiddleware, async (c) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      max_uses,
      expires_at
    } = await c.req.json();

    if (!code || !discount_type || discount_value === undefined) {
      return c.json({ error: "Code, discount_type, and discount_value are required" }, 400);
    }

    // Check if coupon code already exists
    const existingCoupon = await c.env.DB.prepare(
      "SELECT id FROM coupons WHERE code = ?"
    ).bind(code.toUpperCase()).first();

    if (existingCoupon) {
      return c.json({ error: "Coupon code already exists" }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      code.toUpperCase(),
      description || null,
      discount_type,
      discount_value,
      max_uses || 1,
      expires_at || null
    ).run();

    return c.json({ success: true, message: "Coupon created successfully" });
  } catch (error: any) {
    return c.json({ error: "Failed to create coupon" }, 500);
  }
});

// Admin - Update coupon
app.patch("/api/admin/coupons/:id", adminMiddleware, async (c) => {
  const couponId = parseInt(c.req.param('id'));
  
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      max_uses,
      expires_at,
      is_active
    } = await c.req.json();

    // Check if new code conflicts with existing coupons (excluding current one)
    if (code) {
      const existingCoupon = await c.env.DB.prepare(
        "SELECT id FROM coupons WHERE code = ? AND id != ?"
      ).bind(code.toUpperCase(), couponId).first();

      if (existingCoupon) {
        return c.json({ error: "Coupon code already exists" }, 400);
      }
    }

    await c.env.DB.prepare(`
      UPDATE coupons SET 
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        max_uses = COALESCE(?, max_uses),
        expires_at = COALESCE(?, expires_at),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      code?.toUpperCase(),
      description,
      discount_type,
      discount_value,
      max_uses,
      expires_at,
      is_active,
      couponId
    ).run();

    return c.json({ success: true, message: "Coupon updated successfully" });
  } catch (error: any) {
    return c.json({ error: "Failed to update coupon" }, 500);
  }
});

// Admin - Delete coupon
app.delete("/api/admin/coupons/:id", adminMiddleware, async (c) => {
  const couponId = parseInt(c.req.param('id'));

  try {
    // Delete coupon uses first
    await c.env.DB.prepare("DELETE FROM coupon_uses WHERE coupon_id = ?").bind(couponId).run();
    
    // Delete the coupon
    await c.env.DB.prepare("DELETE FROM coupons WHERE id = ?").bind(couponId).run();

    return c.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    return c.json({ error: "Failed to delete coupon" }, 500);
  }
});

// Admin - Get coupon usage statistics
app.get("/api/admin/coupons/stats", adminMiddleware, async (c) => {
  try {
    const stats = await Promise.all([
      // Total coupons
      c.env.DB.prepare("SELECT COUNT(*) as count FROM coupons").first(),
      
      // Active coupons
      c.env.DB.prepare("SELECT COUNT(*) as count FROM coupons WHERE is_active = 1").first(),
      
      // Total coupon uses
      c.env.DB.prepare("SELECT COUNT(*) as count FROM coupon_uses").first(),
      
      // Total discount given
      c.env.DB.prepare("SELECT SUM(discount_applied) as total FROM coupon_uses").first(),
      
      // Most used coupons
      c.env.DB.prepare(`
        SELECT c.code, c.description, COUNT(cu.id) as uses, SUM(cu.discount_applied) as total_discount
        FROM coupons c
        LEFT JOIN coupon_uses cu ON c.id = cu.coupon_id
        GROUP BY c.id, c.code, c.description
        ORDER BY uses DESC
        LIMIT 10
      `).all(),
      
      // Recent coupon uses
      c.env.DB.prepare(`
        SELECT cu.*, c.code, u.email as user_email
        FROM coupon_uses cu
        JOIN coupons c ON cu.coupon_id = c.id
        JOIN users u ON cu.user_id = u.id
        ORDER BY cu.applied_at DESC
        LIMIT 20
      `).all(),
    ]);

    return c.json({
      total_coupons: stats[0]?.count || 0,
      active_coupons: stats[1]?.count || 0,
      total_uses: stats[2]?.count || 0,
      total_discount_given: stats[3]?.total || 0,
      most_used_coupons: stats[4]?.results || [],
      recent_uses: stats[5]?.results || [],
    });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch coupon stats" }, 500);
  }
});

// Public endpoint to get home banners
app.get("/api/home-banners", async (c) => {
  try {
    const banners = await c.env.DB.prepare(`
      SELECT id, title, image_url, link_url, description
      FROM home_banners 
      WHERE is_active = 1 
      ORDER BY display_order ASC, created_at DESC
    `).all();

    return c.json(banners.results || []);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch home banners" }, 500);
  }
});

// Admin - Get all home banners
app.get("/api/admin/home-banners", adminMiddleware, async (c) => {
  try {
    const banners = await c.env.DB.prepare(`
      SELECT * FROM home_banners 
      ORDER BY display_order ASC, created_at DESC
    `).all();

    return c.json(banners.results || []);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch home banners" }, 500);
  }
});

// Admin - Create home banner
app.post("/api/admin/home-banners", adminMiddleware, async (c) => {
  try {
    const { title, image_url, link_url, description, is_active = true, display_order = 0 } = await c.req.json();

    if (!title || !image_url) {
      return c.json({ error: "Title and image URL are required" }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO home_banners (title, image_url, link_url, description, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(title, image_url, link_url || null, description || null, is_active, display_order).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error: any) {
    return c.json({ error: "Failed to create home banner" }, 500);
  }
});

// Admin - Update home banner
app.patch("/api/admin/home-banners/:id", adminMiddleware, async (c) => {
  const bannerId = parseInt(c.req.param('id'));
  
  try {
    const { title, image_url, link_url, description, is_active, display_order } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE home_banners SET 
        title = COALESCE(?, title),
        image_url = COALESCE(?, image_url),
        link_url = COALESCE(?, link_url),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        display_order = COALESCE(?, display_order),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(title, image_url, link_url, description, is_active, display_order, bannerId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update home banner" }, 500);
  }
});

// Admin - Delete home banner
app.delete("/api/admin/home-banners/:id", adminMiddleware, async (c) => {
  const bannerId = parseInt(c.req.param('id'));

  try {
    await c.env.DB.prepare("DELETE FROM home_banners WHERE id = ?").bind(bannerId).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete home banner" }, 500);
  }
});

// VIP Groups routes
app.get('/api/admin/vip-groups', adminMiddleware, async (c) => {
  try {
    const groups = await c.env.DB.prepare(`
      SELECT * FROM vip_groups 
      ORDER BY vip_level_required ASC, name ASC
    `).all();

    return c.json(groups.results);
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch VIP groups' }, 500);
  }
});

app.post('/api/admin/vip-groups', adminMiddleware, async (c) => {
  try {
    const { name, platform, invite_link, description, vip_level_required, is_active } = await c.req.json();

    if (!name?.trim() || !platform || !invite_link?.trim()) {
      return c.json({ error: 'Nome, plataforma e link são obrigatórios' }, 400);
    }

    if (!['whatsapp', 'telegram'].includes(platform)) {
      return c.json({ error: 'Plataforma deve ser whatsapp ou telegram' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO vip_groups (name, platform, invite_link, description, vip_level_required, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name.trim(), platform, invite_link.trim(), description?.trim() || '', vip_level_required || 1, is_active ?? true).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Grupo VIP criado com sucesso!'
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to create VIP group' }, 500);
  }
});

app.patch('/api/admin/vip-groups/:id', adminMiddleware, async (c) => {
  try {
    const groupId = parseInt(c.req.param('id'));
    if (!groupId) {
      return c.json({ error: 'ID do grupo inválido' }, 400);
    }

    const { name, platform, invite_link, description, vip_level_required, is_active } = await c.req.json();

    if (!name?.trim() || !platform || !invite_link?.trim()) {
      return c.json({ error: 'Nome, plataforma e link são obrigatórios' }, 400);
    }

    if (!['whatsapp', 'telegram'].includes(platform)) {
      return c.json({ error: 'Plataforma deve ser whatsapp ou telegram' }, 400);
    }

    const result = await c.env.DB.prepare(`
      UPDATE vip_groups 
      SET name = ?, platform = ?, invite_link = ?, description = ?, 
          vip_level_required = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name.trim(), 
      platform, 
      invite_link.trim(), 
      description?.trim() || '', 
      vip_level_required || 1, 
      is_active ?? true,
      groupId
    ).run();

    if (result.changes === 0) {
      return c.json({ error: 'Grupo não encontrado' }, 404);
    }

    return c.json({ 
      success: true,
      message: 'Grupo VIP atualizado com sucesso!'
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to update VIP group' }, 500);
  }
});

app.patch('/api/admin/vip-groups/:id/toggle', adminMiddleware, async (c) => {
  try {
    const groupId = parseInt(c.req.param('id'));
    if (!groupId) {
      return c.json({ error: 'ID do grupo inválido' }, 400);
    }

    const result = await c.env.DB.prepare(`
      UPDATE vip_groups 
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(groupId).run();

    if (result.changes === 0) {
      return c.json({ error: 'Grupo não encontrado' }, 404);
    }

    return c.json({ 
      success: true,
      message: 'Status do grupo alterado com sucesso!'
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to toggle VIP group status' }, 500);
  }
});

app.delete('/api/admin/vip-groups/:id', adminMiddleware, async (c) => {
  try {
    const groupId = parseInt(c.req.param('id'));
    if (!groupId) {
      return c.json({ error: 'ID do grupo inválido' }, 400);
    }

    const result = await c.env.DB.prepare(`
      DELETE FROM vip_groups WHERE id = ?
    `).bind(groupId).run();

    if (result.changes === 0) {
      return c.json({ error: 'Grupo não encontrado' }, 404);
    }

    return c.json({ 
      success: true,
      message: 'Grupo VIP deletado com sucesso!'
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete VIP group' }, 500);
  }
});

// User route to get available VIP groups
app.get('/api/vip-groups', customAuthMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );
    
    // Get user's actual level using the same logic as dashboard
    const levelInfo = await getLevelInfo(dbUser.id, c.env.DB);
    
    // Get VIP level for display purposes
    let userVipLevel = 0;
    const vipPurchase = await c.env.DB.prepare(`
      SELECT vip_level FROM vip_purchases 
      WHERE user_id = ? AND is_active = true AND payment_status = 'completed'
      ORDER BY vip_level DESC LIMIT 1
    `).bind(dbUser.id).first();
    
    if (vipPurchase) {
      userVipLevel = vipPurchase.vip_level;
    }

    // Get all active groups (all users can access all groups)
    const groups = await c.env.DB.prepare(`
      SELECT id, name, platform, invite_link, description, vip_level_required
      FROM vip_groups 
      WHERE is_active = true
      ORDER BY vip_level_required ASC, name ASC
    `).all();

    return c.json({
      user_vip_level: userVipLevel,
      user_level: levelInfo.level,
      user_level_title: levelInfo.title,
      groups: groups.results
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch VIP groups' }, 500);
  }
});

// Admin routes - simplified versions that work with D1
app.get("/api/admin/stats", adminMiddleware, async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM videos WHERE is_active = 1").first(),
      c.env.DB.prepare("SELECT SUM(total_earnings) as total FROM users").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?").bind(today).first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM video_watches WHERE watch_date = ?").bind(today).first(),
    ]);

    return c.json({
      total_users: stats[0]?.count || 0,
      total_videos: stats[1]?.count || 0,
      total_earnings: stats[2]?.total || 0,
      pending_withdrawals: stats[3]?.count || 0,
      today_signups: stats[4]?.count || 0,
      today_videos_watched: stats[5]?.count || 0,
    });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Admin - Get all users
app.get("/api/admin/users", adminMiddleware, async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT id, name, email, current_balance, total_earnings, total_videos_watched, is_admin, created_at, auth_provider, 
             CASE 
               WHEN password_hash IS NOT NULL THEN 'Sim' 
               ELSE 'Não' 
             END as has_password
      FROM users
      ORDER BY created_at DESC
    `).all();

    return c.json(users.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Admin - Get real-time user data with detailed activity information
app.get("/api/admin/users/realtime", adminMiddleware, async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all users with enhanced real-time data - include users with any video activity
    const users = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.current_balance,
        u.total_earnings,
        u.total_videos_watched,
        u.is_admin,
        u.created_at,
        u.auth_provider,
        u.level,
        u.daily_videos_watched,
        u.daily_limit,
        u.custom_daily_limit,
        u.bonus_videos,
        u.last_video_date,
        u.updated_at as last_activity,
        CASE 
          WHEN password_hash IS NOT NULL THEN 'Sim' 
          ELSE 'Não' 
        END as has_password,
        -- Calculate actual videos today from video_watches table
        (SELECT COUNT(*) FROM video_watches vw 
         WHERE vw.user_id = u.id AND vw.watch_date = ?) as videos_today,
        -- Calculate videos this week
        (SELECT COUNT(*) FROM video_watches vw 
         WHERE vw.user_id = u.id 
         AND vw.watch_date >= date('now', '-7 days')) as videos_this_week,
        -- Check if user has custom videos assigned
        (SELECT COUNT(*) FROM user_custom_videos ucv 
         WHERE ucv.user_id = u.id AND ucv.is_active = 1) as has_custom_videos_assigned,
        -- Check if user has any video watches ever
        (SELECT COUNT(*) FROM video_watches vw 
         WHERE vw.user_id = u.id) as total_video_watches_count,
        -- Calculate actual total videos watched from video_watches table
        (SELECT COUNT(*) FROM video_watches vw 
         WHERE vw.user_id = u.id) as actual_total_videos_watched
      FROM users u
      WHERE (
        -- Include users with video activity OR custom videos OR admin users
        u.total_videos_watched > 0 
        OR EXISTS (SELECT 1 FROM video_watches vw WHERE vw.user_id = u.id)
        OR EXISTS (SELECT 1 FROM user_custom_videos ucv WHERE ucv.user_id = u.id AND ucv.is_active = 1)
        OR u.is_admin = 1
      )
      ORDER BY 
        -- Prioritize users with custom videos first
        CASE WHEN EXISTS (SELECT 1 FROM user_custom_videos ucv WHERE ucv.user_id = u.id AND ucv.is_active = 1) THEN 1 ELSE 0 END DESC,
        -- Then users who watched videos today (use actual count from video_watches)
        (SELECT COUNT(*) FROM video_watches vw WHERE vw.user_id = u.id AND vw.watch_date = ?) DESC,
        -- Then users with any video activity (use actual count)
        (SELECT COUNT(*) FROM video_watches vw WHERE vw.user_id = u.id) DESC,
        -- Finally by last activity
        u.updated_at DESC
    `).bind(today, today).all();

    // Get level info and recent activities for each user
    const enhancedUsers = await Promise.all(
      users.results.map(async (user: any) => {
        // Get level information
        const levelInfo = await getLevelInfo(user.id, c.env.DB);
        
        // Get recent activities (last 5 activities)
        const recentActivities = await c.env.DB.prepare(`
          SELECT 
            'video_watch' as type,
            'Assistiu vídeo: ' || v.title as description,
            vw.created_at as timestamp,
            vw.earnings
          FROM video_watches vw
          JOIN videos v ON vw.video_id = v.id
          WHERE vw.user_id = ?
          ORDER BY vw.created_at DESC
          LIMIT 5
        `).bind(user.id).all();

        // Get custom video settings
        const customSettings = await c.env.DB.prepare(`
          SELECT custom_video_mode, notes FROM user_custom_settings WHERE user_id = ?
        `).bind(user.id).first();

        return {
          ...user,
          level: levelInfo.level,
          level_title: levelInfo.title,
          daily_limit: levelInfo.dailyLimit,
          custom_daily_limit: user.custom_daily_limit,
          custom_video_mode: customSettings?.custom_video_mode || false,
          custom_videos_count: user.has_custom_videos_assigned || 0,
          admin_notes: customSettings?.notes || '',
          recent_activities: recentActivities.results || [],
          // Use actual video counts from database queries instead of stored values
          total_videos_watched: user.actual_total_videos_watched || user.total_videos_watched || 0,
          videos_today: user.videos_today || 0
        };
      })
    );

    return c.json(enhancedUsers);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch real-time user data" }, 500);
  }
});

// Admin - Update user admin status
app.patch("/api/admin/users/:id", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { is_admin } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE users SET is_admin = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(is_admin, userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// Admin - Reset user password (with custom password)
app.post("/api/admin/users/:id/reset-password", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { password } = await c.req.json();

  try {
    // Validate password if provided, otherwise generate one
    let newPassword = password;
    
    if (newPassword) {
      if (newPassword.length < 6) {
        return c.json({ error: "Password must be at least 6 characters long" }, 400);
      }
    } else {
      // Generate temporary password if none provided (8 characters, alphanumeric)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      newPassword = '';
      for (let i = 0; i < 8; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Get user info
    const user = await c.env.DB.prepare(
      "SELECT id, email, name, auth_provider FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Only allow password reset for email users
    if (user.auth_provider !== 'email') {
      return c.json({ error: "Cannot reset password for Google users" }, 400);
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user with new password and clear any existing session
    await c.env.DB.prepare(`
      UPDATE users SET 
        password_hash = ?, 
        session_token = NULL, 
        session_expires_at = NULL,
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(passwordHash, userId).run();

    // Log the password reset for audit purposes
    const currentUser = c.get("user");
    if (currentUser?.email) {
      await c.env.DB.prepare(`
        INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, created_at)
        VALUES (
          (SELECT id FROM users WHERE email = ? AND is_admin = 1),
          'password_reset',
          ?,
          ?,
          datetime('now')
        )
      `).bind(
        currentUser.email,
        userId,
        `Password reset for user ${user.email} (${user.name || 'No name'}) - ${password ? 'Custom password' : 'Generated password'}`
      ).run().catch(() => {
        // Ignore if admin_actions table doesn't exist - this is just for audit logging
      });
    }

    return c.json({ 
      success: true, 
      temporaryPassword: password ? undefined : newPassword,
      message: password ? "Password reset successfully with custom password." : "Password reset successfully. User must change password on next login."
    });
  } catch (error: any) {
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// Manually activate VIP subscription
app.post("/api/admin/transactions/:id/activate-vip", adminMiddleware, async (c) => {
  const transactionId = parseInt(c.req.param('id'));
  
  try {
    // Get transaction details
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions WHERE id = ?
    `).bind(transactionId).first();

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    if (transaction.status !== 'approved') {
      return c.json({ error: 'Transaction must be approved first' }, 400);
    }

    if (!transaction.vip_level) {
      return c.json({ error: 'Transaction does not have a VIP level' }, 400);
    }

    // Check if VIP purchase already exists
    const existingVip = await c.env.DB.prepare(`
      SELECT * FROM vip_purchases 
      WHERE user_id = ? AND payment_reference = ?
    `).bind(transaction.user_id, transaction.qr_code_id).first();

    if (!existingVip) {
      // Create VIP purchase record
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
        transaction.qr_code_id,
        expiresAt.toISOString(),
        true
      ).run();
    } else {
      // Activate existing VIP purchase
      await c.env.DB.prepare(`
        UPDATE vip_purchases 
        SET is_active = true, payment_status = 'completed'
        WHERE id = ?
      `).bind(existingVip.id).run();
    }

    // Update user's daily limit based on VIP level
    const vipLimits: Record<number, number> = {
      1: 15, 2: 20, 3: 25, 4: 30, 5: 35, 6: 40
    };
    
    const newLimit = vipLimits[transaction.vip_level] || 15;
    
    await c.env.DB.prepare(`
      UPDATE users SET daily_limit = ? WHERE id = ?
    `).bind(newLimit, transaction.user_id).run();

    // Create notification for user
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).bind(
      transaction.user_id,
      'Assinatura VIP Ativada!',
      `Sua assinatura VIP Nível ${transaction.vip_level} foi ativada manualmente pelo administrador. Limite diário: ${newLimit} vídeos.`,
      'success'
    ).run();
    
    return c.json({ 
      success: true, 
      message: 'VIP subscription activated successfully',
      vip_level: transaction.vip_level,
      new_daily_limit: newLimit
    });
  } catch (error: any) {
    // Error logged to database
    return c.json({ error: 'Failed to activate VIP subscription' }, 500);
  }
});

// Admin - Create new password for user
app.post("/api/admin/users/:id/create-password", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { password } = await c.req.json();

  try {
    // Validate password
    if (!password || password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    // Get user info
    const user = await c.env.DB.prepare(
      "SELECT id, email, name, auth_provider FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Only allow password creation for email users
    if (user.auth_provider !== 'email') {
      return c.json({ error: "Cannot create password for Google users" }, 400);
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user with new password and clear any existing session
    await c.env.DB.prepare(`
      UPDATE users SET 
        password_hash = ?, 
        session_token = NULL, 
        session_expires_at = NULL,
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(passwordHash, userId).run();

    // Log the password creation for audit purposes
    const currentUser = c.get("user");
    if (currentUser?.email) {
      await c.env.DB.prepare(`
        INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, created_at)
        VALUES (
          (SELECT id FROM users WHERE email = ? AND is_admin = 1),
          'password_create',
          ?,
          ?,
          datetime('now')
        )
      `).bind(
        currentUser.email,
        userId,
        `New password created for user ${user.email} (${user.name || 'No name'})`
      ).run().catch(() => {
        // Ignore if admin_actions table doesn't exist - this is just for audit logging
      });
    }

    return c.json({ 
      success: true, 
      message: "New password created successfully."
    });
  } catch (error: any) {
    return c.json({ error: "Failed to create password" }, 500);
  }
});

// Admin - Get all videos (excluding home featured ones)
app.get("/api/admin/videos", adminMiddleware, async (c) => {
  try {
    const videos = await c.env.DB.prepare(`
      SELECT v.*, 
             CASE 
               WHEN EXISTS (SELECT 1 FROM user_custom_videos ucv WHERE ucv.video_id = v.id AND ucv.is_active = 1) 
               THEN 'specific'
               ELSE 'all'
             END as target_users,
             (SELECT COUNT(*) FROM user_custom_videos ucv WHERE ucv.video_id = v.id AND ucv.is_active = 1) as assigned_users_count
      FROM videos v 
      WHERE (v.is_home_featured = 0 OR v.is_home_featured IS NULL) AND v.video_url IS NOT NULL 
      ORDER BY v.created_at DESC
    `).all();

    // For videos sent to specific users, get the user names
    const videosWithUserInfo = await Promise.all(
      videos.results.map(async (video: any) => {
        if (video.target_users === 'specific') {
          const assignedUsers = await c.env.DB.prepare(`
            SELECT u.name, u.email 
            FROM user_custom_videos ucv 
            JOIN users u ON ucv.user_id = u.id 
            WHERE ucv.video_id = ? AND ucv.is_active = 1
            ORDER BY u.name ASC
          `).bind(video.id).all();
          
          return {
            ...video,
            assigned_users: assignedUsers.results
          };
        }
        return {
          ...video,
          assigned_users: []
        };
      })
    );

    return c.json(videosWithUserInfo);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch videos" }, 500);
  }
});

// Admin - Update video status (excluding home featured ones)
app.patch("/api/admin/videos/:id", adminMiddleware, async (c) => {
  const videoId = parseInt(c.req.param('id'));
  const { is_active } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE videos SET is_active = ?, updated_at = datetime('now') WHERE id = ? AND (is_home_featured = 0 OR is_home_featured IS NULL)"
    ).bind(is_active, videoId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update video" }, 500);
  }
});

// Admin - Delete video
app.delete("/api/admin/videos/:id", adminMiddleware, async (c) => {
  const videoId = parseInt(c.req.param('id'));

  try {
    // Delete associated data first
    await c.env.DB.prepare("DELETE FROM video_questions WHERE video_id = ?").bind(videoId).run();
    await c.env.DB.prepare("DELETE FROM video_question_answers WHERE video_id = ?").bind(videoId).run();
    await c.env.DB.prepare("DELETE FROM video_watches WHERE video_id = ?").bind(videoId).run();
    
    // Delete the video (only non-home featured videos)
    await c.env.DB.prepare("DELETE FROM videos WHERE id = ? AND (is_home_featured = 0 OR is_home_featured IS NULL)").bind(videoId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete video" }, 500);
  }
});



// Admin - Get all withdrawals
app.get("/api/admin/withdrawals", adminMiddleware, async (c) => {
  try {
    const withdrawals = await c.env.DB.prepare(`
      SELECT w.*, u.email as user_email
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `).all();

    return c.json(withdrawals.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch withdrawals" }, 500);
  }
});

// Admin - Update withdrawal status
app.patch("/api/admin/withdrawals/:id", adminMiddleware, async (c) => {
  const withdrawalId = parseInt(c.req.param('id'));
  const { status } = await c.req.json();

  try {
    const processedAt = status !== 'pending' ? new Date().toISOString() : null;

    // Get withdrawal info for notifications
    const withdrawal = await c.env.DB.prepare(
      "SELECT user_id, amount, pix_key FROM withdrawals WHERE id = ?"
    ).bind(withdrawalId).first();

    await c.env.DB.prepare(
      "UPDATE withdrawals SET status = ?, processed_at = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(status, processedAt, withdrawalId).run();

    if (withdrawal) {
      if (status === 'approved') {
        // Create approval notification with detailed info
        await c.env.DB.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, ?)
        `).bind(
          withdrawal.user_id,
          '🎉 Saque Concluído!',
          `Ótimas notícias! Seu saque de R$ ${withdrawal.amount.toFixed(2)} foi processado com sucesso e enviado para sua chave PIX: ${withdrawal.pix_key.substring(0, 10)}... O valor deve aparecer em sua conta em alguns minutos.`,
          'success'
        ).run();

        // Create live activity for successful withdrawal
        const user = await c.env.DB.prepare("SELECT name, email FROM users WHERE id = ?").bind(withdrawal.user_id).first();
        await createLiveActivity(
          c.env.DB,
          'withdrawal',
          user?.name || user?.email || 'Usuario',
          `${maskUsername(user?.name || user?.email || 'Usuario')} sacou R$ ${withdrawal.amount.toFixed(2)}!`,
          withdrawal.amount
        );
      } else if (status === 'rejected') {
        // Return money to user balance
        await c.env.DB.prepare(
          "UPDATE users SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(withdrawal.amount, withdrawal.user_id).run();

        // Create rejection notification with detailed info
        await c.env.DB.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, ?)
        `).bind(
          withdrawal.user_id,
          '⚠️ Saque Rejeitado',
          `Infelizmente, seu saque de R$ ${withdrawal.amount.toFixed(2)} foi rejeitado. O valor foi retornado automaticamente ao seu saldo. Entre em contato com o suporte se tiver dúvidas.`,
          'warning'
        ).run();
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update withdrawal" }, 500);
  }
});

// Video info endpoint - Auto-detect platform and fetch details
app.get("/api/video/info", adminMiddleware, async (c) => {
  try {
    const { url } = c.req.query();
    if (!url) {
      return c.json({ error: "URL parameter is required" }, 400);
    }

    // Detect platform and extract ID
    const videoInfo = await detectVideoPlatformAndFetchInfo(url as string);
    
    if (!videoInfo.success) {
      return c.json({ error: videoInfo.error || "Failed to detect video" }, 400);
    }

    return c.json(videoInfo.data);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch video info: " + error.message }, 500);
  }
});

// Helper function to detect platform and fetch video information
async function detectVideoPlatformAndFetchInfo(url: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    
    // Vimeo URL patterns - improved to handle standard vimeo.com/ID format
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return await fetchYouTubeVideoInfo(videoId);
    } else if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return await fetchVimeoVideoInfo(videoId, url);
    } else {
      // Generic URL support - accept any URL
      return await fetchGenericVideoInfo(url);
    }
  } catch (error: any) {
    return {
      success: false,
      error: "Erro ao processar URL: " + error.message
    };
  }
}

// Fetch YouTube video information
async function fetchYouTubeVideoInfo(videoId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // For now, return basic info since we don't have YouTube API key
    // In production, you would fetch from YouTube API
    return {
      success: true,
      data: {
        platform: 'youtube',
        video_id: videoId,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        embed_url: `https://www.youtube.com/embed/${videoId}`,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        title: `Vídeo do YouTube - ${videoId}`,
        description: "Vídeo do YouTube detectado automaticamente",
        duration_seconds: 120, // Default duration - would be fetched from API
        message: "✅ Vídeo do YouTube detectado! Configure uma chave da API do YouTube para buscar detalhes automaticamente."
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: "Erro ao buscar informações do YouTube: " + error.message
    };
  }
}

// Fetch generic video information
async function fetchGenericVideoInfo(url: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Extract basic info from URL
    const urlObj = new (globalThis as any).URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Determine platform based on hostname
    let platform = 'generic';
    let platformIcon = '🎬';
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      platform = 'youtube';
      platformIcon = '📺';
    } else if (hostname.includes('vimeo.com')) {
      platform = 'vimeo';
      platformIcon = '🎭';
    } else if (hostname.includes('dailymotion.com')) {
      platform = 'dailymotion';
      platformIcon = '🎯';
    } else if (hostname.includes('twitch.tv')) {
      platform = 'twitch';
      platformIcon = '🎮';
    } else if (hostname.includes('tiktok.com')) {
      platform = 'tiktok';
      platformIcon = '🎵';
    } else if (hostname.includes('instagram.com')) {
      platform = 'instagram';
      platformIcon = '📸';
    } else if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      platform = 'facebook';
      platformIcon = '👥';
    } else if (hostname.includes('streamable.com')) {
      platform = 'streamable';
      platformIcon = '📹';
    }

    // Generate a simple video ID from URL
    const videoId = (globalThis as any).btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    
    return {
      success: true,
      data: {
        platform: platform,
        video_id: videoId,
        video_url: url,
        embed_url: url, // Use the original URL as embed URL
        thumbnail_url: null, // Will be populated manually if needed
        title: `Vídeo de ${hostname} - ${videoId}`,
        description: `Vídeo automaticamente detectado de ${hostname}`,
        duration_seconds: 60, // Default duration
        hostname: hostname,
        platform_icon: platformIcon,
        message: `✅ URL aceita! Plataforma: ${hostname} ${platformIcon}`
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: "URL inválida. Verifique se está correta e tente novamente."
    };
  }
}

// Fetch Vimeo video information
async function fetchVimeoVideoInfo(videoId: string, originalUrl: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Extract proper video ID from Vimeo URL - improved regex
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const urlMatch = originalUrl.match(vimeoRegex);
    const actualVideoId = urlMatch ? urlMatch[1] : videoId;

    // Log video info for debugging (removed console.log for worker environment)

    // Try multiple methods to get accurate video duration
    let durationSeconds = null;
    let title = null;
    let description = null;
    let thumbnailUrl = null;
    let authorName = null;
    let width = 640;
    let height = 360;

    // Method 1: Vimeo oEmbed API (most reliable for public videos)
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${actualVideoId}`;
      const oembedResponse = await (globalThis as any).fetch(oembedUrl);
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        
        title = oembedData.title;
        description = oembedData.description;
        thumbnailUrl = oembedData.thumbnail_url;
        authorName = oembedData.author_name;
        width = oembedData.width || 640;
        height = oembedData.height || 360;
        
        // oEmbed doesn't include duration, so we need to try other methods
      }
    } catch (e) {
      // Continue to next method
    }

    // Method 2: Try to extract duration from Vimeo's public API
    try {
      const apiUrl = `https://vimeo.com/api/v2/video/${actualVideoId}.json`;
      const apiResponse = await (globalThis as any).fetch(apiUrl);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        
        if (Array.isArray(apiData) && apiData.length > 0) {
          const videoData = apiData[0];
          
          // Use API data as fallback if oEmbed didn't provide info
          title = title || videoData.title;
          description = description || videoData.description;
          thumbnailUrl = thumbnailUrl || videoData.thumbnail_large || videoData.thumbnail_medium;
          authorName = authorName || videoData.user_name;
          width = width || videoData.width || 640;
          height = height || videoData.height || 360;
          
          // Most importantly - get the duration!
          if (videoData.duration) {
            durationSeconds = parseInt(videoData.duration);
          }
        }
      }
    } catch (e) {
      // Continue with fallback
    }

    // Method 3: Parse video page HTML for duration (last resort)
    if (!durationSeconds) {
      try {
        const pageUrl = `https://vimeo.com/${actualVideoId}`;
        const pageResponse = await (globalThis as any).fetch(pageUrl);
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Look for JSON-LD structured data
          const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
          if (jsonLdMatch) {
            try {
              const jsonData = JSON.parse(jsonLdMatch[1]);
              if (jsonData.duration) {
                // Duration in ISO 8601 format (PT1M23S = 1 minute 23 seconds)
                const match = jsonData.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
                if (match) {
                  const minutes = parseInt(match[1] || '0');
                  const seconds = parseInt(match[2] || '0');
                  durationSeconds = minutes * 60 + seconds;
                }
              }
            } catch (e) {
              // Continue with fallback
            }
          }
          
          // Look for duration in data attributes or other patterns
          const durationMatch = html.match(/"duration":(\d+)/);
          if (durationMatch && !durationSeconds) {
            durationSeconds = parseInt(durationMatch[1]);
          }
        }
      } catch (e) {
        // Continue with fallback
      }
    }

    // If we still don't have duration, use a more reasonable default based on typical video lengths
    if (!durationSeconds || durationSeconds <= 0) {
      durationSeconds = 30; // More reasonable default than 60 seconds
    }

    return {
      success: true,
      data: {
        platform: 'vimeo',
        video_id: actualVideoId,
        video_url: originalUrl,
        embed_url: `https://player.vimeo.com/video/${actualVideoId}`,
        thumbnail_url: thumbnailUrl,
        title: title || `Vídeo do Vimeo - ${actualVideoId}`,
        description: description || "Vídeo do Vimeo detectado automaticamente",
        duration_seconds: durationSeconds,
        width: width,
        height: height,
        author_name: authorName || 'Vimeo User',
        message: durationSeconds > 30 ? "✅ Vídeo do Vimeo detectado com duração real!" : "✅ Vídeo do Vimeo detectado! (Duração estimada)"
      }
    };
  } catch (error: any) {
    // Fallback to basic info if all methods fail - use proper video ID
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const urlMatch = originalUrl.match(vimeoRegex);
    const actualVideoId = urlMatch ? urlMatch[1] : videoId;

    return {
      success: true,
      data: {
        platform: 'vimeo',
        video_id: actualVideoId,
        video_url: originalUrl,
        embed_url: `https://player.vimeo.com/video/${actualVideoId}`,
        thumbnail_url: null,
        title: `Vídeo do Vimeo - ${actualVideoId}`,
        description: "Vídeo do Vimeo detectado automaticamente",
        duration_seconds: 30, // More reasonable fallback
        message: "✅ Vídeo do Vimeo detectado! (Não foi possível determinar duração exata)"
      }
    };
  }
}

// Webhook endpoints
// MercadoPago webhook
app.post("/api/webhooks/mercadopago", async (c) => {
  try {
    const body = await c.req.json();
    const provider = 'mercadopago';
    
    // Log webhook received
    await c.env.DB.prepare(`
      INSERT INTO webhook_logs (provider, event_type, raw_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(provider, body.type || 'unknown', JSON.stringify(body)).run();

    // Only process payment events
    if (body.type !== 'payment') {
      return c.json({ status: 'ignored', message: 'Not a payment event' });
    }

    // Get payment details from MercadoPago API
    if (body.data && body.data.id) {
      // In production, you would fetch payment details from MercadoPago API
      // For now, we'll check if the webhook body contains the necessary info
      const paymentId = body.data.id.toString();
      
      // Try to extract user email and amount from external_reference or metadata
      // This assumes the payment was created with user email in external_reference
      if (body.external_reference && body.transaction_amount) {
        try {
          const userEmail = body.external_reference; // Assuming email is stored here
          const amount = parseFloat(body.transaction_amount);
          
          if (body.status === 'approved') {
            const result = await processVipPurchaseFromWebhook(
              userEmail,
              amount,
              paymentId,
              provider,
              c.env.DB
            );
            
            // Update webhook log with success
            await c.env.DB.prepare(`
              UPDATE webhook_logs SET 
                status = 'processed',
                user_email = ?,
                vip_level = ?,
                amount = ?,
                payment_id = ?,
                processed_at = datetime('now')
              WHERE provider = ? AND raw_data = ?
              ORDER BY created_at DESC LIMIT 1
            `).bind(userEmail, result.vip_level, amount, paymentId, provider, JSON.stringify(body)).run();
            
            return c.json({ status: 'success', message: result.message });
          }
        } catch (error: any) {
          // Update webhook log with error
          await c.env.DB.prepare(`
            UPDATE webhook_logs SET 
              status = 'failed',
              error_message = ?,
              processed_at = datetime('now')
            WHERE provider = ? AND raw_data = ?
            ORDER BY created_at DESC LIMIT 1
          `).bind(error.message, provider, JSON.stringify(body)).run();
          
          return c.json({ status: 'error', message: error.message }, 400);
        }
      }
    }

    return c.json({ status: 'ignored', message: 'Insufficient data' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// PagSeguro webhook
app.post("/api/webhooks/pagseguro", async (c) => {
  try {
    const body = await c.req.text(); // PagSeguro sends form data
    const provider = 'pagseguro';
    
    // Log webhook received
    await c.env.DB.prepare(`
      INSERT INTO webhook_logs (provider, event_type, raw_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(provider, 'notification', body).run();

    // Parse form data
    const params = new (globalThis as any).URLSearchParams(body);
    const notificationCode = params.get('notificationCode');
    const notificationType = params.get('notificationType');

    if (notificationType === 'transaction' && notificationCode) {
      // In production, you would use PagSeguro API to get transaction details
      // For now, return success to acknowledge receipt
      return c.json({ status: 'received' });
    }

    return c.json({ status: 'ignored' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Stripe webhook
app.post("/api/webhooks/stripe", async (c) => {
  try {
    const body = await c.req.json();
    const provider = 'stripe';
    
    // Log webhook received
    await c.env.DB.prepare(`
      INSERT INTO webhook_logs (provider, event_type, raw_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(provider, body.type || 'unknown', JSON.stringify(body)).run();

    // Process payment intent succeeded events
    if (body.type === 'payment_intent.succeeded') {
      const paymentIntent = body.data.object;
      
      if (paymentIntent.metadata && paymentIntent.metadata.user_email) {
        try {
          const userEmail = paymentIntent.metadata.user_email;
          const amount = paymentIntent.amount / 100; // Stripe uses cents
          const paymentId = paymentIntent.id;
          
          const result = await processVipPurchaseFromWebhook(
            userEmail,
            amount,
            paymentId,
            provider,
            c.env.DB
          );
          
          // Update webhook log with success
          await c.env.DB.prepare(`
            UPDATE webhook_logs SET 
              status = 'processed',
              user_email = ?,
              vip_level = ?,
              amount = ?,
              payment_id = ?,
              processed_at = datetime('now')
            WHERE provider = ? AND raw_data = ?
            ORDER BY created_at DESC LIMIT 1
          `).bind(userEmail, result.vip_level, amount, paymentId, provider, JSON.stringify(body)).run();
          
          return c.json({ status: 'success', message: result.message });
        } catch (error: any) {
          // Update webhook log with error
          await c.env.DB.prepare(`
            UPDATE webhook_logs SET 
              status = 'failed',
              error_message = ?,
              processed_at = datetime('now')
            WHERE provider = ? AND raw_data = ?
            ORDER BY created_at DESC LIMIT 1
          `).bind(error.message, provider, JSON.stringify(body)).run();
          
          return c.json({ status: 'error', message: error.message }, 400);
        }
      }
    }

    return c.json({ status: 'received' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// PayPal webhook
app.post("/api/webhooks/paypal", async (c) => {
  try {
    const body = await c.req.json();
    const provider = 'paypal';
    
    // Log webhook received
    await c.env.DB.prepare(`
      INSERT INTO webhook_logs (provider, event_type, raw_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(provider, body.event_type || 'unknown', JSON.stringify(body)).run();

    // Process payment capture completed events
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = body.resource;
      
      if (capture.custom_id) { // Assuming user email is stored in custom_id
        try {
          const userEmail = capture.custom_id;
          const amount = parseFloat(capture.amount.value);
          const paymentId = capture.id;
          
          const result = await processVipPurchaseFromWebhook(
            userEmail,
            amount,
            paymentId,
            provider,
            c.env.DB
          );
          
          // Update webhook log with success
          await c.env.DB.prepare(`
            UPDATE webhook_logs SET 
              status = 'processed',
              user_email = ?,
              vip_level = ?,
              amount = ?,
              payment_id = ?,
              processed_at = datetime('now')
            WHERE provider = ? AND raw_data = ?
            ORDER BY created_at DESC LIMIT 1
          `).bind(userEmail, result.vip_level, amount, paymentId, provider, JSON.stringify(body)).run();
          
          return c.json({ status: 'success', message: result.message });
        } catch (error: any) {
          // Update webhook log with error
          await c.env.DB.prepare(`
            UPDATE webhook_logs SET 
              status = 'failed',
              error_message = ?,
              processed_at = datetime('now')
            WHERE provider = ? AND raw_data = ?
            ORDER BY created_at DESC LIMIT 1
          `).bind(error.message, provider, JSON.stringify(body)).run();
          
          return c.json({ status: 'error', message: error.message }, 400);
        }
      }
    }

    return c.json({ status: 'received' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Pushin Pay checkout endpoint (generates QR code PIX)
app.post("/api/pushinpay/checkout", customAuthMiddleware, async (c) => {
  try {
    const { name, phone, email, cpf, amount, description, vip_level, plan_type } = await c.req.json();

    const pushinPayApiKey = c.env.PUSHIN_PAY_API_KEY;

    if (!pushinPayApiKey) {
      return c.json({ error: 'Credenciais Pushin Pay não configuradas' }, 500);
    }

    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const amountInCents = Math.round(amount * 100);

    const pushinPayResponse = await (globalThis as any).fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pushinPayApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: amountInCents,
        webhook_url: `${c.req.header('origin') || 'https://nextfund.online'}/api/pushinpay/webhook`,
        split_rules: []
      }),
    });

    if (!pushinPayResponse.ok) {
      // const errorData = await pushinPayResponse.text();
      return c.json({ error: 'Erro ao gerar QR code. Verifique as credenciais da API.' }, 400);
    }

    const pushinPayData = await pushinPayResponse.json();

    // Store transaction in database
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
    
    if (plan_type === 'intermediate') {
      await c.env.DB.prepare(`
        INSERT INTO pushin_transactions (user_id, qr_code_id, amount, status, expires_at, user_email, user_name, user_cpf, user_phone, description, plan_type, created_at)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'intermediate', datetime('now'))
      `).bind(dbUser.id, pushinPayData.id, amount, expiresAt, email, name, cpf || null, phone || null, description || null).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO pushin_transactions (user_id, qr_code_id, amount, vip_level, status, expires_at, user_email, user_name, user_cpf, user_phone, description, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(dbUser.id, pushinPayData.id, amount, vip_level || null, expiresAt, email, name, cpf || null, phone || null, description || null).run();
    }

    return c.json({
      qrCode: pushinPayData.qr_code_base64,
      pixKey: pushinPayData.qr_code,
      transactionId: pushinPayData.id,
      status: pushinPayData.status,
      expiresAt: expiresAt,
      amount: amount
    });

  } catch (error: any) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Pushin Pay webhook endpoint (receives payment confirmations)
app.post("/api/pushinpay/webhook", async (c) => {
  try {
    const webhook = await c.req.json();
    const provider = 'pushinpay';

    // Log webhook received
    await c.env.DB.prepare(`
      INSERT INTO webhook_logs (provider, event_type, raw_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(provider, webhook.status || 'unknown', JSON.stringify(webhook)).run();

    // Find transaction
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions WHERE qr_code_id = ?
    `).bind(webhook.id).first();

    if (!transaction) {
      return c.json({ status: 'Transaction not found' }, 404);
    }

    let newStatus = 'pending';
    if (webhook.status === 'paid') {
      newStatus = 'approved';
    } else if (webhook.status === 'expired') {
      newStatus = 'cancelled';
    }

    // Update transaction status
    await c.env.DB.prepare(`
      UPDATE pushin_transactions SET 
        status = ?,
        processed_at = datetime('now'),
        end_to_end_id = ?,
        payer_name = ?,
        payer_document = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      newStatus,
      webhook.end_to_end_id || null,
      webhook.payer_name || null,
      webhook.payer_national_registration || null,
      transaction.id
    ).run();

    if (newStatus === 'approved') {
      if (transaction.plan_type === 'intermediate') {
        try {
          // Process intermediate plan purchase with correct video logic
          const today = new Date().toISOString().split('T')[0];
          
          // Get current user data to check videos watched today
          const currentUser = await c.env.DB.prepare(
            "SELECT daily_videos_watched, last_video_date, daily_limit FROM users WHERE id = ?"
          ).bind(transaction.user_id).first();
          
          const videosWatchedToday = (currentUser.last_video_date === today) ? currentUser.daily_videos_watched : 0;
          const currentLimit = currentUser.daily_limit || 10;
          
          // Deactivate any existing intermediate purchases
          await c.env.DB.prepare(
            "UPDATE intermediate_purchases SET is_active = 0, updated_at = datetime('now') WHERE user_id = ?"
          ).bind(transaction.user_id).run();
          
          // Get the intermediate plan
          const plan = await c.env.DB.prepare(
            "SELECT * FROM intermediate_plans WHERE name = 'Intermediário' LIMIT 1"
          ).first();
          
          if (plan) {
            // Create intermediate purchase record
            await c.env.DB.prepare(`
              INSERT INTO intermediate_purchases (user_id, plan_id, purchase_date, amount, payment_status, payment_reference, is_active)
              VALUES (?, ?, ?, ?, 'completed', ?, 1)
            `).bind(transaction.user_id, plan.id, today, transaction.amount, webhook.id.toString()).run();
            
            // Update user level and daily_limit
            await c.env.DB.prepare(
              "UPDATE users SET level = 2, daily_limit = ?, updated_at = datetime('now') WHERE id = ?"
            ).bind(plan.daily_limit, transaction.user_id).run();
            
            // Calculate bonus videos for today
            const newDailyLimit = plan.daily_limit;
            const bonusVideosToday = Math.max(0, newDailyLimit - Math.max(videosWatchedToday, currentLimit));
            
            if (bonusVideosToday > 0) {
              // Add bonus videos for the remaining videos today
              await c.env.DB.prepare(
                "UPDATE users SET bonus_videos = bonus_videos + ?, updated_at = datetime('now') WHERE id = ?"
              ).bind(bonusVideosToday, transaction.user_id).run();
            }
            
            // Create success notification for user
            const bonusMessage = bonusVideosToday > 0 ? 
              ` Você ganhou ${bonusVideosToday} vídeos bônus para hoje. Amanhã você terá ${newDailyLimit} vídeos completos.` : 
              ` A partir de amanhã você terá ${newDailyLimit} vídeos por dia.`;
              
            await c.env.DB.prepare(`
              INSERT INTO notifications (user_id, title, message, type)
              VALUES (?, ?, ?, ?)
            `).bind(
              transaction.user_id,
              'Plano Intermediário Ativado! 🎉',
              `Seu plano Intermediário foi ativado com sucesso. Agora você pode fazer saques a partir de R$ 20.${bonusMessage}`,
              'success'
            ).run();
          }
        } catch (error: any) {
          // Create error notification for user
          await c.env.DB.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)
          `).bind(
            transaction.user_id,
            'Erro no Pagamento',
            `Houve um problema ao processar seu pagamento do plano Intermediário. Entre em contato com o suporte. Erro: ${error.message}`,
            'error'
          ).run();
        }
      } else if (transaction.vip_level) {
        try {
        // Process VIP purchase
        const result = await processVipPurchaseFromWebhook(
          transaction.user_email,
          transaction.amount,
          webhook.id.toString(),
          provider,
          c.env.DB
        );

        // Create success notification for user
        await c.env.DB.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, ?)
        `).bind(
          transaction.user_id,
          'Pagamento Aprovado! 🎉',
          `Seu plano VIP ${transaction.vip_level} foi ativado com sucesso. Pagamento de R$ ${transaction.amount.toFixed(2)} confirmado.`,
          'success'
        ).run();

        // Create live activity for VIP purchase
        await createLiveActivity(
          c.env.DB,
          'vip_purchase',
          transaction.user_name || transaction.user_email,
          `${maskUsername(transaction.user_name || transaction.user_email)} adquiriu VIP ${transaction.vip_level}!`,
          transaction.amount,
          `VIP ${transaction.vip_level}`
        );

        // Update webhook log with success
        await c.env.DB.prepare(`
          UPDATE webhook_logs SET 
            status = 'processed',
            user_email = ?,
            vip_level = ?,
            amount = ?,
            payment_id = ?,
            processed_at = datetime('now')
          WHERE provider = ? AND raw_data = ?
          ORDER BY created_at DESC LIMIT 1
        `).bind(transaction.user_email, result.vip_level, transaction.amount, webhook.id.toString(), provider, JSON.stringify(webhook)).run();

      } catch (error: any) {
        // Create error notification for user
        await c.env.DB.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, ?)
        `).bind(
          transaction.user_id,
          'Erro no Pagamento',
          `Houve um problema ao processar seu pagamento. Entre em contato com o suporte. Erro: ${error.message}`,
          'error'
        ).run();

        // Update webhook log with error
        await c.env.DB.prepare(`
          UPDATE webhook_logs SET 
            status = 'failed',
            error_message = ?,
            processed_at = datetime('now')
          WHERE provider = ? AND raw_data = ?
          ORDER BY created_at DESC LIMIT 1
        `).bind(error.message, provider, JSON.stringify(webhook)).run();
        }
      }
    } else if (newStatus === 'cancelled') {
      // Create cancellation notification
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).bind(
        transaction.user_id,
        'Pagamento Expirado',
        `Seu QR Code PIX expirou. Você pode gerar um novo na página de VIP.`,
        'warning'
      ).run();
    }

    return c.json({ status: 'OK' });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Check transaction status with rate limiting and Pushin Pay API integration
app.get("/api/pushinpay/transaction/:id", customAuthMiddleware, async (c) => {
  try {
    const transactionId = c.req.param('id');
    const user = c.get("user");
    
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const dbUser = await getOrCreateUser(
      user.email, 
      user.google_user_data?.name || user.email,
      c.env.DB
    );

    const transaction = await c.env.DB.prepare(`
      SELECT * FROM pushin_transactions 
      WHERE qr_code_id = ? AND user_id = ?
    `).bind(transactionId, dbUser.id).first();

    if (!transaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    // Check rate limiting - only allow one API call per minute
    const now = new Date();
    const lastCheck = transaction.last_api_check_at ? new Date(transaction.last_api_check_at) : null;
    
    if (lastCheck && (now.getTime() - lastCheck.getTime()) < 60000) {
      // Less than 1 minute since last check - return cached status
      return c.json({
        id: transaction.qr_code_id,
        status: transaction.status,
        amount: transaction.amount,
        vip_level: transaction.vip_level,
        expires_at: transaction.expires_at,
        processed_at: transaction.processed_at,
        payer_name: transaction.payer_name,
        cached: true,
        next_check_available_in: Math.ceil((60000 - (now.getTime() - lastCheck.getTime())) / 1000)
      });
    }

    // Only query Pushin Pay API if status is still pending and within rate limit
    if (transaction.status === 'pending') {
      const pushinPayApiKey = c.env.PUSHIN_PAY_API_KEY;
      
      if (pushinPayApiKey) {
        try {
          // Query Pushin Pay API using the correct endpoint
          const apiResponse = await (globalThis as any).fetch(`https://api.pushinpay.com.br/api/transactions/${transactionId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${pushinPayApiKey}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });

          // Update rate limiting fields
          await c.env.DB.prepare(`
            UPDATE pushin_transactions 
            SET last_api_check_at = ?, api_check_count = api_check_count + 1, updated_at = datetime('now')
            WHERE qr_code_id = ?
          `).bind(now.toISOString(), transactionId).run();

          if (apiResponse.status === 200) {
            // Transaction found - update with latest data
            const apiData = await apiResponse.json();
            
            let newStatus = 'pending';
            if (apiData.status === 'paid') {
              newStatus = 'approved';
            } else if (apiData.status === 'expired') {
              newStatus = 'cancelled';
            }

            // Update transaction with API data
            await c.env.DB.prepare(`
              UPDATE pushin_transactions 
              SET status = ?, end_to_end_id = ?, payer_name = ?, payer_document = ?, updated_at = datetime('now')
              WHERE qr_code_id = ?
            `).bind(
              newStatus,
              apiData.end_to_end_id || null,
              apiData.payer_name || null,
              apiData.payer_national_registration || null,
              transactionId
            ).run();

            // If payment was approved, process VIP purchase
            if (newStatus === 'approved' && transaction.vip_level) {
              try {
                await processVipPurchaseFromWebhook(
                  transaction.user_email,
                  transaction.amount,
                  transactionId,
                  'pushinpay',
                  c.env.DB
                );

                // Create success notification
                await c.env.DB.prepare(`
                  INSERT INTO notifications (user_id, title, message, type)
                  VALUES (?, ?, ?, ?)
                `).bind(
                  transaction.user_id,
                  'Pagamento Aprovado! 🎉',
                  `Seu plano VIP ${transaction.vip_level} foi ativado com sucesso. Pagamento de R$ ${transaction.amount.toFixed(2)} confirmado.`,
                  'success'
                ).run();
              } catch (error: any) {
                // Log error but don't fail the response
                await c.env.DB.prepare(`
                  INSERT INTO notifications (user_id, title, message, type)
                  VALUES (?, ?, ?, ?)
                `).bind(
                  transaction.user_id,
                  'Erro no Pagamento',
                  `Pagamento confirmado mas houve erro ao ativar VIP. Contate o suporte.`,
                  'error'
                ).run();
              }
            }

            return c.json({
              id: transactionId,
              status: newStatus,
              amount: transaction.amount,
              vip_level: transaction.vip_level,
              expires_at: transaction.expires_at,
              processed_at: newStatus !== 'pending' ? now.toISOString() : null,
              payer_name: apiData.payer_name || null,
              from_api: true
            });

          } else if (apiResponse.status === 404) {
            // Transaction not found or expired
            await c.env.DB.prepare(`
              UPDATE pushin_transactions 
              SET status = 'cancelled', updated_at = datetime('now')
              WHERE qr_code_id = ?
            `).bind(transactionId).run();

            return c.json({
              id: transactionId,
              status: 'cancelled',
              amount: transaction.amount,
              vip_level: transaction.vip_level,
              expires_at: transaction.expires_at,
              processed_at: now.toISOString(),
              payer_name: null,
              from_api: true,
              message: 'Transação não encontrada na API (possivelmente expirada)'
            });
          } else {
            // API error - return cached status
            return c.json({
              id: transaction.qr_code_id,
              status: transaction.status,
              amount: transaction.amount,
              vip_level: transaction.vip_level,
              expires_at: transaction.expires_at,
              processed_at: transaction.processed_at,
              payer_name: transaction.payer_name,
              error: `API error: ${apiResponse.status}`,
              cached: true
            });
          }
        } catch (apiError: any) {
          // API call failed - return cached status
          await c.env.DB.prepare(`
            UPDATE pushin_transactions 
            SET last_api_check_at = ?, api_check_count = api_check_count + 1, updated_at = datetime('now')
            WHERE qr_code_id = ?
          `).bind(now.toISOString(), transactionId).run();

          return c.json({
            id: transaction.qr_code_id,
            status: transaction.status,
            amount: transaction.amount,
            vip_level: transaction.vip_level,
            expires_at: transaction.expires_at,
            processed_at: transaction.processed_at,
            payer_name: transaction.payer_name,
            error: 'Failed to connect to payment API',
            cached: true
          });
        }
      }
    }

    // Return cached transaction data
    return c.json({
      id: transaction.qr_code_id,
      status: transaction.status,
      amount: transaction.amount,
      vip_level: transaction.vip_level,
      expires_at: transaction.expires_at,
      processed_at: transaction.processed_at,
      payer_name: transaction.payer_name,
      cached: true
    });

  } catch (error: any) {
    return c.json({ error: "Failed to fetch transaction" }, 500);
  }
});

// Admin webhook management endpoints
app.get("/api/admin/webhooks", adminMiddleware, async (c) => {
  try {
    const configs = await c.env.DB.prepare(
      "SELECT * FROM webhook_configs ORDER BY provider ASC"
    ).all();

    return c.json(configs.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch webhook configs" }, 500);
  }
});

app.patch("/api/admin/webhooks/:id", adminMiddleware, async (c) => {
  const configId = parseInt(c.req.param('id'));
  const { webhook_url, secret_key, is_active, vip_level_mapping } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE webhook_configs SET 
        webhook_url = ?,
        secret_key = ?,
        is_active = ?,
        vip_level_mapping = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(webhook_url, secret_key, is_active, vip_level_mapping, configId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update webhook config" }, 500);
  }
});

app.get("/api/admin/webhook-logs", adminMiddleware, async (c) => {
  try {
    const { limit = '50', provider = '' } = c.req.query();
    
    let query = "SELECT * FROM webhook_logs";
    let params: any[] = [];
    
    if (provider) {
      query += " WHERE provider = ?";
      params.push(provider);
    }
    
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(parseInt(limit as string));

    const logs = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(logs.results);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch webhook logs" }, 500);
  }
});

// Admin: Get videos available to a specific user (what they see in their account)
app.get("/api/admin/users/:id/available-videos", adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    if (!userId) {
      return c.json({ error: 'ID do usuário inválido' }, 400);
    }

    // Get user's custom settings
    const userSettings = await c.env.DB.prepare(`
      SELECT custom_video_mode FROM user_custom_settings 
      WHERE user_id = ? AND custom_video_mode = true
    `).bind(userId).first();

    let availableVideos = [];

    if (userSettings) {
      // User is in custom video mode - only show assigned videos
      const customVideosQuery = `
        SELECT DISTINCT
          v.id,
          v.title,
          v.description,
          v.duration_seconds,
          v.reward_amount,
          v.category,
          true as is_custom,
          COUNT(vw.id) as watch_count,
          MAX(vw.created_at) as last_watched
        FROM videos v
        INNER JOIN user_custom_videos ucv ON v.id = ucv.video_id
        LEFT JOIN video_watches vw ON v.id = vw.video_id AND vw.user_id = ?
        WHERE ucv.user_id = ? 
          AND ucv.is_active = true 
          AND v.is_active = true
          AND (ucv.expires_at IS NULL OR ucv.expires_at > datetime('now'))
        GROUP BY v.id
        ORDER BY ucv.assigned_at DESC
      `;
      
      availableVideos = await c.env.DB.prepare(customVideosQuery).bind(userId, userId).all();
    } else {
      // Normal mode - show all active videos plus custom videos
      const allVideosQuery = `
        SELECT DISTINCT
          v.id,
          v.title,
          v.description,
          v.duration_seconds,
          v.reward_amount,
          v.category,
          CASE WHEN ucv.id IS NOT NULL THEN true ELSE false END as is_custom,
          COUNT(vw.id) as watch_count,
          MAX(vw.created_at) as last_watched
        FROM videos v
        LEFT JOIN user_custom_videos ucv ON v.id = ucv.video_id 
          AND ucv.user_id = ? 
          AND ucv.is_active = true
          AND (ucv.expires_at IS NULL OR ucv.expires_at > datetime('now'))
        LEFT JOIN video_watches vw ON v.id = vw.video_id AND vw.user_id = ?
        WHERE v.is_active = true
        GROUP BY v.id
        ORDER BY is_custom DESC, v.created_at DESC
      `;
      
      availableVideos = await c.env.DB.prepare(allVideosQuery).bind(userId, userId).all();
    }

    // Format the response
    const formattedVideos = availableVideos.results?.map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.description || '',
      duration_seconds: video.duration_seconds,
      reward_amount: video.reward_amount,
      category: video.category || '',
      is_custom: Boolean(video.is_custom),
      watch_count: video.watch_count || 0,
      last_watched: video.last_watched
    })) || [];

    return c.json(formattedVideos);

  } catch (error: any) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Get user custom videos and settings
app.get("/api/admin/users/:id/custom-videos", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  
  try {
    // Get custom videos
    const customVideos = await c.env.DB.prepare(`
      SELECT ucv.*, v.title as video_title, v.reward_amount as video_reward
      FROM user_custom_videos ucv
      JOIN videos v ON ucv.video_id = v.id
      WHERE ucv.user_id = ? AND ucv.is_active = 1
      ORDER BY ucv.assigned_at DESC
    `).bind(userId).all();

    // Get custom settings
    const settings = await c.env.DB.prepare(
      "SELECT custom_video_mode, notes FROM user_custom_settings WHERE user_id = ?"
    ).bind(userId).first();

    return c.json({
      custom_videos: customVideos.results,
      settings: settings || { custom_video_mode: false, notes: '' }
    });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch custom videos" }, 500);
  }
});

// Update user custom settings
app.patch("/api/admin/users/:id/custom-settings", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { custom_daily_limit, custom_video_mode, notes } = await c.req.json();
  
  try {
    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Admin user not found" }, 401);
    }
    
    const adminUser = await getOrCreateUser(
      currentUser.email,
      currentUser.google_user_data?.name || currentUser.email,
      c.env.DB
    );

    // Update custom daily limit in users table
    await c.env.DB.prepare(
      "UPDATE users SET custom_daily_limit = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(custom_daily_limit, userId).run();

    // Upsert custom settings
    const existingSettings = await c.env.DB.prepare(
      "SELECT id FROM user_custom_settings WHERE user_id = ?"
    ).bind(userId).first();

    if (existingSettings) {
      await c.env.DB.prepare(`
        UPDATE user_custom_settings SET 
          custom_video_mode = ?,
          notes = ?,
          managed_by_admin_id = ?,
          updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(custom_video_mode, notes, adminUser.id, userId).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO user_custom_settings (user_id, custom_video_mode, notes, managed_by_admin_id)
        VALUES (?, ?, ?, ?)
      `).bind(userId, custom_video_mode, notes, adminUser.id).run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

// Assign videos to user
app.post("/api/admin/users/:id/assign-videos", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { video_ids } = await c.req.json();
  
  try {
    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Admin user not found" }, 401);
    }
    
    const adminUser = await getOrCreateUser(
      currentUser.email,
      currentUser.google_user_data?.name || currentUser.email,
      c.env.DB
    );

    // Insert custom videos
    for (const videoId of video_ids) {
      // Check if already assigned
      const existing = await c.env.DB.prepare(
        "SELECT id FROM user_custom_videos WHERE user_id = ? AND video_id = ? AND is_active = 1"
      ).bind(userId, videoId).first();

      if (!existing) {
        await c.env.DB.prepare(`
          INSERT INTO user_custom_videos (user_id, video_id, assigned_by_admin_id)
          VALUES (?, ?, ?)
        `).bind(userId, videoId, adminUser.id).run();
      }
    }

    // Update has_custom_videos flag
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO user_custom_settings (
        user_id, has_custom_videos, managed_by_admin_id, created_at, updated_at
      ) VALUES (
        ?, 1, ?, 
        COALESCE((SELECT created_at FROM user_custom_settings WHERE user_id = ?), datetime('now')),
        datetime('now')
      )
    `).bind(userId, adminUser.id, userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to assign videos" }, 500);
  }
});

// Remove custom video from user
app.delete("/api/admin/users/:id/custom-videos/:customVideoId", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  const customVideoId = parseInt(c.req.param('customVideoId'));
  
  try {
    await c.env.DB.prepare(
      "UPDATE user_custom_videos SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).bind(customVideoId, userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to remove custom video" }, 500);
  }
});

// Get user's videos watched
app.get("/api/admin/users/:id/videos", adminMiddleware, async (c) => {
  const userId = parseInt(c.req.param('id'));
  
  try {
    // Get all videos available to this user (what they see in their account)
    const videosQuery = `
      SELECT 
        v.*,
        COUNT(vw.id) as watch_count,
        MAX(vw.created_at) as last_watched,
        ucv.id IS NOT NULL as is_custom
      FROM videos v
      LEFT JOIN video_watches vw ON v.id = vw.video_id AND vw.user_id = ?
      LEFT JOIN user_custom_videos ucv ON v.id = ucv.video_id AND ucv.user_id = ? AND ucv.is_active = true
      LEFT JOIN user_custom_settings ucs ON ucs.user_id = ?
      WHERE v.is_active = true 
      AND (
        -- If user has custom video mode enabled, only show custom videos
        (ucs.custom_video_mode = true AND ucv.id IS NOT NULL)
        OR
        -- If user doesn't have custom video mode, show all videos
        (ucs.custom_video_mode IS NOT true)
      )
      GROUP BY v.id
      ORDER BY is_custom DESC, v.created_at DESC
    `;
    
    const videos = await c.env.DB.prepare(videosQuery)
      .bind(userId, userId, userId)
      .all();

    return c.json(videos.results || []);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch user videos" }, 500);
  }
});

// Test webhook endpoint (for testing webhook processing)
app.post("/api/admin/webhooks/test", adminMiddleware, async (c) => {
  try {
    const { provider, user_email, amount, payment_id } = await c.req.json();
    
    const result = await processVipPurchaseFromWebhook(
      user_email,
      amount,
      payment_id || `test_${Date.now()}`,
      provider,
      c.env.DB
    );
    
    // Log test webhook
    await c.env.DB.prepare(`
      INSERT INTO webhook_logs (provider, event_type, user_email, vip_level, amount, payment_id, status, raw_data, processed_at, created_at)
      VALUES (?, 'test', ?, ?, ?, ?, 'processed', ?, datetime('now'), datetime('now'))
    `).bind(provider, user_email, result.vip_level, amount, payment_id, JSON.stringify({ test: true, user_email, amount, payment_id })).run();
    
    return c.json({ success: true, message: result.message, vip_level: result.vip_level });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Pushin Pay routes
app.route('/api/pushinpay', pushinpayRoutes);

// Balance transfers routes - apply admin middleware
app.use('/api/admin/balance-transfers/*', adminMiddleware);
app.route('/api/admin/balance-transfers', balanceTransfersRouter);

// Live activities routes - apply admin middleware
app.use('/api/admin/live-activities/*', adminMiddleware);
app.route('/api/admin/live-activities', liveActivitiesRouter);

// Test routes (only for development)
app.route('/api/test/webhook', webhookTestRoutes);

// Global error handler
app.onError((err, c) => {
  return c.json({ 
    error: err.message || 'Internal server error' 
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

export default app;
