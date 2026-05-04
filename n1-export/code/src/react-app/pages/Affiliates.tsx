import { useState, useEffect } from 'react';
import { Users, Copy, ExternalLink, Gift, TrendingUp, UserPlus, Calendar } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import type { AffiliateInfo } from '@/shared/types';

export default function Affiliates() {
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { getAffiliateInfo } = useApi();

  useEffect(() => {
    loadAffiliateInfo();
  }, []);

  const loadAffiliateInfo = async () => {
    try {
      setIsLoading(true);
      const data = await getAffiliateInfo();
      setAffiliateInfo(data);
    } catch (error) {
      console.error('Error loading affiliate info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (!affiliateInfo) return;

    try {
      await navigator.clipboard.writeText(affiliateInfo.affiliate_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-700/50 rounded-xl w-80"></div>
          <div className="h-4 bg-gray-700/30 rounded-lg w-96"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-2xl p-6 border border-gray-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-600 rounded w-16"></div>
                </div>
                <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
              </div>
              <div className="h-3 bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* How it works skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-6">
          <div className="h-6 bg-gray-700 rounded w-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-700 rounded-2xl mx-auto"></div>
                <div className="h-5 bg-gray-700 rounded w-24 mx-auto"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate link skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="h-6 bg-gray-700 rounded w-40"></div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-600 rounded w-full"></div>
              </div>
              <div className="h-8 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Programa de Afiliados 🤝
        </h1>
        <p className="text-gray-400">
          Indique amigos e ganhe +1 vídeo bônus por dia para cada pessoa ativa que você trouxer.
        </p>
      </div>

      {/* Stats cards */}
      {affiliateInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Pessoas Indicadas</p>
                <p className="text-3xl font-bold text-white">
                  {affiliateInfo.referred_count}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-400" />
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Total de indicações realizadas</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Vídeos Bônus</p>
                <p className="text-3xl font-bold text-white">
                  +{affiliateInfo.bonus_videos_earned}
                </p>
              </div>
              <Gift className="w-8 h-8 text-green-400" />
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Vídeos extras por dia</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-400/10 to-purple-600/10 rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Ganho Extra</p>
                <p className="text-3xl font-bold text-white">
                  R$ {(affiliateInfo.bonus_videos_earned * 2 * 30).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Potencial mensal extra</p>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Como Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Copy className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Compartilhe</h3>
            <p className="text-gray-400">
              Copie seu link único e compartilhe com amigos e familiares
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Eles se Cadastram</h3>
            <p className="text-gray-400">
              Quando alguém usa seu link, eles se tornam sua indicação
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Você Ganha</h3>
            <p className="text-gray-400">
              +1 vídeo bônus por dia para cada pessoa ativa que você indicou
            </p>
          </div>
        </div>
      </div>

      {/* Affiliate link */}
      {affiliateInfo && (
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Seu Link de Afiliado</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 mb-1">Código: {affiliateInfo.affiliate_code}</p>
                <p className="text-white font-mono text-sm truncate">
                  {affiliateInfo.affiliate_link}
                </p>
              </div>
              <button
                onClick={copyLink}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  const text = `Venha ganhar dinheiro assistindo vídeos! R$2 por vídeo de 30s. Cadastre-se aqui: ${affiliateInfo.affiliate_link}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                WhatsApp
              </button>

              <button
                onClick={() => {
                  const text = `Venha ganhar dinheiro assistindo vídeos! R$2 por vídeo de 30s.`;
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(affiliateInfo.affiliate_link)}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Twitter
              </button>

              <button
                onClick={() => {
                  const text = `Venha ganhar dinheiro assistindo vídeos! R$2 por vídeo de 30s.`;
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateInfo.affiliate_link)}&quote=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center justify-center gap-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Facebook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referred users */}
      {affiliateInfo && (
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Suas Indicações</h2>
          
          {affiliateInfo.referred_users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Nenhuma indicação ainda</h3>
              <p className="text-gray-400 mb-6">
                Compartilhe seu link para começar a ganhar vídeos bônus!
              </p>
              <button
                onClick={copyLink}
                className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-500 hover:to-green-700 transition-all"
              >
                Copiar Link de Afiliado
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {affiliateInfo.referred_users.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {user.name || user.email}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.total_videos_watched} vídeos assistidos
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-400 font-semibold">
                      Ativo
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Benefits */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-orange-600/10 rounded-2xl p-6 border border-yellow-500/20">
        <h2 className="text-xl font-bold text-white mb-4">Benefícios do Programa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center mt-1">
              <Gift className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Vídeos Bônus Diários</h4>
              <p className="text-sm text-gray-400">
                +1 vídeo extra por dia para cada pessoa ativa que você indicar
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center mt-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Ganhos Sem Limite</h4>
              <p className="text-sm text-gray-400">
                Quanto mais pessoas você indicar, mais vídeos bônus você ganha
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-400/20 rounded-lg flex items-center justify-center mt-1">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Rede Crescente</h4>
              <p className="text-sm text-gray-400">
                Ajude seus amigos a ganhar dinheiro também
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-400/20 rounded-lg flex items-center justify-center mt-1">
              <Calendar className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Benefício Vitalício</h4>
              <p className="text-sm text-gray-400">
                Enquanto suas indicações estiverem ativas, você ganha
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
