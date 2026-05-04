import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MIN_WITHDRAWAL = 20.00

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: withdrawals, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar saques' }, { status: 500 })
  }

  return NextResponse.json({ withdrawals })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { amount, pix_key, pix_key_type } = await request.json()

  if (!amount || !pix_key || !pix_key_type) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json({ 
      error: `Valor mínimo para saque é R$ ${MIN_WITHDRAWAL.toFixed(2)}` 
    }, { status: 400 })
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_balance')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  if (profile.current_balance < amount) {
    return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
  }

  // Check for pending withdrawals
  const { data: pendingWithdrawal } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()

  if (pendingWithdrawal) {
    return NextResponse.json({ 
      error: 'Você já possui um saque pendente. Aguarde a aprovação.' 
    }, { status: 400 })
  }

  // Create withdrawal
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      user_id: user.id,
      amount: amount,
      pix_key: pix_key,
      pix_key_type: pix_key_type,
      status: 'pending',
    })
    .select()
    .single()

  if (withdrawalError) {
    return NextResponse.json({ error: 'Erro ao criar saque' }, { status: 500 })
  }

  // Deduct from balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      current_balance: profile.current_balance - amount,
    })
    .eq('id', user.id)

  if (updateError) {
    // Rollback withdrawal if balance update fails
    await supabase.from('withdrawals').delete().eq('id', withdrawal.id)
    return NextResponse.json({ error: 'Erro ao atualizar saldo' }, { status: 500 })
  }

  // Record live activity
  await supabase.from('live_activities').insert({
    user_id: user.id,
    activity_type: 'withdrawal',
    description: `solicitou saque de R$ ${amount.toFixed(2)}`,
    amount: amount,
  })

  return NextResponse.json({ 
    success: true, 
    withdrawal,
    new_balance: profile.current_balance - amount 
  })
}
