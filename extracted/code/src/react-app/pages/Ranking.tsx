import { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Crown, Gift, Calendar } from 'lucide-react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useApi } from '@/react-app/hooks/useApi';
import { TableRowSkeleton } from '@/react-app/components/ui/skeleton';
import type { RankingUser } from '@/shared/types';

export default function Ranking() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getRanking } = useApi();

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setIsLoading(true);
      const data = await getRanking();
      setRanking(data);
    } catch (error) {
      console.error('Error loading ranking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Medal className="w-6 h-6 text-yellow-600" />;
      default: return <Trophy className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400/20 to-yellow-600/20 border-yellow-500/30';
      case 2: return 'from-gray-300/20 to-gray-500/20 border-gray-400/30';
      case 3: return 'from-yellow-600/20 to-yellow-800/20 border-yellow-600/30';
      default: return 'from-gray-700/20 to-gray-800/20 border-gray-600/20';
    }
  };

  const currentUserPosition = ranking.findIndex(u => u.email === user?.email) + 1;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="text-center lg:text-left space-y-3">
          <div className="h-8 bg-gray-700/50 rounded-xl w-64"></div>
          <div className="h-4 bg-gray-700/30 rounded-lg w-80"></div>
        </div>

        {/* Current position skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-700 rounded w-48"></div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-8 bg-gray-600 rounded w-16"></div>
              <div className="h-3 bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </div>

        {/* Prizes skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="h-6 bg-gray-700 rounded w-40"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center p-4 bg-gray-700/50 rounded-xl space-y-3">
                <div className="w-12 h-12 bg-gray-600 rounded mx-auto"></div>
                <div className="h-5 bg-gray-700 rounded w-20 mx-auto"></div>
                <div className="h-6 bg-gray-600 rounded w-16 mx-auto"></div>
                <div className="h-3 bg-gray-700 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Point system skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="h-6 bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="w-12 h-12 bg-gray-600 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking list skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-700 rounded w-40"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Reset info skeleton */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-600 rounded"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-700 rounded w-48"></div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-80"></div>
            </div>
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
          Ranking Mensal 🏆
        </h1>
        <p className="text-gray-400 text-sm lg:text-base">
          Compete e ganhe prêmios especiais todo mês!
        </p>
      </div>

      {/* Current user position */}
      {currentUserPosition > 0 && (
        <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Sua Posição</h3>
              <p className="text-gray-400">Você está em #{currentUserPosition} no ranking</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">#{currentUserPosition}</div>
              <div className="text-sm text-gray-400">
                {ranking[currentUserPosition - 1]?.total_points || 0} pontos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prizes info */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Prêmios Mensais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-xl border border-yellow-500/30">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">1º Lugar</h3>
            <p className="text-2xl font-bold text-yellow-400 mb-2">R$ 50,00</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-gray-300/20 to-gray-500/20 rounded-xl border border-gray-400/30">
            <Medal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">2º Lugar</h3>
            <p className="text-2xl font-bold text-gray-300 mb-2">R$ 30,00</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 rounded-xl border border-yellow-600/30">
            <Medal className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">3º Lugar</h3>
            <p className="text-2xl font-bold text-yellow-600 mb-2">R$ 20,00</p>
          </div>
        </div>
      </div>

      {/* Point system */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Como Ganhar Pontos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 bg-blue-400/10 rounded-lg border border-blue-500/20">
            <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Vídeos Assistidos</h3>
              <p className="text-sm text-gray-400">15 pontos por vídeo</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-green-400/10 rounded-lg border border-green-500/20">
            <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Ganhos Totais</h3>
              <p className="text-sm text-gray-400">1 ponto por real</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-purple-400/10 rounded-lg border border-purple-500/20">
            <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Status VIP</h3>
              <p className="text-sm text-gray-400">500 pontos por nível</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking list */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Top 100 Usuários</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Atualizado em tempo real</span>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Ranking em construção</h3>
            <p className="text-gray-400">Continue assistindo vídeos para aparecer no ranking!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.slice(0, 100).map((userRank, index) => {
              const position = index + 1;
              const isCurrentUser = userRank.email === user?.email;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 bg-gradient-to-r rounded-lg border transition-all ${
                    getRankColor(position)
                  } ${
                    isCurrentUser ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      {position <= 3 ? (
                        getRankIcon(position)
                      ) : (
                        <span className="text-lg font-bold text-gray-400">#{position}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(userRank.name || userRank.email).charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {userRank.name || userRank.email}
                          {isCurrentUser && (
                            <span className="bg-green-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          Nível {userRank.level} • {userRank.total_videos_watched} vídeos
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {userRank.total_points.toLocaleString()} pts
                    </div>
                    {position <= 3 && (
                      <div className="text-sm font-semibold text-green-400">
                        R$ {position === 1 ? '50,00' : position === 2 ? '30,00' : '20,00'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset info */}
      <div className="bg-gradient-to-r from-orange-400/10 to-red-600/10 rounded-2xl p-6 border border-orange-500/20">
        <div className="flex items-center gap-4">
          <Gift className="w-12 h-12 text-orange-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Premiação Automática</h3>
            <p className="text-gray-400 mb-2">
              Todo último dia do mês às 23:59 (UTC-3), os prêmios são automaticamente creditados 
              no saldo dos 3 primeiros colocados.
            </p>
            <p className="text-sm text-orange-400">
              O ranking é zerado no primeiro dia de cada mês para uma nova competição!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
