import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    let userVipLevel = 0
    let watchedIds: number[] = []

    if (user) {
      // Get user profile to check VIP level
      const { data: profile } = await supabase
        .from('profiles')
        .select('vip_level')
        .eq('id', user.id)
        .single()

      userVipLevel = profile?.vip_level || 0

      // Get videos user hasn't watched today
      const today = new Date().toISOString().split('T')[0]
      
      const { data: watchedToday } = await supabase
        .from('video_watches')
        .select('video_id')
        .eq('user_id', user.id)
        .eq('watch_date', today)

      watchedIds = watchedToday?.map(w => w.video_id) || []
    }

    let query = supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .lte('min_vip_level', userVipLevel)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (featured === 'true') {
      query = query.eq('is_home_featured', true)
    }

    // Exclude watched videos if user is authenticated
    if (user && watchedIds.length > 0) {
      query = query.not('id', 'in', `(${watchedIds.join(',')})`)
    }

    const { data: videos, error } = await query

    if (error) {
      console.error('Videos fetch error:', error)
      return NextResponse.json({ error: 'Erro ao buscar vídeos' }, { status: 500 })
    }

    return NextResponse.json(videos || [])
  } catch (error) {
    console.error('Videos error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
