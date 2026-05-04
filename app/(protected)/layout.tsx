import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProtectedNav } from '@/components/protected-nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, vip_level, is_admin, current_balance')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <ProtectedNav 
        user={{
          name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          vip_level: profile?.vip_level || 0,
          is_admin: profile?.is_admin || false,
          current_balance: profile?.current_balance || 0
        }}
      />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
