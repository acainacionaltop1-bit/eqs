import { useState, useEffect } from 'react';
import { Play, DollarSign, Users, Gift, TrendingUp, Star, Clock, ArrowRight, Ticket, Check, AlertCircle } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import { useAuth } from '@/react-app/hooks/useAuth';
import VideoModal from '@/react-app/components/VideoModal';
import HomeBannerCarousel from '@/react-app/components/HomeBannerCarousel';
import IntegratedChat from '@/react-app/components/IntegratedChat';
import { Link } from 'react-router';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { Dialog, DialogContent } from '@/react-app/components/ui/dialog';
import { AnnouncementModal } from '@/react-app/components/AnnouncementModal';
import LiveActivityTicker from '@/react-app/components/LiveActivityTicker';

import type { Video, DashboardStats } from '@/shared/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAppliedCoupon, setLastAppliedCoupon] = useState<any>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const { getDashboardStats, getVideos, apiCall } = useApi();
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, videosData] = await Promise.all([
        getDashboardStats(),
        getVideos()
      ]);
      setStats(statsData);
      
      // Only show videos if there are any available
      if (Array.isArray(videosData) && videosData.length > 0) {
        setVideos(videosData.slice(0, 3)); // Show only 3 videos on dashboard
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.includes('Unauthorized')) {
        // Session expired, redirect to login
        window.location.href = '/login';
      }
      // For other errors, we'll just log them - the UI will show loading state ended
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Check for announcements after a short delay to ensure user is loaded
    const checkAnnouncements = setTimeout(async () => {
      try {
        const response = await fetch('/api/announcements', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const announcements = await response.json();
          if (Array.isArray(announcements) && announcements.length > 0) {
            setShowAnnouncementModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking announcements:', error);
      }
    }, 1000);

    return () => clearTimeout(checkAnnouncements);
  }, []);

  const handleVideoWatch = () => {
    setSelectedVideo(null);
    loadData(); // Reload data after watching video
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage('Digite um código de cupom');
      setCouponSuccess(false);
      return;
    }

    setCouponLoading(true);
    setCouponMessage('');
    setCouponSuccess(false);

    try {
      const result = await apiCall<{
        success: boolean;
        message: string;
        discount_applied?: number;
        discount_type?: string;
        coupon?: any;
      }>('/coupons/apply', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      });

      if (result.success) {
        setLastAppliedCoupon({
          code: couponCode.toUpperCase(),
          discount_applied: result.discount_applied,
          discount_type: result.discount_type,
          coupon: result.coupon,
        });
        setShowCouponModal(false);
        setShowSuccessModal(true);
        setCouponCode('');
        setCouponMessage('');
        loadData(); // Refresh balance
      } else {
        setCouponMessage(result.message);
        setCouponSuccess(false);
      }
    } catch (error: any) {
      setCouponMessage(error.message || 'Erro ao aplicar cupom');
      setCouponSuccess(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const getDiscountText = (type: string, value: number) => {
    switch (type) {
      case 'money':
        return `R$ ${value.toFixed(2)}`;
      case 'percentage':
        return `${value}%`;
      case 'bonus_videos':
        return `${value} vídeo${value > 1 ? 's' : ''} bônus`;
      default:
        return value.toString();
    }
  };

  const canWatchMoreVideos = stats ? stats.daily_videos_watched < stats.daily_limit : false;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '🎬';
      case 'vimeo':
        return '🎭';
      case 'direct':
        return '📹';
      case 'custom':
        return '🎯';
      default:
        return '🎥';
    }
  };

  const renderVideoThumbnail = (video: Video) => {
    // Try to use the stored thumbnail_url first
    if (video.thumbnail_url) {
      return (
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to platform-specific thumbnail
            const fallbackSrc = getFallbackThumbnail(video);
            if (fallbackSrc) {
              (e.target as HTMLImageElement).src = fallbackSrc;
            } else {
              // Ultimate fallback - remove img and show placeholder
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent && !parent.querySelector('.thumbnail-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.className = 'thumbnail-placeholder w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-xl';
                placeholder.textContent = getPlatformIcon(video.video_platform);
                parent.appendChild(placeholder);
              }
            }
          }}
        />
      );
    }

    // Platform-specific thumbnail generation
    const fallbackSrc = getFallbackThumbnail(video);
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent && !parent.querySelector('.thumbnail-placeholder')) {
              const placeholder = document.createElement('div');
              placeholder.className = 'thumbnail-placeholder w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-xl';
              placeholder.textContent = getPlatformIcon(video.video_platform);
              parent.appendChild(placeholder);
            }
          }}
        />
      );
    }

    // Final fallback - just show platform icon
    return (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-2xl">
        {getPlatformIcon(video.video_platform)}
      </div>
    );
  };

  const getFallbackThumbnail = (video: Video) => {
    switch (video.video_platform) {
      case 'youtube':
        return video.youtube_id ? `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg` : null;
      case 'vimeo':
        // For Vimeo, we would need an API call to get thumbnails, so return null for now
        return null;
      case 'direct':
        // For direct videos, we can't generate thumbnails easily
        return null;
      case 'custom':
        // Custom videos might have their own thumbnail logic
        return null;
      default:
        return video.youtube_id ? `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg` : null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center lg:text-left space-y-3">
          <div className="h-8 bg-gray-700/50 rounded-xl w-64 mx-auto lg:mx-0 animate-pulse"></div>
          <div className="h-4 bg-gray-700/30 rounded-lg w-80 mx-auto lg:mx-0 animate-pulse"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-600 rounded w-20"></div>
                </div>
                <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full w-full"></div>
            </div>
          ))}
        </div>

        {/* Action buttons skeleton */}
        <div className="grid grid-cols-1 gap-3 animate-pulse">
          <div className="h-16 bg-gray-800/50 rounded-xl border border-gray-700/50"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-800/50 rounded-xl border border-gray-700/50"></div>
            ))}
          </div>
        </div>

        {/* Featured videos skeleton */}
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-700 rounded w-40"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <div className="w-16 h-12 bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header - Mobile optimized */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Bem-vindo {user?.google_user_data?.name?.split(' ')[0] || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || ''}! 👋
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Continue assistindo vídeos e aumentando seus ganhos.
        </p>
      </div>

      {/* Live Activities */}
      <LiveActivityTicker />

      {/* Stats cards - Mobile first grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-xs font-medium uppercase tracking-wide">Saldo Atual</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.current_balance.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Total: R$ {stats.total_earnings.toFixed(2)}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-xs font-medium uppercase tracking-wide">Vídeos Hoje</p>
                <p className="text-2xl font-bold text-white">
                  {stats.daily_videos_watched}/{stats.daily_limit}
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-400" />
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min((stats.daily_videos_watched / stats.daily_limit) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-400/10 to-purple-600/10 rounded-xl p-4 border border-purple-500/20 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-xs font-medium uppercase tracking-wide">Nível</p>
                <p className="text-xl font-bold text-white">
                  {stats.level} - {stats.level_title}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${stats.progress_to_next_level}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.progress_to_next_level.toFixed(0)}% próximo nível
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bonus videos alert */}
      {stats && stats.bonus_videos > 0 && (
        <div className="bg-gradient-to-r from-orange-400/10 to-orange-600/10 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white">Vídeos Bônus!</h3>
              <p className="text-gray-300 text-sm">
                {stats.bonus_videos} vídeos bônus disponíveis (não contam no limite)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons - Mobile optimized */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          to="/missions"
          className={`flex items-center justify-between p-4 rounded-xl font-semibold transition-all ${
            canWatchMoreVideos
              ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-lg shadow-green-500/25'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5" />
            <span>Ver Todas as Missões</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">
              {canWatchMoreVideos ? 'Disponível' : 'Limite atingido'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            to="/affiliates"
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm">Afiliados</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>

          {/* Coupon Button */}
          <button
            onClick={() => setShowCouponModal(true)}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-green-400" />
              <span className="text-white text-sm">Cupom</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>

          {stats && stats.can_spin_today && (
            <Link
              to="/profile?spin=true"
              className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-400/20 to-orange-600/20 border border-yellow-500/30 rounded-xl hover:from-yellow-400/30 hover:to-orange-600/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-yellow-400" />
                <span className="text-white text-sm">Roleta</span>
              </div>
              <span className="text-xs text-yellow-400 font-medium">Grátis!</span>
            </Link>
          )}
        </div>
      </div>

      {/* Featured videos - Mobile optimized */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Vídeos em Destaque</h3>
          <Link to="/missions" className="text-green-400 text-sm hover:text-green-300">
            Ver todos
          </Link>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum vídeo disponível</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => {
              const canWatchThisVideo = canWatchMoreVideos;
              
              return (
                <div
                  key={video.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    canWatchThisVideo
                      ? 'bg-gray-700/50 hover:bg-gray-700 cursor-pointer'
                      : 'bg-gray-700/30 opacity-60'
                  }`}
                  onClick={() => canWatchThisVideo && setSelectedVideo(video)}
                >
                  <div className="w-16 h-12 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                    {renderVideoThumbnail(video)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDuration(video.duration_seconds)}
                        </span>
                      </div>
                      
                    </div>
                  </div>
                  {canWatchThisVideo && (
                    <div className="text-xs font-medium text-green-400 flex-shrink-0">
                      R$ 2.00
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Home Banners Carousel */}
      <HomeBannerCarousel className="mb-4" />

      {/* Daily limit reached message */}
      {!canWatchMoreVideos && (
        <div className="bg-gradient-to-r from-red-400/10 to-red-600/10 rounded-xl p-4 border border-red-500/20 text-center">
          <h3 className="text-lg font-bold text-white mb-2">
            Limite Diário Atingido! 🎯
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            Você assistiu todos os vídeos permitidos hoje. Parabéns!
          </p>
          <p className="text-xs text-gray-400">
            Volte amanhã às 00:00 (UTC-3) para continuar ganhando.
          </p>
        </div>
      )}

      {/* Video modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onEarningsUpdate={handleVideoWatch}
        />
      )}

      {/* Coupon Modal */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className="max-w-sm">
          <div className="relative">

            <div className="text-center space-y-6">
              {/* Coupon Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center relative">
                <Ticket className="w-10 h-10 text-white" />
                {/* Decorative stars */}
                <div className="absolute -top-1 -left-1 text-green-300 text-sm">✨</div>
                <div className="absolute -top-1 -right-1 text-green-300 text-sm">✨</div>
                <div className="absolute -bottom-1 -left-1 text-green-300 text-sm">✨</div>
                <div className="absolute -bottom-1 -right-1 text-green-300 text-sm">✨</div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Cupom</h2>
                <p className="text-gray-400 text-sm">
                  Aplique o cupom e ganhe prêmios e benefícios premium.
                </p>
              </div>

              {/* Input and Button */}
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Insira o coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-gray-800 border-gray-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                />
                
                <Button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3"
                >
                  {couponLoading ? 'APLICANDO...' : 'APLICAR'}
                </Button>
              </div>

              {/* Message/Error */}
              {couponMessage && (
                <div className={`rounded-lg p-3 ${couponSuccess ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-2 justify-center">
                    {couponSuccess ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${couponSuccess ? 'text-green-400' : 'text-red-400'}`}>
                      {couponMessage}
                    </span>
                  </div>
                </div>
              )}

              {/* Success Section - shown when coupon is applied */}
              {lastAppliedCoupon && couponSuccess && (
                <div className="space-y-4">
                  <div className="text-green-400 font-medium">
                    Cupom aplicado com sucesso!
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cupom</span>
                      <span className="text-white font-semibold">{lastAppliedCoupon.code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Código</span>
                      <span className="text-white font-semibold">{lastAppliedCoupon.code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Valor</span>
                      <span className="text-green-400 font-semibold">
                        {getDiscountText(lastAppliedCoupon.discount_type, lastAppliedCoupon.discount_applied)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm text-center">
                      O valor do cupom foi aplicado na sua carteira!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && lastAppliedCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-green-400 to-emerald-600 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Cupom aplicado com sucesso!
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cupom:</span>
                    <span className="text-white font-semibold">{lastAppliedCoupon.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor:</span>
                    <span className="text-green-400 font-semibold">
                      {getDiscountText(lastAppliedCoupon.discount_type, lastAppliedCoupon.discount_applied)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-green-400 text-sm text-center">
                    O valor do cupom foi aplicado na sua carteira!
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Integrado - aparece apenas na página home */}
      <IntegratedChat />

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
      />
    </div>
  );
}
