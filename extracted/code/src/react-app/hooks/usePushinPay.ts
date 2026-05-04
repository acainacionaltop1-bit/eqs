import { useState } from 'react';
import { useApi } from './useApi';

interface PushinPayCheckoutData {
  name: string;
  phone: string;
  email: string;
  cpf: string;
  amount: number;
  description: string;
  vip_level?: number;
  plan_type?: string;
}

interface PushinPayResponse {
  qrCode: string;
  pixKey: string;
  transactionId: string;
  status: string;
  expiresAt: string;
  amount: number;
}

interface TransactionStatus {
  id: string;
  status: string;
  amount: number;
  vip_level?: number;
  expires_at: string;
  processed_at?: string;
  payer_name?: string;
  cached?: boolean;
  next_check_available_in?: number;
  from_api?: boolean;
  error?: string;
  message?: string;
}

export const usePushinPay = () => {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<PushinPayResponse | null>(null);
  const { apiCall } = useApi();

  const generateQRCode = async (data: PushinPayCheckoutData): Promise<PushinPayResponse> => {
    setLoading(true);
    try {
      const response = await apiCall<PushinPayResponse>('/pushinpay/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setQrCodeData(response);
      return response;
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async (transactionId: string): Promise<TransactionStatus> => {
    try {
      const response = await apiCall<TransactionStatus>(`/pushinpay/transaction/${transactionId}`);
      return response;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento');
      throw error;
    }
  };

  const clearQRCode = () => {
    setQrCodeData(null);
  };

  return {
    loading,
    qrCodeData,
    generateQRCode,
    checkTransactionStatus,
    clearQRCode,
  };
};
