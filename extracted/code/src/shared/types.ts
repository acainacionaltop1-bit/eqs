import z from "zod";

// Video schemas
export const VideoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  youtube_id: z.string(),
  video_platform: z.string(),
  video_url: z.string().nullable(),
  embed_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  video_file_path: z.string().nullable().optional(),
  duration_seconds: z.number(),
  reward_amount: z.number(),
  category: z.string().nullable(),
  is_active: z.boolean(),
  has_question: z.boolean().default(false),
  question: z.object({
    id: z.number(),
    video_id: z.number(),
    question: z.string(),
    correct_answer: z.string(),
    wrong_answer: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  }).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Video = z.infer<typeof VideoSchema>;

// Dashboard stats schema
export const DashboardStatsSchema = z.object({
  current_balance: z.number(),
  total_earnings: z.number(),
  daily_videos_watched: z.number(),
  daily_limit: z.number(),
  level: z.number(),
  level_title: z.string(),
  progress_to_next_level: z.number(),
  total_videos_watched: z.number(),
  bonus_videos: z.number(),
  can_spin_today: z.boolean(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Withdrawal schemas
export const WithdrawRequestSchema = z.object({
  amount: z.number().min(20),
  pix_key: z.string().min(1),
});

export type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;

export const WithdrawalSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  pix_key: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  processed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Withdrawal = z.infer<typeof WithdrawalSchema>;

// Spin result schema
export const SpinResultSchema = z.object({
  prize_type: z.enum(['money', 'video', 'nothing']),
  prize_value: z.number().nullable(),
  message: z.string(),
});

export type SpinResult = z.infer<typeof SpinResultSchema>;

// Affiliate info schema
export const AffiliateInfoSchema = z.object({
  affiliate_code: z.string(),
  referred_count: z.number(),
  bonus_videos_earned: z.number(),
  referred_users: z.array(z.object({
    name: z.string().nullable(),
    email: z.string(),
    total_videos_watched: z.number(),
    created_at: z.string(),
  })),
  affiliate_link: z.string(),
});

export type AffiliateInfo = z.infer<typeof AffiliateInfoSchema>;

// Ranking user schema
export const RankingUserSchema = z.object({
  name: z.string().nullable(),
  email: z.string(),
  level: z.number(),
  total_videos_watched: z.number(),
  total_points: z.number(),
});

export type RankingUser = z.infer<typeof RankingUserSchema>;

// Video question schemas
export const VideoQuestionSchema = z.object({
  id: z.number(),
  video_id: z.number(),
  question: z.string(),
  correct_answer: z.string(),
  wrong_answer: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type VideoQuestion = z.infer<typeof VideoQuestionSchema>;

// Video watch request schema
export const VideoWatchRequestSchema = z.object({
  video_id: z.number(),
  question_answer: z.string().optional(),
});

export type VideoWatchRequest = z.infer<typeof VideoWatchRequestSchema>;

// Auth schemas
export const RegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  affiliate_code: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Webhook schemas
export const WebhookLogSchema = z.object({
  id: z.number(),
  provider: z.string(),
  event_type: z.string(),
  payment_id: z.string().nullable(),
  user_email: z.string().nullable(),
  vip_level: z.number().nullable(),
  amount: z.number().nullable(),
  status: z.enum(['processed', 'failed', 'ignored']),
  raw_data: z.string(),
  error_message: z.string().nullable(),
  processed_at: z.string().nullable(),
  created_at: z.string(),
});

export type WebhookLog = z.infer<typeof WebhookLogSchema>;

// Webhook config schema
export const WebhookConfigSchema = z.object({
  id: z.number(),
  provider: z.string(),
  webhook_url: z.string(),
  secret_key: z.string().nullable(),
  is_active: z.boolean(),
  vip_level_mapping: z.string().nullable(), // JSON string mapping payment amounts to VIP levels
  created_at: z.string(),
  updated_at: z.string(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
