import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { video_id, question_answer } = await request.json()

  if (!video_id) {
    return NextResponse.json({ error: 'ID do vídeo é obrigatório' }, { status: 400 })
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

  // Check daily limit
  const today = new Date().toISOString().split('T')[0]
  const effectiveLimit = profile.daily_limit + profile.bonus_videos

  if (profile.last_video_date === today && profile.daily_videos_watched >= effectiveLimit) {
    return NextResponse.json({ 
      error: 'Limite diário de vídeos atingido',
      daily_videos_watched: profile.daily_videos_watched,
      daily_limit: effectiveLimit
    }, { status: 400 })
  }

  // Get video info
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', video_id)
    .single()

  if (videoError || !video) {
    return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })
  }

  // Check if already watched today
  const { data: existingWatch } = await supabase
    .from('video_watches')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', video_id)
    .eq('watch_date', today)
    .single()

  if (existingWatch) {
    return NextResponse.json({ error: 'Você já assistiu este vídeo hoje' }, { status: 400 })
  }

  // If video has a question, validate answer
  if (question_answer) {
    const { data: question } = await supabase
      .from('video_questions')
      .select('*')
      .eq('video_id', video_id)
      .single()

    if (question) {
      const isCorrect = question_answer === question.correct_answer

      await supabase.from('video_question_answers').insert({
        user_id: user.id,
        video_id: video_id,
        question_id: question.id,
        selected_answer: question_answer,
        is_correct: isCorrect,
      })

      if (!isCorrect) {
        return NextResponse.json({ 
          error: 'Resposta incorreta! Tente novamente.',
          correct: false 
        }, { status: 400 })
      }
    }
  }

  // Calculate earnings (considering VIP multiplier)
  const { data: vipConfig } = await supabase
    .from('vip_payment_links')
    .select('earnings_multiplier')
    .eq('vip_level', profile.vip_level)
    .single()

  const multiplier = vipConfig?.earnings_multiplier || 1
  const earnings = Number(video.reward_amount) * multiplier

  // Record the watch
  const { error: watchError } = await supabase.from('video_watches').insert({
    user_id: user.id,
    video_id: video_id,
    earnings: earnings,
    watch_date: today,
  })

  if (watchError) {
    return NextResponse.json({ error: 'Erro ao registrar visualização' }, { status: 500 })
  }

  // Update user profile
  const newDailyCount = profile.last_video_date === today 
    ? profile.daily_videos_watched + 1 
    : 1

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({
      current_balance: profile.current_balance + earnings,
      total_earnings: profile.total_earnings + earnings,
      total_videos_watched: profile.total_videos_watched + 1,
      daily_videos_watched: newDailyCount,
      last_video_date: today,
    })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar saldo' }, { status: 500 })
  }

  // Record live activity
  await supabase.from('live_activities').insert({
    user_id: user.id,
    activity_type: 'video_watched',
    description: `assistiu um vídeo e ganhou R$ ${earnings.toFixed(2)}`,
    amount: earnings,
  })

  return NextResponse.json({
    success: true,
    earnings: earnings,
    new_balance: updatedProfile.current_balance,
    daily_videos_watched: updatedProfile.daily_videos_watched,
    daily_limit: effectiveLimit,
  })
}
