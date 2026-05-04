import { useState, useEffect } from 'react';
import { X, Plus, Video, Search } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';

interface QuickVideoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userEmail: string;
  onSuccess: () => void;
}

interface VideoOption {
  id: number;
  title: string;
  description?: string;
  reward_amount: number;
  duration_seconds: number;
  category?: string;
  is_active: boolean;
}

export default function QuickVideoAssignModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  userEmail, 
  onSuccess 
}: QuickVideoAssignModalProps) {
  const [availableVideos, setAvailableVideos] = useState<VideoOption[]>([]);
  const [userVideos, setUserVideos] = useState<VideoOption[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { apiCall } = useApi();

  const loadVideos = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [allVideos, userAvailableVideos] = await Promise.all([
        apiCall<VideoOption[]>('/admin/videos'),
        apiCall<VideoOption[]>(`/admin/users/${userId}/available-videos`)
      ]);
      
      const userVideoIds = new Set(userAvailableVideos.map(v => v.id));
      const unassignedVideos = allVideos.filter(v => !userVideoIds.has(v.id) && v.is_active);
      
      setAvailableVideos(unassignedVideos);
      setUserVideos(userAvailableVideos);
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message || 'Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadVideos();
    }
  }, [isOpen, userId]);

  const handleClose = () => {
    setSelectedVideos([]);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  const handleAssignVideos = async () => {
    if (selectedVideos.length === 0) return;
    
    try {
      setAssigning(true);
      
      await apiCall(`/admin/users/${userId}/assign-videos`, {
        method: 'POST',
        body: JSON.stringify({ video_ids: selectedVideos })
      });
      
      setSelectedVideos([]);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error assigning videos:', err);
      setError('Erro ao atribuir vídeos: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const filteredVideos = availableVideos.filter(video =>
    !searchQuery || 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-green-400" />
              Atribuir Vídeos
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {userName || userEmail} • Tem {userVideos.length} vídeo(s) disponível(is)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vídeos por título, descrição ou categoria..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando vídeos disponíveis...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">❌</div>
              <h3 className="text-lg font-semibold text-white mb-2">Erro ao Carregar</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadVideos}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? 'Nenhum vídeo encontrado' : 'Todos os vídeos já estão atribuídos'}
              </h3>
              <p className="text-gray-400">
                {searchQuery 
                  ? 'Tente alterar os termos de busca'
                  : 'Este usuário já tem acesso a todos os vídeos disponíveis'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-blue-400 font-bold text-xl">{filteredVideos.length}</div>
                  <div className="text-gray-400 text-sm">Vídeos Disponíveis</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-green-400 font-bold text-xl">{selectedVideos.length}</div>
                  <div className="text-gray-400 text-sm">Selecionados</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-purple-400 font-bold text-xl">{userVideos.length}</div>
                  <div className="text-gray-400 text-sm">Já Tem Acesso</div>
                </div>
              </div>

              {/* Bulk Selection */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVideos(filteredVideos.map(v => v.id));
                      } else {
                        setSelectedVideos([]);
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-white font-medium">Selecionar todos os vídeos visíveis</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {filteredVideos.length} vídeo(s) disponível(is)
                </span>
              </div>

              {/* Video List */}
              <div className="space-y-2">
                {filteredVideos.map((video) => (
                  <label key={video.id} className="flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVideos([...selectedVideos, video.id]);
                        } else {
                          setSelectedVideos(selectedVideos.filter(id => id !== video.id));
                        }
                      }}
                      className="rounded"
                    />
                    
                    {/* Video thumbnail placeholder */}
                    <div className="w-16 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{video.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="text-green-400 font-medium">R$ {video.reward_amount.toFixed(2)}</span>
                        <span>{formatDuration(video.duration_seconds)}</span>
                        {video.category && <span>{video.category}</span>}
                      </div>
                      {video.description && (
                        <p className="text-gray-500 text-sm mt-1 truncate">{video.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedVideos.length > 0 && (
                <span>
                  {selectedVideos.length} vídeo(s) selecionado(s) • 
                  R$ {filteredVideos
                    .filter(v => selectedVideos.includes(v.id))
                    .reduce((sum, v) => sum + v.reward_amount, 0)
                    .toFixed(2)} em recompensas
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignVideos}
                disabled={selectedVideos.length === 0 || assigning}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {assigning ? 'Atribuindo...' : `Atribuir ${selectedVideos.length} Vídeo(s)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
