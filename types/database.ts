export interface Profile {
  id: string
  email: string
  name: string | null
  level: number
  total_videos_watched: number
  total_earnings: number
  current_balance: number
  daily_videos_watched: number
  daily_limit: number
  bonus_videos: number
  last_video_date: string | null
  last_spin_date: string | null
  affiliate_code: string | null
  referred_by: string | null
  is_admin: boolean
  vip_level: number
  vip_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Video {
  id: number
  title: string
  description: string | null
  youtube_id: string | null
  video_platform: string
  video_url: string | null
  video_file_path: string | null
  embed_url: string | null
  thumbnail_url: string | null
  duration_seconds: number
  reward_amount: number
  category: string | null
  is_active: boolean
  is_home_featured: boolean
  min_vip_level: number
  created_at: string
  updated_at: string
}

export interface VideoWatch {
  id: number
  user_id: string
  video_id: number
  earnings: number
  watch_date: string
  created_at: string
}

export interface VideoQuestion {
  id: number
  video_id: number
  question: string
  correct_answer: string
  wrong_answer: string
  created_at: string
  updated_at: string
}

export interface Withdrawal {
  id: number
  user_id: string
  amount: number
  pix_key: string
  pix_key_type: string
  status: 'pending' | 'approved' | 'rejected' | 'processing'
  processed_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface SpinResult {
  id: number
  user_id: string
  amount: number
  spin_date: string
  created_at: string
}

export interface VipPurchase {
  id: number
  user_id: string
  vip_level: number
  amount: number
  payment_method: string
  transaction_id: string | null
  status: 'pending' | 'completed' | 'failed'
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface VipPaymentLink {
  id: number
  vip_level: number
  payment_url: string
  price: number
  daily_limit: number
  bonus_videos: number
  earnings_multiplier: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Coupon {
  id: number
  code: string
  reward_type: 'balance' | 'vip' | 'bonus_videos'
  reward_amount: number
  max_uses: number
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CouponUse {
  id: number
  coupon_id: number
  user_id: string
  created_at: string
}

export interface Notification {
  id: number
  user_id: string | null
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  is_global: boolean
  created_at: string
}

export interface ChatMessage {
  id: number
  user_id: string
  message: string
  is_admin_message: boolean
  created_at: string
  profiles?: Pick<Profile, 'name' | 'vip_level'>
}

export interface AdminAnnouncement {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'promo'
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LiveActivity {
  id: number
  user_id: string | null
  activity_type: 'video_watched' | 'withdrawal' | 'vip_purchase' | 'spin' | 'coupon'
  description: string
  amount: number | null
  metadata: Record<string, unknown>
  created_at: string
  profiles?: Pick<Profile, 'name'>
}

export interface HomeBanner {
  id: number
  title: string | null
  image_url: string
  link_url: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VipGroup {
  id: number
  vip_level: number
  platform: 'telegram' | 'whatsapp'
  group_name: string
  invite_link: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  current_balance: number
  total_earnings: number
  daily_videos_watched: number
  daily_limit: number
  bonus_videos: number
  level: number
  level_title: string
  progress_to_next_level: number
  total_videos_watched: number
  vip_level: number
  vip_expires_at: string | null
  can_spin_today: boolean
  affiliate_code: string | null
  is_admin: boolean
}
