import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Check if last_video_date is today, if not reset daily counter
    const today = new Date().toISOString().split('T')[0]
    let dailyVideosWatched = profile.daily_videos_watched || 0
    
    if (profile.last_video_date !== today) {
      dailyVideosWatched = 0
      // Reset daily counter in database
      await supabase
        .from('profiles')
        .update({ daily_videos_watched: 0, last_video_date: today })
        .eq('id', user.id)
    }

    // Calculate level info
    const levelThresholds = [0, 10, 30, 60, 100, 150, 220, 300, 400, 500]
    const levelTitles = [
      'Iniciante', 'Aprendiz', 'Explorador', 'Aventureiro', 'Mestre',
      'Expert', 'Veterano', 'Elite', 'Lenda', 'Campeão'
    ]
    
    const currentLevel = profile.level || 1
    const totalVideos = profile.total_videos_watched || 0
    
    const currentThreshold = levelThresholds[currentLevel - 1] || 0
    const nextThreshold = levelThresholds[currentLevel] || levelThresholds[levelThresholds.length - 1]
    const progressToNextLevel = nextThreshold > currentThreshold 
      ? ((totalVideos - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      : 100

    // Check if user can spin today
    const canSpinToday = profile.last_spin_date !== today

    const stats = {
      current_balance: Number(profile.current_balance) || 0,
      total_earnings: Number(profile.total_earnings) || 0,
      daily_videos_watched: dailyVideosWatched,
      daily_limit: profile.daily_limit || 15,
      bonus_videos: profile.bonus_videos || 0,
      level: currentLevel,
      level_title: levelTitles[currentLevel - 1] || 'Iniciante',
      progress_to_next_level: Math.min(progressToNextLevel, 100),
      total_videos_watched: totalVideos,
      vip_level: profile.vip_level || 0,
      vip_expires_at: profile.vip_expires_at,
      can_spin_today: canSpinToday,
      affiliate_code: profile.affiliate_code,
      is_admin: profile.is_admin || false,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
