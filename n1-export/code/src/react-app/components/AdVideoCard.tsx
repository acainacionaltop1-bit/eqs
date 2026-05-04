import { Play, Timer, Shield } from 'lucide-react';
import type { Video } from '@/shared/types';

interface AdVideoCardProps {
  video?: Video;
  onClick?: () => void;
}

export default function AdVideoCard({ video, onClick }: AdVideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const duration = video?.duration_seconds || 30;
  const title = video?.title || 'Vídeo Disponível';

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm line-clamp-1" title={title}>
              {title.length > 25 ? `${title.substring(0, 25)}...` : title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs">{formatDuration(duration)}</span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-white/60 text-xs">🎯 Vídeo</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {video?.question && (
            <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-1">
              <Shield className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 text-xs font-medium">Quiz</span>
            </div>
          )}
          
        </div>
      </div>

      {/* Video Preview */}
      <div 
        className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden group md:cursor-pointer"
        onClick={onClick}
        style={video?.thumbnail_url ? {
          backgroundImage: `url(${video.thumbnail_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex items-center justify-between text-white/80 text-xs">
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded px-2 py-1">
              <span className="text-xs">🎯</span>
              <span>Vídeo</span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded px-2 py-1">
              <Timer className="w-3 h-3" />
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      

      {/* Action Button */}
      <button 
        onClick={onClick}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-500/25 text-sm sm:text-base"
      >
        Assistir e Ganhar +R$ 2.00
      </button>
    </div>
  );
}
