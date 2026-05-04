import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { VipGroupsButton } from '@/react-app/components/VipGroupsButton';
import { 
  User, 
  DollarSign, 
  Play, 
  Gift, 
  History, 
  Copy, 
  ExternalLink,
  Wallet,
  Star,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Shield,
  FileText
} from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import { ProfileSkeleton, StatCardSkeleton, TableRowSkeleton } from '@/react-app/components/ui/skeleton';
import type { DashboardStats, WithdrawRequest, Withdrawal, SpinResult } from '@/shared/types';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', pix_key: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { getDashboardStats, getWithdrawals, createWithdrawal, spinWheel, getAffiliateInfo } = useApi();

  // Componente SpinWheel realista com Canvas
  const SpinWheel = ({ onSpin }: { onSpin: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationIdRef = useRef<number>();
    const currentAngleRef = useRef(0);
    const velocityRef = useRef(0);
    const isSpinningRef = useRef(false);

    const segments = [
      { label: "💰 R$2,00", color: "#22c55e" },
      { label: "❌ Nada", color: "#ef4444" },
      { label: "🎁 Bônus", color: "#3b82f6" },
      { label: "❌ Nada", color: "#ef4444" },
      { label: "💎 R$5,00", color: "#a855f7" },
      { label: "❌ Nada", color: "#ef4444" }
    ];

    const drawWheel = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const radius = canvas.width / 2;
      const centerX = radius;
      const centerY = radius;
      const segmentAngle = (2 * Math.PI) / segments.length;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw segments
      for (let i = 0; i < segments.length; i++) {
        const startAngle = currentAngleRef.current + i * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        // Create gradient for segment
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, segments[i].color);
        gradient.addColorStop(1, "#111827");

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.fillText(segments[i].label, radius - 20, 5);
        ctx.restore();
      }

      // Draw center circle with glow effect
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fillStyle = "#111827";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    }, [segments]);

    const animate = useCallback(() => {
      if (!isSpinningRef.current) return;

      currentAngleRef.current += velocityRef.current;
      velocityRef.current *= 0.98; // Smooth deceleration

      if (velocityRef.current < 0.002) {
        isSpinningRef.current = false;
        onSpin();
      }

      drawWheel();
      if (isSpinningRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    }, [drawWheel, onSpin]);

    const startSpin = () => {
      if (!isSpinningRef.current) {
        velocityRef.current = Math.random() * 0.5 + 0.4;
        isSpinningRef.current = true;
        animate();
      }
    };

    useEffect(() => {
      drawWheel();
      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
      };
    }, [drawWheel]);

    return (
      <div className="text-center">
        <div className="relative inline-block">
          {/* Fixed pointer */}
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
            style={{
              width: '0',
              height: '0',
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderBottom: '25px solid #facc15',
              marginTop: '10px'
            }}
          />
          <canvas 
            ref={canvasRef} 
            width={320} 
            height={320}
            className="mx-auto mb-6 drop-shadow-2xl cursor-pointer hover:scale-105 transition-transform rounded-full"
            style={{
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.1), 0 0 80px rgba(0, 255, 255, 0.3)'
            }}
            onClick={startSpin}
          />
        </div>
        <p className="text-gray-400 mb-6">
          Clique na roleta para girar e ganhe prêmios incríveis!
        </p>
        <button
          onClick={startSpin}
          disabled={isSpinningRef.current}
          className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-3 px-6 rounded-xl font-bold text-lg hover:from-green-500 hover:to-green-700 transition-all hover:scale-105 shadow-lg shadow-green-500/30 disabled:opacity-50"
        >
          🎯 Girar Roleta
        </button>
      </div>
    );
  };

  useEffect(() => {
    loadData();

    // Check for spin parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spin') === 'true') {
      setShowSpinModal(true);
      // Clean URL
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, withdrawalsData] = await Promise.all([
        getDashboardStats(),
        getWithdrawals()
      ]);
      setStats(statsData);
      setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const amount = parseFloat(withdrawForm.amount);
      const request: WithdrawRequest = {
        amount,
        pix_key: withdrawForm.pix_key
      };
      
      await createWithdrawal(request);
      
      // Show success modal instead of alert
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', pix_key: '' });
      
      // Show success message modal
      const successModal = document.createElement('div');
      successModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
      successModal.innerHTML = `
        <div class="fixed inset-0 bg-black/80"></div>
        <div class="relative w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-700 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-4">Saque Solicitado!</h2>
          <p class="text-gray-400 mb-2">Valor: <span class="text-green-400 font-semibold">R$ ${amount.toFixed(2)}</span></p>
          <p class="text-gray-400 mb-6">Chave PIX: <span class="text-blue-400">${request.pix_key}</span></p>
          <div class="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-yellow-400 font-semibold">Status: Em Análise</span>
            </div>
            <p class="text-sm text-yellow-300">Seu saque está sendo analisado pela nossa equipe. Você será notificado quando for processado.</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-500 transition-colors">
            Fechar
          </button>
        </div>
      `;
      document.body.appendChild(successModal);
      
      loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao solicitar saque');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    try {
      const result = await spinWheel();
      setSpinResult(result);
      setTimeout(() => {
        setIsSpinning(false);
        // Reload stats to show updated balance/bonus videos
        loadData();
      }, 3000);
    } catch (error) {
      setIsSpinning(false);
      alert(error instanceof Error ? error.message : 'Erro ao girar a roleta');
    }
  };

  const copyAffiliateLink = async () => {
    try {
      const affiliateInfo = await getAffiliateInfo();
      await navigator.clipboard.writeText(affiliateInfo.affiliate_link);
      alert('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="text-center lg:text-left space-y-3">
          <div className="h-8 bg-gray-700/50 rounded-xl w-64"></div>
          <div className="h-4 bg-gray-700/30 rounded-lg w-80"></div>
        </div>

        {/* User info skeleton */}
        <ProfileSkeleton />

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Quick actions and progress skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4">
            <div className="h-5 bg-gray-700 rounded w-32"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 bg-gray-700 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-600 rounded w-32"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4">
            <div className="h-5 bg-gray-700 rounded w-40"></div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-700 rounded w-12"></div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-700 rounded w-28"></div>
                <div className="h-3 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal history skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-700 rounded w-40"></div>
            <div className="w-5 h-5 bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header - Mobile optimized */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Meu Perfil 👤
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Gerencie sua conta, veja seus ganhos e solicite saques.
        </p>
      </div>

      {/* User info card - Mobile optimized */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <img
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-green-400/30 flex-shrink-0"
            src={user?.google_user_data?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.google_user_data?.name || user?.email || 'User')}
            alt="Profile"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-1 truncate">
              {user?.google_user_data?.name || user?.email || 'Usuário'}
            </h2>
            <p className="text-gray-400 mb-2 text-sm truncate">{user?.email}</p>
            {stats && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 text-purple-400">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Nível {stats.level} - {stats.level_title}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{stats.total_videos_watched} vídeos</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-xl p-4 border border-green-500/20 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-xs font-medium uppercase tracking-wide">Saldo Disponível</p>
                <p className="text-2xl lg:text-3xl font-bold text-white">
                  R$ {stats.current_balance.toFixed(2)}
                </p>
              </div>
              <Wallet className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
            </div>
            <button
              onClick={() => {
                // Check if user has VIP or Intermediate plan
                if (stats.level >= 2) {
                  // User has Intermediate (level 2) or VIP (level 3+) - can withdraw
                  if (stats.current_balance >= 20) {
                    setShowWithdrawModal(true);
                  } else {
                    alert('Saldo mínimo para saque: R$20,00');
                  }
                } else {
                  // User is Iniciante (level 1) - redirect to career page
                  window.location.href = '/carreira';
                }
              }}
              disabled={stats.level < 2 && stats.current_balance < 20}
              className={`w-full mt-4 py-2 px-4 rounded-xl font-semibold transition-all ${
                stats.level >= 2 && stats.current_balance >= 20
                  ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700'
                  : stats.level >= 2
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : stats.current_balance >= 20
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {stats.level >= 2 
                ? (stats.current_balance >= 20 ? 'Solicitar Saque' : 'Mínimo R$20')
                : (stats.current_balance >= 20 ? 'Ver Planos VIP' : 'Mínimo R$20')
              }
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-xs font-medium uppercase tracking-wide">Total Ganho</p>
                <p className="text-2xl lg:text-3xl font-bold text-white">
                  R$ {stats.total_earnings.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Média: R$ {stats.total_videos_watched > 0 ? (stats.total_earnings / stats.total_videos_watched).toFixed(2) : '0,00'} por vídeo
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-600/10 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-xs font-medium uppercase tracking-wide">Roleta Diária</p>
                <p className="text-base lg:text-lg font-bold text-white">
                  {stats.can_spin_today ? 'Disponível!' : 'Já usado hoje'}
                </p>
              </div>
              <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400" />
            </div>
            <button
              onClick={() => setShowSpinModal(true)}
              disabled={!stats.can_spin_today}
              className={`w-full mt-4 py-2 px-4 rounded-xl font-semibold transition-all ${
                stats.can_spin_today
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {stats.can_spin_today ? 'Girar Roleta' : 'Volte Amanhã'}
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={copyAffiliateLink}
              className="w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Copy className="w-5 h-5 text-green-400" />
                <span className="text-white">Copiar Link de Afiliado</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
            
            <a
              href="/affiliates"
              className="w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-400" />
                <span className="text-white">Programa de Afiliados</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>

            <a
              href="/ranking"
              className="w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Ver Ranking</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>

            <button
              onClick={() => setShowAboutModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-purple-400" />
                <span className="text-white">Sobre Nós</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>

            <a
              href="/build-android.md"
              target="_blank"
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-green-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <span className="text-white font-medium">Download do App Android</span>
              </div>
              <ExternalLink className="w-4 h-4 text-green-400" />
            </a>
          </div>
        </div>

        {stats && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Progresso do Nível</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Nível {stats.level} - {stats.level_title}</span>
                  <span className="text-green-400 font-medium">{stats.progress_to_next_level.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${stats.progress_to_next_level}%` }}
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-400">
                <p>Vídeos assistidos: {stats.total_videos_watched}</p>
                <p>Limite diário atual: {stats.daily_limit} vídeos</p>
                {stats.bonus_videos > 0 && (
                  <p className="text-orange-400">Vídeos bônus: {stats.bonus_videos}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIP Groups Section */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-green-300 font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Grupos VIP Exclusivos
            </h3>
            <p className="text-green-200 text-sm">
              Conecte-se com outros membros premium
            </p>
          </div>
          <VipGroupsButton />
        </div>
      </div>

      {/* Withdrawal history */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Histórico de Saques</h3>
          <History className="w-5 h-5 text-gray-400" />
        </div>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum saque realizado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div 
                key={withdrawal.id} 
                className="p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors"
                onClick={() => {
                  // Show withdrawal details modal
                  const detailsModal = document.createElement('div');
                  detailsModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
                  detailsModal.innerHTML = `
                    <div class="fixed inset-0 bg-black/80" onclick="this.parentElement.remove()"></div>
                    <div class="relative w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-700">
                      <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-full ${
                          withdrawal.status === 'pending' 
                            ? 'bg-yellow-400/20 border-4 border-yellow-400/30' 
                            : withdrawal.status === 'approved'
                            ? 'bg-green-400/20 border-4 border-green-400/30'
                            : 'bg-red-400/20 border-4 border-red-400/30'
                        } flex items-center justify-center mx-auto mb-4">
                          ${withdrawal.status === 'pending' 
                            ? '<svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' 
                            : withdrawal.status === 'approved'
                            ? '<svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
                            : '<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
                          }
                        </div>
                        <h2 class="text-xl font-bold text-white mb-2">
                          ${withdrawal.status === 'pending' ? 'Saque em Análise' : 
                            withdrawal.status === 'approved' ? 'Saque Concluído' : 'Saque Rejeitado'}
                        </h2>
                        <p class="text-2xl font-bold ${
                          withdrawal.status === 'approved' ? 'text-green-400' : 
                          withdrawal.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                        }">
                          R$ ${withdrawal.amount.toFixed(2)}
                        </p>
                      </div>
                      
                      <div class="space-y-4">
                        <div class="bg-gray-800/50 rounded-lg p-4 space-y-3">
                          <div class="flex justify-between">
                            <span class="text-gray-400">Chave PIX:</span>
                            <span class="text-white font-mono">${withdrawal.pix_key}</span>
                          </div>
                          
                          <div class="flex justify-between">
                            <span class="text-gray-400">Data da solicitação:</span>
                            <span class="text-white">${new Date(withdrawal.created_at).toLocaleDateString('pt-BR')} ${new Date(withdrawal.created_at).toLocaleTimeString('pt-BR')}</span>
                          </div>
                          
                          ${withdrawal.processed_at ? `
                            <div class="flex justify-between">
                              <span class="text-gray-400">Data do processamento:</span>
                              <span class="text-white">${new Date(withdrawal.processed_at).toLocaleDateString('pt-BR')} ${new Date(withdrawal.processed_at).toLocaleTimeString('pt-BR')}</span>
                            </div>
                          ` : ''}
                          
                          <div class="flex justify-between">
                            <span class="text-gray-400">Status:</span>
                            <span class="font-semibold ${
                              withdrawal.status === 'pending' ? 'text-yellow-400' : 
                              withdrawal.status === 'approved' ? 'text-green-400' : 'text-red-400'
                            }">
                              ${withdrawal.status === 'pending' ? 'Em Análise' : 
                                withdrawal.status === 'approved' ? 'Concluído' : 'Rejeitado'}
                            </span>
                          </div>
                        </div>
                        
                        ${withdrawal.status === 'pending' ? `
                          <div class="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-4">
                            <p class="text-yellow-300 text-sm text-center">
                              <strong>Em análise:</strong> Seu saque está sendo processado pela nossa equipe. Você será notificado quando for concluído.
                            </p>
                          </div>
                        ` : withdrawal.status === 'approved' ? `
                          <div class="bg-green-400/20 border border-green-400/30 rounded-lg p-4">
                            <p class="text-green-300 text-sm text-center">
                              <strong>Concluído:</strong> Seu saque foi processado com sucesso e enviado para sua chave PIX.
                            </p>
                          </div>
                        ` : `
                          <div class="bg-red-400/20 border border-red-400/30 rounded-lg p-4">
                            <p class="text-red-300 text-sm text-center">
                              <strong>Rejeitado:</strong> Seu saque foi rejeitado e o valor foi retornado ao seu saldo.
                            </p>
                          </div>
                        `}
                      </div>
                      
                      <button 
                        onclick="this.parentElement.parentElement.remove()" 
                        class="w-full mt-6 bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-500 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  `;
                  document.body.appendChild(detailsModal);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      R$ {withdrawal.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      PIX: {withdrawal.pix_key}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      withdrawal.status === 'pending' 
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : withdrawal.status === 'approved'
                        ? 'bg-green-400/20 text-green-400'
                        : 'bg-red-400/20 text-red-400'
                    }`}>
                      {withdrawal.status === 'pending' && <Calendar className="w-3 h-3" />}
                      {withdrawal.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {withdrawal.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                      {withdrawal.status === 'pending' ? 'Em Análise' : 
                       withdrawal.status === 'approved' ? 'Concluído' : 'Rejeitado'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Toque para detalhes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowWithdrawModal(false)} />
          
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Solicitar Saque</h2>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Valor (mín. R$20,00)
                </label>
                <input
                  type="number"
                  min="20"
                  step="0.01"
                  max={stats?.current_balance || 0}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  placeholder="20.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={withdrawForm.pix_key}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, pix_key: e.target.value }))}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:from-green-500 hover:to-green-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spin Modal */}
      {showSpinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowSpinModal(false)} />
          
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">🎰 Roleta Diária</h2>
            
            {!spinResult && !isSpinning && <SpinWheel onSpin={handleSpin} />}

            {isSpinning && !spinResult && (
              <div className="text-center">
                <canvas 
                  ref={canvasRef} 
                  width={320} 
                  height={320}
                  className="mx-auto mb-6 drop-shadow-2xl"
                />
                <p className="text-white text-lg font-semibold animate-pulse">
                  Girando...
                </p>
              </div>
            )}

            {spinResult && (
              <>
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  spinResult.prize_type === 'money' 
                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                    : spinResult.prize_type === 'video'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-600'
                }`}>
                  {spinResult.prize_type === 'money' && <DollarSign className="w-16 h-16 text-white" />}
                  {spinResult.prize_type === 'video' && <Play className="w-16 h-16 text-white" />}
                  {spinResult.prize_type === 'nothing' && <span className="text-4xl">😔</span>}
                </div>
                <p className="text-xl font-bold text-white mb-4">
                  {spinResult.message}
                </p>
                <button
                  onClick={() => {
                    setShowSpinModal(false);
                    setSpinResult(null);
                  }}
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-500 transition-colors"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowAboutModal(false)} />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Sobre Nós</h2>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Nossa Missão</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Somos uma plataforma inovadora que conecta usuários a oportunidades de ganhar dinheiro 
                    assistindo a vídeos publicitários. Nossa missão é democratizar o acesso à renda extra 
                    de forma simples, segura e transparente.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Como Funciona</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-white">Assista Vídeos</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Assista a vídeos publicitários completos e ganhe de R$ 2,00 a R$ 3,00 por vídeo
                      </p>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-white">Evolua de Nível</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Quanto mais você assiste, mais você evolui e aumenta seus ganhos
                      </p>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-white">Indique Amigos</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Ganhe 10% dos ganhos de todos os usuários que você indicar
                      </p>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-white">Saque via PIX</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Solicite saques a partir de R$ 20,00 direto para sua conta via PIX
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Por que Nos Escolher?</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-medium">Pagamentos Garantidos</p>
                        <p className="text-gray-400 text-sm">Processamos todos os saques em até 7 dias úteis</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-medium">Suporte 24/7</p>
                        <p className="text-gray-400 text-sm">Nossa equipe está sempre disponível para ajudar você</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-medium">Segurança Total</p>
                        <p className="text-gray-400 text-sm">Seus dados e ganhos estão protegidos com criptografia</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-medium">Interface Simples</p>
                        <p className="text-gray-400 text-sm">Plataforma intuitiva e fácil de usar para todos</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Links */}
                <div className="border-t border-gray-600 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Documentos Legais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                      href="/termos"
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium group-hover:text-green-400 transition-colors">
                            Termos de Uso
                          </p>
                          <p className="text-gray-400 text-sm">
                            Regras e condições da plataforma
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                    </a>
                    
                    <a
                      href="/privacidade"
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                            Política de Privacidade
                          </p>
                          <p className="text-gray-400 text-sm">
                            Como protegemos seus dados
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </a>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gradient-to-r from-blue-400/10 to-purple-600/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="text-center">
                    <h3 className="text-white font-semibold mb-2">Precisa de Ajuda?</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Nossa equipe de suporte está pronta para ajudar você com qualquer dúvida.
                    </p>
                    <a
                      href="/suporte"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Entrar em Contato
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
