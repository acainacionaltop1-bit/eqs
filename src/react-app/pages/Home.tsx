import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import { useApi } from "@/react-app/hooks/useApi";
import { useState, useEffect } from "react";
import { TrendingUp, Settings, ChevronDown, ChevronRight, Menu, DollarSign } from "lucide-react";
import HomeVideoCard from "../components/HomeVideoCard";
import { ShimmerButton } from "../components/ui/shimmer-button";

import type { Video } from "@/shared/types";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFeaturedVideos } = useApi();
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstLineText, setFirstLineText] = useState("");
  const [secondLineText, setSecondLineText] = useState("");
  const [showFirstCursor, setShowFirstCursor] = useState(true);
  const [showSecondCursor, setShowSecondCursor] = useState(false);
  

  const firstLine = "Ganhe Dinheiro";
  const secondLine = "Assistindo Vídeos";

  // Typewriter effect - corrigido e funcional
  useEffect(() => {
    // Reset states
    setFirstLineText("");
    setSecondLineText("");
    setShowFirstCursor(true);
    setShowSecondCursor(false);
    
    let timeoutIds: NodeJS.Timeout[] = [];
    let isMounted = true;
    
    const typeFirstLine = (index: number = 0) => {
      if (!isMounted) return;
      
      if (index <= firstLine.length) {
        setFirstLineText(firstLine.slice(0, index));
        if (index < firstLine.length) {
          const id = setTimeout(() => typeFirstLine(index + 1), 50);
          timeoutIds.push(id);
        } else {
          // Esconder cursor da primeira linha e mostrar da segunda
          setShowFirstCursor(false);
          setShowSecondCursor(true);
          // Começar segunda linha após pequena pausa
          const id = setTimeout(() => typeSecondLine(0), 100);
          timeoutIds.push(id);
        }
      }
    };
    
    const typeSecondLine = (index: number = 0) => {
      if (!isMounted) return;
      
      if (index <= secondLine.length) {
        setSecondLineText(secondLine.slice(0, index));
        if (index < secondLine.length) {
          const id = setTimeout(() => typeSecondLine(index + 1), 50);
          timeoutIds.push(id);
        } else {
          // Esconder cursor da segunda linha
          setShowSecondCursor(false);
        }
      }
    };

    // Iniciar efeito imediatamente
    typeFirstLine(0);

    // Cleanup function
    return () => {
      isMounted = false;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  const handleStartEarning = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/cadastro');
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/cadastro');
    }
  };

  // Load featured video
  useEffect(() => {
    const loadFeaturedVideo = async () => {
      try {
        setLoading(true);
        const videos = await getFeaturedVideos();
        if (videos.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(videos.length, 5));
          setFeaturedVideo(videos[randomIndex]);
        } else {
          setFeaturedVideo(null);
        }
      } catch (error) {
        console.error('Error loading featured video:', error);
        setFeaturedVideo(null);
      } finally {
        setLoading(false);
      }
    };
    loadFeaturedVideo();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Background Elements com Animações */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      {/* Navigation */}
      <header className="relative z-50 border-b border-white/10 glass sticky top-0" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 text-lg font-semibold group">
              <img src="https://mocha-cdn.com/0199b706-c8e8-7a96-9476-fb4a464d2b23/1000808270-removebg-preview-(2).png" alt="Logo" className="h-40 hover:scale-105 transition-transform duration-300 animate-icon-float-organic" />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <div className="flex items-center gap-6 text-sm font-medium">
                <a href="#" className="px-4 py-2 bg-green-500/20 text-white rounded-2xl hover:bg-green-500/30 transition-all duration-300 backdrop-blur-sm border border-green-500/30 hover:scale-105">Tarefas</a>
                <a href="#" className="text-white/70 hover:text-white transition-colors duration-300 hover:scale-105">Vídeos</a>
                <div className="relative group">
                  <button className="flex items-center gap-1 text-white/70 hover:text-white transition-colors duration-300 hover:scale-105">
                    Produtos <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <a href="#" className="text-white/70 hover:text-white transition-colors duration-300 hover:scale-105">Suporte</a>
                <a href="#" className="text-white/70 hover:text-white transition-colors duration-300 hover:scale-105">Aprender</a>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-px h-6 bg-white/20"></div>
                <button onClick={() => navigate('/login')} className="text-sm font-medium text-white/70 hover:text-white transition-all duration-300 hover:scale-105">Entrar</button>
                <button onClick={handleGetStarted} className="text-sm font-medium text-black bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-2xl px-6 py-2.5 shadow-lg shadow-green-500/25 hover:scale-105 hover:shadow-green-500/50">
                  {user ? 'Dashboard' : 'Começar'}
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 hover:bg-white/10 rounded-2xl transition-colors duration-300 hover:scale-105">
              <Menu className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* Hero Content */}
            <div className="lg:col-span-4">
              <div className="gradient-border rounded-3xl mb-8 inline-block hover:scale-105 transition-transform duration-300" style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))',
                padding: '1px'
              }}>
                <div className="bg-black rounded-3xl px-4 py-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse animate-icon-breathe"></div>
                    <span className="text-white/80">Plataforma de Ganhos</span>
                  </div>
                </div>
              </div>

              {/* Typewriter Title */}
              <h1 className="sm:text-7xl xl:text-8xl leading-none text-6xl font-medium tracking-tighter mb-8 min-h-[200px]">
                <span className="block text-white relative">
                  {firstLineText}
                  {showFirstCursor && (
                    <span className="inline-block w-1 h-[0.9em] bg-white ml-1 animate-pulse" style={{
                      animation: 'blink 1s infinite'
                    }}></span>
                  )}
                </span>
                <span className="block relative" style={{
                  background: 'linear-gradient(135deg, #22c55e, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {secondLineText}
                  {showSecondCursor && (
                    <span className="inline-block w-1 h-[0.9em] bg-green-500 ml-1" style={{
                      animation: 'blink 1s infinite'
                    }}></span>
                  )}
                </span>
              </h1>

              <p className="text-xl text-white/70 mb-10 max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '2s', animationFillMode: 'both' }}>
                Transforme minutos do seu dia em Dinheiro. Assista, responda e receba na hora via PIX.
              </p>

              {/* CTA Button com animação */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '2.2s', animationFillMode: 'both' }}>
                <div className="group relative">
                  <ShimmerButton 
                    onClick={handleStartEarning} 
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 font-bold shadow-xl shadow-green-500/25 !text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/40" 
                    background="linear-gradient(135deg, #22c55e, #10b981)" 
                    borderRadius="24px" 
                    shimmerColor="rgba(255,255,255,0.9)" 
                    shimmerDuration="1.5s"
                  >
                    <span className="text-white font-bold">Começar Agora e Ganhar</span>
                  </ShimmerButton>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    100% Gratuito • Pagamento Instantâneo
                  </div>
                </div>
              </div>

              {/* Stats Grid com animação */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 items-stretch animate-fade-in-up" style={{ animationDelay: '2.4s', animationFillMode: 'both' }}>
                <div className="text-center flex flex-col justify-start h-full hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-none group-hover:text-green-400 transition-colors">+R$ 50K</div>
                  <div className="text-xs sm:text-sm text-white/60 leading-tight">Pagos aos usuários</div>
                </div>
                <div className="text-center flex flex-col justify-start h-full hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-none group-hover:text-green-400 transition-colors">+15K</div>
                  <div className="text-xs sm:text-sm text-white/60 leading-tight">Usuários ativos</div>
                </div>
                <div className="text-center flex flex-col justify-start h-full hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-none group-hover:text-green-400 transition-colors">+500K</div>
                  <div className="text-xs sm:text-sm text-white/60 leading-tight">Vídeos assistidos</div>
                </div>
              </div>
            </div>

            {/* Video Card */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 transition-all duration-500 animate-pulse" style={{
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  <div className="aspect-video bg-black/20 rounded-xl flex items-center justify-center mb-4">
                    <div className="text-white/70 text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                      <div className="h-4 bg-white/20 rounded w-32 mx-auto"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-6 bg-white/20 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-white/15 rounded w-1/2 mx-auto"></div>
                    <div className="h-10 bg-white/20 rounded-xl w-40 mx-auto"></div>
                  </div>
                </div>
              ) : featuredVideo ? (
                <HomeVideoCard video={featuredVideo} />
              ) : (
                <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-[1.02] group" style={{
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  <div className="aspect-video bg-black/20 rounded-xl flex items-center justify-center">
                    <div className="text-white/70 text-center">
                      <p className="text-lg mb-2">Nenhum vídeo configurado</p>
                      <p className="text-sm">Adicione um vídeo na seção Admin → Página Inicial</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          

          {/* Feature Cards Grid com animações em cascata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Ganhos Rápidos ⚡",
                description: "Assista vídeos curtos e receba em segundos.",
                containerClass: "hover-trending-rocket",
                iconClass: "trending-icon"
              },
              {
                icon: Settings,
                title: "Tarefas Simples ✅",
                description: "Basta clicar na resposta e pronto.",
                containerClass: "hover-settings-spin",
                iconClass: "settings-icon"
              },
              {
                icon: DollarSign,
                title: "Pagamentos Garantidos 💸",
                description: "PIX direto na sua conta, sem enrolação.",
                containerClass: "hover-dollar-glow",
                iconClass: "dollar-icon"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`rounded-3xl p-8 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 group cursor-pointer animate-fade-in-up ${feature.containerClass}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  animationDelay: `${3.2 + index * 0.2}s`,
                  animationFillMode: 'both'
                }}
                onClick={() => navigate('/cadastro')}
              >
                <div className={`w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                  index === 0 ? 'animate-icon-breathe animate-icon-pulse-glow' :
                  index === 1 ? 'animate-icon-wiggle animate-icon-bounce-subtle delay-500' :
                  'animate-icon-float-organic animate-icon-rotate-gentle delay-1000'
                }`}>
                  <feature.icon className={`w-6 h-6 text-white ${feature.iconClass} ${
                    index === 0 ? 'animate-trending-up delay-200' :
                    index === 1 ? 'animate-settings-spin delay-700' :
                    'animate-dollar-dance delay-1500'
                  }`} />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight group-hover:text-green-400 transition-colors duration-300">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed mb-8 group-hover:text-white/90 transition-colors duration-300">{feature.description}</p>
                <div className="flex items-center gap-2 text-white font-medium hover:text-green-300 transition-colors duration-300">
                  Saiba mais
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            ))}
          </div>

          

          {/* Final CTA */}
          <div className="text-center mt-24 mb-16 animate-fade-in-up" style={{ animationDelay: '4.0s', animationFillMode: 'both' }}>
            <div className="rounded-3xl p-6 sm:p-8 md:p-12 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-500 hover:scale-[1.02]" style={{
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-4 hover:text-green-400 transition-colors duration-300">
                Já pagamos milhares de usuários todos os dias. <span className="inline-block animate-icon-float-organic animate-icon-rotate-gentle">🚀</span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-6 sm:mb-8 px-4 hover:text-white transition-colors duration-300">
                O próximo pode ser você!
              </p>
              <div className="px-4">
                <ShimmerButton 
                  onClick={handleStartEarning} 
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold shadow-xl shadow-green-500/25 !text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/50" 
                  background="linear-gradient(135deg, #22c55e, #10b981)" 
                  borderRadius="24px" 
                  shimmerColor="rgba(255,255,255,0.9)" 
                  shimmerDuration="2s"
                >
                  <span className="text-white font-bold">Quero Começar Agora</span>
                </ShimmerButton>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-32 py-8 animate-fade-in-up" style={{ animationDelay: '4.2s', animationFillMode: 'both' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-white/60 text-sm hover:text-white/80 transition-colors duration-300">© 2025 Plataforma de Ganhos. Todos os direitos reservados.</p>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <span className="hover:text-white/80 transition-colors duration-300 cursor-pointer">🌍 Português</span>
                <span className="hover:text-white/80 transition-colors duration-300 cursor-pointer">💱 BRL</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
