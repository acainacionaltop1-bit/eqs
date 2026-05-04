import { useRef, useEffect, useState, useMemo } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface GenericVideoPlayerProps {
  videoUrl: string;
  videoPlatform?: string;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: any) => void;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  showPlayer?: boolean;
}

export default function GenericVideoPlayer({
  videoUrl,
  videoPlatform = 'generic',
  onLoadStart,
  onCanPlay,
  onError,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true,
  showPlayer = true
}: GenericVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract video ID and build embed URL based on platform
  const getEmbedInfo = (url: string, platform: string) => {
    try {
      
      switch (platform) {
        case 'youtube': {
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const match = url.match(youtubeRegex);
          if (match) {
            const videoId = match[1];
            const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
            if (autoPlay) {
              embedUrl.searchParams.set('autoplay', '1');
              if (muted) embedUrl.searchParams.set('mute', '1');
            }
            if (muted) embedUrl.searchParams.set('mute', '1');
            if (!controls) embedUrl.searchParams.set('controls', '0');
            embedUrl.searchParams.set('rel', '0');
            return { embedUrl: embedUrl.toString(), canEmbed: true };
          }
          break;
        }
        
        case 'vimeo': {
          const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
          const match = url.match(vimeoRegex);
          if (match) {
            const videoId = match[1];
            const embedUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
            if (autoPlay) {
              embedUrl.searchParams.set('autoplay', '1');
              if (muted) embedUrl.searchParams.set('muted', '1');
            }
            if (muted) embedUrl.searchParams.set('muted', '1');
            // Remove watermark and clean up player
            embedUrl.searchParams.set('title', '0');
            embedUrl.searchParams.set('byline', '0');
            embedUrl.searchParams.set('portrait', '0');
            embedUrl.searchParams.set('color', 'ffffff');
            embedUrl.searchParams.set('pip', '0');
            embedUrl.searchParams.set('transparent', '0');
            embedUrl.searchParams.set('responsive', '1');
            embedUrl.searchParams.set('dnt', '1');
            // Hide Vimeo branding and menu
            embedUrl.searchParams.set('badge', '0');
            embedUrl.searchParams.set('autopause', '0');
            return { embedUrl: embedUrl.toString(), canEmbed: true };
          }
          break;
        }
        
        case 'dailymotion': {
          const dmRegex = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/;
          const match = url.match(dmRegex);
          if (match) {
            const videoId = match[1];
            const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
            return { embedUrl, canEmbed: true };
          }
          break;
        }
        
        default: {
          // For generic URLs, try to embed directly
          // Some platforms might work, others might not due to X-Frame-Options
          return { embedUrl: url, canEmbed: false };
        }
      }
      
      return { embedUrl: url, canEmbed: false };
    } catch (error) {
      return { embedUrl: url, canEmbed: false };
    }
  };

  const { embedUrl, canEmbed } = useMemo(() => getEmbedInfo(videoUrl, videoPlatform), [videoUrl, videoPlatform]);

  useEffect(() => {
    onLoadStart?.();
    setIsLoading(true);
    setHasError(false);

    // Set a timeout to automatically hide loading
    const loadTimeout = setTimeout(() => {
      setIsLoading(false);
      onCanPlay?.();
    }, 3000);

    return () => {
      clearTimeout(loadTimeout);
    };
  }, [embedUrl]);

  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return { name: 'YouTube', icon: '📺', color: 'text-red-400' };
      case 'vimeo':
        return { name: 'Vimeo', icon: '🎭', color: 'text-blue-400' };
      case 'dailymotion':
        return { name: 'Dailymotion', icon: '🎯', color: 'text-orange-400' };
      case 'twitch':
        return { name: 'Twitch', icon: '🎮', color: 'text-purple-400' };
      case 'tiktok':
        return { name: 'TikTok', icon: '🎵', color: 'text-pink-400' };
      case 'instagram':
        return { name: 'Instagram', icon: '📸', color: 'text-pink-400' };
      case 'facebook':
        return { name: 'Facebook', icon: '👥', color: 'text-blue-400' };
      case 'streamable':
        return { name: 'Streamable', icon: '📹', color: 'text-green-400' };
      default:
        return { name: 'Vídeo Externo', icon: '🎬', color: 'text-gray-400' };
    }
  };

  const platformInfo = getPlatformInfo(videoPlatform);

  // If showPlayer is false, don't render the actual player
  if (!showPlayer) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center text-white ${className}`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">{platformInfo.icon}</div>
          <h3 className="text-lg font-medium mb-2">Vídeo Pronto</h3>
          <p className="text-gray-400 text-sm">Use o botão "Assistir e Ganhar" para começar</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center text-white ${className}`}>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro no Vídeo</h3>
          <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
          <p className="text-xs text-gray-500 break-all mb-4">URL: {videoUrl}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                window.location.reload();
              }}
              className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Tentar Novamente
            </button>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em Nova Aba
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="flex flex-col items-center text-white">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Video embed iframe */}
      {canEmbed ? (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          title={`${platformInfo.name} Video Player`}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
            onCanPlay?.();
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            setErrorMessage(`Erro ao carregar vídeo do ${platformInfo.name}`);
            onError?.(new Error(`Failed to load ${platformInfo.name} video`));
          }}
        />
      ) : (
        // Fallback for non-embeddable videos
        <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-800">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">{platformInfo.icon}</div>
            <h3 className="text-lg font-medium mb-2">Vídeo Externo</h3>
            <p className="text-gray-400 text-sm mb-4">
              Este vídeo não pode ser incorporado diretamente.
            </p>
            <p className="text-gray-500 text-xs mb-6 break-all">
              {videoUrl}
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
              onClick={() => {
                setIsLoading(false);
                onCanPlay?.();
              }}
            >
              <ExternalLink className="w-5 h-5" />
              Assistir no {platformInfo.name}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
