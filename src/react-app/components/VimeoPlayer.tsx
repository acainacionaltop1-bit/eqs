import { useRef, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface VimeoPlayerProps {
  vimeoUrl: string;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: any) => void;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function VimeoPlayer({
  vimeoUrl,
  onLoadStart,
  onCanPlay,
  onError,
  className = '',
  autoPlay = false,
  muted = true,
  controls = true
}: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract Vimeo ID from URL
  const extractVimeoId = (url: string): string | null => {
    const regex = /(?:vimeo\.com\/(?:channels\/|groups\/.*\/videos\/|.*\/|video\/|.*#|.*))?(\d+)(?:$|\/|\?|#)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const vimeoId = extractVimeoId(vimeoUrl);

  useEffect(() => {
    if (!vimeoId) {
      setHasError(true);
      setErrorMessage('URL do Vimeo inválida');
      onError?.(new Error('Invalid Vimeo URL'));
      return;
    }

    onLoadStart?.();
    setIsLoading(true);
    setHasError(false);

    // Set a timeout to automatically hide loading after iframe should have loaded
    const loadTimeout = setTimeout(() => {
      setIsLoading(false);
      onCanPlay?.();
    }, 3000);

    return () => {
      clearTimeout(loadTimeout);
    };
  }, [vimeoId]);

  if (hasError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center text-white ${className}`}>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro no Vídeo</h3>
          <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
          <p className="text-xs text-gray-500 break-all">URL: {vimeoUrl}</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!vimeoId) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center text-white ${className}`}>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">URL Inválida</h3>
          <p className="text-gray-400 text-sm">Por favor, forneça uma URL válida do Vimeo</p>
        </div>
      </div>
    );
  }

  // Build Vimeo embed URL with parameters
  const embedUrl = new URL(`https://player.vimeo.com/video/${vimeoId}`);
  if (autoPlay) embedUrl.searchParams.set('autoplay', '1');
  if (muted) embedUrl.searchParams.set('muted', '1');
  if (!controls) embedUrl.searchParams.set('controls', '0');
  embedUrl.searchParams.set('responsive', '1');
  embedUrl.searchParams.set('dnt', '1'); // Do not track
  embedUrl.searchParams.set('title', '0'); // Hide title
  embedUrl.searchParams.set('byline', '0'); // Hide byline
  embedUrl.searchParams.set('portrait', '0'); // Hide portrait

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="flex flex-col items-center text-white">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Carregando vídeo do Vimeo...</p>
          </div>
        </div>
      )}

      {/* Vimeo embed iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl.toString()}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo Video Player"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
          onCanPlay?.();
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage('Erro ao carregar vídeo do Vimeo');
          onError?.(new Error('Failed to load Vimeo video'));
        }}
      />
    </div>
  );
}
