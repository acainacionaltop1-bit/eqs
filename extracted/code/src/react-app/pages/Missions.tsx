import { useState, useEffect } from 'react';
import { Play, AlertCircle, Shield } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import VideoModal from '@/react-app/components/VideoModal';
import type { Video, DashboardStats } from '@/shared/types';

export default function Missions() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getVideos, getDashboardStats } = useApi();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [videosData, statsData] = await Promise.all([
        getVideos(),
        getDashboardStats()
      ]);
      
      // Ensure we only show Vimeo videos that are valid
      if (Array.isArray(videosData) && videosData.length > 0) {
        // Filter to ensure videos have valid URLs
        const validVideos = videosData.filter(video => 
          video && 
          video.video_url
        );
        setVideos(validVideos);
      } else {
        setVideos([]);
      }
      setStats(statsData);
    } catch (error) {
      console.error('Error loading missions:', error);
      
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
  }, []);

  const handleVideoWatch = () => {
    setSelectedVideo(null);
    loadData(); // Reload data after watching video
  };

  const canWatchMoreVideos = stats ? stats.daily_videos_watched < stats.daily_limit : false;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="text-center lg:text-left space-y-3">
          <div className="h-8 bg-gray-700/50 rounded-xl w-64"></div>
          <div className="h-4 bg-gray-700/30 rounded-lg w-80"></div>
        </div>

        {/* Progress card skeleton */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-6 bg-gray-600 rounded w-20"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2"></div>
        </div>

        {/* Videos section skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-gray-700/50 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
                      <div className="h-3 bg-gray-700 rounded w-12"></div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-4"></div>
                </div>
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
          Missões Disponíveis 🎯
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Complete missões diárias e ganhe recompensas exclusivas.
        </p>
      </div>

      {/* Progress card */}
      {stats && (
        <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base lg:text-lg font-bold text-white">Progresso Diário</h3>
              <p className="text-gray-400 text-sm">
                {stats.daily_videos_watched}/{stats.daily_limit} vídeos hoje
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl lg:text-2xl font-bold text-green-400">
                R$ {((stats.daily_videos_watched * (stats.level === 1 ? 2 : stats.level === 2 ? 2.1 : stats.level === 3 ? 2.3 : stats.level === 4 ? 2.5 : 3))).toFixed(2)}
              </div>
              <div className="text-xs lg:text-sm text-gray-400">ganhos hoje</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
              style={{ 
                width: `${Math.min((stats.daily_videos_watched / stats.daily_limit) * 100, 100)}%` 
              }}
            />
          </div>

          {stats.bonus_videos > 0 && (
            <div className="mt-4 p-4 bg-orange-400/10 rounded-lg border border-orange-500/20">
              <p className="text-orange-400 font-medium">
                🎁 Você tem {stats.bonus_videos} vídeos bônus disponíveis! Eles não contam no limite diário.
              </p>
            </div>
          )}
        </div>
      )}

      

      {/* Limit reached warning */}
      {!canWatchMoreVideos && (
        <div className="bg-gradient-to-r from-red-400/10 to-red-600/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Limite Diário Atingido</h3>
              <p className="text-gray-400">
                Você assistiu todos os vídeos permitidos hoje. Volte amanhã às 00:00 (UTC-3) para continuar ganhando!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Videos grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">🎬</span>
          Vídeos Disponíveis
        </h2>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum vídeo disponível</h3>
            <p className="text-gray-400">Novos vídeos serão adicionados em breve!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => {
              // Validate video object
              if (!video || !video.id) {
                return null;
              }

              const watchedToday = false; // This would come from the API response
              const canWatch = canWatchMoreVideos && !watchedToday;

              return (
                <div
                  key={video.id}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 ${canWatch ? 'cursor-pointer' : ''}`}
                  onClick={() => canWatch && setSelectedVideo(video)}
                >
                  <div className="flex items-center gap-4">
                    {/* Video thumbnail */}
                    <div className="relative w-20 h-14 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title || 'Vídeo'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                          <div className="text-2xl">🎬</div>
                        </div>
                      )}
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
                        {formatDuration(video.duration_seconds)}
                      </div>

                      {watchedToday && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="text-green-400 text-xs font-bold">✓</div>
                        </div>
                      )}

                      {!canWatchMoreVideos && !watchedToday && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="text-red-400 text-xs font-bold">!</div>
                        </div>
                      )}
                    </div>

                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm truncate">
                            {video.title || 'Título não disponível'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-green-400 font-bold text-sm">R$ 2.00</span>
                            {video.question && (
                              <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-0.5">
                                <Shield className="w-3 h-3 text-yellow-400" />
                                <span className="text-yellow-400 text-xs font-medium">Quiz</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="mt-2">
                        {watchedToday ? (
                          <span className="text-gray-400 text-xs">✓ Assistido hoje</span>
                        ) : !canWatchMoreVideos ? (
                          <span className="text-red-400 text-xs">Limite atingido</span>
                        ) : (
                          <span className="text-green-400 text-xs">Disponível</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    {canWatch && (
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onEarningsUpdate={handleVideoWatch}
        />
      )}
    </div>
  );
}
