import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SPIN_REWARDS = [
  { value: 0.50, weight: 30 },
  { value: 1.00, weight: 25 },
  { value: 1.50, weight: 20 },
  { value: 2.00, weight: 15 },
  { value: 3.00, weight: 7 },
  { value: 5.00, weight: 2 },
  { value: 10.00, weight: 1 },
]

function getRandomReward(): number {
  const totalWeight = SPIN_REWARDS.reduce((sum, r) => sum + r.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const reward of SPIN_REWARDS) {
    random -= reward.weight
    if (random <= 0) {
      return reward.value
    }
  }
  
  return SPIN_REWARDS[0].value
}

export async function POST() {
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

  const today = new Date().toISOString().split('T')[0]

  // Check if already spun today
  if (profile.last_spin_date === today) {
    return NextResponse.json({ 
      error: 'Você já girou a roleta hoje. Volte amanhã!',
      can_spin: false 
    }, { status: 400 })
  }

  // Check if watched minimum videos
  const MIN_VIDEOS_TO_SPIN = 5
  if (profile.last_video_date !== today || profile.daily_videos_watched < MIN_VIDEOS_TO_SPIN) {
    return NextResponse.json({ 
      error: `Assista pelo menos ${MIN_VIDEOS_TO_SPIN} vídeos hoje para girar a roleta`,
      videos_watched: profile.daily_videos_watched,
      videos_required: MIN_VIDEOS_TO_SPIN,
      can_spin: false 
    }, { status: 400 })
  }

  // Get reward
  const reward = getRandomReward()

  // Record spin result
  const { error: spinError } = await supabase.from('spin_results').insert({
    user_id: user.id,
    amount: reward,
    spin_date: today,
  })

  if (spinError) {
    return NextResponse.json({ error: 'Erro ao registrar giro' }, { status: 500 })
  }

  // Update user profile
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({
      current_balance: profile.current_balance + reward,
      total_earnings: profile.total_earnings + reward,
      last_spin_date: today,
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
    activity_type: 'spin',
    description: `ganhou R$ ${reward.toFixed(2)} na roleta!`,
    amount: reward,
  })

  return NextResponse.json({
    success: true,
    reward: reward,
    new_balance: updatedProfile.current_balance,
    can_spin: false,
  })
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_spin_date, daily_videos_watched, last_video_date')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const MIN_VIDEOS_TO_SPIN = 5

  const canSpin = profile?.last_spin_date !== today && 
    profile?.last_video_date === today && 
    profile?.daily_videos_watched >= MIN_VIDEOS_TO_SPIN

  return NextResponse.json({
    can_spin: canSpin,
    videos_watched: profile?.daily_videos_watched || 0,
    videos_required: MIN_VIDEOS_TO_SPIN,
    already_spun: profile?.last_spin_date === today,
  })
}
