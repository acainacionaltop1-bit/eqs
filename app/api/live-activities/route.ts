import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data: activities, error } = await supabase
    .from('live_activities')
    .select(`
      *,
      profiles:user_id (name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar atividades' }, { status: 500 })
  }

  // Format activities with masked names for privacy
  const formattedActivities = activities?.map(activity => ({
    id: activity.id,
    activity_type: activity.activity_type,
    description: activity.description,
    amount: activity.amount,
    created_at: activity.created_at,
    user_name: activity.profiles?.name 
      ? maskName(activity.profiles.name) 
      : 'Usuário',
  }))

  return NextResponse.json({ activities: formattedActivities })
}

function maskName(name: string): string {
  if (!name || name.length < 3) return 'Usuário'
  
  const parts = name.split(' ')
  if (parts.length === 1) {
    return name.substring(0, 2) + '***'
  }
  
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  
  return `${firstName.substring(0, 2)}*** ${lastName.substring(0, 1)}***`
}
