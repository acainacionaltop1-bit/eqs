'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { 
  Home, 
  Play, 
  Users, 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X,
  Settings,
  Crown,
  Ticket
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
          setIsAdmin(profileData.is_admin)
        }
      }
    }
    loadProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Missões', href: '/missions', icon: Play },
    { name: 'Cupons', href: '/cupons', icon: Ticket },
    { name: 'Afiliados', href: '/affiliates', icon: Users },
    { name: 'Ranking', href: '/ranking', icon: Trophy },
    { name: 'Carreira', href: '/carreira', icon: Crown },
    { name: 'Perfil', href: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Settings }] : []),
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Mobile-first layout */}
      <div className="pb-20 lg:pb-0 lg:pl-72 relative z-10">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
            {/* Logo */}
            <div className="flex items-center h-20 flex-shrink-0 px-6 border-b border-border">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                NextFund
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-primary' : ''}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User info */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-border">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-background/95 backdrop-blur-xl">
            <div className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              NextFund
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
              <nav className="px-4 py-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className={`mr-3 h-4 w-4 ${isActive(item.href) ? 'text-primary' : ''}`} />
                      {item.name}
                    </Link>
                  )
                })}
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sair
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Main content */}
        <main className="px-4 py-4 lg:py-8 lg:px-8">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="flex items-center justify-around py-2">
            {navigation.slice(0, 5).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive(item.href) ? 'text-primary' : ''}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
