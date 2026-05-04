import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Get user's affiliate code
  const { data: profile } = await supabase
    .from('profiles')
    .select('affiliate_code')
    .eq('id', user.id)
    .single()

  if (!profile?.affiliate_code) {
    return NextResponse.json({ error: 'Código de afiliado não encontrado' }, { status: 404 })
  }

  // Get referrals
  const { data: referrals, error: referralsError } = await supabase
    .from('profiles')
    .select('id, name, created_at, total_earnings, vip_level')
    .eq('referred_by', profile.affiliate_code)
    .order('created_at', { ascending: false })

  if (referralsError) {
    return NextResponse.json({ error: 'Erro ao buscar indicados' }, { status: 500 })
  }

  // Calculate stats
  const totalReferrals = referrals?.length || 0
  const totalEarningsFromReferrals = referrals?.reduce((sum, r) => sum + (r.total_earnings * 0.05), 0) || 0
  const activeReferrals = referrals?.filter(r => r.total_earnings > 0).length || 0

  return NextResponse.json({
    affiliate_code: profile.affiliate_code,
    referrals: referrals || [],
    stats: {
      total_referrals: totalReferrals,
      active_referrals: activeReferrals,
      total_earnings: totalEarningsFromReferrals,
    }
  })
}
