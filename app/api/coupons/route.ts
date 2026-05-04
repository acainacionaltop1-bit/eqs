import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 })
  }

  // Find coupon
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (couponError || !coupon) {
    return NextResponse.json({ error: 'Cupom não encontrado ou inválido' }, { status: 404 })
  }

  // Check if expired
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este cupom expirou' }, { status: 400 })
  }

  // Check usage limit
  if (coupon.current_uses >= coupon.max_uses) {
    return NextResponse.json({ error: 'Este cupom atingiu o limite de uso' }, { status: 400 })
  }

  // Check if user already used this coupon
  const { data: existingUse } = await supabase
    .from('coupon_uses')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)
    .single()

  if (existingUse) {
    return NextResponse.json({ error: 'Você já usou este cupom' }, { status: 400 })
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_balance, bonus_videos')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // Apply coupon reward
  let updateData: Record<string, unknown> = {}
  let message = ''

  switch (coupon.reward_type) {
    case 'balance':
      updateData = { current_balance: profile.current_balance + coupon.reward_amount }
      message = `Você ganhou R$ ${coupon.reward_amount.toFixed(2)}!`
      break
    case 'bonus_videos':
      updateData = { bonus_videos: profile.bonus_videos + coupon.reward_amount }
      message = `Você ganhou ${coupon.reward_amount} vídeos bônus!`
      break
    default:
      return NextResponse.json({ error: 'Tipo de cupom inválido' }, { status: 400 })
  }

  // Update user profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao aplicar cupom' }, { status: 500 })
  }

  // Record coupon use
  await supabase.from('coupon_uses').insert({
    coupon_id: coupon.id,
    user_id: user.id,
  })

  // Update coupon usage count
  await supabase
    .from('coupons')
    .update({ current_uses: coupon.current_uses + 1 })
    .eq('id', coupon.id)

  // Record live activity
  await supabase.from('live_activities').insert({
    user_id: user.id,
    activity_type: 'coupon',
    description: `resgatou o cupom ${code.toUpperCase()}`,
    amount: coupon.reward_type === 'balance' ? coupon.reward_amount : null,
  })

  return NextResponse.json({ 
    success: true, 
    message,
    reward_type: coupon.reward_type,
    reward_amount: coupon.reward_amount
  })
}
