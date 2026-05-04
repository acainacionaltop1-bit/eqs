import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/ui/dialog';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { FormField } from '@/react-app/components/ui/form-field';
import { Checkbox } from '@/react-app/components/ui/checkbox';
import { Badge } from '@/react-app/components/ui/badge';
import { useApi } from '@/react-app/hooks/useApi';
import { toast } from '@/react-app/components/ui/toast';
import { Video, UserCheck, Settings, Plus, Trash2, Eye, Monitor, RefreshCw } from 'lucide-react';

interface Video {
  id: number;
  title: string;
  description: string;
  duration_seconds: number;
  reward_amount: number;
  category: string;
  is_active: boolean;
  thumbnail_url?: string;
}

interface CustomVideo {
  id: number;
  video_id: number;
  video_title: string;
  video_reward: number;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
}

interface UserAvailableVideo {
  id: number;
  title: string;
  description: string;
  duration_seconds: number;
  reward_amount: number;
  category: string;
  is_custom: boolean;
  watch_count: number;
  last_watched: string | null;
}

interface UserCustomVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    daily_videos_watched: number;
    daily_limit: number;
    custom_daily_limit?: number;
    total_videos_watched: number;
    current_balance: number;
  };
}

export function UserCustomVideosModal({ isOpen, onClose, user }: UserCustomVideosModalProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [customVideos, setCustomVideos] = useState<CustomVideo[]>([]);
  const [userAvailableVideos, setUserAvailableVideos] = useState<UserAvailableVideo[]>([]);
  const [customDailyLimit, setCustomDailyLimit] = useState<string>(user.custom_daily_limit?.toString() || '');
  const [customVideoMode, setCustomVideoMode] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUserVideos, setShowUserVideos] = useState(false);
  
  const { apiCall } = useApi();
  // Using toast directly

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all videos
      const videosData = await apiCall<Video[]>('/admin/videos');
      setVideos(videosData.filter(v => v.is_active));
      
      // Fetch user's custom videos
      const customData = await apiCall<{
        custom_videos: CustomVideo[];
        settings: {
          custom_video_mode: boolean;
          notes: string;
        };
      }>(`/admin/users/${user.id}/custom-videos`);
      
      setCustomVideos(customData.custom_videos);
      setCustomVideoMode(customData.settings.custom_video_mode);
      setNotes(customData.settings.notes || '');
      
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAvailableVideos = async () => {
    try {
      setLoading(true);
      
      // Fetch videos available to this specific user
      const userVideosData = await apiCall<UserAvailableVideo[]>(`/admin/users/${user.id}/available-videos`);
      setUserAvailableVideos(userVideosData);
      
    } catch (error: any) {
      toast.error('Erro ao carregar vídeos do usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const customLimit = customDailyLimit ? parseInt(customDailyLimit) : null;
      
      await apiCall(`/admin/users/${user.id}/custom-settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          custom_daily_limit: customLimit,
          custom_video_mode: customVideoMode,
          notes: notes.trim()
        })
      });
      
      toast.success('Configurações salvas com sucesso!');
      
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignVideos = async () => {
    if (selectedVideoIds.size === 0) {
      toast.error('Selecione pelo menos um vídeo');
      return;
    }

    try {
      setSaving(true);
      
      await apiCall(`/admin/users/${user.id}/assign-videos`, {
        method: 'POST',
        body: JSON.stringify({
          video_ids: Array.from(selectedVideoIds)
        })
      });
      
      setSelectedVideoIds(new Set());
      await fetchData(); // Refresh data
      toast.success(`${selectedVideoIds.size} vídeo(s) atribuído(s) com sucesso!`);
      
    } catch (error: any) {
      toast.error('Erro ao atribuir vídeos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCustomVideo = async (customVideoId: number) => {
    try {
      await apiCall(`/admin/users/${user.id}/custom-videos/${customVideoId}`, {
        method: 'DELETE'
      });
      
      await fetchData(); // Refresh data
      toast.success('Vídeo removido com sucesso!');
      
    } catch (error: any) {
      toast.error('Erro ao remover vídeo: ' + error.message);
    }
  };

  const handleVideoSelection = (videoId: number, checked: boolean) => {
    const newSelection = new Set(selectedVideoIds);
    if (checked) {
      newSelection.add(videoId);
    } else {
      newSelection.delete(videoId);
    }
    setSelectedVideoIds(newSelection);
  };

  const assignedVideoIds = new Set(customVideos.filter(cv => cv.is_active).map(cv => cv.video_id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <UserCheck className="w-6 h-6 text-green-400" />
            Gerenciar Vídeos Personalizados - {user.name}
          </DialogTitle>
          <p className="text-sm text-gray-400">{user.email}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-400">Vídeos Hoje</p>
                <p className="text-lg font-bold text-white">
                  {user.daily_videos_watched}/{user.custom_daily_limit || user.daily_limit}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Total Assistidos</p>
                <p className="text-lg font-bold text-white">{user.total_videos_watched}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Saldo Atual</p>
                <p className="text-lg font-bold text-green-400">R$ {user.current_balance.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Vídeos Customizados</p>
                <p className="text-lg font-bold text-blue-400">{customVideos.filter(cv => cv.is_active).length}</p>
              </div>
            </div>

            {/* Custom Settings */}
            <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Configurações Personalizadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Limite Diário Personalizado">
                  <Input
                    type="number"
                    placeholder={`Padrão: ${user.daily_limit}`}
                    value={customDailyLimit}
                    onChange={(e) => setCustomDailyLimit(e.target.value)}
                    min="1"
                    max="100"
                  />
                </FormField>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="customVideoMode"
                    checked={customVideoMode}
                    onCheckedChange={setCustomVideoMode}
                  />
                  <label htmlFor="customVideoMode" className="text-sm text-white">
                    Modo vídeos exclusivos (usuário só vê vídeos atribuídos)
                  </label>
                </div>
              </div>

              <FormField label="Notas do Administrador">
                <textarea
                  className="w-full h-20 px-4 py-3 rounded-2xl border border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Notas sobre este usuário..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>

              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                variant="nextfund"
                className="w-full"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>

            {/* Current Custom Videos */}
            {customVideos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  Vídeos Atribuídos ({customVideos.filter(cv => cv.is_active).length})
                </h3>
                
                <div className="grid gap-3">
                  {customVideos.filter(cv => cv.is_active).map((customVideo) => (
                    <div key={customVideo.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{customVideo.video_title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span>Recompensa: R$ {customVideo.video_reward.toFixed(2)}</span>
                          <span>Atribuído: {new Date(customVideo.assigned_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleRemoveCustomVideo(customVideo.id)}
                        variant="destructive"
                        size="sm"
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Available Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-purple-400" />
                  Vídeos Disponíveis na Conta do Usuário
                </h3>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={fetchUserAvailableVideos}
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  
                  <Button
                    onClick={() => setShowUserVideos(!showUserVideos)}
                    variant="nextfund"
                    size="sm"
                  >
                    {showUserVideos ? 'Ocultar' : 'Visualizar'} Vídeos
                  </Button>
                </div>
              </div>

              {showUserVideos && (
                <div className="space-y-3">
                  {userAvailableVideos.length === 0 ? (
                    <div className="text-center p-8 bg-gray-800/30 rounded-lg border border-gray-700">
                      <Monitor className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">
                        {loading ? 'Carregando vídeos...' : 'Clique em "Visualizar Vídeos" para ver os vídeos disponíveis para este usuário'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Esta visualização mostra exatamente o que o usuário vê na sua conta
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-purple-900/20 border border-purple-600/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="w-5 h-5 text-purple-400" />
                          <h4 className="font-semibold text-white">Simulação da Conta do Usuário</h4>
                        </div>
                        <p className="text-sm text-gray-300">
                          Total de {userAvailableVideos.length} vídeo(s) visível(is) para {user.name || user.email}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
                          <div className="text-center">
                            <p className="text-purple-400 font-bold">
                              {userAvailableVideos.filter(v => v.is_custom).length}
                            </p>
                            <p className="text-gray-400">Customizados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-green-400 font-bold">
                              {userAvailableVideos.filter(v => !v.is_custom).length}
                            </p>
                            <p className="text-gray-400">Gerais</p>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-400 font-bold">
                              {userAvailableVideos.filter(v => v.watch_count > 0).length}
                            </p>
                            <p className="text-gray-400">Já Assistidos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-yellow-400 font-bold">
                              R$ {userAvailableVideos.reduce((sum, v) => sum + v.reward_amount, 0).toFixed(2)}
                            </p>
                            <p className="text-gray-400">Potencial Total</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 max-h-80 overflow-y-auto">
                        {userAvailableVideos.map((video) => (
                          <div
                            key={video.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              video.is_custom
                                ? 'bg-purple-900/20 border-purple-600/50'
                                : video.watch_count > 0
                                ? 'bg-green-900/20 border-green-600/50'
                                : 'bg-gray-800/30 border-gray-700'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{video.title}</h4>
                                {video.is_custom && (
                                  <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                                    Customizado
                                  </Badge>
                                )}
                                {video.watch_count > 0 && (
                                  <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                                    Assistido {video.watch_count}x
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span>⏱️ {Math.floor(video.duration_seconds / 60)}min</span>
                                <span>💰 R$ {video.reward_amount.toFixed(2)}</span>
                                {video.category && <span>📂 {video.category}</span>}
                                {video.last_watched && (
                                  <span>🕒 Último: {new Date(video.last_watched).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Assign New Videos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Atribuir Novos Vídeos
                </h3>
                
                {selectedVideoIds.size > 0 && (
                  <Button
                    onClick={handleAssignVideos}
                    disabled={saving}
                    variant="nextfund"
                    size="sm"
                  >
                    Atribuir {selectedVideoIds.size} Vídeo(s)
                  </Button>
                )}
              </div>

              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {videos.map((video) => {
                  const isAssigned = assignedVideoIds.has(video.id);
                  const isSelected = selectedVideoIds.has(video.id);
                  
                  return (
                    <div
                      key={video.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isAssigned
                          ? 'bg-green-900/20 border-green-600/50'
                          : isSelected
                          ? 'bg-blue-900/20 border-blue-600/50'
                          : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
                      }`}
                    >
                      {!isAssigned && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleVideoSelection(video.id, checked)}
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{video.title}</h4>
                          {isAssigned && (
                            <Badge variant="secondary" className="bg-green-600 text-white">
                              Já Atribuído
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span>⏱️ {Math.floor(video.duration_seconds / 60)}min</span>
                          <span>💰 R$ {video.reward_amount.toFixed(2)}</span>
                          {video.category && <span>📂 {video.category}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button onClick={onClose} variant="ghost">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
