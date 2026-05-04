import { 
  type DashboardStats, 
  type Video, 
  type Withdrawal, 
  type WithdrawRequest,
  type VideoWatchRequest,
  type SpinResult,
  type AffiliateInfo,
  type RankingUser
} from '@/shared/types';

export function useApi() {
  const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      // Add timeout to all API calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Provide user-friendly error messages for common status codes
        if (response.status >= 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        } else if (response.status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado.';
        } else if (response.status === 404) {
          errorMessage = 'Recurso não encontrado.';
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors and other fetch failures
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da requisição excedido. Verifique sua conexão.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }
      throw error;
    }
  };

  return {
    // Expose apiCall for direct use
    apiCall,

    // Dashboard
    getDashboardStats: (): Promise<DashboardStats> => 
      apiCall('/dashboard/stats'),

    // Videos
    getVideos: (): Promise<Video[]> => 
      apiCall('/videos'),
    
    // Featured videos (public endpoint)
    getFeaturedVideos: (): Promise<Video[]> => 
      apiCall('/videos/featured'),
    
    watchVideo: (data: VideoWatchRequest): Promise<{ success: boolean; earnings: number; message: string }> =>
      apiCall('/videos/watch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Withdrawals
    getWithdrawals: (): Promise<Withdrawal[]> => 
      apiCall('/withdrawals'),
    
    createWithdrawal: (data: WithdrawRequest): Promise<{ success: boolean; message: string }> =>
      apiCall('/withdrawals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Spin wheel
    spinWheel: (): Promise<SpinResult> =>
      apiCall('/spin', {
        method: 'POST',
      }),

    // Affiliate
    getAffiliateInfo: (): Promise<AffiliateInfo> =>
      apiCall('/affiliate'),

    // Ranking
    getRanking: (): Promise<RankingUser[]> =>
      apiCall('/ranking'),

    // Session management
    renewSession: (): Promise<{ success: boolean; message: string }> =>
      apiCall('/auth/renew-session', {
        method: 'POST',
      }),

    // Notifications
    getNotifications: (): Promise<any[]> =>
      apiCall('/notifications'),

    markNotificationAsRead: (notificationId: number): Promise<{ success: boolean }> =>
      apiCall(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      }),

    markAllNotificationsAsRead: (): Promise<{ success: boolean }> =>
      apiCall('/notifications/mark-all-read', {
        method: 'POST',
      }),

    // Coupons
    applyCoupon: (code: string): Promise<{ success: boolean; message: string; discount_applied?: number; discount_type?: string; coupon?: any }> =>
      apiCall('/coupons/apply', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    getCouponHistory: (): Promise<any[]> =>
      apiCall('/coupons/history'),

    // Announcements
    getAnnouncements: (): Promise<any[]> =>
      apiCall('/announcements'),

    markAnnouncementAsViewed: (announcementId: number): Promise<{ success: boolean }> =>
      apiCall(`/announcements/${announcementId}/view`, {
        method: 'POST',
      }),
  };
}
