import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/react-app/components/ui/dialog";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Copy, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePushinPay } from "@/react-app/hooks/usePushinPay";

interface PushinPayQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeData: {
    qrCode: string;
    pixKey: string;
    transactionId: string;
    status: string;
    expiresAt: string;
    amount: number;
  };
  onPaymentConfirmed: () => void;
  vipLevel?: number;
}

export const PushinPayQRCode = ({ 
  open, 
  onOpenChange, 
  qrCodeData, 
  onPaymentConfirmed,
  vipLevel 
}: PushinPayQRCodeProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { checkTransactionStatus } = usePushinPay();

  useEffect(() => {
    if (!qrCodeData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(qrCodeData.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        setPaymentStatus('expired');
        toast.error('QR Code expirou. Gere um novo para continuar.');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      // Avisar quando restam 2 minutos
      if (diff <= 2 * 60 * 1000 && diff > 1.9 * 60 * 1000) {
        toast.warning('QR Code expira em 2 minutos!');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrCodeData?.expiresAt]);

  useEffect(() => {
    if (!open || !qrCodeData?.transactionId) return;

    let pollInterval = 5000; // Start with 5 second polling
    let intervalId: NodeJS.Timeout;

    // Poll for payment status with adaptive intervals
    const checkStatus = async () => {
      try {
        const status = await checkTransactionStatus(qrCodeData.transactionId);
        setPaymentStatus(status.status);
        
        if (status.status === 'approved') {
          toast.success('Pagamento aprovado! VIP ativado com sucesso.');
          setTimeout(() => {
            onPaymentConfirmed();
            onOpenChange(false);
          }, 2000);
          return; // Stop polling
        } else if (status.status === 'cancelled' || status.status === 'expired') {
          toast.error('Pagamento expirou ou foi cancelado.');
          return; // Stop polling
        }

        // Handle rate limiting from API
        if (status.cached && status.next_check_available_in) {
          // If rate limited, wait until next check is available
          pollInterval = Math.max(status.next_check_available_in * 1000, 5000);
        } else if (status.from_api) {
          // If we got fresh data from API, wait at least 60 seconds before next API call
          pollInterval = 65000; // 65 seconds to be safe
        } else {
          // Normal polling interval
          pollInterval = 5000;
        }

        // Schedule next check
        intervalId = setTimeout(checkStatus, pollInterval);
        
      } catch (error) {
        // Silent fail - retry with longer interval
        pollInterval = Math.min(pollInterval * 1.5, 30000); // Max 30 seconds
        intervalId = setTimeout(checkStatus, pollInterval);
      }
    };

    // Start initial check
    checkStatus();

    // Cleanup function
    return () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, [open, qrCodeData?.transactionId, checkTransactionStatus, onPaymentConfirmed, onOpenChange]);

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeData.pixKey);
      toast.success("Código PIX copiado!");
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const status = await checkTransactionStatus(qrCodeData.transactionId);
      setPaymentStatus(status.status);
      
      if (status.status === 'approved') {
        toast.success('Pagamento aprovado! VIP ativado com sucesso.');
        setTimeout(() => {
          onPaymentConfirmed();
          onOpenChange(false);
        }, 1000);
      } else if (status.status === 'pending') {
        if (status.cached && status.next_check_available_in) {
          toast.info(`Consulta em cache. Próxima consulta na API disponível em ${status.next_check_available_in}s`);
        } else if (status.from_api) {
          toast.info('Status consultado diretamente na API. Pagamento ainda pendente.');
        } else {
          toast.info('Pagamento ainda pendente. Aguarde...');
        }
      } else if (status.status === 'cancelled' || status.status === 'expired') {
        if (status.message) {
          toast.error(status.message);
        } else {
          toast.error('Pagamento expirou ou foi cancelado.');
        }
      } else {
        toast.error('Pagamento não foi encontrado ou expirou.');
      }

      // Show additional info if there was an API error
      if (status.error && status.cached) {
        toast.warning(`Aviso: ${status.error}. Mostrando último status conhecido.`);
      }
    } catch (error) {
      toast.error('Erro ao verificar status do pagamento');
    } finally {
      setCheckingStatus(false);
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'approved': return 'bg-green-500';
      case 'expired': 
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'approved': return 'Pagamento Aprovado';
      case 'expired': return 'Pagamento Expirado';
      case 'cancelled': return 'Pagamento Cancelado';
      default: return 'Aguardando Pagamento';
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'expired': 
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!qrCodeData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-white">
            QR Code PIX - VIP {vipLevel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Timer */}
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()} text-white`}>
              {getStatusIcon()}
              {getStatusText()}
            </div>
            
            {paymentStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{timeLeft}</span>
              </div>
            )}

            <div className="text-2xl font-bold text-green-400">
              R$ {qrCodeData.amount.toFixed(2)}
            </div>
          </div>

          {/* QR Code - Apenas para VIP 2+ */}
          {vipLevel !== 0 && vipLevel !== 1 && (
            <div className="flex justify-center">
              {qrCodeData.qrCode ? (
                <div className="p-4 bg-white rounded-xl">
                  <img
                    src={`data:image/png;base64,${qrCodeData.qrCode}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-700 rounded-xl flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="text-sm">QR Code não disponível</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PIX Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Código PIX Copia e Cola:
            </label>
            <div className="flex gap-2">
              <Input
                value={qrCodeData.pixKey}
                readOnly
                className="flex-1 bg-gray-800 border-gray-600 text-white text-xs font-mono"
                style={{ fontSize: '10px' }}
              />
              <Button
                onClick={handleCopyPixCode}
                variant="ghost"
                size="sm"
                className="border-gray-600 hover:bg-gray-700"
                title="Copiar código PIX"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-white">Como pagar:</h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco ou carteira digital</li>
              <li>Escolha a opção "PIX"</li>
              {vipLevel !== 0 && vipLevel !== 1 ? (
                <li>Escaneie o QR Code ou cole o código copiado</li>
              ) : (
                <li>Cole o código PIX copiado</li>
              )}
              <li>Confirme os dados e finalize o pagamento</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCheckStatus}
              disabled={checkingStatus || paymentStatus === 'approved'}
              variant="ghost"
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              {checkingStatus ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Verificar Status
            </Button>
            
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
