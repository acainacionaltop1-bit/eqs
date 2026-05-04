import { useState, useEffect } from 'react';
import { useApi } from '@/react-app/hooks/useApi';
import { Button } from '@/react-app/components/ui/button';
import { toast } from '@/react-app/components/ui/toast';
import { 
  Users, 
  Trophy, 
  BarChart3,
  Activity,
  RefreshCw,
  Crown,
  Medal,
  Settings,
  Gift
} from 'lucide-react';

interface RankingStats {
  total_users: number;
  top_scorer: number;
  average_points: number;
  active_today: number;
}

export default function RankingGeneratorTab() {
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { apiCall } = useApi();

  const loadRankingData = async () => {
    try {
      setLoading(true);
      const [ranking, stats] = await Promise.all([
        apiCall('/admin/ranking'),
        apiCall('/admin/ranking/stats')
      ]);
      setRankingData(Array.isArray(ranking) ? ranking : []);
      setRankingStats(stats as RankingStats);
    } catch (error: any) {
      toast.error('Erro ao carregar ranking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankingData();
  }, []);

  const generateFakeUsers = async (count: number) => {
    setGenerating(true);
    try {
      await apiCall('/admin/ranking/generate-fake', {
        method: 'POST',
        body: JSON.stringify({ count })
      });
      toast.success(`${count} usuários fake criados com sucesso!`);
      loadRankingData();
    } catch (error: any) {
      toast.error('Erro ao gerar usuários: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const resetRanking = async () => {
    if (!confirm('Tem certeza que deseja resetar todo o ranking? Esta ação não pode ser desfeita.')) {
      return;
    }

    setResetting(true);
    try {
      await apiCall('/admin/ranking/reset', { method: 'POST' });
      toast.success('Ranking resetado com sucesso!');
      loadRankingData();
    } catch (error: any) {
      toast.error('Erro ao resetar ranking: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

  const adjustUserPoints = async (userId: number, adjustment: number) => {
    try {
      await apiCall(`/admin/ranking/adjust/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ adjustment })
      });
      toast.success(`Pontos ajustados com sucesso!`);
      loadRankingData();
    } catch (error: any) {
      toast.error('Erro ao ajustar pontos: ' + error.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-white">Carregando ranking...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gerador de Ranking 🏆</h2>
          <p className="text-gray-400">Crie e gerencie rankings competitivos para engajar usuários</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => loadRankingData()}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:bg-blue-500/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {rankingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total de Usuários</p>
                <p className="text-xl font-bold text-blue-400">{rankingStats.total_users}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Maior Pontuação</p>
                <p className="text-xl font-bold text-yellow-400">{rankingStats.top_scorer.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Média de Pontos</p>
                <p className="text-xl font-bold text-green-400">{rankingStats.average_points.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Ativos Hoje</p>
                <p className="text-xl font-bold text-purple-400">{rankingStats.active_today}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Panel */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ações do Ranking
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Generate Fake Users */}
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <h4 className="text-blue-400 font-semibold mb-2">🎭 Usuários Fake Estratégicos</h4>
            <p className="text-gray-400 text-sm mb-3">
              Crie usuários fictícios que automaticamente dominarão o top 3 do ranking com base nos usuários reais atuais
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => generateFakeUsers(5)}
                disabled={generating}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                +5 Usuários Top
              </Button>
              <Button
                onClick={() => generateFakeUsers(20)}
                disabled={generating}
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                +20 Usuários Mix
              </Button>
            </div>
            <div className="mt-2 text-xs text-blue-300">
              ⚡ Os primeiros 3 usuários sempre ficarão no top 3
            </div>
          </div>

          {/* Competition Tools */}
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <h4 className="text-green-400 font-semibold mb-2">🏁 Ferramentas de Competição</h4>
            <p className="text-gray-400 text-sm mb-3">
              Recursos para criar competições mais engajantes
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => toast.success('Funcionalidade em desenvolvimento!')}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Premiação
              </Button>
              <Button
                onClick={() => toast.success('Funcionalidade em desenvolvimento!')}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Temporadas
              </Button>
            </div>
          </div>

          {/* Reset Options */}
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <h4 className="text-red-400 font-semibold mb-2">⚠️ Reset do Ranking</h4>
            <p className="text-gray-400 text-sm mb-3">
              Zere o ranking para iniciar uma nova temporada
            </p>
            <Button
              onClick={resetRanking}
              disabled={resetting}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              {resetting ? 'Resetando...' : 'Reset Completo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Current Ranking */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Ranking Atual - Top 50
          </h3>
          <div className="text-sm text-gray-400">
            {rankingData.length} usuários no ranking
          </div>
        </div>

        {rankingData.filter(user => !user.is_fake).length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Ranking vazio</h3>
            <p className="text-gray-400 mb-4">Não há usuários reais no ranking ainda</p>
            <p className="text-gray-400 text-sm">Usuários fake não aparecem no ranking principal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankingData.filter(user => !user.is_fake).slice(0, 50).map((user, index) => {
              const position = index + 1;
              
              return (
                <div
                  key={user.email}
                  className={`flex items-center justify-between p-4 bg-gradient-to-r rounded-lg border transition-all ${
                    getRankColor(position)
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
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {user.name || user.email}
                          {user.email.includes('demo') && (
                            <span className="bg-blue-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          Nível {user.level} • {user.total_videos_watched} vídeos
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {user.total_points.toLocaleString()} pts
                      </div>
                      {position <= 3 && (
                        <div className="text-sm font-semibold text-green-400">
                          R$ {position === 1 ? '50,00' : position === 2 ? '30,00' : '20,00'}
                        </div>
                      )}
                    </div>

                    {/* Point adjustment buttons */}
                    <div className="flex gap-1">
                      <Button
                        onClick={() => adjustUserPoints(user.id, 100)}
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:bg-green-500/20 p-1 h-8 w-8"
                        title="Adicionar 100 pontos"
                      >
                        +
                      </Button>
                      <Button
                        onClick={() => adjustUserPoints(user.id, -100)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/20 p-1 h-8 w-8"
                        title="Remover 100 pontos"
                      >
                        -
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-orange-400/10 to-red-600/10 rounded-2xl p-6 border border-orange-500/20">
        <div className="flex items-center gap-4">
          <Gift className="w-12 h-12 text-orange-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Como Funciona o Sistema de Pontos</h3>
            <div className="text-gray-400 space-y-1 mt-2">
              <p>• <strong>Vídeos assistidos:</strong> 15 pontos por vídeo (fator principal)</p>
              <p>• <strong>Ganhos totais:</strong> 1 ponto por real ganho</p>
              <p>• <strong>Nível VIP:</strong> 500 pontos de bônus por nível VIP</p>
              <p>• <strong>Premiação:</strong> Top 3 ganham prêmios automáticos todo mês</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
