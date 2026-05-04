import { X } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LiveActivity {
  id: number;
  activity_type: string;
  user_name: string;
  message: string;
  amount?: number;
  level_info?: string;
  created_at: string;
}

interface LiveActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: LiveActivity | null;
}

export function LiveActivityModal({ isOpen, onClose, activity }: LiveActivityModalProps) {
  if (!isOpen || !activity) {
    return null;
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return '💸';
      case 'vip_purchase':
        return '👑';
      case 'registration':
        return '🎉';
      case 'video_watch':
        return '📺';
      default:
        return '✨';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return 'from-green-500 to-emerald-600';
      case 'vip_purchase':
        return 'from-yellow-500 to-orange-600';
      case 'registration':
        return 'from-blue-500 to-purple-600';
      case 'video_watch':
        return 'from-pink-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return 'Saque Realizado';
      case 'vip_purchase':
        return 'Compra VIP';
      case 'registration':
        return 'Novo Usuário';
      case 'video_watch':
        return 'Vídeo Assistido';
      default:
        return 'Atividade';
    }
  };

  const getActivityDescription = (activity: LiveActivity) => {
    switch (activity.activity_type) {
      case 'withdrawal':
        return `${activity.user_name} acabou de sacar ${activity.amount ? `R$ ${activity.amount.toFixed(2)}` : 'um valor'} via PIX. O pagamento foi processado instantaneamente!`;
      case 'vip_purchase':
        return `${activity.user_name} se tornou ${activity.level_info || 'VIP'} e agora tem acesso a benefícios exclusivos e maior limite de ganhos diários!`;
      case 'registration':
        return `${activity.user_name} acabou de se cadastrar na plataforma e está começando a ganhar dinheiro assistindo vídeos!`;
      case 'video_watch':
        return `${activity.user_name} assistiu um vídeo e ganhou ${activity.amount ? `R$ ${activity.amount.toFixed(2)}` : 'dinheiro'}. Você também pode ganhar!`;
      default:
        return activity.message;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-md w-full shadow-2xl animate-fade-in-up overflow-hidden border border-gray-700">
        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${getActivityColor(activity.activity_type)} p-6 text-center relative`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl animate-bounce">
              {getActivityIcon(activity.activity_type)}
            </span>
            <h2 className="text-xl font-bold text-white">
              {getActivityTitle(activity.activity_type)}
            </h2>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-white/90">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">ATIVIDADE AO VIVO</span>
          </div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User info */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Usuário</span>
              <span className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            <div className="text-white font-medium">{activity.user_name}</div>
          </div>

          {/* Activity details */}
          <div className="space-y-3">
            <div className="text-white/90 text-sm leading-relaxed">
              {getActivityDescription(activity)}
            </div>
            
            {activity.amount && (
              <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-sm font-medium">Valor</span>
                  <span className="text-green-400 text-lg font-bold">
                    R$ {activity.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {activity.level_info && (
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 text-sm font-medium">Nível VIP</span>
                  <span className="text-yellow-400 text-lg font-bold">
                    {activity.level_info}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Motivation message */}
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 mt-6">
            <div className="text-center">
              <div className="text-blue-400 text-lg font-medium mb-2">
                Você também pode ganhar! 🚀
              </div>
              <div className="text-blue-300 text-sm">
                {activity.activity_type === 'withdrawal' 
                  ? 'Assista vídeos e faça seu saque também!'
                  : activity.activity_type === 'vip_purchase'
                  ? 'Considere se tornar VIP para ganhar mais!'
                  : 'Comece agora e seja o próximo na lista!'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full py-3 font-medium"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
