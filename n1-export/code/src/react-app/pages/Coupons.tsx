import { useState, useEffect } from 'react';
import { Ticket, Gift, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { CouponHistorySkeleton } from '@/react-app/components/ui/skeleton';



interface CouponUse {
  id: number;
  coupon_id: number;
  discount_applied: number;
  applied_at: string;
  coupon: {
    code: string;
    description: string;
    discount_type: string;
  };
}

export default function Coupons() {
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [couponHistory, setCouponHistory] = useState<CouponUse[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAppliedCoupon, setLastAppliedCoupon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { apiCall } = useApi();

  const loadCouponHistory = async () => {
    try {
      setIsLoading(true);
      const history = await apiCall<CouponUse[]>('/coupons/history');
      setCouponHistory(history);
    } catch (error) {
      console.error('Error loading coupon history:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    loadCouponHistory();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setErrorMessage('Digite um código de cupom');
      return;
    }

    setIsApplyingCoupon(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await apiCall<{
        success: boolean;
        message: string;
        discount_applied?: number;
        discount_type?: string;
        coupon?: any;
      }>('/coupons/apply', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      });

      if (result.success) {
        setLastAppliedCoupon({
          code: couponCode.toUpperCase(),
          discount_applied: result.discount_applied,
          discount_type: result.discount_type,
          coupon: result.coupon,
        });
        setShowSuccessModal(true);
        setCouponCode('');
        loadCouponHistory(); // Refresh history
      } else {
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao aplicar cupom');
    } finally {
      setIsLoading(false);
    }
  };

  const getDiscountText = (type: string, value: number) => {
    switch (type) {
      case 'money':
        return `R$ ${value.toFixed(2)}`;
      case 'percentage':
        return `${value}%`;
      case 'bonus_videos':
        return `${value} vídeo${value > 1 ? 's' : ''} bônus`;
      default:
        return value.toString();
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'money':
        return '💰';
      case 'percentage':
        return '🎯';
      case 'bonus_videos':
        return '🎬';
      default:
        return '🎁';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <div className="bg-gray-700/50 p-3 rounded-full w-16 h-16 mx-auto"></div>
          <div className="h-8 bg-gray-700/50 rounded-xl w-48 mx-auto"></div>
          <div className="h-4 bg-gray-700/30 rounded-lg w-80 mx-auto"></div>
        </div>

        {/* Apply coupon card skeleton */}
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-700/50 p-2 rounded-lg w-9 h-9"></div>
            <div className="h-5 bg-gray-700 rounded w-32"></div>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 h-10 bg-gray-700/50 rounded-lg"></div>
              <div className="h-10 bg-gray-700/50 rounded-lg w-24"></div>
            </div>
          </div>
        </div>

        {/* Coupon history skeleton */}
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-700/50 p-2 rounded-lg w-9 h-9"></div>
            <div className="h-5 bg-gray-700 rounded w-40"></div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <CouponHistorySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-400 to-emerald-600 p-3 rounded-full">
            <Ticket className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Cupons 🎫
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Aplique cupons e ganhe descontos e bônus em seus investimentos e depósitos.
        </p>
      </div>

      {/* Apply Coupon Card */}
      <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-green-400/20 to-emerald-600/20 p-2 rounded-lg">
            <Gift className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Aplicar Cupom</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Insira o código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon || !couponCode.trim()}
              className="bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white font-semibold px-6"
            >
              {isApplyingCoupon ? 'Aplicando...' : 'APLICAR'}
            </Button>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">{successMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coupon History */}
      <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-blue-400/20 to-blue-600/20 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Histórico de Cupons</h2>
        </div>

        {couponHistory.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400">Nenhum cupom aplicado ainda</p>
            <p className="text-gray-500 text-sm mt-1">
              Aplique seu primeiro cupom para começar!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {couponHistory.map((use) => (
              <div
                key={use.id}
                className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getDiscountIcon(use.coupon.discount_type)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {use.coupon.code}
                        </span>
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                          Aplicado
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {use.coupon.description || 'Cupom aplicado com sucesso'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatDate(use.applied_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">
                      + {getDiscountText(use.coupon.discount_type, use.discount_applied)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastAppliedCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-green-400 to-emerald-600 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Cupom aplicado com sucesso!
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cupom:</span>
                    <span className="text-white font-semibold">{lastAppliedCoupon.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Código:</span>
                    <span className="text-white font-semibold">{lastAppliedCoupon.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor:</span>
                    <span className="text-green-400 font-semibold">
                      {getDiscountText(lastAppliedCoupon.discount_type, lastAppliedCoupon.discount_applied)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-green-400 text-sm text-center">
                    O valor do cupom foi aplicado na sua carteira!
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
