import { useState, useEffect } from 'react';
import { X, Play, Shield, Eye } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import type { Video } from '@/shared/types';

interface UserVideosViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userEmail: string;
}

interface UserVideoInfo extends Video {
  watch_count?: number;
  last_watched?: string;
  is_custom?: boolean;
  is_available?: boolean;
}

interface AvailableVideoInfo {
  id: number;
  title: string;
  description?: string;
  duration_seconds: number;
  reward_amount: number;
  category?: string;
  is_custom: boolean;
  watch_count: number;
  last_watched?: string;
}

export default function UserVideosViewModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  userEmail 
}: UserVideosViewModalProps) {
  const [userVideos, setUserVideos] = useState<UserVideoInfo[]>([]);
  const [availableVideos, setAvailableVideos] = useState<AvailableVideoInfo[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningVideos, setAssigningVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'watched'>('available');
  const [selectedVideosToAssign, setSelectedVideosToAssign] = useState<number[]>([]);
  const { apiCall } = useApi();

  const loadUserVideos = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get available videos for this user (what they can see in their account)
      const [availableVids, watchedVids, allVids] = await Promise.all([
        apiCall<AvailableVideoInfo[]>(`/admin/users/${userId}/available-videos`),
        apiCall<UserVideoInfo[]>(`/admin/users/${userId}/videos`),
        apiCall<any[]>('/admin/videos')
      ]);
      
      setAvailableVideos(availableVids || []);
      setUserVideos(watchedVids || []);
      setAllVideos(allVids || []);
    } catch (err: any) {
      console.error('Error loading user videos:', err);
      setError(err.message || 'Erro ao carregar vídeos do usuário');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadUserVideos();
    }
  }, [isOpen, userId]);

  const handleClose = () => {
    setUserVideos([]);
    setAvailableVideos([]);
    setAllVideos([]);
    setSelectedVideosToAssign([]);
    setError(null);
    onClose();
  };

  const assignVideosToUser = async () => {
    if (selectedVideosToAssign.length === 0) return;
    
    try {
      setAssigningVideos(true);
      
      await apiCall(`/admin/users/${userId}/assign-videos`, {
        method: 'POST',
        body: JSON.stringify({ video_ids: selectedVideosToAssign })
      });
      
      // Reload videos after assignment
      await loadUserVideos();
      setSelectedVideosToAssign([]);
      
      alert(`${selectedVideosToAssign.length} vídeo(s) atribuído(s) com sucesso!`);
    } catch (err: any) {
      console.error('Error assigning videos:', err);
      alert('Erro ao atribuir vídeos: ' + err.message);
    } finally {
      setAssigningVideos(false);
    }
  };

  const getUnassignedVideos = () => {
    const assignedVideoIds = new Set(availableVideos.map(v => v.id));
    return allVideos.filter(v => !assignedVideoIds.has(v.id) && v.is_active);
  };

  

  const customVideos = availableVideos.filter(v => v.is_custom);
  const generalVideos = availableVideos.filter(v => !v.is_custom);
  const totalWatchedVideos = availableVideos.filter(v => (v.watch_count || 0) > 0).length;
  const totalAvailableVideos = availableVideos.length;
  const totalRewardValue = availableVideos.reduce((sum, v) => sum + (v.reward_amount || 2), 0);
  const unassignedVideos = getUnassignedVideos();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Vídeos do Usuário</h2>
            <p className="text-gray-400 text-sm mt-1">
              {userName || userEmail} • ID: {userId}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'available' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📱 Vídeos Disponíveis ({totalAvailableVideos})
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'watched' 
                ? 'text-green-400 border-b-2 border-green-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👁️ Histórico de Assistidos ({userVideos.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando vídeos do usuário...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">❌</div>
              <h3 className="text-lg font-semibold text-white mb-2">Erro ao Carregar</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadUserVideos}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'available' ? (
                <AvailableVideosTab 
                  availableVideos={availableVideos}
                  customVideos={customVideos}
                  generalVideos={generalVideos}
                  totalRewardValue={totalRewardValue}
                  totalWatchedVideos={totalWatchedVideos}
                  unassignedVideos={unassignedVideos}
                  selectedVideosToAssign={selectedVideosToAssign}
                  setSelectedVideosToAssign={setSelectedVideosToAssign}
                  assignVideosToUser={assignVideosToUser}
                  assigningVideos={assigningVideos}
                />
              ) : (
                <WatchedVideosTab userVideos={userVideos} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {activeTab === 'available' 
                ? `${totalAvailableVideos} vídeos disponíveis • ${totalWatchedVideos} já assistidos`
                : `${userVideos.length} vídeos assistidos`
              }
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadUserVideos}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {loading ? 'Carregando...' : 'Atualizar'}
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Available Videos Tab Component
function AvailableVideosTab({ 
  availableVideos, 
  customVideos, 
  generalVideos, 
  totalRewardValue, 
  totalWatchedVideos,
  unassignedVideos,
  selectedVideosToAssign,
  setSelectedVideosToAssign,
  assignVideosToUser,
  assigningVideos
}: {
  availableVideos: AvailableVideoInfo[];
  customVideos: AvailableVideoInfo[];
  generalVideos: AvailableVideoInfo[];
  totalRewardValue: number;
  totalWatchedVideos: number;
  unassignedVideos: any[];
  selectedVideosToAssign: number[];
  setSelectedVideosToAssign: (videos: number[]) => void;
  assignVideosToUser: () => void;
  assigningVideos: boolean;
}) {
  const [showAddVideos, setShowAddVideos] = useState(false);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400">{availableVideos.length}</div>
          <div className="text-sm text-gray-400">Vídeos Disponíveis</div>
          <div className="text-xs text-gray-500 mt-1">Na conta do usuário</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{customVideos.length}</div>
          <div className="text-sm text-gray-400">Vídeos Customizados</div>
          <div className="text-xs text-gray-500 mt-1">Atribuídos especificamente</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{totalWatchedVideos}</div>
          <div className="text-sm text-gray-400">Já Assistidos</div>
          <div className="text-xs text-gray-500 mt-1">Progresso atual</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">R$ {totalRewardValue.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Valor Total</div>
          <div className="text-xs text-gray-500 mt-1">Potencial de ganhos</div>
        </div>
      </div>

      {/* Problem Indicator */}
      {availableVideos.length < 10 && (
        <div className="bg-orange-900/30 border border-orange-600/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-orange-400 text-2xl">⚠️</div>
            <div>
              <h4 className="text-orange-300 font-semibold">Poucos Vídeos Disponíveis</h4>
              <p className="text-orange-100 text-sm">
                Este usuário tem apenas {availableVideos.length} vídeo(s) disponível(is). 
                Considere atribuir mais vídeos para melhorar a experiência.
              </p>
            </div>
            <button
              onClick={() => setShowAddVideos(true)}
              className="ml-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              + Adicionar Vídeos
            </button>
          </div>
        </div>
      )}

      {/* Add Videos Section */}
      {(showAddVideos || selectedVideosToAssign.length > 0) && unassignedVideos.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">Adicionar Vídeos ao Usuário</h4>
            <div className="flex gap-2">
              {selectedVideosToAssign.length > 0 && (
                <button
                  onClick={assignVideosToUser}
                  disabled={assigningVideos}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {assigningVideos ? 'Atribuindo...' : `Atribuir ${selectedVideosToAssign.length} Vídeo(s)`}
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddVideos(false);
                  setSelectedVideosToAssign([]);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {unassignedVideos.map((video) => (
              <label key={video.id} className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVideosToAssign.includes(video.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedVideosToAssign([...selectedVideosToAssign, video.id]);
                    } else {
                      setSelectedVideosToAssign(selectedVideosToAssign.filter(id => id !== video.id));
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">{video.title}</div>
                  <div className="text-gray-400 text-xs">R$ {video.reward_amount.toFixed(2)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Custom Videos Section */}
      {customVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Vídeos Customizados ({customVideos.length})
          </h3>
          <div className="space-y-3">
            {customVideos.map((video) => (
              <AvailableVideoCard key={`custom-${video.id}`} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* General Videos Section */}
      {generalVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-400" />
            Vídeos Gerais ({generalVideos.length})
          </h3>
          <div className="space-y-3">
            {generalVideos.map((video) => (
              <AvailableVideoCard key={`general-${video.id}`} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* No Videos */}
      {availableVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Vídeo Disponível</h3>
          <p className="text-gray-400 mb-4">
            Este usuário não tem vídeos disponíveis no momento.
          </p>
          {unassignedVideos.length > 0 && (
            <button
              onClick={() => setShowAddVideos(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Atribuir Vídeos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Watched Videos Tab Component
function WatchedVideosTab({ userVideos }: { userVideos: UserVideoInfo[] }) {
  if (userVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👁️</div>
        <h3 className="text-xl font-bold text-white mb-2">Nenhum Vídeo Assistido</h3>
        <p className="text-gray-400">Este usuário ainda não assistiu nenhum vídeo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-lg text-center">
          <div className="text-purple-400 font-bold text-2xl">
            {userVideos.length}
          </div>
          <div className="text-gray-400 text-sm">Vídeos Assistidos</div>
        </div>
        <div className="bg-white/5 p-4 rounded-lg text-center">
          <div className="text-green-400 font-bold text-2xl">
            R$ {userVideos.reduce((sum, v) => sum + (v.reward_amount || 0), 0).toFixed(2)}
          </div>
          <div className="text-gray-400 text-sm">Total Ganho</div>
        </div>
        <div className="bg-white/5 p-4 rounded-lg text-center">
          <div className="text-blue-400 font-bold text-2xl">
            {userVideos.filter(v => v.watch_count && v.watch_count > 0).length}
          </div>
          <div className="text-gray-400 text-sm">Únicos Assistidos</div>
        </div>
      </div>

      {/* Lista de vídeos assistidos */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-white/10 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-white">Vídeo</th>
                <th className="px-4 py-3 text-left text-white">Ganhos</th>
                <th className="px-4 py-3 text-left text-white">Data</th>
                <th className="px-4 py-3 text-left text-white">Quiz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {userVideos.map((video, index) => (
                <tr key={index} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 bg-gray-700 rounded flex items-center justify-center text-gray-400">
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-medium line-clamp-1">
                          {video.title || 'Título não disponível'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {video.video_platform || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-green-400 font-bold">
                      R$ {(video.reward_amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white">
                      {video.last_watched ? new Date(video.last_watched).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Available Video Card Component
function AvailableVideoCard({ video }: { video: AvailableVideoInfo }) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="relative w-20 h-14 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
            <Play className="w-6 h-6" />
          </div>
          
          {/* Duration badge */}
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
            {formatDuration(video.duration_seconds)}
          </div>

          {/* Watch status */}
          {(video.watch_count || 0) > 0 && (
            <div className="absolute top-1 left-1 bg-green-500/90 text-white text-xs px-1 py-0.5 rounded">
              ✓ {video.watch_count}x
            </div>
          )}

          {/* Custom badge */}
          {video.is_custom && (
            <div className="absolute top-1 right-1 bg-blue-500/90 text-white text-xs px-1 py-0.5 rounded">
              C
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate mb-1">
            {video.title}
          </h4>
          
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="text-green-400 font-medium">R$ {video.reward_amount.toFixed(2)}</span>
            <span>{video.category || 'Geral'}</span>
          </div>

          {/* Description */}
          {video.description && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {video.description}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="text-center">
          {(video.watch_count || 0) > 0 ? (
            <div className="text-green-400">
              <Eye className="w-5 h-5 mx-auto" />
              <div className="text-xs mt-1">Assistido</div>
            </div>
          ) : (
            <div className="text-gray-400">
              <Play className="w-5 h-5 mx-auto" />
              <div className="text-xs mt-1">Disponível</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


