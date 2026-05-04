import { useState, useEffect } from 'react';
import { Gem, ExternalLink, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/react-app/components/ui/dialog';
import { toast } from '@/react-app/components/ui/toast';

interface VipGroup {
  id: number;
  name: string;
  platform: 'whatsapp' | 'telegram';
  invite_link: string;
  description: string;
  vip_level_required: number;
}

interface VipGroupsData {
  user_vip_level: number;
  user_level?: number;
  user_level_title?: string;
  groups: VipGroup[];
}

export const VipGroupsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<VipGroup[]>([]);
  const [userVipLevel, setUserVipLevel] = useState(0);
  const [, setUserLevel] = useState(1);
  const [userLevelTitle, setUserLevelTitle] = useState('Iniciante');
  const [loading, setLoading] = useState(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vip-groups', {
        credentials: 'include'
      });

      if (response.ok) {
        const data: VipGroupsData = await response.json();
        setGroups(data.groups);
        setUserVipLevel(data.user_vip_level);
        setUserLevel(data.user_level || 1);
        setUserLevelTitle(data.user_level_title || 'Iniciante');
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

  const getVipLevelName = (vipLevel: number, userLevelTitle: string) => {
    if (vipLevel === 0) return userLevelTitle;
    return `👑 VIP ${vipLevel}`;
  };

  // Show button for all users

  return (
    <>
      <button
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/25 text-xs"
        onClick={() => setIsOpen(true)}
        title="Grupos VIP"
      >
        <Gem className="h-3.5 w-3.5 text-green-200" />
        <span>Grupo VIP</span>
        {groups.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1rem] h-4 flex items-center justify-center rounded-full font-bold">
            {groups.length}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-black border border-gray-800 max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <Gem className="w-6 h-6 text-green-400" />
              Grupos VIP Exclusivos
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Acesse grupos exclusivos para membros {getVipLevelName(userVipLevel, userLevelTitle)} e superiores
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {/* User VIP Status */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                  <Gem className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{getVipLevelName(userVipLevel, userLevelTitle)}</h3>
                  <p className="text-gray-400 text-xs">
                    {groups.length} grupo{groups.length !== 1 ? 's' : ''} disponível{groups.length !== 1 ? 'is' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Groups List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                <span className="ml-3 text-white">Carregando grupos...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-6">
                <Gem className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Nenhum grupo disponível</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Não há grupos criados no momento
                </p>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">
                    💡 Os grupos aparecerão aqui quando criados pelos administradores.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div 
                    key={group.id} 
                    className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-lg">
                          {getPlatformIcon(group.platform)}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{group.name}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {getPlatformName(group.platform)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          window.open(group.invite_link, '_blank');
                          toast.success(`Abrindo grupo ${group.name}`);
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Entrar
                      </Button>
                    </div>
                    
                    {group.description && (
                      <p className="text-gray-400 text-xs mb-2 pl-10">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 pl-10">
                      <MessageCircle className="w-3 h-3" />
                      <span>Grupo exclusivo</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Instructions */}
            {groups.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm">
                  💡 Instruções
                </h4>
                <div className="space-y-1 text-gray-400 text-xs">
                  <p>• Clique em "Entrar" para acessar o grupo</p>
                  <p>• Respeite as regras de cada grupo</p>
                  <p>• Conecte-se com outros membros</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-700 mt-3">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:bg-gray-700 text-sm px-4 py-2"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
