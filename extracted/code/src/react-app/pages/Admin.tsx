import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useApi } from '@/react-app/hooks/useApi';

import { Input } from '@/react-app/components/ui/input';
import { Button } from '@/react-app/components/ui/button';
import { FormField } from '@/react-app/components/ui/form-field';
import { toast } from '@/react-app/components/ui/toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/react-app/components/ui/dialog';
import { 
  Users, 
  Video, 
  DollarSign, 
  TrendingUp, 
  Trash,
  Check,
  X,
  Settings,
  BarChart3,
  Activity,
  RefreshCw,
  Clock,
  Crown,
  ExternalLink,
  Save,
  Home,
  Star,
  Target,
  Ticket,
  Eye,
  EyeOff,
  Trophy,
  Gift,
  MessageCircle,
  Send,
  User,
  AlertCircle
} from 'lucide-react';

import { UserCustomVideosModal } from '@/react-app/components/UserCustomVideosModal';
import UserVideosViewModal from '@/react-app/components/UserVideosViewModal';
import QuickVideoAssignModal from '@/react-app/components/QuickVideoAssignModal';
import RankingGeneratorTab from '@/react-app/components/RankingGeneratorTab';


interface AdminStats {
  total_users: number;
  total_videos: number;
  total_earnings: number;
  pending_withdrawals: number;
  today_signups: number;
  today_videos_watched: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  current_balance: number;
  total_earnings: number;
  total_videos_watched: number;
  is_admin: boolean;
  created_at: string;
  auth_provider: string;
  has_password: string;
  is_fake?: boolean;
  level?: number;
  level_title?: string;
  daily_videos_watched?: number;
  daily_limit?: number;
  custom_daily_limit?: number;
  bonus_videos?: number;
  last_video_date?: string;
  last_activity?: string;
  videos_today?: number;
  videos_this_week?: number;
  recent_activities?: Array<{
    type: string;
    description: string;
    timestamp: string;
    earnings?: number;
  }>;
}

interface AdminVideo {
  id: number;
  title: string;
  description?: string;
  video_platform: string;
  video_url: string;
  embed_url: string;
  reward_amount: number;
  duration_seconds: number;
  is_active: boolean;
  is_home_featured?: boolean;
}

interface AdminWithdrawal {
  id: number;
  user_email: string;
  amount: number;
  pix_key: string;
  status: string;
  created_at: string;
}

interface VipPaymentLink {
  id: number;
  vip_level: number;
  payment_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VipPurchase {
  id: number;
  user_email: string;
  user_name?: string;
  name?: string;
  vip_level: number;
  purchase_date: string;
  amount: number;
  payment_status: string;
  payment_reference?: string;
  is_active: boolean;
  created_at: string;
  plan_type?: string;
}

interface WebhookConfig {
  id: number;
  provider: string;
  webhook_url: string;
  secret_key?: string;
  is_active: boolean;
  vip_level_mapping: string;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: number;
  provider: string;
  event_type: string;
  payment_id?: string;
  user_email?: string;
  vip_level?: number;
  amount?: number;
  status: string;
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

interface HomeBanner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface PushinTransaction {
  id: number;
  user_id: number;
  qr_code_id: string;
  amount: number;
  vip_level?: number;
  status: string;
  expires_at: string;
  user_email: string;
  user_name?: string;
  user_cpf?: string;
  user_phone?: string;
  description?: string;
  end_to_end_id?: string;
  payer_name?: string;
  payer_document?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

interface VipGroup {
  id: number;
  name: string;
  platform: string;
  invite_link: string;
  description?: string;
  vip_level_required: number;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}



export default function Admin() {
  const { } = useAuth();
  const { } = useApi();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [homeVideos, setHomeVideos] = useState<AdminVideo[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [vipLinks, setVipLinks] = useState<VipPaymentLink[]>([]);
  const [vipPurchases, setVipPurchases] = useState<VipPurchase[]>([]);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [pushinTransactions, setPushinTransactions] = useState<PushinTransaction[]>([]);
  const [balanceTransfers, setBalanceTransfers] = useState<any[]>([]);
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatStats, setChatStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [vipGroups, setVipGroups] = useState<VipGroup[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newDataIndicator, setNewDataIndicator] = useState(false);

  // Video form
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration_seconds: 0,
    reward_amount: 2.0,
    question: '',
    correct_answer: '',
    wrong_answer: '',
    target_users: 'all' as 'all' | 'specific' | 'bonus_only',
    selected_user_ids: [] as number[],
  });

  // Home video form
  const [homeVideoForm, setHomeVideoForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration_seconds: 0,
    reward_amount: 2.0,
    question: '',
    correct_answer: '',
    wrong_answer: '',
    target_users: 'all' as 'all' | 'specific' | 'bonus_only',
    selected_user_ids: [] as number[],
  });

  // Video detection states
  const [videoDetecting, setVideoDetecting] = useState(false);
  const [homeVideoDetecting, setHomeVideoDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [homeDetectionMessage, setHomeDetectionMessage] = useState('');

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [homeSubmitting, setHomeSubmitting] = useState(false);

  // Home banner form
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    description: '',
    is_active: true,
    display_order: 0,
  });
  const [bannerSubmitting, setBannerSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);

  // Chat states
  const [chatFilter, setChatFilter] = useState('all');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Announcement states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target_new_users: true,
    target_all_users: false,
    priority: 1,
    expires_at: '',
    is_active: true
  });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  // Live activities states
  const [liveActivityForm, setLiveActivityForm] = useState({
    activity_type: 'withdrawal',
    user_name: '',
    custom_message: '',
    amount: 0,
    level_info: ''
  });
  const [liveActivitySubmitting, setLiveActivitySubmitting] = useState(false);

  // VIP Groups states
  const [vipGroupForm, setVipGroupForm] = useState({
    name: '',
    platform: 'whatsapp' as 'whatsapp' | 'telegram',
    invite_link: '',
    description: '',
    vip_level_required: 1,
    is_active: true
  });
  const [vipGroupSubmitting, setVipGroupSubmitting] = useState(false);
  const [editingVipGroup, setEditingVipGroup] = useState<VipGroup | null>(null);
  const [showVipGroupModal, setShowVipGroupModal] = useState(false);

  // User monitoring states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'admins'>('all');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showUserVideos, setShowUserVideos] = useState(false);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [loadingUserVideos, setLoadingUserVideos] = useState(false);
  const [realtimeUsers, setRealtimeUsers] = useState<AdminUser[]>([]);
  
  // Modal states
  const [customVideosModalOpen, setCustomVideosModalOpen] = useState(false);
  const [userVideosViewModalOpen, setUserVideosViewModalOpen] = useState(false);
  const [quickAssignModalOpen, setQuickAssignModalOpen] = useState(false);

  // User selection for video targeting
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSelectorMode, setUserSelectorMode] = useState<'video' | 'home'>('video');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AdminUser[]>([]);

  // Auto-detect video info when URL changes
  const detectVideoInfo = async (url: string, isHome = false) => {
    if (!url.trim()) {
      if (isHome) {
        setHomeDetectionMessage('');
      } else {
        setDetectionMessage('');
      }
      return;
    }

    const setDetecting = isHome ? setHomeVideoDetecting : setVideoDetecting;
    const setMessage = isHome ? setHomeDetectionMessage : setDetectionMessage;
    const setForm = isHome ? setHomeVideoForm : setVideoForm;

    setDetecting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/video/info?url=${encodeURIComponent(url)}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const info = await response.json();
        
        // Auto-populate form with detected info
        setForm(prev => ({
          ...prev,
          title: info.title || prev.title,
          description: info.description || prev.description,
          thumbnail_url: info.thumbnail_url || prev.thumbnail_url,
          duration_seconds: info.duration_seconds || prev.duration_seconds,
        }));

        setMessage(info.message || `✅ ${info.platform === 'youtube' ? 'YouTube' : 'Vimeo'} detectado!`);
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error || 'Erro ao detectar vídeo'}`);
      }
    } catch (error) {
      setMessage('❌ Erro ao conectar com o servidor');
    } finally {
      setDetecting(false);
    }
  };

  // Debounce video detection
  const [urlDetectionTimeout, setUrlDetectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isCreatingPassword, setIsCreatingPassword] = useState<number | null>(null);
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [createPasswordError, setCreatePasswordError] = useState<string | null>(null);
  
  // Password reset states
  const [isResettingPassword, setIsResettingPassword] = useState<number | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  
  const handleUrlChange = (url: string, isHome = false) => {
    const setForm = isHome ? setHomeVideoForm : setVideoForm;
    
    setForm(prev => ({ ...prev, video_url: url }));

    // Clear previous timeout
    if (urlDetectionTimeout) {
      clearTimeout(urlDetectionTimeout);
    }

    // Set new timeout for detection
    const timeout = setTimeout(() => {
      detectVideoInfo(url, isHome);
    }, 1000); // Wait 1 second after user stops typing

    setUrlDetectionTimeout(timeout);
  };

  // Video selection for bulk actions
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [selectedHomeVideos, setSelectedHomeVideos] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isAllHomeSelected, setIsAllHomeSelected] = useState(false);

  // Purchase form (VIP + Intermediate)
  const [newVipPurchase, setNewVipPurchase] = useState({
    user_email: '',
    vip_level: null as number | null,
    amount: 0,
    payment_reference: '',
    payment_status: 'completed'
  });
  const [vipPurchaseSubmitting, setVipPurchaseSubmitting] = useState(false);

  // Balance transfer form
  const [balanceTransferForm, setBalanceTransferForm] = useState({
    user_email: '',
    amount: 0,
    reason: '',
    type: 'add' as 'add' | 'subtract'
  });
  const [balanceTransferSubmitting, setBalanceTransferSubmitting] = useState(false);

  const handleAddVipPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVipPurchase.user_email || newVipPurchase.vip_level === null || !newVipPurchase.amount) {
      toast.error('Preencha todos os campos obrigatórios (Email, Nível VIP e Valor)');
      return;
    }

    setVipPurchaseSubmitting(true);

    try {
      let endpoint = '';
      let payload = {};

      if (newVipPurchase.vip_level === 0) {
        // Intermediate plan
        endpoint = '/api/admin/intermediate-purchases';
        payload = {
          user_email: newVipPurchase.user_email,
          amount: newVipPurchase.amount,
          payment_reference: newVipPurchase.payment_reference || `MANUAL_${Date.now()}`,
          payment_status: newVipPurchase.payment_status
        };
      } else {
        // VIP plan
        endpoint = '/api/admin/vip-purchases';
        payload = {
          user_email: newVipPurchase.user_email,
          vip_level: newVipPurchase.vip_level,
          amount: newVipPurchase.amount,
          payment_reference: newVipPurchase.payment_reference || `MANUAL_${Date.now()}`,
          payment_status: newVipPurchase.payment_status
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const planName = newVipPurchase.vip_level === 0 ? 'Intermediário' : `VIP ${newVipPurchase.vip_level}`;
        toast.success(`Plano ${planName} registrado com sucesso!`);
        setNewVipPurchase({ user_email: '', vip_level: null, amount: 0, payment_reference: '', payment_status: 'completed' });
        loadData(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        toast.error(`Erro: ${errorData.error || 'Falha ao registrar compra'}`);
      }
    } catch (error) {
      console.error('Error registering purchase:', error);
      toast.error('Erro ao registrar compra');
    } finally {
      setVipPurchaseSubmitting(false);
    }
  };

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const [statsRes, usersRes, videosRes, homeVideosRes, withdrawalsRes, vipLinksRes, vipPurchasesRes, intermediatePurchasesRes, webhookConfigsRes, webhookLogsRes, pushinTransactionsRes, realtimeUsersRes, balanceTransfersRes, homeBannersRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/videos', { credentials: 'include' }),
        fetch('/api/admin/home-videos', { credentials: 'include' }),
        fetch('/api/admin/withdrawals', { credentials: 'include' }),
        fetch('/api/admin/vip-links', { credentials: 'include' }),
        fetch('/api/admin/vip-purchases', { credentials: 'include' }),
        fetch('/api/admin/intermediate-purchases', { credentials: 'include' }),
        fetch('/api/admin/webhooks', { credentials: 'include' }),
        fetch('/api/admin/webhook-logs?limit=100', { credentials: 'include' }),
        fetch('/api/admin/pushin-transactions', { credentials: 'include' }),
        fetch('/api/admin/users/realtime', { credentials: 'include' }),
        fetch('/api/admin/balance-transfers', { credentials: 'include' }),
        fetch('/api/admin/home-banners', { credentials: 'include' }),
        fetch('/api/admin/chat?limit=100', { credentials: 'include' }),
        fetch('/api/admin/announcements', { credentials: 'include' }),
        fetch('/api/admin/live-activities', { credentials: 'include' }),
        fetch('/api/admin/vip-groups', { credentials: 'include' }),
      ]);

      const newStats = statsRes.ok ? await statsRes.json() : null;
      const newUsers = usersRes.ok ? await usersRes.json() : [];
      const newVideos = videosRes.ok ? await videosRes.json() : [];
      const newHomeVideos = homeVideosRes.ok ? await homeVideosRes.json() : [];
      const newWithdrawals = withdrawalsRes.ok ? await withdrawalsRes.json() : [];
      const newVipLinks = vipLinksRes.ok ? await vipLinksRes.json() : [];
      const newVipPurchases = vipPurchasesRes.ok ? await vipPurchasesRes.json() : [];
      const newIntermediatePurchases = intermediatePurchasesRes.ok ? await intermediatePurchasesRes.json() : [];
      const newWebhookConfigs = webhookConfigsRes.ok ? await webhookConfigsRes.json() : [];
      const newWebhookLogs = webhookLogsRes.ok ? await webhookLogsRes.json() : [];
      const newPushinTransactions = pushinTransactionsRes.ok ? await pushinTransactionsRes.json() : [];
      const newRealtimeUsers = realtimeUsersRes.ok ? await realtimeUsersRes.json() : [];
      const newBalanceTransfers = balanceTransfersRes.ok ? await balanceTransfersRes.json() : [];
      const newHomeBanners = homeBannersRes.ok ? await homeBannersRes.json() : [];
      const chatData = await fetch('/api/admin/chat?limit=100', { credentials: 'include' });
      const newChatData = chatData.ok ? await chatData.json() : { messages: [], stats: null };
      const announcementsData = await fetch('/api/admin/announcements', { credentials: 'include' });
      const newAnnouncements = announcementsData.ok ? await announcementsData.json() : [];
      const liveActivitiesData = await fetch('/api/admin/live-activities', { credentials: 'include' });
      const newLiveActivities = liveActivitiesData.ok ? await liveActivitiesData.json() : [];
      const vipGroupsData = await fetch('/api/admin/vip-groups', { credentials: 'include' });
      const newVipGroups = vipGroupsData.ok ? await vipGroupsData.json() : [];

      // Update states directly without comparing (to avoid dependency issues)
      setStats((prevStats) => {
        // Only show new data indicator if we have previous data and it's different
        const hasNewData = prevStats && newStats && (
          newStats.total_users !== prevStats.total_users ||
          newStats.total_videos !== prevStats.total_videos ||
          newStats.total_earnings !== prevStats.total_earnings ||
          newStats.pending_withdrawals !== prevStats.pending_withdrawals ||
          newStats.today_signups !== prevStats.today_signups ||
          newStats.today_videos_watched !== prevStats.today_videos_watched
        );

        if (hasNewData && !showRefreshing) {
          setNewDataIndicator(true);
          setTimeout(() => setNewDataIndicator(false), 3000);
        }

        return newStats;
      });

      setUsers(newUsers);
      setVideos(newVideos);
      setHomeVideos(newHomeVideos);
      setWithdrawals(newWithdrawals);
      setVipLinks(newVipLinks);
      
      // Combine VIP and intermediate purchases for unified display
      const combinedPurchases = [
        ...newIntermediatePurchases.map((purchase: any) => ({
          ...purchase,
          vip_level: 0,
          plan_type: 'intermediate'
        })),
        ...newVipPurchases
      ].sort((a, b) => new Date(b.created_at || b.purchase_date).getTime() - new Date(a.created_at || a.purchase_date).getTime());
      
      setVipPurchases(combinedPurchases);
      setWebhookConfigs(newWebhookConfigs);
      setWebhookLogs(newWebhookLogs);
      setPushinTransactions(newPushinTransactions);
      setRealtimeUsers(newRealtimeUsers);
      setBalanceTransfers(newBalanceTransfers);
      setHomeBanners(newHomeBanners);
      setChatMessages(newChatData.messages || []);
      setChatStats(newChatData.stats);
      setAnnouncements(newAnnouncements);
      setLiveActivities(newLiveActivities);
      setVipGroups(newVipGroups);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    
    const interval = setInterval(() => {
      loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Sync select all states
  useEffect(() => {
    setIsAllSelected(videos.length > 0 && selectedVideos.length === videos.length);
  }, [videos.length, selectedVideos.length]);

  useEffect(() => {
    setIsAllHomeSelected(homeVideos.length > 0 && selectedHomeVideos.length === homeVideos.length);
  }, [homeVideos.length, selectedHomeVideos.length]);

  const createVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.video_url.trim()) {
      alert('Por favor, informe a URL do vídeo');
      return;
    }

    if (videoForm.target_users === 'specific' && videoForm.selected_user_ids.length === 0) {
      alert('Selecione pelo menos um usuário para enviar o vídeo');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...videoForm,
          is_home_featured: false,
        }),
      });

      if (response.ok) {
        setVideoForm({
          title: '',
          description: '',
          video_url: '',
          thumbnail_url: '',
          duration_seconds: 0,
          reward_amount: 2.0,
          question: '',
          correct_answer: '',
          wrong_answer: '',
          target_users: 'all',
          selected_user_ids: [],
        });
        setDetectionMessage('');
        
        loadData(true);
        const targetMessage = videoForm.target_users === 'all' 
          ? 'Vídeo criado e disponível para todos os usuários!' 
          : videoForm.target_users === 'bonus_only'
          ? 'Vídeo criado e disponível apenas para usuários com vídeos bônus!'
          : `Vídeo criado e enviado para ${videoForm.selected_user_ids.length} usuário(s) específico(s)!`;
        alert(targetMessage);
      } else {
        const error = await response.json();
        alert(`Erro ao criar vídeo: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert('Erro ao enviar vídeo');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const createHomeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeVideoForm.video_url.trim()) {
      alert('Por favor, informe a URL do vídeo');
      return;
    }

    if (homeVideoForm.target_users === 'specific' && homeVideoForm.selected_user_ids.length === 0) {
      alert('Selecione pelo menos um usuário para enviar o vídeo');
      return;
    }

    setHomeSubmitting(true);
    try {
      const response = await fetch('/api/admin/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...homeVideoForm,
          is_home_featured: true,
        }),
      });

      if (response.ok) {
        setHomeVideoForm({
          title: '',
          description: '',
          video_url: '',
          thumbnail_url: '',
          duration_seconds: 0,
          reward_amount: 2.0,
          question: '',
          correct_answer: '',
          wrong_answer: '',
          target_users: 'all',
          selected_user_ids: [],
        });
        setHomeDetectionMessage('');
        
        loadData(true);
        const targetMessage = homeVideoForm.target_users === 'all' 
          ? 'Vídeo da página inicial criado e disponível para todos os usuários!' 
          : `Vídeo da página inicial criado e enviado para ${homeVideoForm.selected_user_ids.length} usuário(s) específico(s)!`;
        alert(targetMessage);
      } else {
        const error = await response.json();
        alert(`Erro ao criar vídeo: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert('Erro ao enviar vídeo');
      console.error(error);
    } finally {
      setHomeSubmitting(false);
    }
  };

  const toggleVideoStatus = async (videoId: number, isActive: boolean, isHome = false) => {
    try {
      const endpoint = isHome ? `/api/admin/home-videos/${videoId}` : `/api/admin/videos/${videoId}`;
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive }),
      });
      loadData();
    } catch (error) {
      alert('Erro ao atualizar vídeo');
    }
  };

  const deleteVideo = async (videoId: number, videoTitle: string, isHome = false) => {
    const confirmDelete = confirm(`Tem certeza que deseja excluir o vídeo "${videoTitle}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmDelete) return;

    try {
      const endpoint = isHome ? `/api/admin/home-videos/${videoId}` : `/api/admin/videos/${videoId}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadData();
        alert('Vídeo excluído com sucesso!');
      } else {
        alert('Erro ao excluir vídeo');
      }
    } catch (error) {
      alert('Erro ao excluir vídeo');
    }
  };

  const deleteSelectedVideos = async (isHome = false) => {
    const selectedList = isHome ? selectedHomeVideos : selectedVideos;
    
    if (selectedList.length === 0) {
      alert('Selecione pelo menos um vídeo para excluir');
      return;
    }

    const confirmDelete = confirm(`Tem certeza que deseja excluir ${selectedList.length} vídeo(s) selecionado(s)? Esta ação não pode ser desfeita.`);
    
    if (!confirmDelete) return;

    try {
      const deletePromises = selectedList.map(async (videoId) => {
        const endpoint = isHome ? `/api/admin/home-videos/${videoId}` : `/api/admin/videos/${videoId}`;
        const response = await fetch(endpoint, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Falha ao excluir vídeo ${videoId}: ${error.error || 'Erro desconhecido'}`);
        }
        
        return videoId;
      });

      await Promise.all(deletePromises);
      
      const deletedCount = selectedList.length;
      if (isHome) {
        setSelectedHomeVideos([]);
        setIsAllHomeSelected(false);
      } else {
        setSelectedVideos([]);
        setIsAllSelected(false);
      }
      
      await loadData(true);
      alert(`${deletedCount} vídeo(s) excluído(s) com sucesso!`);

    } catch (error) {
      console.error('Erro ao excluir vídeos:', error);
      alert(`Erro ao excluir vídeos: ${error instanceof Error ? error.message : 'Verifique o console para mais detalhes.'}`);
      await loadData(true);
    }
  };

  const toggleVideoSelection = (videoId: number, isHome = false) => {
    if (isHome) {
      setSelectedHomeVideos(prev => {
        const newSelection = prev.includes(videoId)
          ? prev.filter(id => id !== videoId)
          : [...prev, videoId];
        
        setIsAllHomeSelected(newSelection.length === homeVideos.length && homeVideos.length > 0);
        return newSelection;
      });
    } else {
      setSelectedVideos(prev => {
        const newSelection = prev.includes(videoId)
          ? prev.filter(id => id !== videoId)
          : [...prev, videoId];
        
        setIsAllSelected(newSelection.length === videos.length && videos.length > 0);
        return newSelection;
      });
    }
  };

  const toggleSelectAll = (isHome = false) => {
    if (isHome) {
      if (isAllHomeSelected || selectedHomeVideos.length === homeVideos.length) {
        setSelectedHomeVideos([]);
        setIsAllHomeSelected(false);
      } else {
        const allIds = homeVideos.map(video => video.id);
        setSelectedHomeVideos(allIds);
        setIsAllHomeSelected(true);
      }
    } else {
      if (isAllSelected || selectedVideos.length === videos.length) {
        setSelectedVideos([]);
        setIsAllSelected(false);
      } else {
        const allIds = videos.map(video => video.id);
        setSelectedVideos(allIds);
        setIsAllSelected(true);
      }
    }
  };

  const updateWithdrawalStatus = async (withdrawalId: number, status: string) => {
    try {
      await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      loadData(true);
      alert(`Saque ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      alert('Erro ao atualizar saque');
    }
  };

  const toggleUserAdmin = async (userId: number, isAdmin: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_admin: !isAdmin }),
      });
      loadData(true);
    } catch (error) {
      alert('Erro ao atualizar usuário');
    }
  };

  const handleCreatePassword = async (userId: number) => {
    setCreatePasswordError(null);

    if (!newPasswordForm.password || newPasswordForm.password.length < 6) {
      setCreatePasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      setCreatePasswordError('As senhas não coincidem');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/create-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPasswordForm.password }),
      });

      if (response.ok) {
        alert('Nova senha criada com sucesso!');
        setIsCreatingPassword(null);
        setNewPasswordForm({ password: '', confirmPassword: '' });
        loadData(true);
      } else {
        const error = await response.json();
        setCreatePasswordError(`Erro ao criar senha: ${error.message}`);
      }
    } catch (error: any) {
      setCreatePasswordError(`Erro ao criar senha: ${error.message}`);
    }
  };

  const handleResetPassword = async (userId: number) => {
    setResetPasswordError(null);

    if (!resetPasswordForm.password || resetPasswordForm.password.length < 6) {
      setResetPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setResetPasswordError('As senhas não coincidem');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: resetPasswordForm.password }),
      });

      if (response.ok) {
        alert('Senha resetada com sucesso! O usuário pode fazer login com a nova senha.');
        setIsResettingPassword(null);
        setResetPasswordForm({ password: '', confirmPassword: '' });
        loadData(true);
      } else {
        const error = await response.json();
        setResetPasswordError(`Erro ao resetar senha: ${error.error || error.message}`);
      }
    } catch (error: any) {
      setResetPasswordError(`Erro ao resetar senha: ${error.message}`);
    }
  };

  const openCreatePasswordModal = (userId: number) => {
    setIsCreatingPassword(userId);
    setNewPasswordForm({ password: '', confirmPassword: '' });
    setCreatePasswordError(null);
  };

  const openResetPasswordModal = (userId: number) => {
    setIsResettingPassword(userId);
    setResetPasswordForm({ password: '', confirmPassword: '' });
    setResetPasswordError(null);
  };

  const openUserSelector = (mode: 'video' | 'home') => {
    setUserSelectorMode(mode);
    setUserSearchQuery('');
    setAvailableUsers(realtimeUsers.length > 0 ? realtimeUsers : users);
    setShowUserSelector(true);
  };

  const handleUserSelection = (userId: number, selected: boolean, mode: 'video' | 'home') => {
    if (mode === 'video') {
      setVideoForm(prev => ({
        ...prev,
        selected_user_ids: selected 
          ? [...prev.selected_user_ids, userId]
          : prev.selected_user_ids.filter(id => id !== userId)
      }));
    } else {
      setHomeVideoForm(prev => ({
        ...prev,
        selected_user_ids: selected 
          ? [...prev.selected_user_ids, userId]
          : prev.selected_user_ids.filter(id => id !== userId)
      }));
    }
  };

  const createHomeBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim() || !bannerForm.image_url.trim()) {
      alert('Por favor, informe o título e a URL da imagem');
      return;
    }

    setBannerSubmitting(true);
    try {
      const response = await fetch('/api/admin/home-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bannerForm),
      });

      if (response.ok) {
        setBannerForm({
          title: '',
          image_url: '',
          link_url: '',
          description: '',
          is_active: true,
          display_order: 0,
        });
        
        loadData(true);
        alert('Banner criado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao criar banner: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert('Erro ao criar banner');
      console.error(error);
    } finally {
      setBannerSubmitting(false);
    }
  };

  const updateHomeBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !bannerForm.title.trim() || !bannerForm.image_url.trim()) {
      alert('Por favor, informe o título e a URL da imagem');
      return;
    }

    setBannerSubmitting(true);
    try {
      const response = await fetch(`/api/admin/home-banners/${editingBanner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bannerForm),
      });

      if (response.ok) {
        setBannerForm({
          title: '',
          image_url: '',
          link_url: '',
          description: '',
          is_active: true,
          display_order: 0,
        });
        setEditingBanner(null);
        
        loadData(true);
        alert('Banner atualizado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao atualizar banner: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert('Erro ao atualizar banner');
      console.error(error);
    } finally {
      setBannerSubmitting(false);
    }
  };

  const deleteHomeBanner = async (bannerId: number, title: string) => {
    const confirmDelete = confirm(`Tem certeza que deseja excluir o banner "${title}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/admin/home-banners/${bannerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadData();
        alert('Banner excluído com sucesso!');
      } else {
        alert('Erro ao excluir banner');
      }
    } catch (error) {
      alert('Erro ao excluir banner');
    }
  };

  const editHomeBanner = (banner: HomeBanner) => {
    setBannerForm({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      description: banner.description || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setEditingBanner(banner);
  };

  const cancelBannerEdit = () => {
    setBannerForm({
      title: '',
      image_url: '',
      link_url: '',
      description: '',
      is_active: true,
      display_order: 0,
    });
    setEditingBanner(null);
  };

  const handleChatReply = async (messageId: number) => {
    if (!replyText.trim() || replyText.trim().length < 5) {
      toast.error('A resposta deve ter pelo menos 5 caracteres');
      return;
    }

    setReplySubmitting(true);

    try {
      const response = await fetch(`/api/admin/chat/${messageId}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (response.ok) {
        toast.success('Resposta enviada com sucesso!');
        setReplyingTo(null);
        setReplyText('');
        loadData(true); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar resposta');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setReplySubmitting(false);
    }
  };

  const markChatAsRead = async (messageId: number) => {
    try {
      await fetch(`/api/admin/chat/${messageId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      loadData(); // Refresh data silently
    } catch (error) {
      // Ignore errors for marking as read
    }
  };

  const deleteChatMessage = async (messageId: number) => {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;

    try {
      const response = await fetch(`/api/admin/chat/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Mensagem deletada com sucesso!');
        loadData(true);
      } else {
        toast.error('Erro ao deletar mensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const getSelectedUserNames = (mode: 'video' | 'home') => {
    const selectedIds = mode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids;
    const userList = availableUsers.length > 0 ? availableUsers : (realtimeUsers.length > 0 ? realtimeUsers : users);
    return userList.filter(user => selectedIds.includes(user.id)).map(user => user.name || user.email);
  };

  const updateVipLink = async (level: number, paymentUrl: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/vip-links/${level}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ payment_url: paymentUrl, is_active: isActive }),
      });

      if (response.ok) {
        loadData(true);
        alert('Link de pagamento atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar link de pagamento');
      }
    } catch (error) {
      alert('Erro ao atualizar link de pagamento');
    }
  };

  

  const activateVipSubscription = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}/activate-vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Assinatura VIP ativada com sucesso!');
        loadData(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao ativar assinatura VIP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar assinatura VIP');
    }
  };

  const handleApprovePayment = async (transactionId: number, planType: 'intermediate' | 'vip', vipLevel?: number) => {
    const transaction = pushinTransactions.find(t => t.id === transactionId);
    if (!transaction) {
      alert('Transação não encontrada');
      return;
    }

    const planDescription = planType === 'intermediate' 
      ? 'Intermediário' 
      : `VIP ${vipLevel}`;
      
    const confirmMessage = `Deseja aprovar o pagamento de ${transaction.user_name || transaction.user_email} no valor de R$ ${transaction.amount.toFixed(2)} para o plano ${planDescription}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      let endpoint = '';
      let payload = {};

      if (planType === 'intermediate') {
        // Process intermediate plan activation
        endpoint = '/api/admin/intermediate-purchases';
        payload = {
          user_email: transaction.user_email,
          amount: transaction.amount,
          payment_reference: transaction.qr_code_id,
          payment_status: 'completed'
        };
      } else if (planType === 'vip' && vipLevel) {
        // Process VIP plan activation
        endpoint = '/api/admin/vip-purchases';
        payload = {
          user_email: transaction.user_email,
          vip_level: vipLevel,
          amount: transaction.amount,
          payment_reference: transaction.qr_code_id,
          payment_status: 'completed'
        };
      }

      // First, activate the plan
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Then update the transaction status
        const updateResponse = await fetch(`/api/admin/pushin-transactions/${transactionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'approved' }),
        });

        if (updateResponse.ok) {
          loadData(true);
          alert(`Pagamento aprovado com sucesso! Plano ${planDescription} ativado para ${transaction.user_name || transaction.user_email}.`);
        } else {
          alert('Plano ativado, mas erro ao atualizar status da transação');
        }
      } else {
        const error = await response.json();
        alert(`Erro ao ativar plano: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Erro ao aprovar pagamento. Tente novamente.');
    }
  };

  const handleBalanceTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!balanceTransferForm.user_email || !balanceTransferForm.amount || !balanceTransferForm.reason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (balanceTransferForm.amount <= 0) {
      toast.error('O valor deve ser maior que zero');
      return;
    }

    const confirmMessage = `Tem certeza que deseja ${balanceTransferForm.type === 'add' ? 'ADICIONAR' : 'SUBTRAIR'} R$ ${balanceTransferForm.amount.toFixed(2)} ${balanceTransferForm.type === 'add' ? 'para' : 'de'} ${balanceTransferForm.user_email}?\n\nMotivo: ${balanceTransferForm.reason}`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setBalanceTransferSubmitting(true);

    try {
      const response = await fetch('/api/admin/balance-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(balanceTransferForm)
      });

      if (response.ok) {
        toast.success(`Saldo ${balanceTransferForm.type === 'add' ? 'adicionado' : 'subtraído'} com sucesso!`);
        setBalanceTransferForm({ user_email: '', amount: 0, reason: '', type: 'add' });
        loadData(true); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        toast.error(`Erro: ${errorData.error || 'Falha ao processar transferência'}`);
      }
    } catch (error) {
      console.error('Error processing balance transfer:', error);
      toast.error('Erro ao processar transferência');
    } finally {
      setBalanceTransferSubmitting(false);
    }
  };

  

  const loadUserVideos = async (user: AdminUser) => {
    setSelectedUser(user);
    setLoadingUserVideos(true);
    setShowUserVideos(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/videos`, {
        credentials: 'include'
      });

      if (response.ok) {
        const videos = await response.json();
        setUserVideos(videos);
      } else {
        const error = await response.json();
        alert(`Erro ao carregar vídeos: ${error.error || 'Erro desconhecido'}`);
        setUserVideos([]);
      }
    } catch (error) {
      console.error('Error loading user videos:', error);
      alert('Erro ao carregar vídeos do usuário');
      setUserVideos([]);
    } finally {
      setLoadingUserVideos(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando painel admin...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'real-time-users', name: 'Monitor Usuários', icon: Activity },
    { id: 'user-videos-stats', name: 'Vídeos por Usuário', icon: Video },
    { id: 'bonus-videos', name: 'Bônus de Vídeos', icon: Gift },
    { id: 'ranking-generator', name: 'Gerador Ranking', icon: Trophy },
    { id: 'money', name: 'Money', icon: DollarSign },
    { id: 'live-activities', name: 'Atividades ao Vivo', icon: Activity },
    { id: 'chat-live', name: 'Chat ao Vivo', icon: MessageCircle },
    { id: 'announcements', name: 'Anúncios', icon: AlertCircle },
    { id: 'home-page', name: 'Página Inicial', icon: Home },
    { id: 'home-banners', name: 'Banners da Home', icon: Star },
    { id: 'users', name: 'Usuários', icon: Users },
    { id: 'fake-users', name: 'Usuários Fakes', icon: Users },
    { id: 'videos', name: 'Vídeos', icon: Video },
    { id: 'withdrawals', name: 'Saques', icon: DollarSign },
    { id: 'coupons', name: 'Cupons', icon: Ticket },
    { id: 'pix-payments', name: 'Pagamentos PIX', icon: DollarSign },
    { id: 'vip-plans', name: 'Planos VIP', icon: Crown },
    { id: 'vip-purchases', name: 'Compras VIP', icon: Star },
    { id: 'vip-groups', name: 'Grupos VIP', icon: Users },
    { id: 'webhooks', name: 'Webhooks', icon: ExternalLink },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <p className="text-white/70 mt-2">Gerencie todos os aspectos da plataforma NextFund</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Real-time indicator */}
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className={`w-2 h-2 rounded-full ${
                  isRefreshing ? 'bg-yellow-400 animate-pulse' : 
                  newDataIndicator ? 'bg-blue-400 animate-bounce' : 
                  'bg-green-400'
                }`}></div>
                <span>{
                  isRefreshing ? 'Atualizando...' : 
                  newDataIndicator ? '🔥 Novos dados detectados!' : 
                  '✅ Tempo real ativo'
                }</span>
                {lastUpdated && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
              
              {/* Manual refresh button */}
              <div className="flex gap-2">
                <Button
                  onClick={() => loadData(true)}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/5 p-1 rounded-2xl overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total de Usuários</p>
                    <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total de Vídeos</p>
                    <p className="text-2xl font-bold">{stats?.total_videos || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total Pago</p>
                    <p className="text-2xl font-bold">R$ {stats?.total_earnings?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-orange-400" />
                  <div>
                    <p className="text-white/70 text-sm">Saques Pendentes</p>
                    <p className="text-2xl font-bold">{stats?.pending_withdrawals || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className="text-white/70 text-sm">Cadastros Hoje</p>
                    <p className="text-2xl font-bold">{stats?.today_signups || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-pink-400" />
                  <div>
                    <p className="text-white/70 text-sm">Vídeos Hoje</p>
                    <p className="text-2xl font-bold">{stats?.today_videos_watched || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'user-videos-stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Quantidade de Vídeos por Usuário</h2>
              <div className="flex gap-4 items-center">
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-64"
                />
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos Hoje</option>
                  <option value="inactive">Inativos</option>
                  <option value="admins">Administradores</option>
                </select>
                <Button
                  onClick={() => loadData(true)}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                  className="text-green-400 hover:bg-green-500/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70 text-sm">Vídeos Disponíveis</p>
                    <p className="text-xl font-bold text-blue-400">
                      {stats?.total_videos || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-white/70 text-sm">Vídeos Assistidos</p>
                    <p className="text-xl font-bold text-green-400">
                      {realtimeUsers.reduce((sum, u) => sum + u.total_videos_watched, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-purple-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total de Usuários</p>
                    <p className="text-xl font-bold text-purple-400">
                      {realtimeUsers.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-orange-400" />
                  <div>
                    <p className="text-white/70 text-sm">Vídeos Hoje (Total)</p>
                    <p className="text-xl font-bold text-orange-400">
                      {realtimeUsers.reduce((sum, u) => sum + (u.videos_today || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-cyan-400" />
                  <div>
                    <p className="text-white/70 text-sm">Média de Vídeos</p>
                    <p className="text-xl font-bold text-cyan-400">
                      {realtimeUsers.length > 0 ? 
                        (realtimeUsers.reduce((sum, u) => sum + u.total_videos_watched, 0) / realtimeUsers.length).toFixed(1) : 
                        '0'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 10 Usuários com Mais Vídeos */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Top 10 - Usuários com Mais Vídeos Assistidos
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">#</th>
                      <th className="px-4 py-3 text-left text-white">Usuário</th>
                      <th className="px-4 py-3 text-left text-white">Total de Vídeos</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Hoje</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Esta Semana</th>
                      <th className="px-4 py-3 text-left text-white">Total Ganho</th>
                      <th className="px-4 py-3 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {realtimeUsers
                      .sort((a, b) => b.total_videos_watched - a.total_videos_watched)
                      .slice(0, 10)
                      .map((user, index) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm font-bold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                user.videos_today && user.videos_today > 0 ? 'bg-green-400' : 'bg-gray-500'
                              }`}></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                  {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                </div>
                                <div className="text-gray-400 text-sm">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-bold text-lg">
                                {user.total_videos_watched}
                              </span>
                              <span className="text-gray-400 text-sm">vídeos</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-bold">
                                {user.videos_today || 0}
                              </span>
                              <span className="text-gray-400 text-sm">
                                / {user.daily_limit || 15}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-purple-400 font-bold">
                              {user.videos_this_week || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-yellow-400 font-bold">
                              R$ {user.total_earnings.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => loadUserVideos(user)}
                              className="text-blue-400 hover:bg-blue-500/20"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Vídeos
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lista Completa de Usuários com Quantidade de Vídeos */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quantidade de Vídeos por Conta de Usuário ({
                realtimeUsers.filter(user => {
                  const matchesSearch = !userSearch || 
                    user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                    user.email.toLowerCase().includes(userSearch.toLowerCase());
                  
                  switch (userFilter) {
                    case 'active': return matchesSearch && user.videos_today && user.videos_today > 0;
                    case 'inactive': return matchesSearch && (!user.videos_today || user.videos_today === 0);
                    case 'admins': return matchesSearch && user.is_admin;
                    default: return matchesSearch;
                  }
                }).length
              })</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">Usuário</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Disponíveis</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Assistidos</th>
                      <th className="px-4 py-3 text-left text-white">Progresso Hoje</th>
                      <th className="px-4 py-3 text-left text-white">Limite Diário</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Bônus</th>
                      <th className="px-4 py-3 text-left text-white">Tipo de Conta</th>
                      <th className="px-4 py-3 text-left text-white">Status</th>
                      <th className="px-4 py-3 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {realtimeUsers
                      .filter(user => {
                        const matchesSearch = !userSearch || 
                          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          user.email.toLowerCase().includes(userSearch.toLowerCase());
                        
                        switch (userFilter) {
                          case 'active': return matchesSearch && user.videos_today && user.videos_today > 0;
                          case 'inactive': return matchesSearch && (!user.videos_today || user.videos_today === 0);
                          case 'admins': return matchesSearch && user.is_admin;
                          default: return matchesSearch;
                        }
                      })
                      .sort((a, b) => {
                        // Sort by videos available (daily limit + bonus), then by total watched
                        const aTotal = (a.daily_limit || 15) + (a.bonus_videos || 0);
                        const bTotal = (b.daily_limit || 15) + (b.bonus_videos || 0);
                        if (aTotal !== bTotal) return bTotal - aTotal;
                        return b.total_videos_watched - a.total_videos_watched;
                      })
                      .map((user) => {
                        const videosAvailable = (user.daily_limit || 15) + (user.bonus_videos || 0);
                        const accountType = user.is_admin ? 'Admin' : 
                          (user.level || 1) >= 4 ? 'VIP Alto' :
                          (user.level || 1) >= 2 ? 'VIP' : 'Padrão';
                        
                        return (
                          <tr key={user.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  user.videos_today && user.videos_today > 0 ? 'bg-green-400' : 'bg-gray-500'
                                }`}></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                    {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                  </div>
                                  <div className="text-gray-400 text-sm">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400">
                                  {videosAvailable}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {user.daily_limit || 15} + {user.bonus_videos || 0} bônus
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-400">
                                  {user.total_videos_watched}
                                </div>
                                <div className="text-xs text-gray-400">total</div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400 font-bold">
                                    {user.videos_today || 0}
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    / {user.daily_limit || 15}
                                  </span>
                                </div>
                                <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(100, ((user.videos_today || 0) / (user.daily_limit || 15)) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <span className="text-white font-semibold text-lg">
                                  {user.daily_limit || 15}
                                </span>
                                {user.custom_daily_limit && (
                                  <div className="mt-1">
                                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                                      Personalizado
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-4 py-3 text-center">
                              {user.bonus_videos && user.bonus_videos > 0 ? (
                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-sm font-bold">
                                  +{user.bonus_videos}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  user.is_admin ? 'bg-yellow-500/20 text-yellow-400' :
                                  (user.level || 1) >= 4 ? 'bg-purple-500/20 text-purple-400' :
                                  (user.level || 1) >= 2 ? 'bg-blue-500/20 text-blue-400' : 
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {accountType}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Nível {user.level || 1}
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.videos_today && user.videos_today > 0 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {user.videos_today && user.videos_today > 0 ? '🟢 Ativo' : '🔴 Inativo'}
                                </span>
                                <div className="text-xs text-gray-400 mt-1">
                                  {user.last_video_date ? 
                                    new Date(user.last_video_date).toLocaleDateString('pt-BR') : 
                                    'Nunca assistiu'
                                  }
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserVideosViewModalOpen(true);
                                  }}
                                  className="text-blue-400 hover:bg-blue-500/20"
                                  title="Ver vídeos disponíveis na conta"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setQuickAssignModalOpen(true);
                                  }}
                                  className="text-green-400 hover:bg-green-500/20"
                                  title="Atribuir mais vídeos"
                                >
                                  <Video className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bonus-videos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gerenciar Usuários com Bônus de Vídeos</h2>
              <div className="flex gap-4 items-center">
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-64"
                />
                <Button
                  onClick={() => loadData(true)}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                  className="text-green-400 hover:bg-green-500/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Estatísticas de Bônus */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6 text-orange-400" />
                  <div>
                    <p className="text-white/70 text-sm">Usuários com Bônus</p>
                    <p className="text-xl font-bold text-orange-400">
                      {realtimeUsers.filter(u => u.bonus_videos && u.bonus_videos > 0).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total Vídeos Bônus</p>
                    <p className="text-xl font-bold text-blue-400">
                      {realtimeUsers.reduce((sum, u) => sum + (u.bonus_videos || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-yellow-400" />
                  <div>
                    <p className="text-white/70 text-sm">Maior Bônus</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {Math.max(...realtimeUsers.map(u => u.bonus_videos || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                  <div>
                    <p className="text-white/70 text-sm">Média de Bônus</p>
                    <p className="text-xl font-bold text-purple-400">
                      {realtimeUsers.length > 0 ? 
                        (realtimeUsers.reduce((sum, u) => sum + (u.bonus_videos || 0), 0) / realtimeUsers.length).toFixed(1) : 
                        '0'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Usuários com Mais Bônus */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Top 10 - Usuários com Mais Vídeos Bônus
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">#</th>
                      <th className="px-4 py-3 text-left text-white">Usuário</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Bônus</th>
                      <th className="px-4 py-3 text-left text-white">Nível</th>
                      <th className="px-4 py-3 text-left text-white">Total de Vídeos</th>
                      <th className="px-4 py-3 text-left text-white">Última Atividade</th>
                      <th className="px-4 py-3 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {realtimeUsers
                      .filter(user => user.bonus_videos && user.bonus_videos > 0)
                      .sort((a, b) => (b.bonus_videos || 0) - (a.bonus_videos || 0))
                      .slice(0, 10)
                      .map((user, index) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-yellow-600 text-white text-sm font-bold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                user.videos_today && user.videos_today > 0 ? 'bg-green-400' : 'bg-gray-500'
                              }`}></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                  {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                </div>
                                <div className="text-gray-400 text-sm">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Gift className="h-5 w-5 text-orange-400" />
                              <span className="text-orange-400 font-bold text-lg">
                                {user.bonus_videos || 0}
                              </span>
                              <span className="text-gray-400 text-sm">vídeos</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-purple-400 font-bold">
                              Nível {user.level || 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-blue-400 font-bold">
                              {user.total_videos_watched}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300 text-sm">
                              {user.last_video_date ? 
                                new Date(user.last_video_date).toLocaleDateString('pt-BR') : 
                                'Nunca assistiu'
                              }
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserVideosViewModalOpen(true);
                                }}
                                className="text-blue-400 hover:bg-blue-500/20"
                                title="Ver vídeos disponíveis"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setQuickAssignModalOpen(true);
                                }}
                                className="text-green-400 hover:bg-green-500/20"
                                title="Atribuir mais vídeos"
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lista Completa de Usuários com Bônus */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-400" />
                Todos os Usuários com Vídeos Bônus ({
                  realtimeUsers.filter(user => {
                    const hasBonus = user.bonus_videos && user.bonus_videos > 0;
                    const matchesSearch = !userSearch || 
                      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      user.email.toLowerCase().includes(userSearch.toLowerCase());
                    return hasBonus && matchesSearch;
                  }).length
                })
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">Usuário</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Bônus</th>
                      <th className="px-4 py-3 text-left text-white">Limite Diário Total</th>
                      <th className="px-4 py-3 text-left text-white">Progresso Hoje</th>
                      <th className="px-4 py-3 text-left text-white">Nível/Tipo</th>
                      <th className="px-4 py-3 text-left text-white">Saldo</th>
                      <th className="px-4 py-3 text-left text-white">Total Ganho</th>
                      <th className="px-4 py-3 text-left text-white">Status</th>
                      <th className="px-4 py-3 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {realtimeUsers
                      .filter(user => {
                        const hasBonus = user.bonus_videos && user.bonus_videos > 0;
                        const matchesSearch = !userSearch || 
                          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          user.email.toLowerCase().includes(userSearch.toLowerCase());
                        return hasBonus && matchesSearch;
                      })
                      .sort((a, b) => (b.bonus_videos || 0) - (a.bonus_videos || 0))
                      .map((user) => {
                        const totalLimit = (user.daily_limit || 15) + (user.bonus_videos || 0);
                        const accountType = user.is_admin ? 'Admin' : 
                          (user.level || 1) >= 4 ? 'VIP Alto' :
                          (user.level || 1) >= 2 ? 'VIP' : 'Padrão';
                        
                        return (
                          <tr key={user.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  user.videos_today && user.videos_today > 0 ? 'bg-green-400' : 'bg-gray-500'
                                }`}></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                    {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                  </div>
                                  <div className="text-gray-400 text-sm">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-400">
                                    +{user.bonus_videos || 0}
                                  </div>
                                  <div className="text-xs text-gray-400">bônus</div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <div className="text-xl font-bold text-cyan-400">
                                  {totalLimit}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {user.daily_limit || 15} normal + {user.bonus_videos || 0} bônus
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400 font-bold">
                                    {user.videos_today || 0}
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    / {totalLimit}
                                  </span>
                                </div>
                                <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(100, ((user.videos_today || 0) / totalLimit) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  user.is_admin ? 'bg-yellow-500/20 text-yellow-400' :
                                  (user.level || 1) >= 4 ? 'bg-purple-500/20 text-purple-400' :
                                  (user.level || 1) >= 2 ? 'bg-blue-500/20 text-blue-400' : 
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {accountType}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Nível {user.level || 1}
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <span className="text-green-400 font-bold">
                                R$ {user.current_balance.toFixed(2)}
                              </span>
                            </td>
                            
                            <td className="px-4 py-3">
                              <span className="text-yellow-400 font-bold">
                                R$ {user.total_earnings.toFixed(2)}
                              </span>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.videos_today && user.videos_today > 0 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {user.videos_today && user.videos_today > 0 ? '🟢 Ativo' : '🔴 Inativo'}
                                </span>
                                <div className="text-xs text-gray-400 mt-1">
                                  {user.last_video_date ? 
                                    new Date(user.last_video_date).toLocaleDateString('pt-BR') : 
                                    'Nunca'
                                  }
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserVideosViewModalOpen(true);
                                  }}
                                  className="text-blue-400 hover:bg-blue-500/20"
                                  title="Ver vídeos na conta"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setQuickAssignModalOpen(true);
                                  }}
                                  className="text-green-400 hover:bg-green-500/20"
                                  title="Atribuir mais vídeos"
                                >
                                  <Video className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {realtimeUsers.filter(user => {
                const hasBonus = user.bonus_videos && user.bonus_videos > 0;
                const matchesSearch = !userSearch || 
                  user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearch.toLowerCase());
                return hasBonus && matchesSearch;
              }).length === 0 && (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {userSearch ? 'Nenhum usuário encontrado' : 'Nenhum usuário com vídeos bônus'}
                  </h3>
                  <p className="text-gray-400">
                    {userSearch 
                      ? 'Tente alterar os termos de busca'
                      : 'Ainda não há usuários com vídeos bônus atribuídos'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Instruções para Uso */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Como Usar esta Funcionalidade
              </h3>
              <div className="space-y-2 text-blue-300 text-sm">
                <p>• <strong>Ver conta:</strong> Clique no ícone do olho para ver todos os vídeos disponíveis na conta do usuário</p>
                <p>• <strong>Atribuir vídeos:</strong> Clique no ícone de vídeo para atribuir vídeos extras específicos para o usuário</p>
                <p>• <strong>Vídeos bônus:</strong> São vídeos extras que não contam no limite diário normal do usuário</p>
                <p>• <strong>Status ativo:</strong> Usuários com ponto verde assistiram vídeos hoje</p>
                <p>• <strong>Filtros:</strong> Use a busca para encontrar usuários específicos por nome ou email</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'real-time-users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Monitor de Usuários em Tempo Real</h2>
              <div className="flex gap-4 items-center">
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-64"
                />
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos Hoje</option>
                  <option value="inactive">Inativos</option>
                  <option value="admins">Administradores</option>
                </select>
                <Button
                  onClick={() => loadData(true)}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                  className="text-green-400 hover:bg-green-500/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-white/70 text-sm">Usuários Ativos Hoje</p>
                    <p className="text-xl font-bold text-green-400">
                      {realtimeUsers.filter(u => u.videos_today && u.videos_today > 0).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70 text-sm">Vídeos Hoje</p>
                    <p className="text-xl font-bold text-blue-400">
                      {realtimeUsers.reduce((sum, u) => sum + (u.videos_today || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-yellow-400" />
                  <div>
                    <p className="text-white/70 text-sm">Saldo Total</p>
                    <p className="text-xl font-bold text-yellow-400">
                      R$ {realtimeUsers.reduce((sum, u) => sum + u.current_balance, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-purple-400" />
                  <div>
                    <p className="text-white/70 text-sm">Administradores</p>
                    <p className="text-xl font-bold text-purple-400">
                      {realtimeUsers.filter(u => u.is_admin).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de usuários em tempo real */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Usuários ({
                  realtimeUsers.filter(user => {
                    const matchesSearch = !userSearch || 
                      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      user.email.toLowerCase().includes(userSearch.toLowerCase());
                    
                    switch (userFilter) {
                      case 'active': return matchesSearch && user.videos_today && user.videos_today > 0;
                      case 'inactive': return matchesSearch && (!user.videos_today || user.videos_today === 0);
                      case 'admins': return matchesSearch && user.is_admin;
                      default: return matchesSearch;
                    }
                  }).length
                })</h3>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span>Atualização automática</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">Usuário</th>
                      <th className="px-4 py-3 text-left text-white">Status</th>
                      <th className="px-4 py-3 text-left text-white">Nível</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Hoje</th>
                      <th className="px-4 py-3 text-left text-white">Saldo</th>
                      <th className="px-4 py-3 text-left text-white">Total Ganhos</th>
                      <th className="px-4 py-3 text-left text-white">Última Atividade</th>
                      <th className="px-4 py-3 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {realtimeUsers
                      .filter(user => {
                        const matchesSearch = !userSearch || 
                          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          user.email.toLowerCase().includes(userSearch.toLowerCase());
                        
                        switch (userFilter) {
                          case 'active': return matchesSearch && user.videos_today && user.videos_today > 0;
                          case 'inactive': return matchesSearch && (!user.videos_today || user.videos_today === 0);
                          case 'admins': return matchesSearch && user.is_admin;
                          default: return matchesSearch;
                        }
                      })
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                user.videos_today && user.videos_today > 0 ? 'bg-green-400' : 'bg-gray-500'
                              }`}></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                  {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                </div>
                                <div className="text-gray-400 text-sm">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.videos_today && user.videos_today > 0 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.videos_today && user.videos_today > 0 ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400 font-semibold">
                                Nível {user.level || 1}
                              </span>
                              <span className="text-gray-400 text-sm">
                                ({user.level_title || 'Iniciante'})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-bold">
                                {user.videos_today || 0}
                              </span>
                              <span className="text-gray-400 text-sm">
                                / {user.daily_limit || 15}
                              </span>
                              {user.bonus_videos && user.bonus_videos > 0 && (
                                <span className="px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                                  +{user.bonus_videos} bônus
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-green-400 font-semibold">
                              R$ {user.current_balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-yellow-400 font-semibold">
                              R$ {user.total_earnings.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300 text-sm">
                              {user.last_activity ? 
                                new Date(user.last_activity).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 
                                'Nunca'
                              }
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetails(true);
                                }}
                                className="text-blue-400 hover:bg-blue-500/20"
                                title="Ver detalhes do usuário"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserVideosViewModalOpen(true);
                                }}
                                className="text-purple-400 hover:bg-purple-500/20"
                                title="Ver vídeos na conta do usuário"
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Ver Conta
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setQuickAssignModalOpen(true);
                                }}
                                className="text-green-400 hover:bg-green-500/20"
                                title="Adicionar mais vídeos"
                              >
                                <Video className="h-4 w-4 mr-1" />
                                + Vídeos
                              </Button>
                              {user.auth_provider === 'email' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openResetPasswordModal(user.id)}
                                  className="text-orange-400 hover:bg-orange-500/20"
                                  title="Resetar senha do usuário"
                                >
                                  🔄
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal de detalhes do usuário */}
            {showUserDetails && selectedUser && (
              <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Detalhes do Usuário: {selectedUser.name || selectedUser.email}
                      {selectedUser.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Informações detalhadas e atividades recentes
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Informações gerais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-sm">Saldo Atual</div>
                        <div className="text-green-400 text-xl font-bold">
                          R$ {selectedUser.current_balance.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-sm">Total de Ganhos</div>
                        <div className="text-yellow-400 text-xl font-bold">
                          R$ {selectedUser.total_earnings.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-sm">Vídeos Hoje</div>
                        <div className="text-blue-400 text-xl font-bold">
                          {selectedUser.videos_today || 0} / {selectedUser.daily_limit || 15}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-gray-400 text-sm">Total de Vídeos</div>
                        <div className="text-purple-400 text-xl font-bold">
                          {selectedUser.total_videos_watched}
                        </div>
                      </div>
                    </div>

                    {/* Atividades recentes */}
                    {selectedUser.recent_activities && selectedUser.recent_activities.length > 0 && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <h4 className="text-white font-semibold mb-3">Atividades Recentes</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedUser.recent_activities.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-white/10">
                              <div>
                                <div className="text-white text-sm">{activity.description}</div>
                                <div className="text-gray-400 text-xs">
                                  {new Date(activity.timestamp).toLocaleString('pt-BR')}
                                </div>
                              </div>
                              {activity.earnings && (
                                <div className="text-green-400 font-semibold">
                                  +R$ {activity.earnings.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Informações do sistema */}
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-3">Informações do Sistema</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">ID: </span>
                          <span className="text-white">{selectedUser.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Provedor: </span>
                          <span className="text-white">{selectedUser.auth_provider}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Criado em: </span>
                          <span className="text-white">
                            {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Vídeos Bônus: </span>
                          <span className="text-orange-400">{selectedUser.bonus_videos || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setShowUserDetails(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Modal de vídeos do usuário */}
            {showUserVideos && selectedUser && (
              <Dialog open={showUserVideos} onOpenChange={setShowUserVideos}>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Vídeos Assistidos: {selectedUser.name || selectedUser.email}
                      {selectedUser.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Histórico completo de vídeos assistidos pelo usuário
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-auto">
                    {loadingUserVideos ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-3 text-white">Carregando vídeos...</span>
                      </div>
                    ) : userVideos.length === 0 ? (
                      <div className="text-center py-12">
                        <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum vídeo assistido</h3>
                        <p className="text-gray-400">Este usuário ainda não assistiu nenhum vídeo.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Resumo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-white/5 p-4 rounded-lg text-center">
                            <div className="text-purple-400 font-bold text-2xl">
                              {userVideos.length}
                            </div>
                            <div className="text-gray-400 text-sm">Vídeos Assistidos</div>
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg text-center">
                            <div className="text-green-400 font-bold text-2xl">
                              R$ {userVideos.reduce((sum, v) => sum + (v.earnings || 0), 0).toFixed(2)}
                            </div>
                            <div className="text-gray-400 text-sm">Total Ganho</div>
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg text-center">
                            <div className="text-blue-400 font-bold text-2xl">
                              {userVideos.filter(v => v.watch_date === new Date().toISOString().split('T')[0]).length}
                            </div>
                            <div className="text-gray-400 text-sm">Vídeos Hoje</div>
                          </div>
                        </div>

                        {/* Lista de vídeos */}
                        <div className="bg-white/5 rounded-lg overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-white/10 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-white">Vídeo</th>
                                  <th className="px-4 py-3 text-left text-white">Ganhos</th>
                                  <th className="px-4 py-3 text-left text-white">Data</th>
                                  <th className="px-4 py-3 text-left text-white">Quiz</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {userVideos.map((video, index) => (
                                  <tr key={index} className="hover:bg-white/5">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={video.thumbnail_url || (video.video_platform === 'youtube' 
                                            ? `https://img.youtube.com/vi/${video.video_url?.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`
                                            : '/api/placeholder/60/45'
                                          )}
                                          alt={video.title}
                                          className="w-12 h-9 object-cover rounded"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/api/placeholder/60/45';
                                          }}
                                        />
                                        <div>
                                          <div className="text-white font-medium line-clamp-1">
                                            {video.title || 'Título não disponível'}
                                          </div>
                                          <div className="text-gray-400 text-sm capitalize">
                                            {video.video_platform || 'N/A'}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-green-400 font-bold">
                                        R$ {(video.earnings || 0).toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-white">
                                        {video.watch_date ? new Date(video.watch_date).toLocaleDateString('pt-BR') : 'N/A'}
                                      </div>
                                      <div className="text-gray-400 text-sm">
                                        {video.created_at ? new Date(video.created_at).toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) : ''}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      {video.question_answered ? (
                                        <div className="flex items-center gap-2">
                                          {video.answer_correct ? (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                              ✓ Correto
                                            </span>
                                          ) : (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                              ✗ Incorreto
                                            </span>
                                          )}
                                        </div>
                                      ) : video.has_question ? (
                                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                                          Sem pergunta
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-700">
                    <Button
                      variant="ghost"
                      onClick={() => setShowUserVideos(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        

        {activeTab === 'home-page' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Gerenciar Vídeos da Página Inicial</h2>
            
            {/* Form para adicionar vídeo da home */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Adicionar Vídeo na Página Inicial</h3>
              <form onSubmit={createHomeVideo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="URL do Vídeo" required>
                    <Input
                      value={homeVideoForm.video_url}
                      onChange={(e) => handleUrlChange(e.target.value, true)}
                      placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                      required
                    />
                    {homeVideoDetecting && (
                      <div className="text-sm text-yellow-400 mt-1">🔍 Detectando informações do vídeo...</div>
                    )}
                    {homeDetectionMessage && (
                      <div className="text-sm mt-1">{homeDetectionMessage}</div>
                    )}
                  </FormField>

                  <FormField label="Título" required>
                    <Input
                      value={homeVideoForm.title}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do vídeo"
                      required
                    />
                  </FormField>

                  <FormField label="Descrição">
                    <Input
                      value={homeVideoForm.description}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do vídeo"
                    />
                  </FormField>

                  <FormField label="URL da Thumbnail">
                    <Input
                      value={homeVideoForm.thumbnail_url}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      placeholder="URL da imagem de capa"
                    />
                  </FormField>

                  <FormField label="Duração (segundos)">
                    <Input
                      type="number"
                      min="1"
                      value={homeVideoForm.duration_seconds}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                      placeholder="Duração em segundos"
                    />
                  </FormField>

                  <FormField label="Valor da Recompensa (R$)">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={homeVideoForm.reward_amount}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, reward_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="2.00"
                    />
                  </FormField>

                  <FormField label="Pergunta">
                    <Input
                      value={homeVideoForm.question}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Pergunta sobre o vídeo"
                    />
                  </FormField>

                  <FormField label="Resposta Correta">
                    <Input
                      value={homeVideoForm.correct_answer}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                      placeholder="Resposta correta"
                    />
                  </FormField>

                  <FormField label="Resposta Incorreta">
                    <Input
                      value={homeVideoForm.wrong_answer}
                      onChange={(e) => setHomeVideoForm(prev => ({ ...prev, wrong_answer: e.target.value }))}
                      placeholder="Resposta incorreta"
                    />
                  </FormField>
                </div>

                {/* Target Users Selection */}
                <div className="space-y-4 pt-4 border-t border-white/20">
                  <h4 className="text-lg font-semibold text-white">Destinatários do Vídeo</h4>
                  
                  <FormField label="Enviar vídeo para:" required>
                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="home_target_users"
                          value="all"
                          checked={homeVideoForm.target_users === 'all'}
                          onChange={(e) => setHomeVideoForm(prev => ({ 
                            ...prev, 
                            target_users: e.target.value as 'all' | 'specific' | 'bonus_only',
                            selected_user_ids: e.target.value === 'all' ? [] : prev.selected_user_ids
                          }))}
                          className="text-green-500"
                        />
                        <span className="text-white">Todos os usuários</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="home_target_users"
                          value="bonus_only"
                          checked={homeVideoForm.target_users === 'bonus_only'}
                          onChange={(e) => setHomeVideoForm(prev => ({ 
                            ...prev, 
                            target_users: e.target.value as 'all' | 'specific' | 'bonus_only',
                            selected_user_ids: []
                          }))}
                          className="text-orange-500"
                        />
                        <span className="text-white">Apenas usuários com bônus 🎁</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="home_target_users"
                          value="specific"
                          checked={homeVideoForm.target_users === 'specific'}
                          onChange={(e) => setHomeVideoForm(prev => ({ 
                            ...prev, 
                            target_users: e.target.value as 'all' | 'specific' | 'bonus_only' 
                          }))}
                          className="text-green-500"
                        />
                        <span className="text-white">Usuários específicos</span>
                      </label>
                    </div>
                  </FormField>

                  {homeVideoForm.target_users === 'specific' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">
                          {homeVideoForm.selected_user_ids.length} usuário(s) selecionado(s)
                        </span>
                        <Button
                          type="button"
                          onClick={() => openUserSelector('home')}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:bg-blue-500/20"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Selecionar Usuários
                        </Button>
                      </div>
                      
                      {homeVideoForm.selected_user_ids.length > 0 && (
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-sm text-gray-400 mb-2">Usuários selecionados:</div>
                          <div className="flex flex-wrap gap-2">
                            {getSelectedUserNames('home').map((name, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-sm">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={homeSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {homeSubmitting ? 'Adicionando...' : 'Adicionar Vídeo na Home'}
                </Button>
              </form>
            </div>

            {/* Lista de vídeos da home */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Vídeos da Página Inicial</h3>
                {selectedHomeVideos.length > 0 && (
                  <Button
                    onClick={() => deleteSelectedVideos(true)}
                    variant="ghost"
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir Selecionados ({selectedHomeVideos.length})
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={isAllHomeSelected}
                          onChange={() => toggleSelectAll(true)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-white">Título</th>
                      <th className="px-4 py-2 text-left text-white">Plataforma</th>
                      <th className="px-4 py-2 text-left text-white">Recompensa</th>
                      <th className="px-4 py-2 text-left text-white">Destinatários</th>
                      <th className="px-4 py-2 text-left text-white">Status</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {homeVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedHomeVideos.includes(video.id)}
                            onChange={() => toggleVideoSelection(video.id, true)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={video.video_platform === 'youtube' 
                                ? `https://img.youtube.com/vi/${video.video_url.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`
                                : (video as any).thumbnail_url || '/api/placeholder/120/90'
                              }
                              alt={video.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="text-white font-medium">{video.title}</div>
                              <div className="text-gray-400 text-sm">{video.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white capitalize">{video.video_platform}</td>
                        <td className="px-4 py-2 text-green-400">R$ {video.reward_amount.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          {(video as any).assigned_users_count > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-400 font-semibold">
                                  {(video as any).assigned_users_count} usuário(s)
                                </span>
                              </div>
                              {(video as any).assigned_users && (video as any).assigned_users.length > 0 && (
                                <div className="max-w-xs">
                                  <div className="text-xs text-gray-400 truncate">
                                    {(video as any).assigned_users.slice(0, 3).map((user: any) => user.name || user.email).join(', ')}
                                    {(video as any).assigned_users.length > 3 && ` +${(video as any).assigned_users.length - 3} mais`}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-400" />
                              <span className="text-green-400">Todos os usuários</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => toggleVideoStatus(video.id, video.is_active, true)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              video.is_active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {video.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {video.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(video.video_url, '_blank')}
                              className="text-blue-400 hover:bg-blue-500/20"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteVideo(video.id, video.title, true)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Gerenciar Usuários Reais</h2>
            
            {/* Administradores */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="h-6 w-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Administradores</h3>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  {users.filter(user => user.is_admin && !user.is_fake).length}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Nome</th>
                      <th className="px-4 py-2 text-left text-white">Email</th>
                      <th className="px-4 py-2 text-left text-white">Saldo</th>
                      <th className="px-4 py-2 text-left text-white">Total Ganho</th>
                      <th className="px-4 py-2 text-left text-white">Vídeos</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.filter(user => user.is_admin && !user.is_fake).map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-400" />
                            <span className="text-white">{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white">{user.email}</td>
                        <td className="px-4 py-2 text-green-400">R$ {user.current_balance.toFixed(2)}</td>
                        <td className="px-4 py-2 text-blue-400">R$ {user.total_earnings.toFixed(2)}</td>
                        <td className="px-4 py-2 text-purple-400">{user.total_videos_watched}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                              className="text-orange-400 hover:bg-orange-500/20"
                            >
                              Remover Admin
                            </Button>
                            {user.auth_provider === 'email' && !user.has_password && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openCreatePasswordModal(user.id)}
                                className="text-green-400 hover:bg-green-500/20"
                              >
                                Criar Senha
                              </Button>
                            )}
                            {user.auth_provider === 'email' && user.has_password === 'Sim' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openResetPasswordModal(user.id)}
                                className="text-orange-400 hover:bg-orange-500/20"
                                title="Resetar senha do usuário"
                              >
                                Resetar Senha
                              </Button>
                            )}
                            {user.auth_provider === 'email' && user.has_password === 'Sim' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openResetPasswordModal(user.id)}
                                className="text-orange-400 hover:bg-orange-500/20"
                                title="Resetar senha do usuário"
                              >
                                Resetar Senha
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.filter(user => user.is_admin && !user.is_fake).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum administrador encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Usuários Normais */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Usuários Reais</h3>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  {users.filter(user => !user.is_admin && !user.is_fake).length}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Nome</th>
                      <th className="px-4 py-2 text-left text-white">Email</th>
                      <th className="px-4 py-2 text-left text-white">Saldo</th>
                      <th className="px-4 py-2 text-left text-white">Total Ganho</th>
                      <th className="px-4 py-2 text-left text-white">Vídeos</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.filter(user => !user.is_admin && !user.is_fake).map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-white">{user.name || 'N/A'}</td>
                        <td className="px-4 py-2 text-white">{user.email}</td>
                        <td className="px-4 py-2 text-green-400">R$ {user.current_balance.toFixed(2)}</td>
                        <td className="px-4 py-2 text-blue-400">R$ {user.total_earnings.toFixed(2)}</td>
                        <td className="px-4 py-2 text-purple-400">{user.total_videos_watched}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                              className="text-yellow-400 hover:bg-yellow-500/20"
                            >
                              Promover Admin
                            </Button>
                            {user.auth_provider === 'email' && !user.has_password && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openCreatePasswordModal(user.id)}
                                className="text-green-400 hover:bg-green-500/20"
                              >
                                Criar Senha
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.filter(user => !user.is_admin && !user.is_fake).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum usuário real encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Modal para criar senha */}
            {isCreatingPassword && (
              <Dialog open={isCreatingPassword !== null} onOpenChange={() => setIsCreatingPassword(null)}>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Nova Senha</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Crie uma nova senha para este usuário.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {createPasswordError && (
                    <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
                      {createPasswordError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <FormField label="Nova Senha">
                      <Input
                        type="password"
                        value={newPasswordForm.password}
                        onChange={(e) => setNewPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Digite a nova senha"
                      />
                    </FormField>

                    <FormField label="Confirmar Senha">
                      <Input
                        type="password"
                        value={newPasswordForm.confirmPassword}
                        onChange={(e) => setNewPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirme a nova senha"
                      />
                    </FormField>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingPassword(null)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleCreatePassword(isCreatingPassword)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      Criar Senha
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Modal para resetar senha */}
            {isResettingPassword && (
              <Dialog open={isResettingPassword !== null} onOpenChange={() => setIsResettingPassword(null)}>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      🔄 Resetar Senha do Usuário
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Defina uma nova senha para o usuário que esqueceu suas credenciais. 
                      A senha atual será substituída e o usuário poderá fazer login imediatamente.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {resetPasswordError && (
                    <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
                      {resetPasswordError}
                    </div>
                  )}

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="text-orange-400 text-lg">⚠️</div>
                      <div>
                        <p className="text-orange-300 text-sm font-medium">Atenção:</p>
                        <p className="text-orange-200 text-xs mt-1">
                          Esta ação irá substituir a senha atual do usuário. 
                          Certifique-se de fornecer a nova senha ao usuário com segurança.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField label="Nova Senha">
                      <Input
                        type="password"
                        value={resetPasswordForm.password}
                        onChange={(e) => setResetPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Digite a nova senha"
                      />
                    </FormField>

                    <FormField label="Confirmar Nova Senha">
                      <Input
                        type="password"
                        value={resetPasswordForm.confirmPassword}
                        onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirme a nova senha"
                      />
                    </FormField>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setIsResettingPassword(null)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleResetPassword(isResettingPassword)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      🔄 Resetar Senha
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {activeTab === 'fake-users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Gerenciar Usuários Fake</h2>
            
            {/* Info sobre usuários fake */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="text-orange-400 text-2xl">🎭</div>
                <div>
                  <h4 className="text-orange-300 font-semibold">Usuários Fake / Demonstração</h4>
                  <p className="text-orange-100 text-sm">
                    Usuários criados para demonstração e teste do sistema. 
                    Eles não aparecem no ranking principal nem contam nas estatísticas reais.
                  </p>
                </div>
              </div>
            </div>

            {/* Usuários Fake */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Usuários Fake</h3>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                    {users.filter(user => user.is_fake).length}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja deletar TODOS os usuários fake? Esta ação não pode ser desfeita.')) {
                        // Add delete all fake users functionality here
                        toast.success('Funcionalidade será implementada');
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Deletar Todos
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Nome</th>
                      <th className="px-4 py-2 text-left text-white">Email</th>
                      <th className="px-4 py-2 text-left text-white">Saldo</th>
                      <th className="px-4 py-2 text-left text-white">Total Ganho</th>
                      <th className="px-4 py-2 text-left text-white">Vídeos</th>
                      <th className="px-4 py-2 text-left text-white">Nível</th>
                      <th className="px-4 py-2 text-left text-white">Criado</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.filter(user => user.is_fake).map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-orange-400 text-sm">🎭</span>
                            <span className="text-white">{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-gray-300 font-mono text-sm">{user.email}</span>
                        </td>
                        <td className="px-4 py-2 text-green-400">R$ {user.current_balance.toFixed(2)}</td>
                        <td className="px-4 py-2 text-blue-400">R$ {user.total_earnings.toFixed(2)}</td>
                        <td className="px-4 py-2 text-purple-400">{user.total_videos_watched}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            Nível {user.level || 1}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-sm">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja deletar o usuário fake "${user.name || user.email}"?`)) {
                                  // Add delete single fake user functionality here
                                  toast.success('Funcionalidade será implementada');
                                }
                              }}
                              className="text-red-400 hover:bg-red-500/20"
                              title="Deletar usuário fake"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.filter(user => user.is_fake).length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum usuário fake encontrado</h3>
                    <p className="text-gray-400 mb-4">
                      Vá para a aba "Gerador Ranking" para criar usuários fake para demonstração
                    </p>
                    <Button
                      onClick={() => setActiveTab('ranking-generator')}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Ir para Gerador de Ranking
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas dos usuários fake */}
            {users.filter(user => user.is_fake).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-orange-400" />
                    <div>
                      <p className="text-white/70 text-sm">Total Fake</p>
                      <p className="text-xl font-bold text-orange-400">
                        {users.filter(user => user.is_fake).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Video className="h-6 w-6 text-purple-400" />
                    <div>
                      <p className="text-white/70 text-sm">Vídeos Fake</p>
                      <p className="text-xl font-bold text-purple-400">
                        {users.filter(user => user.is_fake).reduce((sum, u) => sum + u.total_videos_watched, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="text-white/70 text-sm">Ganhos Fake</p>
                      <p className="text-xl font-bold text-green-400">
                        R$ {users.filter(user => user.is_fake).reduce((sum, u) => sum + u.total_earnings, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-blue-400" />
                    <div>
                      <p className="text-white/70 text-sm">Média Vídeos</p>
                      <p className="text-xl font-bold text-blue-400">
                        {users.filter(user => user.is_fake).length > 0 ? 
                          (users.filter(user => user.is_fake).reduce((sum, u) => sum + u.total_videos_watched, 0) / users.filter(user => user.is_fake).length).toFixed(1) : 
                          '0'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Gerenciar Vídeos</h2>
            
            {/* Form para adicionar vídeo */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Adicionar Novo Vídeo</h3>
              <form onSubmit={createVideo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="URL do Vídeo" required>
                    <Input
                      value={videoForm.video_url}
                      onChange={(e) => handleUrlChange(e.target.value, false)}
                      placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                      required
                    />
                    {videoDetecting && (
                      <div className="text-sm text-yellow-400 mt-1">🔍 Detectando informações do vídeo...</div>
                    )}
                    {detectionMessage && (
                      <div className="text-sm mt-1">{detectionMessage}</div>
                    )}
                  </FormField>

                  <FormField label="Título" required>
                    <Input
                      value={videoForm.title}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do vídeo"
                      required
                    />
                  </FormField>

                  <FormField label="Descrição">
                    <Input
                      value={videoForm.description}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do vídeo"
                    />
                  </FormField>

                  <FormField label="URL da Thumbnail">
                    <Input
                      value={videoForm.thumbnail_url}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      placeholder="URL da imagem de capa"
                    />
                  </FormField>

                  <FormField label="Duração (segundos)">
                    <Input
                      type="number"
                      min="1"
                      value={videoForm.duration_seconds}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                      placeholder="Duração em segundos"
                    />
                  </FormField>

                  <FormField label="Valor da Recompensa (R$)">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={videoForm.reward_amount}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, reward_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="2.00"
                    />
                  </FormField>

                  <FormField label="Pergunta">
                    <Input
                      value={videoForm.question}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Pergunta sobre o vídeo"
                    />
                  </FormField>

                  <FormField label="Resposta Correta">
                    <Input
                      value={videoForm.correct_answer}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                      placeholder="Resposta correta"
                    />
                  </FormField>

                  <FormField label="Resposta Incorreta">
                    <Input
                      value={videoForm.wrong_answer}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, wrong_answer: e.target.value }))}
                      placeholder="Resposta incorreta"
                    />
                  </FormField>
                </div>

                {/* Target Users Selection */}
                <div className="space-y-4 pt-4 border-t border-white/20">
                  <h4 className="text-lg font-semibold text-white">Destinatários do Vídeo</h4>
                  
                  <FormField label="Enviar vídeo para:" required>
                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="target_users"
                          value="all"
                          checked={videoForm.target_users === 'all'}
                          onChange={(e) => setVideoForm(prev => ({ 
                            ...prev, 
                            target_users: e.target.value as 'all' | 'specific' | 'bonus_only',
                            selected_user_ids: e.target.value === 'all' ? [] : prev.selected_user_ids
                          }))}
                          className="text-green-500"
                        />
                        <span className="text-white">Todos os usuários</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="target_users"
                          value="bonus_only"
                          checked={videoForm.target_users === 'bonus_only'}
                          onChange={(e) => setVideoForm(prev => ({ 
                            ...prev, 
                            target_users: e.target.value as 'all' | 'specific' | 'bonus_only',
                            selected_user_ids: []
                          }))}
                          className="text-orange-500"
                        />
                        <span className="text-white">Apenas usuários com bônus 🎁</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="target_users"
                          value="specific"
                          checked={videoForm.target_users === 'specific'}
                          onChange={(e) => setVideoForm(prev => ({ 
                            ...prev, 
                            target_users: e.target.value as 'all' | 'specific' | 'bonus_only' 
                          }))}
                          className="text-green-500"
                        />
                        <span className="text-white">Usuários específicos</span>
                      </label>
                    </div>
                  </FormField>

                  {videoForm.target_users === 'specific' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">
                          {videoForm.selected_user_ids.length} usuário(s) selecionado(s)
                        </span>
                        <Button
                          type="button"
                          onClick={() => openUserSelector('video')}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:bg-blue-500/20"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Selecionar Usuários
                        </Button>
                      </div>
                      
                      {videoForm.selected_user_ids.length > 0 && (
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-sm text-gray-400 mb-2">Usuários selecionados:</div>
                          <div className="flex flex-wrap gap-2">
                            {getSelectedUserNames('video').map((name, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-sm">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {submitting ? 'Adicionando...' : 'Adicionar Vídeo'}
                </Button>
              </form>
            </div>

            {/* Lista de vídeos */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Lista de Vídeos</h3>
                {selectedVideos.length > 0 && (
                  <Button
                    onClick={() => deleteSelectedVideos(false)}
                    variant="ghost"
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir Selecionados ({selectedVideos.length})
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={() => toggleSelectAll(false)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-white">Título</th>
                      <th className="px-4 py-2 text-left text-white">Plataforma</th>
                      <th className="px-4 py-2 text-left text-white">Recompensa</th>
                      <th className="px-4 py-2 text-left text-white">Destinatários</th>
                      <th className="px-4 py-2 text-left text-white">Status</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {videos.map((video) => (
                      <tr key={video.id} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedVideos.includes(video.id)}
                            onChange={() => toggleVideoSelection(video.id, false)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={video.video_platform === 'youtube' 
                                ? `https://img.youtube.com/vi/${video.video_url.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`
                                : (video as any).thumbnail_url || '/api/placeholder/120/90'
                              }
                              alt={video.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="text-white font-medium">{video.title}</div>
                              <div className="text-gray-400 text-sm">{video.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white capitalize">{video.video_platform}</td>
                        <td className="px-4 py-2 text-green-400">R$ {video.reward_amount.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          {(video as any).assigned_users_count > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-400 font-semibold">
                                  {(video as any).assigned_users_count} usuário(s)
                                </span>
                              </div>
                              {(video as any).assigned_users && (video as any).assigned_users.length > 0 && (
                                <div className="max-w-xs">
                                  <div className="text-xs text-gray-400 truncate">
                                    {(video as any).assigned_users.slice(0, 3).map((user: any) => user.name || user.email).join(', ')}
                                    {(video as any).assigned_users.length > 3 && ` +${(video as any).assigned_users.length - 3} mais`}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-400" />
                              <span className="text-green-400">Todos os usuários</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => toggleVideoStatus(video.id, video.is_active, false)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              video.is_active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {video.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {video.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(video.video_url, '_blank')}
                              className="text-blue-400 hover:bg-blue-500/20"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteVideo(video.id, video.title, false)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Gerenciar Saques</h2>
            
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Email</th>
                      <th className="px-4 py-2 text-left text-white">Valor</th>
                      <th className="px-4 py-2 text-left text-white">Chave PIX</th>
                      <th className="px-4 py-2 text-left text-white">Status</th>
                      <th className="px-4 py-2 text-left text-white">Data</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-white">{withdrawal.user_email}</td>
                        <td className="px-4 py-2 text-green-400">R$ {withdrawal.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-white">{withdrawal.pix_key}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {withdrawal.status === 'pending' ? 'Pendente' :
                             withdrawal.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400">
                          {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateWithdrawalStatus(withdrawal.id, 'approved')}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateWithdrawalStatus(withdrawal.id, 'rejected')}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && <CouponsTab />}

        {activeTab === 'pix-payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Transações PIX - Aprovação Manual</h2>
            
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  💡 <strong>Atenção:</strong> Use os botões abaixo para aprovar pagamentos manualmente e ativar os planos correspondentes para cada usuário.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Usuário</th>
                      <th className="px-4 py-2 text-left text-white">Valor</th>
                      <th className="px-4 py-2 text-left text-white">Plano</th>
                      <th className="px-4 py-2 text-left text-white">Status</th>
                      <th className="px-4 py-2 text-left text-white">Data</th>
                      <th className="px-4 py-2 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {pushinTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          <div>
                            <div className="text-white font-medium">{transaction.user_name || 'N/A'}</div>
                            <div className="text-gray-400 text-sm">{transaction.user_email}</div>
                            {transaction.user_phone && (
                              <div className="text-gray-500 text-xs">{transaction.user_phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-green-400 font-bold">R$ {transaction.amount.toFixed(2)}</div>
                          {transaction.description && (
                            <div className="text-gray-400 text-xs">{transaction.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (transaction as any).plan_type === 'intermediate' 
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {(transaction as any).plan_type === 'intermediate' 
                              ? 'Intermediário' 
                              : `VIP ${transaction.vip_level || '?'}`
                            }
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            transaction.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            transaction.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.status === 'pending' ? 'Pendente' :
                             transaction.status === 'approved' ? 'Aprovado' :
                             transaction.status === 'completed' ? 'Completo' : 
                             transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-gray-300">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {transaction.status === 'pending' && (
                            <div className="flex flex-wrap gap-1">
                              {/* Intermediário Button */}
                              <Button
                                size="sm"
                                onClick={() => handleApprovePayment(transaction.id, 'intermediate')}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                                title="Aprovar como Intermediário"
                              >
                                <Crown className="w-3 h-3 mr-1" />
                                Inter.
                              </Button>
                              
                              {/* VIP 1-6 Buttons */}
                              {[1, 2, 3, 4, 5, 6].map((level) => (
                                <Button
                                  key={level}
                                  size="sm"
                                  onClick={() => handleApprovePayment(transaction.id, 'vip', level)}
                                  className={`text-white text-xs px-2 py-1 ${
                                    level <= 2 
                                      ? 'bg-blue-600 hover:bg-blue-700'
                                      : level <= 4
                                      ? 'bg-purple-600 hover:bg-purple-700'
                                      : 'bg-yellow-600 hover:bg-yellow-700'
                                  }`}
                                  title={`Aprovar como VIP ${level}`}
                                >
                                  <Crown className="w-3 h-3 mr-1" />
                                  V{level}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          {transaction.status === 'approved' && transaction.vip_level && (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                onClick={() => activateVipSubscription(transaction.id)}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                                title="Ativar VIP manualmente"
                              >
                                Ativar VIP
                              </Button>
                            </div>
                          )}
                          
                          {transaction.status !== 'pending' && !(transaction.status === 'approved' && transaction.vip_level) && (
                            <div className="text-center">
                              <span className="text-gray-400 text-xs">
                                {transaction.status === 'approved' || transaction.status === 'completed' 
                                  ? '✅ Processado' 
                                  : '❌ Finalizado'
                                }
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pushinTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Nenhuma transação PIX encontrada
                    </h3>
                    <p className="text-gray-400">
                      As transações PIX aparecerão aqui quando os usuários gerarem QR codes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vip-plans' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Planos VIP (VIP 2 - VIP 6)</h2>
            
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Links de Pagamento VIP</h3>
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  ℹ️ <strong>Nota:</strong> O plano Intermediário e VIP 1 usam PIX integrado e não precisam de links externos.
                </p>
              </div>
              <div className="space-y-4">
                {vipLinks.filter((link) => link.vip_level >= 2 && link.vip_level <= 6).map((link) => (
                  <div key={link.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <div className="text-white font-medium">VIP Nível {link.vip_level}</div>
                      <Input
                        value={link.payment_url}
                        onChange={(e) => {
                          const newLinks = vipLinks.map(l => 
                            l.id === link.id ? { ...l, payment_url: e.target.value } : l
                          );
                          setVipLinks(newLinks);
                        }}
                        placeholder="URL do link de pagamento"
                        className="mt-2"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={link.is_active}
                          onChange={(e) => {
                            const newLinks = vipLinks.map(l => 
                              l.id === link.id ? { ...l, is_active: e.target.checked } : l
                            );
                            setVipLinks(newLinks);
                          }}
                          className="rounded"
                        />
                        <span className="text-white text-sm">Ativo</span>
                      </label>
                      <Button
                        size="sm"
                        onClick={() => updateVipLink(link.vip_level, link.payment_url, link.is_active)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vip-purchases' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Compras VIP</h2>
            
            {/* Form para registrar compra manual */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Registrar Compra Manual (Intermediário + VIP 1-6)</h3>
              <form onSubmit={handleAddVipPurchase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Email do Usuário" required>
                    <Input
                      type="email"
                      value={newVipPurchase.user_email}
                      onChange={(e) => setNewVipPurchase(prev => ({ ...prev, user_email: e.target.value }))}
                      placeholder="usuario@exemplo.com"
                      required
                    />
                  </FormField>

                  <FormField label="Nível/Plano" required>
                    <select
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={newVipPurchase.vip_level !== null ? newVipPurchase.vip_level.toString() : ''}
                      onChange={(e) => {
                        const level = e.target.value === '' ? null : parseInt(e.target.value);
                        let defaultAmount = 0;
                        
                        if (level !== null) {
                          // Set default amounts based on level
                          switch(level) {
                            case 0: defaultAmount = 97.90; break;
                            case 1: defaultAmount = 150; break;
                            case 2: defaultAmount = 300; break;
                            case 3: defaultAmount = 600; break;
                            case 4: defaultAmount = 1200; break;
                            case 5: defaultAmount = 2400; break;
                            case 6: defaultAmount = 4800; break;
                          }
                        }
                        
                        setNewVipPurchase(prev => ({ 
                          ...prev, 
                          vip_level: level,
                          amount: defaultAmount
                        }));
                      }}
                      required
                    >
                      <option value="">Selecione um nível...</option>
                      <option value="0">📈 Intermediário (R$ 97,90)</option>
                      <option value="1">👑 VIP 1 (R$ 150,00)</option>
                      <option value="2">💎 VIP 2 (R$ 300,00)</option>
                      <option value="3">🌟 VIP 3 (R$ 600,00)</option>
                      <option value="4">⭐ VIP 4 (R$ 1.200,00)</option>
                      <option value="5">💫 VIP 5 (R$ 2.400,00)</option>
                      <option value="6">🔥 VIP 6 (R$ 4.800,00)</option>
                    </select>
                  </FormField>

                  <FormField label="Valor Pago (R$)" required>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newVipPurchase.amount}
                      onChange={(e) => setNewVipPurchase(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.50"
                      required
                    />
                  </FormField>

                  <FormField label="Referência do Pagamento">
                    <Input
                      value={newVipPurchase.payment_reference}
                      onChange={(e) => setNewVipPurchase(prev => ({ ...prev, payment_reference: e.target.value }))}
                      placeholder="ID ou referência do pagamento (opcional)"
                    />
                  </FormField>
                </div>

                <Button 
                  type="submit" 
                  disabled={vipPurchaseSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {vipPurchaseSubmitting ? 'Registrando...' : 'Registrar Compra'}
                </Button>
              </form>
            </div>

            {/* Lista de compras (Intermediário + VIP) */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Histórico de Compras - Todos os Planos ({vipPurchases.length})
              </h3>
              
              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-green-400 font-bold text-lg">
                    {vipPurchases.filter(p => p.vip_level === 0).length}
                  </div>
                  <div className="text-gray-400 text-sm">Intermediário</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-blue-400 font-bold text-lg">
                    {vipPurchases.filter(p => p.vip_level >= 1 && p.vip_level <= 3).length}
                  </div>
                  <div className="text-gray-400 text-sm">VIP 1-3</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-purple-400 font-bold text-lg">
                    {vipPurchases.filter(p => p.vip_level >= 4 && p.vip_level <= 6).length}
                  </div>
                  <div className="text-gray-400 text-sm">VIP 4-6</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-yellow-400 font-bold text-lg">
                    R$ {vipPurchases.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-gray-400 text-sm">Total Vendido</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Usuário</th>
                      <th className="px-4 py-2 text-left text-white">Plano</th>
                      <th className="px-4 py-2 text-left text-white">Valor</th>
                      <th className="px-4 py-2 text-left text-white">Status</th>
                      <th className="px-4 py-2 text-left text-white">Ativo</th>
                      <th className="px-4 py-2 text-left text-white">Data</th>
                      <th className="px-4 py-2 text-left text-white">Referência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {vipPurchases.map((purchase, index) => (
                      <tr key={`${purchase.id}-${index}`} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          <div>
                            <div className="text-white font-medium">
                              {purchase.user_name || purchase.name || 'N/A'}
                            </div>
                            <div className="text-gray-400 text-sm">{purchase.user_email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              purchase.vip_level === 0 
                                ? 'bg-green-500/20 text-green-400'
                                : purchase.vip_level <= 2
                                ? 'bg-blue-500/20 text-blue-400'
                                : purchase.vip_level <= 4
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {purchase.vip_level === 0 
                                ? '📈 Intermediário' 
                                : `👑 VIP ${purchase.vip_level}`
                              }
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-green-400 font-semibold">
                            R$ {(purchase.amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            purchase.payment_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            purchase.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {purchase.payment_status === 'completed' ? 'Completo' :
                             purchase.payment_status === 'pending' ? 'Pendente' : 
                             purchase.payment_status || 'Desconhecido'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            purchase.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {purchase.is_active ? '✓ Ativo' : '✗ Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-sm">
                          {new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-xs text-gray-500 font-mono">
                            {purchase.payment_reference ? 
                              purchase.payment_reference.substring(0, 15) + (purchase.payment_reference.length > 15 ? '...' : '') : 
                              'N/A'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {vipPurchases.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Nenhuma compra registrada ainda
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        

        {activeTab === 'ranking-generator' && <RankingGeneratorTab />}

        {activeTab === 'money' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Money - Enviar Dinheiro para Usuários</h2>
              <div className="text-sm text-green-300 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                💰 Transferência real de saldo
              </div>
            </div>

            {/* Form para enviar dinheiro */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                💰 Enviar Dinheiro REAL para Usuário
              </h3>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-green-400 text-2xl">💰</div>
                  <div>
                    <h4 className="text-green-300 font-semibold">Transferência Real de Saldo</h4>
                    <p className="text-green-100 text-sm mt-1">
                      Esta funcionalidade adiciona dinheiro REAL ao saldo dos usuários.
                      O valor será creditado imediatamente na conta do usuário selecionado.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-400 text-2xl">💡</div>
                  <div>
                    <h4 className="text-blue-300 font-semibold">Como Usar</h4>
                    <p className="text-blue-100 text-sm mt-1">
                      Selecione um usuário, informe o valor e o motivo da transferência.
                      O dinheiro será adicionado instantaneamente ao saldo da conta do usuário.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleBalanceTransfer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Selecionar Usuário" required>
                    <select
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      value={balanceTransferForm.user_email}
                      onChange={(e) => setBalanceTransferForm(prev => ({ ...prev, user_email: e.target.value }))}
                      required
                    >
                      <option value="">Selecione um usuário...</option>
                      {users
                        .filter(user => !user.is_fake) // Não mostrar usuários fake
                        .sort((a, b) => {
                          // Ordenar: admins primeiro, depois por nome/email
                          if (a.is_admin && !b.is_admin) return -1;
                          if (!a.is_admin && b.is_admin) return 1;
                          const nameA = a.name || a.email;
                          const nameB = b.name || b.email;
                          return nameA.localeCompare(nameB);
                        })
                        .map(user => (
                          <option key={user.id} value={user.email}>
                            {user.is_admin ? '👑 ' : ''}{user.name || user.email} ({user.email}) - R$ {user.current_balance.toFixed(2)}
                          </option>
                        ))}
                    </select>
                  </FormField>

                  <FormField label="Valor FICTÍCIO a Enviar (R$)" required>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={balanceTransferForm.amount}
                      onChange={(e) => setBalanceTransferForm(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0,
                        type: 'add' // Sempre adicionar na aba Money
                      }))}
                      placeholder="Ex: 10.00 (valor real que será creditado)"
                      required
                    />
                    <div className="text-xs text-green-400 mt-1">
                      💰 Este valor será adicionado ao saldo real do usuário
                    </div>
                  </FormField>

                  <FormField label="Motivo do Envio" required className="md:col-span-2">
                    <Input
                      value={balanceTransferForm.reason}
                      onChange={(e) => setBalanceTransferForm(prev => ({ 
                        ...prev, 
                        reason: e.target.value,
                        type: 'add' // Sempre adicionar na aba Money
                      }))}
                      placeholder="Ex: Bônus promocional, compensação, prêmio especial..."
                      required
                    />
                    <div className="text-xs text-green-400 mt-1">
                      💡 Descreva o motivo desta transferência de dinheiro
                    </div>
                  </FormField>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                  <Button 
                    type="submit" 
                    disabled={balanceTransferSubmitting}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {balanceTransferSubmitting ? '💰 Enviando dinheiro...' : 
                     `💰 ENVIAR R$ ${balanceTransferForm.amount.toFixed(2)} REAL`
                    }
                  </Button>
                  
                  {balanceTransferForm.amount > 0 && balanceTransferForm.user_email && (
                    <div className="text-sm text-gray-400">
                      💰 Será enviado{' '}
                      <span className="font-bold text-green-400">
                        R$ {balanceTransferForm.amount.toFixed(2)} (REAL)
                      </span> 
                      {' '}para {balanceTransferForm.user_email}
                      <div className="text-xs text-green-400 mt-1">
                        ✅ O dinheiro será adicionado automaticamente ao saldo do usuário!
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Lista de todos os usuários */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Lista Completa de Usuários ({users.length})
                </h3>
                <div className="flex gap-4 items-center">
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-64"
                  />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as any)}
                    className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos Hoje</option>
                    <option value="inactive">Inativos</option>
                    <option value="admins">Administradores</option>
                  </select>
                  <Button
                    onClick={() => loadData(true)}
                    variant="ghost"
                    size="sm"
                    disabled={isRefreshing}
                    className="text-green-400 hover:bg-green-500/20"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Estatísticas rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-400" />
                    <div>
                      <p className="text-white/70 text-sm">Total Usuários</p>
                      <p className="text-xl font-bold text-blue-400">
                        {users.filter(u => !u.is_fake).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="text-white/70 text-sm">Ativos Hoje</p>
                      <p className="text-xl font-bold text-green-400">
                        {users.filter(u => !u.is_fake && u.daily_videos_watched && u.daily_videos_watched > 0).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-yellow-400" />
                    <div>
                      <p className="text-white/70 text-sm">Saldo Total</p>
                      <p className="text-xl font-bold text-yellow-400">
                        R$ {users.filter(u => !u.is_fake).reduce((sum, u) => sum + u.current_balance, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 text-purple-400" />
                    <div>
                      <p className="text-white/70 text-sm">Administradores</p>
                      <p className="text-xl font-bold text-purple-400">
                        {users.filter(u => !u.is_fake && u.is_admin).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Video className="h-6 w-6 text-purple-400" />
                    <div>
                      <p className="text-white/70 text-sm">Total Vídeos</p>
                      <p className="text-xl font-bold text-purple-400">
                        {users.filter(u => !u.is_fake).reduce((sum, u) => sum + u.total_videos_watched, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">Usuário</th>
                      <th className="px-4 py-3 text-left text-white">Email</th>
                      <th className="px-4 py-3 text-left text-white">Saldo Atual</th>
                      <th className="px-4 py-3 text-left text-white">Total Ganho</th>
                      <th className="px-4 py-3 text-left text-white">Vídeos Assistidos</th>
                      <th className="px-4 py-3 text-left text-white">Nível</th>
                      <th className="px-4 py-3 text-left text-white">Status</th>
                      <th className="px-4 py-3 text-left text-white">Data Cadastro</th>
                      <th className="px-4 py-3 text-left text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users
                      .filter(user => {
                        if (user.is_fake) return false; // Não mostrar usuários fake
                        
                        const matchesSearch = !userSearch || 
                          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          user.email.toLowerCase().includes(userSearch.toLowerCase());
                        
                        switch (userFilter) {
                          case 'active': return matchesSearch && user.daily_videos_watched && user.daily_videos_watched > 0;
                          case 'inactive': return matchesSearch && (!user.daily_videos_watched || user.daily_videos_watched === 0);
                          case 'admins': return matchesSearch && user.is_admin;
                          default: return matchesSearch;
                        }
                      })
                      .sort((a, b) => {
                        // Admins primeiro, depois por saldo, depois por data
                        if (a.is_admin && !b.is_admin) return -1;
                        if (!a.is_admin && b.is_admin) return 1;
                        if (a.current_balance !== b.current_balance) return b.current_balance - a.current_balance;
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      })
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                user.daily_videos_watched && user.daily_videos_watched > 0 ? 'bg-green-400' : 'bg-gray-500'
                              }`}></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                  {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                </div>
                                <div className="text-gray-400 text-sm">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white font-mono text-sm">{user.email}</div>
                            <div className="text-gray-400 text-xs">{user.auth_provider}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-green-400 font-bold text-lg">
                              R$ {user.current_balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-blue-400 font-semibold">
                              R$ {user.total_earnings.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-center">
                              <div className="text-purple-400 font-bold text-lg">
                                {user.total_videos_watched}
                              </div>
                              <div className="text-gray-400 text-xs">
                                Hoje: {user.daily_videos_watched || 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-center">
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                user.is_admin ? 'bg-yellow-500/20 text-yellow-400' :
                                (user.level || 1) >= 4 ? 'bg-purple-500/20 text-purple-400' :
                                (user.level || 1) >= 2 ? 'bg-blue-500/20 text-blue-400' : 
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {user.is_admin ? 'Admin' : `Nível ${user.level || 1}`}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.daily_videos_watched && user.daily_videos_watched > 0 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.daily_videos_watched && user.daily_videos_watched > 0 ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-300 text-sm">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(user.created_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setBalanceTransferForm(prev => ({
                                  ...prev,
                                  user_email: user.email,
                                  type: 'add'
                                }));
                                // Scroll to the form
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-green-400 hover:bg-green-500/20"
                              title="Enviar dinheiro REAL para este usuário"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              💰 $ REAL
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                {users.filter(user => {
                  if (user.is_fake) return false;
                  
                  const matchesSearch = !userSearch || 
                    user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                    user.email.toLowerCase().includes(userSearch.toLowerCase());
                  
                  switch (userFilter) {
                    case 'active': return matchesSearch && user.daily_videos_watched && user.daily_videos_watched > 0;
                    case 'inactive': return matchesSearch && (!user.daily_videos_watched || user.daily_videos_watched === 0);
                    case 'admins': return matchesSearch && user.is_admin;
                    default: return matchesSearch;
                  }
                }).length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      {userSearch ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </h3>
                    <p className="text-gray-400">
                      {userSearch 
                        ? 'Tente alterar os termos de busca ou filtros'
                        : 'Não há usuários cadastrados no sistema ainda'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico recente de transferências */}
            {balanceTransfers.length > 0 && (
              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  💰 Histórico de Transferências de Dinheiro
                </h3>
                
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
                  <p className="text-green-300 text-sm">
                    💰 <strong>Histórico:</strong> Todas as transferências de dinheiro realizadas através desta aba são registradas aqui.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-white">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-white">Usuário</th>
                        <th className="px-4 py-3 text-left text-white">Valor Enviado</th>
                        <th className="px-4 py-3 text-left text-white">Motivo</th>
                        <th className="px-4 py-3 text-left text-white">Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {balanceTransfers
                        .filter(transfer => transfer.type === 'add') // Só mostrar adições
                        .slice(0, 10) // Mostrar apenas os 10 mais recentes
                        .map((transfer) => (
                          <tr key={transfer.id} className="hover:bg-white/5">
                            <td className="px-4 py-3">
                              <div className="text-white text-sm">
                                {new Date(transfer.created_at).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {new Date(transfer.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white font-medium">{transfer.user_name || 'N/A'}</div>
                              <div className="text-gray-400 text-sm">{transfer.user_email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-lg text-green-400">
                                +R$ {transfer.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs">
                                <div className="text-white text-sm">{transfer.reason}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-400 text-sm">
                                {transfer.admin_name || transfer.admin_email || 'Sistema'}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {balanceTransfers.filter(t => t.type === 'add').length > 10 && (
                  <div className="text-center mt-4">
                    <Button
                      onClick={() => setActiveTab('balance-manager')}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:bg-blue-500/20"
                    >
                      Ver histórico completo na aba "Gerenciar Saldo" →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'home-banners' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Banners da Página Inicial</h2>
            
            {/* Form para adicionar/editar banner */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {editingBanner ? 'Editar Banner' : 'Adicionar Novo Banner'}
                </h3>
                {editingBanner && (
                  <Button
                    onClick={cancelBannerEdit}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
              
              <form onSubmit={editingBanner ? updateHomeBanner : createHomeBanner} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Título do Banner" required>
                    <Input
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título que aparecerá no banner"
                      required
                    />
                  </FormField>

                  <FormField label="URL da Imagem" required>
                    <Input
                      value={bannerForm.image_url}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://exemplo.com/imagem.jpg"
                      required
                    />
                  </FormField>

                  <FormField label="URL do Link (opcional)">
                    <Input
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://exemplo.com (abrir ao clicar no banner)"
                    />
                  </FormField>

                  <FormField label="Ordem de Exibição">
                    <Input
                      type="number"
                      min="0"
                      value={bannerForm.display_order}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </FormField>

                  <FormField label="Descrição (opcional)" className="md:col-span-2">
                    <Input
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição que aparecerá sobre o banner"
                    />
                  </FormField>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bannerForm.is_active}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-white text-sm">Banner ativo</span>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  disabled={bannerSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {bannerSubmitting ? 'Processando...' : editingBanner ? 'Atualizar Banner' : 'Criar Banner'}
                </Button>
              </form>
            </div>

            {/* Preview do banner */}
            {bannerForm.image_url && (
              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Preview do Banner</h3>
                <div className="relative h-64 rounded-xl overflow-hidden bg-black">
                  <img
                    src={bannerForm.image_url}
                    alt={bannerForm.title || 'Preview'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h4 className="text-xl font-bold mb-2">
                      {bannerForm.title || 'Título do Banner'}
                    </h4>
                    {bannerForm.description && (
                      <p className="text-white/90 text-sm mb-3">
                        {bannerForm.description}
                      </p>
                    )}
                    {bannerForm.link_url && (
                      <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                        <span>Clique para saber mais</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lista de banners */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Banners Existentes ({homeBanners.length})
              </h3>

              {homeBanners.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Nenhum banner criado</h4>
                  <p className="text-gray-400">Crie seu primeiro banner para exibir na página inicial</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {homeBanners.map((banner) => (
                    <div 
                      key={banner.id} 
                      className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Banner thumbnail */}
                        <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-black">
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/96/64';
                            }}
                          />
                        </div>

                        {/* Banner info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-white font-semibold truncate">{banner.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              banner.is_active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {banner.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                              Ordem: {banner.display_order}
                            </span>
                          </div>
                          
                          {banner.description && (
                            <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                              {banner.description}
                            </p>
                          )}
                          
                          {banner.link_url && (
                            <div className="flex items-center gap-2 text-xs text-blue-400">
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">{banner.link_url}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editHomeBanner(banner)}
                            className="text-blue-400 hover:bg-blue-500/20"
                            title="Editar banner"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          {banner.link_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(banner.link_url, '_blank')}
                              className="text-green-400 hover:bg-green-500/20"
                              title="Abrir link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteHomeBanner(banner.id, banner.title)}
                            className="text-red-400 hover:bg-red-500/20"
                            title="Excluir banner"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instrução de uso */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Como usar os banners
              </h3>
              <div className="space-y-2 text-blue-300 text-sm">
                <p>• <strong>Ordem de exibição:</strong> Números menores aparecem primeiro no carrossel</p>
                <p>• <strong>Imagens:</strong> Use URLs diretas para imagens (JPG, PNG, WebP)</p>
                <p>• <strong>Links:</strong> Se fornecido, o banner será clicável e abrirá em nova aba</p>
                <p>• <strong>Dimensões recomendadas:</strong> 1200x400px ou 16:9 para melhor resultado</p>
                <p>• <strong>Carrossel automático:</strong> Banners mudam automaticamente a cada 5 segundos</p>
                <p>• <strong>Status:</strong> Apenas banners ativos aparecem na página inicial</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat-live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Chat ao Vivo</h2>
              <div className="flex gap-4 items-center">
                <select
                  value={chatFilter}
                  onChange={(e) => setChatFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">Todas as mensagens</option>
                  <option value="pending">Pendentes</option>
                  <option value="replied">Respondidas</option>
                </select>
                <Button
                  onClick={() => loadData(true)}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                  className="text-green-400 hover:bg-green-500/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Chat Stats */}
            {chatStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-orange-400" />
                    <div>
                      <p className="text-white/70 text-sm">Mensagens Pendentes</p>
                      <p className="text-xl font-bold text-orange-400">
                        {chatStats.pending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Check className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="text-white/70 text-sm">Respondidas</p>
                      <p className="text-xl font-bold text-green-400">
                        {chatStats.replied}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-blue-400" />
                    <div>
                      <p className="text-white/70 text-sm">Total</p>
                      <p className="text-xl font-bold text-blue-400">
                        {chatStats.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-purple-400" />
                    <div>
                      <p className="text-white/70 text-sm">Hoje</p>
                      <p className="text-xl font-bold text-purple-400">
                        {chatStats.today}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Mensagens do Chat ({
                  chatMessages.filter(msg => 
                    chatFilter === 'all' || msg.status === chatFilter
                  ).length
                })
              </h3>

              {chatMessages.filter(msg => 
                chatFilter === 'all' || msg.status === chatFilter
              ).length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Nenhuma mensagem encontrada</h4>
                  <p className="text-gray-400">
                    {chatFilter === 'pending' 
                      ? 'Não há mensagens pendentes no momento'
                      : chatFilter === 'replied'
                      ? 'Não há mensagens respondidas ainda'
                      : 'Nenhuma mensagem foi enviada ainda'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages
                    .filter(msg => chatFilter === 'all' || msg.status === chatFilter)
                    .map((message) => (
                      <div 
                        key={message.id} 
                        className={`bg-white/5 rounded-xl p-6 border transition-all ${
                          message.status === 'pending' 
                            ? 'border-orange-500/30 bg-orange-500/5' 
                            : 'border-white/10'
                        }`}
                      >
                        {/* Message Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-semibold">{message.user_name}</h4>
                                {message.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  message.status === 'pending' 
                                    ? 'bg-orange-500/20 text-orange-400' 
                                    : 'bg-green-500/20 text-green-400'
                                }`}>
                                  {message.status === 'pending' ? 'Pendente' : 'Respondida'}
                                </span>
                              </div>
                              <div className="text-gray-400 text-sm">{message.user_email}</div>
                              <div className="text-gray-500 text-xs">
                                {new Date(message.created_at).toLocaleString('pt-BR')}
                                {message.level && (
                                  <span className="ml-2">• Nível {message.level}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!message.is_read && message.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markChatAsRead(message.id)}
                                className="text-gray-400 hover:text-white"
                                title="Marcar como lida"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteChatMessage(message.id)}
                              className="text-red-400 hover:bg-red-500/20"
                              title="Deletar mensagem"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Original Message */}
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            Mensagem do usuário:
                          </h5>
                          <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
                        </div>

                        {/* Admin Reply */}
                        {message.admin_reply && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                            <h5 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                              <Send className="w-4 h-4" />
                              Sua resposta:
                            </h5>
                            <p className="text-green-100 whitespace-pre-wrap">{message.admin_reply}</p>
                            <div className="text-green-300 text-xs mt-2">
                              Respondido por {message.admin_name} em {' '}
                              {new Date(message.replied_at).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        )}

                        {/* Reply Form */}
                        {message.status === 'pending' && (
                          <>
                            {replyingTo === message.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Digite sua resposta... (mínimo 5 caracteres)"
                                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none resize-none"
                                  rows={4}
                                  minLength={5}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleChatReply(message.id)}
                                    disabled={replySubmitting || replyText.trim().length < 5}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    {replySubmitting ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enviando...
                                      </div>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Enviar Resposta
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => setReplyingTo(message.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Responder
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Como usar o Chat ao Vivo
              </h3>
              <div className="space-y-2 text-blue-300 text-sm">
                <p>• <strong>Mensagens pendentes:</strong> Aparecem destacadas em laranja e precisam de resposta</p>
                <p>• <strong>Responder:</strong> Clique em "Responder" para enviar uma mensagem diretamente ao usuário</p>
                <p>• <strong>Notificações:</strong> Usuários cadastrados recebem notificações quando você responde</p>
                <p>• <strong>Filtros:</strong> Use os filtros para ver apenas mensagens pendentes ou respondidas</p>
                <p>• <strong>Marcar como lida:</strong> Use o ícone do olho para marcar mensagens como lidas sem responder</p>
                <p>• <strong>Email direto:</strong> Usuários sem conta podem ser contatados pelo email: {' '}
                  <a href="mailto:nextfundpagamentos@gmail.com" className="text-blue-400 underline">
                    nextfundpagamentos@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Anúncios do Sistema</h2>
              <Button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setAnnouncementForm({
                    title: '',
                    content: '',
                    target_new_users: true,
                    target_all_users: false,
                    priority: 1,
                    expires_at: '',
                    is_active: true
                  });
                  setShowAnnouncementModal(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Criar Anúncio
              </Button>
            </div>

            {/* Instruções */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Como funcionam os anúncios
              </h3>
              <div className="space-y-2 text-blue-300 text-sm">
                <p>• <strong>Usuários novos:</strong> Anúncios aparecem para usuários cadastrados há menos de 7 dias</p>
                <p>• <strong>Todos os usuários:</strong> Anúncios aparecem para qualquer usuário logado</p>
                <p>• <strong>Prioridade:</strong> Números maiores aparecem primeiro</p>
                <p>• <strong>Expiração:</strong> Anúncios podem ter data de expiração opcional</p>
                <p>• <strong>Visualização única:</strong> Cada usuário vê o anúncio apenas uma vez</p>
                <p>• <strong>Modal automático:</strong> Anúncios aparecem automaticamente quando o usuário faz login</p>
              </div>
            </div>

            {/* Lista de anúncios */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Anúncios Criados ({announcements.length})
              </h3>

              {announcements.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Nenhum anúncio criado</h4>
                  <p className="text-gray-400">Crie seu primeiro anúncio para exibir aos usuários</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id} 
                      className={`bg-white/5 p-6 rounded-xl border transition-all ${
                        announcement.is_active 
                          ? 'border-green-500/30 bg-green-500/5' 
                          : 'border-gray-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-white font-bold text-lg">{announcement.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                announcement.is_active 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {announcement.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                Prioridade: {announcement.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>Por {announcement.created_by_admin_name}</span>
                              <span>•</span>
                              <span>{new Date(announcement.created_at).toLocaleDateString('pt-BR')}</span>
                              <span>•</span>
                              <span>{announcement.views_count || 0} visualizações</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setAnnouncementForm({
                                title: announcement.title,
                                content: announcement.content,
                                target_new_users: announcement.target_new_users,
                                target_all_users: announcement.target_all_users,
                                priority: announcement.priority,
                                expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
                                is_active: announcement.is_active
                              });
                              setShowAnnouncementModal(true);
                            }}
                            className="text-blue-400 hover:bg-blue-500/20"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!confirm('Tem certeza que deseja deletar este anúncio?')) return;
                              
                              try {
                                await fetch(`/api/admin/announcements/${announcement.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                                toast.success('Anúncio deletado com sucesso!');
                                loadData(true);
                              } catch (error) {
                                toast.error('Erro ao deletar anúncio');
                              }
                            }}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Targets */}
                      <div className="flex items-center gap-4 mb-4">
                        {announcement.target_new_users && (
                          <span className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            <User className="w-4 h-4" />
                            Usuários novos (7 dias)
                          </span>
                        )}
                        {announcement.target_all_users && (
                          <span className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            <Users className="w-4 h-4" />
                            Todos os usuários
                          </span>
                        )}
                        {announcement.expires_at && (
                          <span className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                            <Clock className="w-4 h-4" />
                            Expira: {new Date(announcement.expires_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-2">Conteúdo:</h5>
                        <div className="text-gray-300 whitespace-pre-wrap line-clamp-3">
                          {announcement.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal para criar/editar anúncio */}
            {showAnnouncementModal && (
              <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingAnnouncement ? 'Edite as informações do anúncio.' : 'Crie um anúncio que aparecerá para os usuários.'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    
                    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
                      toast.error('Título e conteúdo são obrigatórios');
                      return;
                    }

                    setAnnouncementSubmitting(true);

                    try {
                      const endpoint = editingAnnouncement 
                        ? `/api/admin/announcements/${editingAnnouncement.id}`
                        : '/api/admin/announcements';
                      
                      const method = editingAnnouncement ? 'PATCH' : 'POST';

                      const response = await fetch(endpoint, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          ...announcementForm,
                          expires_at: announcementForm.expires_at || null
                        })
                      });

                      if (response.ok) {
                        toast.success(`Anúncio ${editingAnnouncement ? 'atualizado' : 'criado'} com sucesso!`);
                        setShowAnnouncementModal(false);
                        setEditingAnnouncement(null);
                        loadData(true);
                      } else {
                        const error = await response.json();
                        toast.error(`Erro: ${error.error || 'Erro desconhecido'}`);
                      }
                    } catch (error) {
                      toast.error('Erro de conexão');
                    } finally {
                      setAnnouncementSubmitting(false);
                    }
                  }} className="space-y-4">
                    <FormField label="Título do Anúncio" required>
                      <Input
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Último anúncio, Evento especial..."
                        required
                      />
                    </FormField>

                    <FormField label="Conteúdo do Anúncio" required>
                      <textarea
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Digite o conteúdo completo do anúncio aqui..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none resize-none"
                        rows={6}
                        required
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Prioridade (1-10)">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={announcementForm.priority}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                          placeholder="1"
                        />
                      </FormField>

                      <FormField label="Data de Expiração (opcional)">
                        <Input
                          type="date"
                          value={announcementForm.expires_at}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expires_at: e.target.value }))}
                        />
                      </FormField>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Quem deve ver este anúncio?</h4>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={announcementForm.target_new_users}
                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_new_users: e.target.checked }))}
                            className="rounded"
                          />
                          <div>
                            <span className="text-white">👋 Usuários novos</span>
                            <div className="text-gray-400 text-xs">Usuários cadastrados há menos de 7 dias</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={announcementForm.target_all_users}
                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_all_users: e.target.checked }))}
                            className="rounded"
                          />
                          <div>
                            <span className="text-white">👥 Todos os usuários</span>
                            <div className="text-gray-400 text-xs">Qualquer usuário que fizer login</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={announcementForm.is_active}
                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="rounded"
                          />
                          <div>
                            <span className="text-white">✅ Anúncio ativo</span>
                            <div className="text-gray-400 text-xs">Se desmarcado, o anúncio não aparecerá para ninguém</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowAnnouncementModal(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={announcementSubmitting}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        {announcementSubmitting ? 'Salvando...' : editingAnnouncement ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {activeTab === 'live-activities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gerenciar Atividades ao Vivo</h2>
              <div className="text-sm text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                🔥 Crie atividades falsas que aparecem no ticker ao vivo
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Como Usar as Atividades ao Vivo
              </h3>
              <div className="space-y-2 text-blue-300 text-sm">
                <p>• <strong>Ticker automático:</strong> As atividades aparecem no ticker que roda na página inicial</p>
                <p>• <strong>Nomes mascarados:</strong> Automaticamente converte nomes em "Usuario*****" para privacidade</p>
                <p>• <strong>Tipos disponíveis:</strong> Saques, compras VIP, cadastros, assistir vídeos</p>
                <p>• <strong>Valores realistas:</strong> Use valores que pareçam genuínos (ex: R$ 25, R$ 150)</p>
                <p>• <strong>Limite automático:</strong> Sistema mantém apenas as 50 atividades mais recentes</p>
                <p>• <strong>Atualização em tempo real:</strong> Aparecem instantaneamente para os usuários</p>
              </div>
            </div>

            {/* Form para criar atividade */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Criar Nova Atividade
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                if (!liveActivityForm.user_name.trim()) {
                  toast.error('Nome do usuário é obrigatório');
                  return;
                }

                setLiveActivitySubmitting(true);

                try {
                  const response = await fetch('/api/admin/live-activities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(liveActivityForm)
                  });

                  if (response.ok) {
                    const data = await response.json();
                    toast.success(data.message || 'Atividade criada com sucesso!');
                    setLiveActivityForm({
                      activity_type: 'withdrawal',
                      user_name: '',
                      custom_message: '',
                      amount: 0,
                      level_info: ''
                    });
                    loadData(true); // Refresh data
                  } else {
                    const error = await response.json();
                    toast.error(`Erro: ${error.error || 'Erro desconhecido'}`);
                  }
                } catch (error) {
                  toast.error('Erro de conexão');
                } finally {
                  setLiveActivitySubmitting(false);
                }
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Tipo de Atividade" required>
                    <select
                      value={liveActivityForm.activity_type}
                      onChange={(e) => setLiveActivityForm(prev => ({ 
                        ...prev, 
                        activity_type: e.target.value,
                        amount: e.target.value === 'withdrawal' ? 120 :
                               e.target.value === 'vip_purchase' ? 150 :
                               e.target.value === 'intermediate_purchase' ? 97.90 :
                               e.target.value === 'video_watch' ? 2.0 : 0,
                        level_info: e.target.value === 'vip_purchase' ? 'VIP 1' : ''
                      }))}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      required
                    >
                      <option value="withdrawal">💰 Saque</option>
                      <option value="vip_purchase">👑 Compra VIP</option>
                      <option value="intermediate_purchase">📈 Compra Intermediário</option>
                      <option value="registration">🆕 Cadastro</option>
                      <option value="video_watch">🎬 Assistir Vídeo</option>
                    </select>
                  </FormField>

                  <FormField label="Nome do Usuário" required>
                    <Input
                      value={liveActivityForm.user_name}
                      onChange={(e) => setLiveActivityForm(prev => ({ ...prev, user_name: e.target.value }))}
                      placeholder="Ex: João Silva, Maria Santos..."
                      required
                    />
                    <div className="text-xs text-blue-400 mt-1">
                      💡 Será automaticamente mascarado para "Usuario*****"
                    </div>
                  </FormField>

                  {(liveActivityForm.activity_type === 'withdrawal' || 
                    liveActivityForm.activity_type === 'vip_purchase' ||
                    liveActivityForm.activity_type === 'intermediate_purchase' ||
                    liveActivityForm.activity_type === 'video_watch') && (
                    <FormField label="Valor (R$)">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={liveActivityForm.amount}
                        onChange={(e) => setLiveActivityForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="Ex: 120.00"
                      />
                    </FormField>
                  )}

                  {liveActivityForm.activity_type === 'vip_purchase' && (
                    <FormField label="Nível VIP">
                      <select
                        value={liveActivityForm.level_info}
                        onChange={(e) => setLiveActivityForm(prev => ({ ...prev, level_info: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      >
                        <option value="VIP 1">VIP 1</option>
                        <option value="VIP 2">VIP 2</option>
                        <option value="VIP 3">VIP 3</option>
                        <option value="VIP 4">VIP 4</option>
                        <option value="VIP 5">VIP 5</option>
                        <option value="VIP 6">VIP 6</option>
                        <option value="Intermediário">Intermediário</option>
                      </select>
                    </FormField>
                  )}
                </div>

                <FormField label="Mensagem Personalizada (opcional)">
                  <Input
                    value={liveActivityForm.custom_message}
                    onChange={(e) => setLiveActivityForm(prev => ({ ...prev, custom_message: e.target.value }))}
                    placeholder="Deixe vazio para usar mensagem automática"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Se deixar vazio, será gerada automaticamente baseada no tipo de atividade
                  </div>
                </FormField>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={liveActivitySubmitting}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {liveActivitySubmitting ? 'Criando...' : 'Criar Atividade'}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Criar 10 atividades aleatórias?')) return;

                      setLiveActivitySubmitting(true);
                      try {
                        const response = await fetch('/api/admin/live-activities/bulk', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ count: 10 })
                        });

                        if (response.ok) {
                          const data = await response.json();
                          toast.success(data.message);
                          loadData(true);
                        } else {
                          const error = await response.json();
                          toast.error(error.error);
                        }
                      } catch (error) {
                        toast.error('Erro de conexão');
                      } finally {
                        setLiveActivitySubmitting(false);
                      }
                    }}
                    disabled={liveActivitySubmitting}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Criar 10 Aleatórias
                  </Button>
                </div>
              </form>
            </div>

            {/* Lista de atividades */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Atividades Recentes ({liveActivities.length})
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => loadData(true)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:bg-blue-500/20"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!confirm('Deletar TODAS as atividades? Esta ação não pode ser desfeita.')) return;
                      
                      try {
                        const response = await fetch('/api/admin/live-activities', {
                          method: 'DELETE',
                          credentials: 'include'
                        });

                        if (response.ok) {
                          toast.success('Todas as atividades foram deletadas');
                          loadData(true);
                        } else {
                          toast.error('Erro ao deletar atividades');
                        }
                      } catch (error) {
                        toast.error('Erro de conexão');
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Limpar Todas
                  </Button>
                </div>
              </div>

              {liveActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Nenhuma atividade criada</h4>
                  <p className="text-gray-400">Crie sua primeira atividade para aparecer no ticker ao vivo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        activity.is_active 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-gray-500/10 border-gray-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {activity.activity_type === 'withdrawal' ? '💰' :
                             activity.activity_type === 'vip_purchase' ? '👑' :
                             activity.activity_type === 'intermediate_purchase' ? '📈' :
                             activity.activity_type === 'registration' ? '🆕' :
                             activity.activity_type === 'video_watch' ? '🎬' : '🔥'}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {activity.message}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {activity.activity_type === 'withdrawal' ? 'Saque' :
                               activity.activity_type === 'vip_purchase' ? 'Compra VIP' :
                               activity.activity_type === 'intermediate_purchase' ? 'Plano Intermediário' :
                               activity.activity_type === 'registration' ? 'Novo Cadastro' :
                               activity.activity_type === 'video_watch' ? 'Vídeo Assistido' : 'Atividade'}
                              {' • '}
                              {new Date(activity.created_at).toLocaleString('pt-BR')}
                              {activity.amount && (
                                <span className="text-green-400 ml-2 font-semibold">
                                  R$ {activity.amount.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            activity.is_active 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {activity.is_active ? '🟢 Ativo' : '🔴 Inativo'}
                          </span>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await fetch(`/api/admin/live-activities/${activity.id}/toggle`, {
                                  method: 'PATCH',
                                  credentials: 'include'
                                });
                                loadData(true);
                              } catch (error) {
                                toast.error('Erro ao alterar status');
                              }
                            }}
                            className="text-blue-400 hover:bg-blue-500/20"
                          >
                            {activity.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!confirm('Deletar esta atividade?')) return;
                              
                              try {
                                await fetch(`/api/admin/live-activities/${activity.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                                toast.success('Atividade deletada');
                                loadData(true);
                              } catch (error) {
                                toast.error('Erro ao deletar atividade');
                              }
                            }}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview de como aparece no ticker */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                👁️ Preview do Ticker ao Vivo
              </h3>
              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="text-white text-sm mb-2 opacity-70">Como aparece na página inicial:</div>
                <div className="overflow-hidden">
                  <div className="flex gap-8 animate-pulse">
                    {liveActivities.filter(a => a.is_active).slice(0, 3).map((activity, index) => (
                      <div 
                        key={index}
                        className="whitespace-nowrap text-green-400 text-sm bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"
                      >
                        {activity.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vip-groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gerenciar Grupos VIP</h2>
              <Button
                onClick={() => {
                  setEditingVipGroup(null);
                  setVipGroupForm({
                    name: '',
                    platform: 'whatsapp',
                    invite_link: '',
                    description: '',
                    vip_level_required: 1,
                    is_active: true
                  });
                  setShowVipGroupModal(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Criar Grupo VIP
              </Button>
            </div>

            {/* Instruções */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Como funcionam os Grupos VIP
              </h3>
              <div className="space-y-2 text-blue-300 text-sm">
                <p>• <strong>WhatsApp:</strong> Grupos no WhatsApp para comunicação direta com usuários VIP</p>
                <p>• <strong>Telegram:</strong> Canais ou grupos no Telegram para atualizações e suporte</p>
                <p>• <strong>Nível necessário:</strong> Define qual nível VIP mínimo é necessário para acessar o grupo</p>
                <p>• <strong>Links de convite:</strong> URLs diretas para os grupos (ex: https://chat.whatsapp.com/...)</p>
                <p>• <strong>Visibilidade:</strong> Usuários só veem grupos que atendem ao nível VIP deles</p>
                <p>• <strong>Status ativo:</strong> Apenas grupos ativos aparecem para os usuários</p>
              </div>
            </div>

            {/* Estatísticas dos Grupos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-white/70 text-sm">WhatsApp</p>
                    <p className="text-xl font-bold text-green-400">
                      {vipGroups.filter(g => g.platform === 'whatsapp' && g.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Send className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70 text-sm">Telegram</p>
                    <p className="text-xl font-bold text-blue-400">
                      {vipGroups.filter(g => g.platform === 'telegram' && g.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-yellow-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total Ativos</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {vipGroups.filter(g => g.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-purple-400" />
                  <div>
                    <p className="text-white/70 text-sm">Total Grupos</p>
                    <p className="text-xl font-bold text-purple-400">
                      {vipGroups.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Grupos VIP */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Grupos VIP Criados ({vipGroups.length})
              </h3>

              {vipGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Nenhum grupo VIP criado</h4>
                  <p className="text-gray-400">Crie seu primeiro grupo VIP para conectar com os usuários</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vipGroups.map((group) => (
                    <div 
                      key={group.id} 
                      className={`bg-white/5 p-6 rounded-xl border transition-all ${
                        group.is_active 
                          ? 'border-green-500/30 bg-green-500/5' 
                          : 'border-gray-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            group.platform === 'whatsapp' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {group.platform === 'whatsapp' ? (
                              <div className="text-2xl">💚</div>
                            ) : (
                              <Send className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-white font-bold text-lg">{group.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                group.is_active 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {group.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                                VIP {group.vip_level_required}+
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                group.platform === 'whatsapp' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {group.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}</span>
                              <span>•</span>
                              <span>{group.member_count || 0} membros</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(group.invite_link, '_blank')}
                            className="text-green-400 hover:bg-green-500/20"
                            title="Abrir link do grupo"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingVipGroup(group);
                              setVipGroupForm({
                                name: group.name,
                                platform: group.platform as 'whatsapp' | 'telegram',
                                invite_link: group.invite_link,
                                description: group.description || '',
                                vip_level_required: group.vip_level_required,
                                is_active: group.is_active
                              });
                              setShowVipGroupModal(true);
                            }}
                            className="text-blue-400 hover:bg-blue-500/20"
                            title="Editar grupo"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await fetch(`/api/admin/vip-groups/${group.id}/toggle`, {
                                  method: 'PATCH',
                                  credentials: 'include'
                                });
                                toast.success('Status do grupo alterado!');
                                loadData(true);
                              } catch (error) {
                                toast.error('Erro ao alterar status');
                              }
                            }}
                            className="text-yellow-400 hover:bg-yellow-500/20"
                            title={group.is_active ? 'Desativar grupo' : 'Ativar grupo'}
                          >
                            {group.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!confirm(`Tem certeza que deseja deletar o grupo "${group.name}"? Esta ação não pode ser desfeita.`)) return;
                              
                              try {
                                await fetch(`/api/admin/vip-groups/${group.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                                toast.success('Grupo deletado com sucesso!');
                                loadData(true);
                              } catch (error) {
                                toast.error('Erro ao deletar grupo');
                              }
                            }}
                            className="text-red-400 hover:bg-red-500/20"
                            title="Deletar grupo"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Descrição */}
                      {group.description && (
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <h5 className="text-white font-medium mb-2">Descrição:</h5>
                          <p className="text-gray-300 text-sm">{group.description}</p>
                        </div>
                      )}

                      {/* Link do grupo */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-blue-400" />
                          Link de Convite:
                        </h5>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 text-blue-300 text-sm bg-black/20 p-2 rounded border break-all">
                            {group.invite_link}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(group.invite_link);
                              toast.success('Link copiado!');
                            }}
                            className="text-gray-400 hover:text-white"
                            title="Copiar link"
                          >
                            📋
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal para criar/editar grupo VIP */}
            {showVipGroupModal && (
              <Dialog open={showVipGroupModal} onOpenChange={setShowVipGroupModal}>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {editingVipGroup ? 'Editar Grupo VIP' : 'Criar Novo Grupo VIP'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingVipGroup ? 'Edite as informações do grupo VIP.' : 'Crie um grupo VIP para conectar com usuários premium.'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    
                    if (!vipGroupForm.name.trim() || !vipGroupForm.invite_link.trim()) {
                      toast.error('Nome e link de convite são obrigatórios');
                      return;
                    }

                    setVipGroupSubmitting(true);

                    try {
                      const endpoint = editingVipGroup 
                        ? `/api/admin/vip-groups/${editingVipGroup.id}`
                        : '/api/admin/vip-groups';
                      
                      const method = editingVipGroup ? 'PATCH' : 'POST';

                      const response = await fetch(endpoint, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(vipGroupForm)
                      });

                      if (response.ok) {
                        const data = await response.json();
                        toast.success(data.message || `Grupo VIP ${editingVipGroup ? 'atualizado' : 'criado'} com sucesso!`);
                        setShowVipGroupModal(false);
                        setEditingVipGroup(null);
                        setVipGroupForm({
                          name: '',
                          platform: 'whatsapp',
                          invite_link: '',
                          description: '',
                          vip_level_required: 1,
                          is_active: true
                        });
                        loadData(true);
                      } else {
                        const error = await response.json();
                        toast.error(`Erro: ${error.error || 'Erro desconhecido'}`);
                      }
                    } catch (error) {
                      toast.error('Erro de conexão');
                    } finally {
                      setVipGroupSubmitting(false);
                    }
                  }} className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nome do Grupo" required>
                        <Input
                          value={vipGroupForm.name}
                          onChange={(e) => setVipGroupForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Grupo VIP Premium, Canal de Atualizações..."
                          required
                        />
                      </FormField>

                      <FormField label="Plataforma" required>
                        <select
                          value={vipGroupForm.platform}
                          onChange={(e) => setVipGroupForm(prev => ({ ...prev, platform: e.target.value as 'whatsapp' | 'telegram' }))}
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                          required
                        >
                          <option value="whatsapp">💚 WhatsApp</option>
                          <option value="telegram">📱 Telegram</option>
                        </select>
                      </FormField>

                      <FormField label="Nível VIP Necessário" required>
                        <select
                          value={vipGroupForm.vip_level_required}
                          onChange={(e) => setVipGroupForm(prev => ({ ...prev, vip_level_required: parseInt(e.target.value) }))}
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                          required
                        >
                          <option value="1">👑 VIP 1+</option>
                          <option value="2">💎 VIP 2+</option>
                          <option value="3">🌟 VIP 3+</option>
                          <option value="4">⭐ VIP 4+</option>
                          <option value="5">💫 VIP 5+</option>
                          <option value="6">🔥 VIP 6 apenas</option>
                        </select>
                      </FormField>

                      <FormField label="Status" required>
                        <select
                          value={vipGroupForm.is_active.toString()}
                          onChange={(e) => setVipGroupForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                        >
                          <option value="true">✅ Ativo</option>
                          <option value="false">❌ Inativo</option>
                        </select>
                      </FormField>
                    </div>

                    <FormField label="Link de Convite" required>
                      <Input
                        value={vipGroupForm.invite_link}
                        onChange={(e) => setVipGroupForm(prev => ({ ...prev, invite_link: e.target.value }))}
                        placeholder={vipGroupForm.platform === 'whatsapp' 
                          ? "https://chat.whatsapp.com/..." 
                          : "https://t.me/..."
                        }
                        required
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {vipGroupForm.platform === 'whatsapp' 
                          ? '💡 Obtenha este link nas configurações do grupo do WhatsApp'
                          : '💡 Obtenha este link nas configurações do canal/grupo do Telegram'
                        }
                      </div>
                    </FormField>

                    <FormField label="Descrição (opcional)">
                      <textarea
                        value={vipGroupForm.description}
                        onChange={(e) => setVipGroupForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição sobre o grupo, benefícios, regras, etc..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none resize-none"
                        rows={3}
                      />
                    </FormField>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowVipGroupModal(false);
                          setEditingVipGroup(null);
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={vipGroupSubmitting}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        {vipGroupSubmitting ? 'Salvando...' : editingVipGroup ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {/* Grupos por Plataforma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Groups */}
              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="text-green-400 text-xl">💚</div>
                  Grupos WhatsApp ({vipGroups.filter(g => g.platform === 'whatsapp').length})
                </h3>

                {vipGroups.filter(g => g.platform === 'whatsapp').length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-3">💚</div>
                    <p className="text-gray-400 text-sm">Nenhum grupo WhatsApp criado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vipGroups.filter(g => g.platform === 'whatsapp').map((group) => (
                      <div 
                        key={group.id}
                        className={`p-4 rounded-lg border ${
                          group.is_active 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-gray-500/10 border-gray-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-medium">{group.name}</h5>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            VIP {group.vip_level_required}+
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-gray-400 text-sm mb-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <code className="text-green-300 text-xs bg-black/20 p-1 rounded flex-1 truncate">
                            {group.invite_link}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(group.invite_link, '_blank')}
                            className="text-green-400 hover:bg-green-500/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Telegram Groups */}
              <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-400" />
                  Grupos Telegram ({vipGroups.filter(g => g.platform === 'telegram').length})
                </h3>

                {vipGroups.filter(g => g.platform === 'telegram').length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Nenhum grupo Telegram criado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vipGroups.filter(g => g.platform === 'telegram').map((group) => (
                      <div 
                        key={group.id}
                        className={`p-4 rounded-lg border ${
                          group.is_active 
                            ? 'bg-blue-500/10 border-blue-500/30' 
                            : 'bg-gray-500/10 border-gray-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-medium">{group.name}</h5>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            VIP {group.vip_level_required}+
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-gray-400 text-sm mb-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <code className="text-blue-300 text-xs bg-black/20 p-1 rounded flex-1 truncate">
                            {group.invite_link}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(group.invite_link, '_blank')}
                            className="text-blue-400 hover:bg-blue-500/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Webhooks</h2>
            
            {/* Configurações de webhook */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações de Webhook</h3>
              <div className="space-y-4">
                {webhookConfigs.map((config) => (
                  <div key={config.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="text-white font-medium mb-2">{config.provider}</div>
                    <div className="text-gray-400 text-sm">{config.webhook_url}</div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        config.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {config.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logs de webhook */}
            <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Logs de Webhook</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white">Provider</th>
                      <th className="px-4 py-2 text-left text-white">Evento</th>
                      <th className="px-4 py-2 text-left text-white">Email</th>
                      <th className="px-4 py-2 text-left text-white">Valor</th>
                      <th className="px-4 py-2 text-left text-white">Status</th>
                      <th className="px-4 py-2 text-left text-white">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-white">{log.provider}</td>
                        <td className="px-4 py-2 text-white">{log.event_type}</td>
                        <td className="px-4 py-2 text-white">{log.user_email || 'N/A'}</td>
                        <td className="px-4 py-2 text-green-400">
                          {log.amount ? `R$ ${log.amount.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            log.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                            log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400">
                          {new Date(log.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Custom Videos Modal */}
        {selectedUser && (
          <UserCustomVideosModal
            isOpen={customVideosModalOpen}
            onClose={() => {
              setCustomVideosModalOpen(false);
              setSelectedUser(null);
            }}
            user={{
              id: selectedUser.id,
              name: selectedUser.name || selectedUser.email,
              email: selectedUser.email,
              daily_videos_watched: selectedUser.daily_videos_watched || 0,
              daily_limit: selectedUser.daily_limit || 15,
              custom_daily_limit: selectedUser.custom_daily_limit,
              total_videos_watched: selectedUser.total_videos_watched,
              current_balance: selectedUser.current_balance
            }}
          />
        )}

        {/* User Videos View Modal */}
        {selectedUser && (
          <UserVideosViewModal
            isOpen={userVideosViewModalOpen}
            onClose={() => {
              setUserVideosViewModalOpen(false);
              setSelectedUser(null);
            }}
            userId={selectedUser.id}
            userName={selectedUser.name || selectedUser.email}
            userEmail={selectedUser.email}
          />
        )}

        {/* Quick Video Assign Modal */}
        {selectedUser && (
          <QuickVideoAssignModal
            isOpen={quickAssignModalOpen}
            onClose={() => {
              setQuickAssignModalOpen(false);
              setSelectedUser(null);
            }}
            userId={selectedUser.id}
            userName={selectedUser.name || selectedUser.email}
            userEmail={selectedUser.email}
            onSuccess={() => {
              loadData(true); // Refresh data after successful assignment
            }}
          />
        )}

        {/* User Selector Modal */}
        {showUserSelector && (
          <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-400" />
                  Selecionar Usuários para o Vídeo
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Escolha quais usuários devem receber este vídeo. Você pode buscar por nome ou email.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-auto space-y-4">
                {/* Search */}
                <div className="sticky top-0 bg-gray-800 pb-4">
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Buscar usuários por nome ou email..."
                    className="w-full"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <div className="text-blue-400 font-bold text-lg">
                      {(userSelectorMode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids).length}
                    </div>
                    <div className="text-gray-400 text-sm">Selecionados</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <div className="text-green-400 font-bold text-lg">
                      {availableUsers.filter(user => 
                        !userSearchQuery || 
                        user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                      ).length}
                    </div>
                    <div className="text-gray-400 text-sm">Disponíveis</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <div className="text-purple-400 font-bold text-lg">
                      {availableUsers.length}
                    </div>
                    <div className="text-gray-400 text-sm">Total</div>
                  </div>
                </div>

                {/* User Table */}
                <div className="bg-white/5 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-white/10 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                availableUsers.filter(user => 
                                  !userSearchQuery || 
                                  user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                  user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                                ).length > 0 &&
                                availableUsers.filter(user => 
                                  !userSearchQuery || 
                                  user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                  user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                                ).every(user => 
                                  (userSelectorMode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids).includes(user.id)
                                )
                              }
                              onChange={(e) => {
                                const filteredUsers = availableUsers.filter(user => 
                                  !userSearchQuery || 
                                  user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                  user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                                );
                                
                                if (e.target.checked) {
                                  // Select all filtered users
                                  const newIds = filteredUsers.map(user => user.id);
                                  const currentIds = userSelectorMode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids;
                                  const combinedIds = [...new Set([...currentIds, ...newIds])];
                                  
                                  if (userSelectorMode === 'video') {
                                    setVideoForm(prev => ({ ...prev, selected_user_ids: combinedIds }));
                                  } else {
                                    setHomeVideoForm(prev => ({ ...prev, selected_user_ids: combinedIds }));
                                  }
                                } else {
                                  // Deselect all filtered users
                                  const filteredIds = new Set(filteredUsers.map(user => user.id));
                                  const currentIds = userSelectorMode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids;
                                  const remainingIds = currentIds.filter(id => !filteredIds.has(id));
                                  
                                  if (userSelectorMode === 'video') {
                                    setVideoForm(prev => ({ ...prev, selected_user_ids: remainingIds }));
                                  } else {
                                    setHomeVideoForm(prev => ({ ...prev, selected_user_ids: remainingIds }));
                                  }
                                }
                              }}
                              className="rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-white">Usuário</th>
                          <th className="px-4 py-3 text-left text-white">Nível</th>
                          <th className="px-4 py-3 text-left text-white">Vídeos Hoje</th>
                          <th className="px-4 py-3 text-left text-white">Saldo</th>
                          <th className="px-4 py-3 text-left text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {availableUsers
                          .filter(user => 
                            !userSearchQuery || 
                            user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                          )
                          .map((user) => {
                            const isSelected = (userSelectorMode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids).includes(user.id);
                            
                            return (
                              <tr key={user.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}>
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleUserSelection(user.id, e.target.checked, userSelectorMode)}
                                    className="rounded"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      user.videos_today && user.videos_today > 0 ? 'bg-green-400' : 'bg-gray-500'
                                    }`}></div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{user.name || 'N/A'}</span>
                                        {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                                      </div>
                                      <div className="text-gray-400 text-sm">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-purple-400 font-semibold">
                                    Nível {user.level || 1}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 font-bold">
                                      {user.videos_today || 0}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                      / {user.daily_limit || 15}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-green-400 font-semibold">
                                    R$ {user.current_balance.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.videos_today && user.videos_today > 0 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {user.videos_today && user.videos_today > 0 ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  
                  {availableUsers.filter(user => 
                    !userSearchQuery || 
                    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      Nenhum usuário encontrado
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  {(userSelectorMode === 'video' ? videoForm.selected_user_ids : homeVideoForm.selected_user_ids).length} usuário(s) selecionado(s)
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserSelector(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setShowUserSelector(false)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Confirmar Seleção
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// Coupons Tab Component
function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const { apiCall } = useApi();

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const [couponsData, statsData] = await Promise.all([
        apiCall('/admin/coupons'),
        apiCall('/admin/coupons/stats')
      ]);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Erro ao carregar cupons: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) return;

    try {
      await apiCall(`/admin/coupons/${couponId}`, { method: 'DELETE' });
      toast.success('Cupom deletado com sucesso!');
      loadCoupons();
    } catch (error: any) {
      toast.error('Erro ao deletar cupom: ' + error.message);
    }
  };

  const getDiscountDisplay = (type: string, value: number) => {
    switch (type) {
      case 'money': return `R$ ${value.toFixed(2)}`;
      case 'percentage': return `${value}%`;
      case 'bonus_videos': return `${value} vídeo${value > 1 ? 's' : ''}`;
      default: return value.toString();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'money': return '💰';
      case 'percentage': return '🎯';
      case 'bonus_videos': return '🎬';
      default: return '🎁';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="text-gray-400 text-sm">Total de Cupons</div>
            <div className="text-2xl font-bold text-white">{stats.total_coupons}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="text-gray-400 text-sm">Cupons Ativos</div>
            <div className="text-2xl font-bold text-green-400">{stats.active_coupons}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="text-gray-400 text-sm">Total de Usos</div>
            <div className="text-2xl font-bold text-blue-400">{stats.total_uses}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="text-gray-400 text-sm">Desconto Total Dado</div>
            <div className="text-2xl font-bold text-yellow-400">R$ {(stats.total_discount_given || 0).toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gerenciar Cupons</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          + Criar Cupom
        </Button>
      </div>

      {/* Coupons List */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-white">Código</th>
                <th className="px-4 py-3 text-left text-white">Tipo</th>
                <th className="px-4 py-3 text-left text-white">Valor</th>
                <th className="px-4 py-3 text-left text-white">Usos</th>
                <th className="px-4 py-3 text-left text-white">Status</th>
                <th className="px-4 py-3 text-left text-white">Expira</th>
                <th className="px-4 py-3 text-left text-white">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(coupon.discount_type)}</span>
                      <div>
                        <div className="font-mono text-white font-bold">{coupon.code}</div>
                        {coupon.description && (
                          <div className="text-gray-400 text-sm">{coupon.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{coupon.discount_type}</td>
                  <td className="px-4 py-3 text-white font-semibold">
                    {getDiscountDisplay(coupon.discount_type, coupon.discount_value)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {coupon.total_uses || 0} / {coupon.max_uses}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      coupon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {coupon.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCoupon(coupon)}
                        className="text-blue-400 hover:bg-blue-500/20"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        Deletar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Coupon Modal */}
      {(showCreateModal || editingCoupon) && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
            loadCoupons();
          }}
        />
      )}
    </div>
  );
}

// Coupon Create/Edit Modal
function CouponModal({ coupon, onClose, onSave }: { coupon?: any, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'money',
    discount_value: coupon?.discount_value || 0,
    max_uses: coupon?.max_uses || 1,
    expires_at: coupon?.expires_at ? coupon.expires_at.split('T')[0] : '',
    is_active: coupon?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (coupon) {
        // Edit existing coupon
        await apiCall(`/admin/coupons/${coupon.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...formData,
            expires_at: formData.expires_at || null
          })
        });
        toast.success('Cupom atualizado com sucesso!');
      } else {
        // Create new coupon
        await apiCall('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            expires_at: formData.expires_at || null
          })
        });
        toast.success('Cupom criado com sucesso!');
      }
      onSave();
    } catch (error: any) {
      toast.error('Erro ao salvar cupom: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {coupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {coupon ? 'Edite as informações do cupom.' : 'Crie um novo cupom de desconto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Código do Cupom" required>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Ex: WELCOME50"
              required
            />
          </FormField>

          <FormField label="Descrição">
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do cupom (opcional)"
            />
          </FormField>

          <FormField label="Tipo de Desconto" required>
            <select
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
              value={formData.discount_type}
              onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
              required
            >
              <option value="money">💰 Dinheiro (R$)</option>
              <option value="percentage">🎯 Porcentagem (%)</option>
              <option value="bonus_videos">🎬 Vídeos Bônus</option>
            </select>
          </FormField>

          <FormField label="Valor do Desconto" required>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.discount_value}
              onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
              placeholder="Ex: 50.00"
              required
            />
          </FormField>

          <FormField label="Máximo de Usos" required>
            <Input
              type="number"
              min="1"
              value={formData.max_uses}
              onChange={(e) => setFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))}
              placeholder="Ex: 100"
              required
            />
          </FormField>

          <FormField label="Data de Expiração">
            <Input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
            />
          </FormField>

          <FormField>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-white">Cupom ativo</span>
            </label>
          </FormField>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              {loading ? 'Salvando...' : coupon ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
