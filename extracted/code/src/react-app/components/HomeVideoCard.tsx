import { Play } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import GenericVideoPlayer from './GenericVideoPlayer';
import { ShimmerButton } from './ui/shimmer-button';
import type { Video } from '@/shared/types';

interface HomeVideoCardProps {
  video: Video;
}

export default function HomeVideoCard({ video }: HomeVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const navigate = useNavigate();

  const handleWatchAndEarn = () => {
    setIsPlaying(true);
    setVideoCompleted(false);
    setWatchProgress(0);
    
    // Simulate video progress and completion
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / (video.duration_seconds || 30); // Progress based on video duration
      setWatchProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setVideoCompleted(true);
      }
    }, 1000); // Update every second
  };

  const renderVideoPlayer = () => {
    // Support all video platforms
    if (video.video_url) {
      return (
        <GenericVideoPlayer
          videoUrl={video.video_url}
          videoPlatform={video.video_platform || 'generic'}
          className="w-full h-full"
          onLoadStart={() => {
            // Video loading started
          }}
          onCanPlay={() => {
            // Start progress tracking when video can play
            if (isPlaying && !videoCompleted) {
              handleWatchAndEarn();
            }
          }}
          onError={(e) => {
            console.error('Video failed to load:', video.video_url, e);
          }}
          controls={true}
          muted={false}
          autoPlay={isPlaying}
          showPlayer={isPlaying}
        />
      );
    }

    // Fallback if no video source is available
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/70 bg-black/40">
        <div className="text-4xl mb-4">🎬</div>
        <div className="text-lg font-medium mb-2">Vídeo não disponível</div>
        <div className="text-sm text-white/50 text-center max-w-md">
          URL do vídeo não encontrada.
        </div>
        {video.video_url && (
          <div className="text-xs text-white/40 mt-2 text-center max-w-md break-all">
            URL: {video.video_url}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-[1.02] group overflow-hidden animate-fade-in-up" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      animationDelay: '0.8s',
      animationFillMode: 'both'
    }}>
      {/* Header com ícone gradiente */}
      <div className="flex items-center justify-between mb-6 animate-slide-in-left" style={{
        animationDelay: '1s',
        animationFillMode: 'both'
      }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white mb-1 tracking-tight group-hover:text-green-400 transition-colors duration-300">Vídeo Disponível</h3>
            <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">Assista e ganhe</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center animate-slide-in-right" style={{
          animationDelay: '1.2s',
          animationFillMode: 'both'
        }}>
          <div className="text-white/70 text-sm mb-2 group-hover:text-white transition-colors duration-300">Recompensa</div>
          <div className="bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold text-xl px-6 py-3 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300 shadow-green-500/30">
            +R$ 2.00
          </div>
        </div>
      </div>

      {/* Video Player Area Integrado */}
      <div className="w-full bg-black/20 rounded-2xl relative overflow-hidden md:cursor-pointer group border border-white/10 mb-6 h-[280px] sm:h-[320px] md:h-[400px] lg:h-[500px] xl:h-[600px] 2xl:h-[700px] transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:shadow-green-500/20 animate-fade-in-up" style={{
        animationDelay: '1.4s',
        animationFillMode: 'both'
      }}>
        {/* Video Player */}
        {!isPlaying ? (
          <>
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center text-gray-400 group-hover:text-white transition-colors duration-300">
                <div className="text-6xl mb-4">🎬</div>
                <div className="text-lg animate-fade-in-up">Vídeo Disponível</div>
              </div>
            )}
            
            {/* Gradient overlay com animação */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
            
            {/* Desktop play button overlay */}
            <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-20 h-20 bg-green-500/90 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
            
            {/* Mobile overlay - sem botão de play */}
            <div className="absolute inset-0 bg-black/30 flex md:hidden items-center justify-center">
              <div className="text-center text-white animate-fade-in-up">
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-sm">Use o botão abaixo para assistir</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full animate-fade-in-up">
            {renderVideoPlayer()}
          </div>
        )}

        
      </div>

      

      {/* Watch Progress Bar (when watching) */}
      {isPlaying && !videoCompleted && (
        <div className="mb-6 animate-fade-in-up">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Assistindo vídeo...</span>
            <span className="text-white font-medium">{Math.round(watchProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(watchProgress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Watch and Earn Button (before watching) */}
      {!isPlaying && (
        <div className="animate-fade-in-up" style={{
          animationDelay: '1.6s',
          animationFillMode: 'both'
        }}>
          <ShimmerButton 
            onClick={handleWatchAndEarn}
            className="w-full py-4 sm:py-5 px-6 font-bold shadow-xl shadow-green-500/25 !text-white transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/40 text-base sm:text-lg" 
            background="linear-gradient(135deg, #22c55e, #10b981)" 
            borderRadius="24px" 
            shimmerColor="rgba(255,255,255,0.9)" 
            shimmerDuration="1.5s"
          >
            <span className="text-white font-bold">Assistir e Ganhar +R$ 2.00</span>
          </ShimmerButton>
        </div>
      )}

      {/* Video Completed Message */}
      {isPlaying && videoCompleted && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center animate-fade-in-up">
          <div className="text-green-400 font-semibold mb-2">🎉 Vídeo Concluído!</div>
          <p className="text-white/80 text-sm">Parabéns! Você assistiu o vídeo completo. Agora você pode resgatar sua recompensa!</p>
        </div>
      )}

      {/* Claim Reward Button (after watching) */}
      {videoCompleted && (
        <button 
          onClick={() => navigate('/cadastro')}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-500/25 text-base sm:text-lg hover:shadow-xl hover:shadow-green-500/40"
        >
          🎁 Resgatar Recompensa +R$ 2.00
        </button>
      )}

      {/* Question indicator */}
      {video.question && (
        <div className="mt-4 p-4 border border-yellow-500/30 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:border-yellow-500/50 hover:bg-yellow-500/5 animate-fade-in-up" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          animationDelay: '1.8s',
          animationFillMode: 'both'
        }}>
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <span>🤔</span>
            Este vídeo possui uma pergunta para responder
          </p>
        </div>
      )}
    </div>
  );
}
