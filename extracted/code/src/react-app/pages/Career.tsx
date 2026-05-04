import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useApi } from '@/react-app/hooks/useApi';
import { usePushinPay } from '@/react-app/hooks/usePushinPay';
import { 
  Crown, 
  Star, 
  Play, 
  DollarSign, 
  CheckCircle,
  Lock,
  Zap,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/ui/dialog';
import { Input } from '@/react-app/components/ui/input';
import { PushinPayQRCode } from '@/react-app/components/PushinPayQRCode';
import type { DashboardStats } from '@/shared/types';

interface VipPlan {
  id: number;
  name: string;
  price: number;
  dailyLimit: number;
  features: string[];
  popular?: boolean;
  monthlyReturn: number;
}

interface VipPurchase {
  vip_level: number;
  purchase_date: string;
  amount: number;
  payment_status: string;
  is_active: boolean;
}

interface VipPaymentLink {
  vip_level: number;
  payment_url: string;
}

interface PaymentForm {
  name: string;
  phone: string;
  email: string;
  cpf: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Career() {
  const { user } = useAuth();
  const { getDashboardStats } = useApi();
  const { generateQRCode, qrCodeData, clearQRCode, loading: paymentLoading } = usePushinPay();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vipPaymentLinks, setVipPaymentLinks] = useState<VipPaymentLink[]>([]);
  const [userVipPurchases, setUserVipPurchases] = useState<VipPurchase[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    name: '',
    phone: '',
    email: '',
    cpf: ''
  });
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Function to get VIP plans
  const getVipPlans = (): VipPlan[] => [
    {
      id: 0,
      name: 'Intermediário',
      price: 97.90,
      dailyLimit: 12,
      monthlyReturn: 720,
      features: [
        '12 vídeos por dia',
        'Saque liberado',
        'Suporte standard',
        'Badge Intermediário no perfil',
        'Retorno mensal: R$ 720'
      ],
      popular: true
    },
    {
      id: 1,
      name: 'VIP 1',
      price: 150,
      dailyLimit: 15,
      monthlyReturn: 900,
      features: [
        '15 vídeos por dia',
        'Suporte prioritário',
        'Recompensas exclusivas',
        'Badge VIP no perfil',
        'Retorno mensal: R$ 900'
      ]
    },
    {
      id: 2,
      name: 'VIP 2',
      price: 300,
      dailyLimit: 20,
      monthlyReturn: 1200,
      features: [
        '20 vídeos por dia',
        'Suporte prioritário',
        'Recompensas exclusivas',
        'Badge VIP no perfil',
        '10% bônus em ganhos',
        'Retorno mensal: R$ 1.200'
      ],
      popular: true
    },
    {
      id: 3,
      name: 'VIP 3',
      price: 600,
      dailyLimit: 25,
      monthlyReturn: 1800,
      features: [
        '25 vídeos por dia',
        'Suporte prioritário',
        'Recompensas exclusivas',
        'Badge VIP no perfil',
        '15% bônus em ganhos',
        'Acesso antecipado a novos vídeos',
        'Retorno mensal: R$ 1.800'
      ]
    },
    {
      id: 4,
      name: 'VIP 4',
      price: 1200,
      dailyLimit: 30,
      monthlyReturn: 2100,
      features: [
        '30 vídeos por dia',
        'Suporte prioritário',
        'Recompensas exclusivas',
        'Badge VIP no perfil',
        '20% bônus em ganhos',
        'Acesso antecipado a novos vídeos',
        'Vídeos bônus semanais',
        'Retorno mensal: R$ 2.100'
      ],
      popular: true
    },
    {
      id: 5,
      name: 'VIP 5',
      price: 2400,
      dailyLimit: 35,
      monthlyReturn: 2800,
      features: [
        '35 vídeos por dia',
        'Suporte prioritário',
        'Recompensas exclusivas',
        'Badge VIP no perfil',
        '25% bônus em ganhos',
        'Acesso antecipado a novos vídeos',
        'Vídeos bônus semanais',
        'Cashback em saques',
        'Retorno mensal: R$ 2.800'
      ]
    },
    {
      id: 6,
      name: 'VIP 6',
      price: 4800,
      dailyLimit: 40,
      monthlyReturn: 3200,
      features: [
        '40 vídeos por dia',
        'Suporte prioritário',
        'Recompensas exclusivas',
        'Badge VIP no perfil',
        '30% bônus em ganhos',
        'Acesso antecipado a novos vídeos',
        'Vídeos bônus semanais',
        'Cashback em saques',
        'Gerente de conta dedicado',
        'Retorno mensal: R$ 3.200'
      ],
      popular: true
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Cronômetro para a oferta
  useEffect(() => {
    const targetDate = new Date('2025-10-10T23:59:59').getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer(); // Atualizar imediatamente
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Pre-fill form with user data
    if (user) {
      setPaymentForm(prev => ({
        ...prev,
        name: user.google_user_data?.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [statsData, vipPurchasesData, vipLinksData, intermediatePurchasesData] = await Promise.all([
        getDashboardStats(),
        fetch('/api/vip-purchases', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
        fetch('/api/vip-links').then(res => res.ok ? res.json() : []),
        fetch('/api/intermediate-purchases', { credentials: 'include' }).then(res => res.ok ? res.json() : [])
      ]);
      
      setStats(statsData);
      // Combine VIP and intermediate purchases
      const combinedPurchases = [
        ...vipPurchasesData,
        ...intermediatePurchasesData.map((purchase: any) => ({
          ...purchase,
          plan_type: 'intermediate'
        }))
      ];
      setUserVipPurchases(combinedPurchases);
      setVipPaymentLinks(vipLinksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchasePlan = (plan: VipPlan) => {
    const userHasPlan = userVipPurchases.some(purchase => 
      purchase.vip_level === plan.id && 
      purchase.is_active && 
      purchase.payment_status === 'completed'
    );
    const userHasHigherPlan = userVipPurchases.some(purchase => 
      purchase.vip_level > plan.id && 
      purchase.is_active && 
      purchase.payment_status === 'completed'
    );
    
    if (userHasPlan) {
      alert('Você já possui este plano VIP ativo!');
      return;
    }
    
    if (userHasHigherPlan) {
      alert('Você já possui um plano VIP superior ativo!');
      return;
    }

    // Para VIP 2-6, usar exclusivamente link de pagamento externo
    if (plan.id >= 2 && plan.id <= 6) {
      const paymentLink = vipPaymentLinks.find(link => link.vip_level === plan.id);
      if (paymentLink && paymentLink.payment_url) {
        window.open(paymentLink.payment_url, '_blank');
        return;
      } else {
        alert('Link de pagamento não disponível para este plano. Entre em contato com o suporte.');
        return;
      }
    }
    
    // Intermediário (0) e VIP 1 usam sistema PIX integrado
    if (plan.id === 0 || plan.id === 1) {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan || paymentLoading) return;

    try {
      if (selectedPlan.id === 0) {
        // Intermediate plan
        await generateQRCode({
          name: paymentForm.name,
          phone: paymentForm.phone,
          email: paymentForm.email,
          cpf: paymentForm.cpf,
          amount: selectedPlan.price,
          description: `Plano ${selectedPlan.name} - NextFund`,
          plan_type: 'intermediate'
        });
      } else {
        // VIP plan
        await generateQRCode({
          name: paymentForm.name,
          phone: paymentForm.phone,
          email: paymentForm.email,
          cpf: paymentForm.cpf,
          amount: selectedPlan.price,
          description: `Plano ${selectedPlan.name} - NextFund VIP`,
          vip_level: selectedPlan.id
        });
      }

      setShowPaymentModal(false);
      setShowQRCodeModal(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handlePaymentConfirmed = () => {
    clearQRCode();
    setShowQRCodeModal(false);
    setSelectedPlan(null);
    loadData(); // Reload data to show new VIP status
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-yellow-400/50 rounded"></div>
            <div className="h-8 bg-gray-700/50 rounded-xl w-64"></div>
            <div className="w-8 h-8 bg-yellow-400/50 rounded"></div>
          </div>
          <div className="h-5 bg-gray-700/30 rounded-lg w-96 mx-auto"></div>
        </div>

        {/* Current status skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
            <div className="h-8 bg-gray-700 rounded-xl w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-600 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP plans skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div className="text-center space-y-3">
                <div className="h-6 bg-gray-700 rounded-full w-24 mx-auto"></div>
                <div className="h-8 bg-gray-600 rounded w-20 mx-auto"></div>
                <div className="h-4 bg-gray-700 rounded w-32 mx-auto"></div>
                <div className="h-3 bg-gray-700 rounded w-28 mx-auto"></div>
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                    <div className="h-3 bg-gray-700 rounded flex-1"></div>
                  </div>
                ))}
              </div>
              
              <div className="h-10 bg-gray-700 rounded-xl w-full"></div>
            </div>
          ))}
        </div>

        {/* Benefits skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 space-y-8">
          <div className="text-center space-y-4">
            <div className="h-6 bg-gray-700 rounded w-48 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-80 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto"></div>
                <div className="h-5 bg-gray-700 rounded w-24 mx-auto"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get current VIP plans
  const vipPlans = getVipPlans();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            Carreira VIP
          </h1>
          <Crown className="w-8 h-8 text-yellow-400" />
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Melhore sua experiência e aumente seus ganhos com nossos planos VIP exclusivos
        </p>
      </div>

      {/* Current Status */}
      {stats && (
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Seu Status Atual</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">Nível {stats.level} - {stats.level_title}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 text-sm">Saldo Atual</span>
              </div>
              <span className="text-xl font-bold text-white">R$ {stats.current_balance.toFixed(2)}</span>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-sm">Limite Diário</span>
              </div>
              <span className="text-xl font-bold text-white">{stats.daily_limit} vídeos</span>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-sm">Total Ganho</span>
              </div>
              <span className="text-xl font-bold text-white">R$ {stats.total_earnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* VIP Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vipPlans.map((plan) => {
          const paymentLink = vipPaymentLinks.find(link => link.vip_level === plan.id);
          const hasPaymentLink = paymentLink && paymentLink.payment_url;
          const userHasPlan = userVipPurchases.some(purchase => 
            purchase.vip_level === plan.id && 
            purchase.is_active && 
            purchase.payment_status === 'completed'
          );
          const userHasHigherPlan = userVipPurchases.some(purchase => 
            purchase.vip_level > plan.id && 
            purchase.is_active && 
            purchase.payment_status === 'completed'
          );
          
          return (
            <div 
              key={plan.id}
              className={`relative bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border transition-all duration-300 ${
                userHasPlan 
                  ? 'border-green-400 shadow-lg shadow-green-400/20 scale-105'
                  : userHasHigherPlan
                  ? 'border-gray-600 opacity-75'
                  : plan.popular 
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20 hover:scale-105' 
                  : 'border-gray-700 hover:border-gray-600 hover:scale-105'
              }`}
            >
            {userHasPlan && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  ATIVO
                </div>
              </div>
            )}
            
            {!userHasPlan && plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                  plan.id === 0 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                }`}>
                  {plan.id === 0 ? 'LIMITADO' : plan.id === 2 ? 'MELHOR CUSTO' : plan.id === 4 ? 'PREMIUM' : plan.id === 6 ? 'ELITE' : 'MAIS POPULAR'}
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 ${
                plan.popular ? 'bg-yellow-400/20 text-yellow-400' : 'bg-purple-400/20 text-purple-400'
              }`}>
                <Crown className="w-4 h-4" />
                <span className="font-medium">{plan.name}</span>
              </div>
              
              <div className="text-3xl font-bold text-white mb-1">
                R$ {plan.price.toLocaleString('pt-BR')}
              </div>
              
              <div className="text-gray-400 text-sm mb-1">
                {plan.dailyLimit} vídeos por dia
              </div>
              
              <div className="text-gray-500 text-xs">
                {plan.id === 0 ? (
                  `Oferta até: ${timeLeft.days.toString().padStart(2, '0')}d ${timeLeft.hours.toString().padStart(2, '0')}h ${timeLeft.minutes.toString().padStart(2, '0')}m`
                ) : (
                  `Retorno mensal: R$ ${plan.monthlyReturn.toLocaleString('pt-BR')}`
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handlePurchasePlan(plan)}
              disabled={userHasPlan || userHasHigherPlan || (plan.id >= 2 && plan.id <= 6 && !hasPaymentLink)}
              variant={userHasPlan ? 'default' : plan.popular ? 'nextfund' : 'default'}
              className={`w-full ${userHasPlan ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {userHasPlan ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Plano Ativo
                </>
              ) : userHasHigherPlan ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Nível Inferior
                </>
              ) : plan.id >= 2 && plan.id <= 6 && !hasPaymentLink ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Link Indisponível
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ativar VIP
                </>
              )}
            </Button>
          </div>
          );
        })}
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Por que ser VIP?
          </h2>
          <p className="text-gray-400">
            Desbloqueie todo o potencial da plataforma com benefícios exclusivos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Mais Vídeos</h3>
            <p className="text-gray-400 text-sm">Assista mais vídeos por dia e aumente seus ganhos</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Maior Renda</h3>
            <p className="text-gray-400 text-sm">Bônus em ganhos para maximizar sua receita</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Status Exclusivo</h3>
            <p className="text-gray-400 text-sm">Badge VIP e reconhecimento na plataforma</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Suporte Premium</h3>
            <p className="text-gray-400 text-sm">Atendimento prioritário e suporte dedicado</p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-white">
                Pagamento - {selectedPlan.name}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-green-400">
                  R$ {selectedPlan.price.toLocaleString('pt-BR')}
                </div>
                <div className="text-gray-400">
                  {selectedPlan.dailyLimit} vídeos por dia
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={paymentForm.email}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Telefone *
                </label>
                <Input
                  type="tel"
                  value={paymentForm.phone}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  CPF
                </label>
                <Input
                  type="text"
                  value={paymentForm.cpf}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cpf: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700"
                >
                  {paymentLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Gerar QR Code PIX
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Modal */}
      {qrCodeData && (
        <PushinPayQRCode
          open={showQRCodeModal}
          onOpenChange={setShowQRCodeModal}
          qrCodeData={qrCodeData}
          onPaymentConfirmed={handlePaymentConfirmed}
          vipLevel={selectedPlan?.id}
        />
      )}
    </div>
  );
}
