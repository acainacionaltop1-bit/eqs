import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash, ExternalLink, X, Send } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/react-app/components/ui/dialog';
import { Input } from '@/react-app/components/ui/input';
import { FormField } from '@/react-app/components/ui/form-field';
import { toast } from '@/react-app/components/ui/toast';

interface VipGroup {
  id: number;
  name: string;
  platform: 'whatsapp' | 'telegram';
  invite_link: string;
  description: string;
  vip_level_required: number;
  is_active: boolean;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

interface VipGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipGroupsModal = ({ isOpen, onClose }: VipGroupsModalProps) => {
  const [groups, setGroups] = useState<VipGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<VipGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    platform: 'whatsapp' as 'whatsapp' | 'telegram',
    invite_link: '',
    description: '',
    vip_level_required: 1,
    is_active: true
  });

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vip-groups', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        console.error('Failed to load VIP groups');
      }
    } catch (error) {
      console.error('Error loading VIP groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      platform: 'whatsapp',
      invite_link: '',
      description: '',
      vip_level_required: 1,
      is_active: true
    });
    setEditingGroup(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.invite_link.trim()) {
      toast.error('Nome e link do convite são obrigatórios');
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = editingGroup 
        ? `/api/admin/vip-groups/${editingGroup.id}`
        : '/api/admin/vip-groups';
      
      const method = editingGroup ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Grupo ${editingGroup ? 'atualizado' : 'criado'} com sucesso!`);
        resetForm();
        loadGroups();
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (group: VipGroup) => {
    setFormData({
      name: group.name,
      platform: group.platform,
      invite_link: group.invite_link,
      description: group.description,
      vip_level_required: group.vip_level_required,
      is_active: group.is_active
    });
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDelete = async (groupId: number, groupName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o grupo "${groupName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vip-groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Grupo deletado com sucesso!');
        loadGroups();
      } else {
        const error = await response.json();
        toast.error(`Erro ao deletar: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const handleToggleStatus = async (groupId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/vip-groups/${groupId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(`Grupo ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
        loadGroups();
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'whatsapp') {
      return '💚';
    } else {
      return <Send className="w-5 h-5 text-blue-400" />;
    }
  };

  const getPlatformName = (platform: string) => {
    return platform === 'whatsapp' ? 'WhatsApp' : 'Telegram';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-black border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-green-400 flex items-center gap-3">
            <Users className="w-6 h-6 text-green-400" />
            Gerenciar Grupos VIP
          </DialogTitle>
          <DialogDescription className="text-green-300">
            Gerencie os grupos do WhatsApp e Telegram para todos os usuários
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Header with create button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-green-400">
                Grupos Ativos ({groups.filter(g => g.is_active).length})
              </h3>
              <div className="text-sm text-green-300">
                Total: {groups.length}
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Grupo
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              💎 Como Usar
            </h4>
            <div className="space-y-1 text-green-300 text-sm">
              <p>• <strong>Acesso:</strong> Todos os usuários cadastrados podem acessar os grupos</p>
              <p>• <strong>WhatsApp:</strong> Use links como https://chat.whatsapp.com/invite-code</p>
              <p>• <strong>Telegram:</strong> Use links como https://t.me/+invite-code ou @groupname</p>
              <p>• <strong>Usuários veem:</strong> Grupos aparecem na área VIP do perfil quando ativos</p>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-green-400">
                  {editingGroup ? 'Editar Grupo' : 'Criar Novo Grupo'}
                </h4>
                <Button
                  onClick={resetForm}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nome do Grupo" required>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: VIP Elite, Grupo Premium..."
                      required
                    />
                  </FormField>

                  <FormField label="Plataforma" required>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value as 'whatsapp' | 'telegram' }))}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-green-300 focus:border-green-400"
                      required
                    >
                      <option value="whatsapp">💚 WhatsApp</option>
                      <option value="telegram">📱 Telegram</option>
                    </select>
                  </FormField>

                  <FormField label="Link de Convite" required>
                    <Input
                      value={formData.invite_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, invite_link: e.target.value }))}
                      placeholder={formData.platform === 'whatsapp' 
                        ? 'https://chat.whatsapp.com/...' 
                        : 'https://t.me/... ou @groupname'
                      }
                      required
                    />
                  </FormField>

                  <FormField label="Tipo de Acesso">
                    <select
                      value={formData.vip_level_required}
                      onChange={(e) => setFormData(prev => ({ ...prev, vip_level_required: parseInt(e.target.value) }))}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-green-300 focus:border-green-400"
                    >
                      <option value={0}>🌟 Todos os Usuários</option>
                    </select>
                    <div className="text-sm text-green-300 mt-1">
                      Todos os usuários cadastrados podem acessar este grupo
                    </div>
                  </FormField>

                  <FormField label="Descrição" className="md:col-span-2">
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do grupo (opcional)"
                    />
                  </FormField>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-green-300 text-sm">Grupo ativo</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    {submitting ? 'Salvando...' : editingGroup ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Groups List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3 text-green-300">Carregando grupos...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Nenhum grupo criado</h3>
                <p className="text-green-300 mb-4">
                  Crie seu primeiro grupo VIP para conectar usuários premium
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Criar Primeiro Grupo
                </Button>
              </div>
            ) : (
              groups.map((group) => (
                <div 
                  key={group.id} 
                  className={`bg-gray-800/50 p-6 rounded-xl border transition-all ${
                    group.is_active 
                      ? 'border-gray-600 bg-gray-700/50' 
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center text-2xl">
                        {getPlatformIcon(group.platform)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-green-400 font-bold text-lg">{group.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            group.is_active 
                              ? 'bg-gray-600/50 text-gray-300' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {group.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="px-2 py-1 bg-gray-600/50 text-gray-300 rounded-full text-xs">
                            {getPlatformName(group.platform)}
                          </span>
                          <span className="px-2 py-1 bg-gray-600/50 text-gray-300 rounded-full text-xs">
                            Todos os Usuários
                          </span>
                        </div>
                        
                        {group.description && (
                          <p className="text-green-300 text-sm mb-3">
                            {group.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-green-300">
                          <span>Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}</span>
                          {group.member_count && (
                            <>
                              <span>•</span>
                              <span>{group.member_count} membros</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(group.invite_link, '_blank')}
                        className="text-gray-400 hover:bg-gray-700"
                        title="Abrir grupo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(group.id, group.is_active)}
                        className={group.is_active 
                          ? "text-orange-400 hover:bg-orange-500/20" 
                          : "text-gray-400 hover:bg-gray-700"
                        }
                        title={group.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {group.is_active ? '⏸️' : '▶️'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(group)}
                        className="text-gray-400 hover:bg-gray-700"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(group.id, group.name)}
                        className="text-red-400 hover:bg-red-500/20"
                        title="Deletar"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Show link preview */}
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-green-300 text-xs mb-1">Link de convite:</div>
                    <div className="text-green-400 text-sm font-mono break-all">
                      {group.invite_link}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-green-400 hover:bg-gray-700"
          >
            💎 Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
