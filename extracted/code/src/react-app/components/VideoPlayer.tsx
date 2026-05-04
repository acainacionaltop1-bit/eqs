import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function VideoPlayer({
  src,
  poster,
  onLoadStart,
  onCanPlay,
  onError,
  onPlay,
  onPause,
  onEnded,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
      onLoadStart?.();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
      onCanPlay?.();
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      setHasError(true);
      const target = e.target as HTMLVideoElement;
      let message = 'Erro ao carregar vídeo';
      
      // Log detailed error information
      console.error('Video error occurred:', {
        src: target.src,
        error: target.error,
        networkState: target.networkState,
        readyState: target.readyState,
        currentTime: target.currentTime
      });
      
      if (target.error) {
        const errorCode = target.error.code;
        const errorMessage = target.error.message;
        
        console.error(`Video error code: ${errorCode}, message: ${errorMessage}`);
        
        switch (errorCode) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = 'Carregamento cancelado pelo usuário';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = 'Erro de conexão de rede. Tentando novamente...';
            // Auto-retry on network errors with exponential backoff
            setTimeout(() => {
              if (video && !video.paused && !video.ended) {
                setHasError(false);
                setIsLoading(true);
                video.load();
              }
            }, 3000);
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = 'Erro na decodificação do vídeo. Verifique se o formato é suportado.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'Formato do vídeo não suportado. Tente atualizar a página.';
            // Try to reload the video source after a delay
            setTimeout(() => {
              if (video && src) {
                setHasError(false);
                setIsLoading(true);
                video.src = '';
                video.load();
                setTimeout(() => {
                  video.src = src;
                  video.load();
                }, 1000);
              }
            }, 2000);
            break;
          default:
            message = `Erro no player: ${errorMessage || 'Tente recarregar a página'}`;
        }
      }
      
      setErrorMessage(message);
      onError?.(e);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [src]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        // Check if video is still in the document before playing
        if (document.contains(video)) {
          await video.play();
        } else {
          console.warn('Video element removed from document, skipping play');
        }
      }
    } catch (error: any) {
      console.error('Erro ao reproduzir:', error);
      
      // Handle specific play errors
      if (error.name === 'AbortError') {
        console.log('Play interrupted - video may have been removed or changed');
        return; // Don't show error for abort errors
      }
      
      if (error.name === 'NotSupportedError') {
        setHasError(true);
        setErrorMessage('Formato de vídeo não suportado neste navegador');
      } else if (error.name === 'NotAllowedError') {
        setErrorMessage('Reprodução bloqueada. Clique no vídeo para reproduzir.');
      } else {
        setHasError(true);
        setErrorMessage('Não foi possível reproduzir o vídeo. Tente novamente.');
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setVolume(video.muted ? 0 : video.volume);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = e.currentTarget;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    video.currentTime = newTime;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center text-white ${className}`}>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro no Vídeo</h3>
          <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
          <p className="text-xs text-gray-500 break-all">URL: {src}</p>
          <button
            onClick={() => {
              setHasError(false);
              videoRef.current?.load();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center text-white">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {/* Custom controls */}
      {controls && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div 
            className="w-full h-2 bg-gray-600 rounded-full mb-4 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-200"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              {/* Volume button */}
              <button
                onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-green-400 transition-colors"
              >
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* Time display */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-green-400 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large play button overlay when paused */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-110"
          >
            <Play className="w-10 h-10 text-white ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
