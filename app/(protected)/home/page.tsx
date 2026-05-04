'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Play, 
  DollarSign, 
  Users, 
  Gift, 
  TrendingUp, 
  Star, 
  ArrowRight, 
  Ticket,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardStats, Video } from '@/types/database'

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const [statsRes, videosRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/videos?limit=3')
      ])

      if (!statsRes.ok) {
        throw new Error('Erro ao carregar estatisticas')
      }

      const statsData = await statsRes.json()
      const videosData = await videosRes.json()

      setStats(statsData)
      setVideos(Array.isArray(videosData) ? videosData.slice(0, 3) : [])
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const canWatchMoreVideos = stats ? stats.daily_videos_watched < stats.daily_limit : false

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center lg:text-left space-y-3">
          <div className="h-8 bg-secondary rounded-xl w-64 mx-auto lg:mx-0 animate-pulse" />
          <div className="h-4 bg-secondary/50 rounded-lg w-80 mx-auto lg:mx-0 animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-secondary rounded w-24" />
                  <div className="h-8 bg-secondary rounded w-20" />
                </div>
                <div className="h-8 w-8 bg-secondary rounded-full" />
              </div>
              <div className="h-2 bg-secondary rounded-full w-full" />
            </div>
          ))}
        </div>

        {/* Videos skeleton */}
        <div className="bg-card rounded-xl p-4 border border-border space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-secondary rounded w-40" />
            <div className="h-4 bg-secondary rounded w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <div className="w-16 h-12 bg-secondary rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-16" />
                </div>
                <div className="h-4 bg-secondary rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={loadData} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Bem-vindo de volta!
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          Continue assistindo videos e aumentando seus ganhos.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary text-xs font-medium uppercase tracking-wide">Saldo Atual</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {stats.current_balance.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              Total: R$ {stats.total_earnings.toFixed(2)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-xs font-medium uppercase tracking-wide">Videos Hoje</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.daily_videos_watched}/{stats.daily_limit}
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-400" />
            </div>
            <div className="mt-3">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min((stats.daily_videos_watched / stats.daily_limit) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/20 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-xs font-medium uppercase tracking-wide">Nivel</p>
                <p className="text-xl font-bold text-foreground">
                  {stats.level} - {stats.level_title}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${stats.progress_to_next_level}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.progress_to_next_level.toFixed(0)}% proximo nivel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bonus videos alert */}
      {stats && stats.bonus_videos > 0 && (
        <div className="bg-gradient-to-r from-orange-500/20 to-orange-500/5 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Videos Bonus!</h3>
              <p className="text-muted-foreground text-sm">
                {stats.bonus_videos} videos bonus disponiveis (nao contam no limite)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/missoes"
          className={`flex items-center justify-between p-4 rounded-xl font-semibold transition-all ${
            canWatchMoreVideos
              ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5" />
            <span>Ver Todas as Missoes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">
              {canWatchMoreVideos ? 'Disponivel' : 'Limite atingido'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href="/afiliados"
            className="flex items-center justify-between p-3 bg-card rounded-xl hover:bg-secondary transition-colors border border-border"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-foreground text-sm">Afiliados</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link
            href="/cupons"
            className="flex items-center justify-between p-3 bg-card rounded-xl hover:bg-secondary transition-colors border border-border"
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-primary" />
              <span className="text-foreground text-sm">Cupom</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {stats && stats.can_spin_today && (
            <Link
              href="/perfil?spin=true"
              className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl hover:from-yellow-500/30 hover:to-orange-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-yellow-400" />
                <span className="text-foreground text-sm">Roleta</span>
              </div>
              <span className="text-xs text-yellow-400 font-medium">Gratis!</span>
            </Link>
          )}
        </div>
      </div>

      {/* Featured videos */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Videos em Destaque</h3>
          <Link href="/missoes" className="text-primary text-sm hover:text-primary/80">
            Ver todos
          </Link>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum video disponivel</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/missoes?video=${video.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  canWatchMoreVideos
                    ? 'bg-secondary/50 hover:bg-secondary cursor-pointer'
                    : 'bg-secondary/30 opacity-60 pointer-events-none'
                }`}
              >
                <div className="w-16 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : video.youtube_id ? (
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Play className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDuration(video.duration_seconds)}</span>
                  </div>
                </div>
                <div className="text-primary font-semibold text-sm">
                  +R$ {Number(video.reward_amount).toFixed(2)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
