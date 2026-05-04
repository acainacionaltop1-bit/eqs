import { X, MessageCircle, Clock, User, CheckCircle } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';

interface ChatMessage {
  id: number;
  user_email: string;
  user_name: string;
  message: string;
  admin_reply?: string;
  admin_name?: string;
  status: string;
  replied_at?: string;
  created_at: string;
}

interface ChatMessageModalProps {
  message: ChatMessage | null;
  isOpen: boolean;
  onClose: () => void;
}

const ChatMessageModal = ({ message, isOpen, onClose }: ChatMessageModalProps) => {
  if (!isOpen || !message) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'closed':
        return 'text-gray-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'answered':
        return 'Respondido';
      case 'pending':
        return 'Aguardando resposta';
      case 'closed':
        return 'Encerrado';
      default:
        return 'Processando';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Detalhes da Mensagem</h2>
              <p className="text-green-100 text-sm">Mensagem #{message.id}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 w-10 h-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Status */}
          <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className={`flex items-center gap-2 ${getStatusColor(message.status)}`}>
              {getStatusIcon(message.status)}
              <span className="font-medium">{getStatusText(message.status)}</span>
            </div>
          </div>

          {/* Informações do usuário */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Informações do Usuário
            </h3>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Nome:</span>
                <span className="text-white">{message.user_name || 'Não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{message.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Enviado em:</span>
                <span className="text-white">{formatDate(message.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Mensagem original */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Mensagem Original</h3>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {message.message}
              </p>
            </div>
          </div>

          {/* Resposta do admin (se houver) */}
          {message.admin_reply && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Resposta do Suporte</h3>
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-green-400 font-medium">
                    {message.admin_name || 'Equipe de Suporte'}
                  </span>
                  {message.replied_at && (
                    <span className="text-green-300 text-sm">
                      {formatDate(message.replied_at)}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {message.admin_reply}
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Timeline</h3>
            <div className="space-y-3">
              {/* Mensagem enviada */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white font-medium">Mensagem enviada</p>
                  <p className="text-gray-400 text-sm">{formatDate(message.created_at)}</p>
                </div>
              </div>

              {/* Resposta (se houver) */}
              {message.replied_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Resposta enviada</p>
                    <p className="text-gray-400 text-sm">{formatDate(message.replied_at)}</p>
                  </div>
                </div>
              )}

              {/* Status atual */}
              {!message.admin_reply && message.status === 'pending' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                  <div>
                    <p className="text-white font-medium">Aguardando resposta</p>
                    <p className="text-gray-400 text-sm">Nossa equipe irá responder em breve</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="nextfund">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageModal;
