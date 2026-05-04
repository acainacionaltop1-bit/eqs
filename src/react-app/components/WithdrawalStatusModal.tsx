import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/ui/dialog';
import { CheckCircle, AlertCircle, Clock, Copy } from 'lucide-react';
import type { Withdrawal } from '@/shared/types';

interface WithdrawalStatusModalProps {
  withdrawal: Withdrawal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawalStatusModal({ withdrawal, isOpen, onClose }: WithdrawalStatusModalProps) {
  if (!withdrawal) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Saque Concluído',
          bgColor: 'bg-green-400/20',
          borderColor: 'border-green-400/30',
          textColor: 'text-green-400',
          message: 'Seu saque foi processado com sucesso e enviado para sua chave PIX.'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          title: 'Saque Rejeitado',
          bgColor: 'bg-red-400/20',
          borderColor: 'border-red-400/30',
          textColor: 'text-red-400',
          message: 'Seu saque foi rejeitado e o valor foi retornado ao seu saldo.'
        };
      default:
        return {
          icon: Clock,
          title: 'Saque em Análise',
          bgColor: 'bg-yellow-400/20',
          borderColor: 'border-yellow-400/30',
          textColor: 'text-yellow-400',
          message: 'Seu saque está sendo processado pela nossa equipe. Você será notificado quando for concluído.'
        };
    }
  };

  const config = getStatusConfig(withdrawal.status);
  const Icon = config.icon;

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(withdrawal.pix_key);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy PIX key:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full ${config.bgColor} border-4 ${config.borderColor} flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`w-8 h-8 ${config.textColor}`} />
            </div>
            <DialogTitle className="text-xl font-bold text-white mb-2">
              {config.title}
            </DialogTitle>
            <p className={`text-2xl font-bold ${config.textColor}`}>
              R$ {withdrawal.amount.toFixed(2)}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Chave PIX:</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">{withdrawal.pix_key}</span>
                <button
                  onClick={copyPixKey}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Copiar chave PIX"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Data da solicitação:</span>
              <div className="text-right">
                <div className="text-white text-sm">
                  {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-gray-400 text-xs">
                  {new Date(withdrawal.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
            
            {withdrawal.processed_at && (
              <div className="flex justify-between">
                <span className="text-gray-400">Data do processamento:</span>
                <div className="text-right">
                  <div className="text-white text-sm">
                    {new Date(withdrawal.processed_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(withdrawal.processed_at).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-semibold ${config.textColor}`}>
                {withdrawal.status === 'pending' ? 'Em Análise' : 
                 withdrawal.status === 'approved' ? 'Concluído' : 'Rejeitado'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">ID da transação:</span>
              <span className="text-white font-mono text-xs">#{withdrawal.id}</span>
            </div>
          </div>
          
          <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
            <p className={`${config.textColor.replace('text-', 'text-').replace('-400', '-300')} text-sm text-center`}>
              <strong>
                {withdrawal.status === 'pending' ? 'Em análise:' : 
                 withdrawal.status === 'approved' ? 'Concluído:' : 'Rejeitado:'}
              </strong> {config.message}
            </p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-6 bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-500 transition-colors"
        >
          Fechar
        </button>
      </DialogContent>
    </Dialog>
  );
}
