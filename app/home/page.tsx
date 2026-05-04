'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useProfile } from '@/hooks/use-profile'
import { useVideos } from '@/hooks/use-videos'
import { formatCurrency, getVipLevelName, getVipLevelColor } from '@/lib/utils'
import { Play, Wallet, TrendingUp, Crown, Gift, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { profile, isLoading: profileLoading } = useProfile()
  const { videos, isLoading: videosLoading } = useVideos({ featured: true, limit: 3 })

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const dailyLimit = (profile?.daily_limit || 15) + (profile?.bonus_videos || 0)
  const videosRemaining = dailyLimit - (profile?.daily_videos_watched || 0)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Olá, {profile?.name?.split(' ')[0] || 'Usuário'}!
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta. Continue ganhando!
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border ${getVipLevelColor(profile?.vip_level || 0)}`}>
            <Crown className="w-4 h-4" />
            <span className="font-medium">{getVipLevelName(profile?.vip_level || 0)}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Saldo Atual"
            value={formatCurrency(profile?.current_balance || 0)}
            color="text-primary"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Ganho"
            value={formatCurrency(profile?.total_earnings || 0)}
            color="text-green-400"
          />
          <StatCard
            icon={<Play className="w-5 h-5" />}
            label="Vídeos Hoje"
            value={`${profile?.daily_videos_watched || 0}/${dailyLimit}`}
            color="text-blue-400"
          />
          <StatCard
            icon={<Gift className="w-5 h-5" />}
            label="Bônus Restantes"
            value={`${videosRemaining} vídeos`}
            color="text-purple-400"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Videos to Watch */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Vídeos Disponíveis</h2>
              <Link href="/missions">
                <Button variant="ghost" size="sm">Ver Todos</Button>
              </Link>
            </div>
            
            {videosLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-3">
                {videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/missions?video=${video.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-16 h-12 bg-background rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.duration_seconds}s - {formatCurrency(video.reward_amount)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum vídeo disponível no momento</p>
              </div>
            )}
          </div>

          {/* Withdrawal Card */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Solicitar Saque</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Saque mínimo: R$ 20,00 via PIX
            </p>
            
            <div className="bg-card/50 rounded-xl p-4 mb-4">
              <div className="text-sm text-muted-foreground">Seu saldo</div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(profile?.current_balance || 0)}
              </div>
            </div>

            <Link href="/profile#saque">
              <Button 
                variant="primary" 
                className="w-full"
                disabled={(profile?.current_balance || 0) < 20}
              >
                {(profile?.current_balance || 0) < 20 
                  ? `Faltam ${formatCurrency(20 - (profile?.current_balance || 0))}`
                  : 'Solicitar Saque'
                }
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickLink href="/missions" icon={<Play />} label="Assistir Vídeos" />
          <QuickLink href="/cupons" icon={<Gift />} label="Resgatar Cupom" />
          <QuickLink href="/affiliates" icon={<TrendingUp />} label="Indicar Amigos" />
          <QuickLink href="/carreira" icon={<Crown />} label="Planos VIP" />
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl hover:bg-secondary transition-colors text-center"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
