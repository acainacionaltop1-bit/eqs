import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import VideoQuestionModal from './VideoQuestionModal';
import GenericVideoPlayer from './GenericVideoPlayer';
import type { Video } from '@/shared/types';

interface VideoModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onEarningsUpdate: () => void;
}

export default function VideoModal({ video, isOpen, onClose, onEarningsUpdate }: VideoModalProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [hasWatchedComplete, setHasWatchedComplete] = useState(false);
  const { watchVideo } = useApi();

  useEffect(() => {
    if (!isOpen) {
      setIsWatching(false);
      setWatchProgress(0);
      setShowQuestion(false);
      setHasWatchedComplete(false);
    }
  }, [isOpen]);

  const handleStartWatching = () => {
    setIsWatching(true);
    
    // Simulate video progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / (video.duration_seconds || 30); // Progress based on video duration
      setWatchProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setHasWatchedComplete(true);
        
        // If video has question, show it. Otherwise complete watching.
        if (video.question) {
          setShowQuestion(true);
        } else {
          handleCompleteWatching();
        }
      }
    }, 1000); // Update every second
  };

  const handleCompleteWatching = async (questionAnswer?: string) => {
    try {
      await watchVideo({ 
        video_id: video.id, 
        question_answer: questionAnswer 
      });
      onEarningsUpdate();
      onClose();
    } catch (error) {
      console.error('Error completing video watch:', error);
      alert('Erro ao processar o vídeo. Tente novamente.');
    }
  };

  

  const renderVideoPlayer = () => {
    // Support all video platforms
    if (video.video_url) {
      return (
        <div className="w-full h-full rounded-xl overflow-hidden bg-black">
          <GenericVideoPlayer
            videoUrl={video.video_url}
            videoPlatform={video.video_platform || 'generic'}
            className="w-full h-full"
            onLoadStart={() => {
              // Video loading started
            }}
            onCanPlay={() => {
              // Video can play
            }}
            onError={(e) => {
              console.error('Video failed to load:', video.video_url, e);
            }}
            controls={true}
            muted={false}
            autoPlay={isWatching}
            showPlayer={isWatching}
          />
        </div>
      );
    }

    // Fallback if no video source is available
    return (
      <div className="w-full h-full bg-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <Play className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Vídeo não disponível</p>
        <p className="text-sm text-center max-w-md">
          URL do vídeo não encontrada. Verifique se o vídeo foi configurado corretamente.
        </p>
      </div>
    );
  };

  // Removed unused getPlatformInfo function

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white">{video.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-green-400 font-medium">Assista e ganhe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Video player */}
              <div className="h-[300px] sm:h-[350px] md:min-h-[500px] lg:min-h-[600px] xl:min-h-[700px] 2xl:min-h-[800px]">
                {isWatching ? (
                  renderVideoPlayer()
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center text-gray-400">
                        <div className="text-6xl mb-4">🎬</div>
                        <div className="text-lg">Vídeo Disponível</div>
                      </div>
                    )}
                    
                    {/* Overlay escuro com informações */}
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <h3 className="text-xl font-bold mb-2">Pronto para Assistir</h3>
                        <p className="text-gray-300 text-sm mb-4">Clique em "Assistir e Ganhar" para começar</p>
                        
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Watch progress e controles */}
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
                {/* Mobile-first layout */}
                <div className="block sm:hidden space-y-4">
                  {/* Botão principal - mobile */}
                  {!isWatching ? (
                    <button
                      onClick={handleStartWatching}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 text-lg"
                    >
                      Assistir e Ganhar
                    </button>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white">
                        {hasWatchedComplete ? '✅ Vídeo Completo!' : 'Assistindo Vídeo...'}
                      </h3>
                    </div>
                  )}
                  
                  {/* Informações - mobile */}
                  <div className="flex items-center justify-center gap-6 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-400">R$ 2.00</div>
                      <div className="text-xs text-gray-400">Recompensa</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-white">
                        {Math.floor((video.duration_seconds || 0) / 60)}:{((video.duration_seconds || 0) % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400">Duração</div>
                    </div>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {!isWatching ? (
                      <button
                        onClick={handleStartWatching}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-500/25"
                      >
                        Assistir e Ganhar
                      </button>
                    ) : (
                      <h3 className="text-lg font-bold text-white">
                        {hasWatchedComplete ? '✅ Vídeo Completo!' : 'Assistindo Vídeo...'}
                      </h3>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">R$ 2.00</div>
                    <div className="text-sm text-gray-400">
                      Duração: {Math.floor((video.duration_seconds || 0) / 60)}:{((video.duration_seconds || 0) % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>

                {isWatching && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {hasWatchedComplete ? 'Concluído!' : 'Aguarde para ganhar seu prêmio'}
                      </span>
                      <span className="text-white">{Math.round(watchProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(watchProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {hasWatchedComplete && !video.question && (
                  <div className="mt-4 text-center">
                    <p className="text-green-400 font-medium">
                      Parabéns! Você completou o vídeo!
                    </p>
                  </div>
                )}

                
              </div>
            </div>

                
          </div>
        </div>
      </div>

      {/* Question modal */}
      {showQuestion && video.question && (
        <VideoQuestionModal
          question={video.question}
          isOpen={showQuestion}
          onAnswer={(answer) => {
            setShowQuestion(false);
            handleCompleteWatching(answer);
          }}
          onClose={() => {
            setShowQuestion(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
