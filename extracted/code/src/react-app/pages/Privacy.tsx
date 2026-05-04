import { Link } from 'react-router';
import { ArrowLeft, Shield, Eye, Lock, Users, Database, FileText } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-400 text-lg">
            Como coletamos, usamos e protegemos suas informações
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Compromisso com sua Privacidade</h2>
          </div>
          <p className="text-gray-300">
            Sua privacidade é fundamental para nós. Esta política explica como coletamos, usamos, 
            armazenamos e protegemos suas informações pessoais quando você usa nossa plataforma.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Information Collection */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Informações que Coletamos</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Informações de Registro
                </h3>
                <ul className="text-gray-300 space-y-2 ml-7">
                  <li>• Nome completo</li>
                  <li>• Endereço de e-mail</li>
                  <li>• Informações do Google (quando usando login social)</li>
                  <li>• Data de criação da conta</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  Dados de Atividade
                </h3>
                <ul className="text-gray-300 space-y-2 ml-7">
                  <li>• Vídeos assistidos e tempo de visualização</li>
                  <li>• Ganhos acumulados e histórico de transações</li>
                  <li>• Interações com a plataforma (cliques, navegação)</li>
                  <li>• Progresso nos níveis e missões</li>
                  <li>• Atividades do programa de afiliados</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-400" />
                  Informações de Pagamento
                </h3>
                <ul className="text-gray-300 space-y-2 ml-7">
                  <li>• Chaves PIX para saques</li>
                  <li>• Histórico de solicitações de saque</li>
                  <li>• Dados para verificação de identidade (quando necessário)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Dados Técnicos
                </h3>
                <ul className="text-gray-300 space-y-2 ml-7">
                  <li>• Endereço IP e localização aproximada</li>
                  <li>• Tipo de dispositivo e navegador</li>
                  <li>• Cookies e dados de sessão</li>
                  <li>• Logs de acesso e uso</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Como Usamos suas Informações</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Operação da Plataforma</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Criar e gerenciar sua conta</li>
                  <li>• Processar visualizações de vídeos</li>
                  <li>• Calcular e creditar ganhos</li>
                  <li>• Gerenciar níveis e progressão</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Pagamentos e Segurança</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Processar solicitações de saque</li>
                  <li>• Verificar identidade quando necessário</li>
                  <li>• Prevenir fraudes e atividades suspeitas</li>
                  <li>• Manter a segurança da plataforma</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Comunicação</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Enviar atualizações importantes</li>
                  <li>• Notificar sobre ganhos e saques</li>
                  <li>• Comunicar mudanças nos termos</li>
                  <li>• Fornecer suporte ao cliente</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Melhorias</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Analisar uso da plataforma</li>
                  <li>• Desenvolver novos recursos</li>
                  <li>• Otimizar experiência do usuário</li>
                  <li>• Personalizar conteúdo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Compartilhamento de Dados</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-red-400/10 rounded-xl p-4 border border-red-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">⚠️ Importante</h3>
                <p className="text-gray-300">
                  <strong>Nós NÃO vendemos, alugamos ou comercializamos suas informações pessoais.</strong> 
                  Seus dados são compartilhados apenas nas situações específicas descritas abaixo.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Quando Compartilhamos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Provedores de Pagamento</h4>
                    <p className="text-gray-300 text-sm">
                      Informações necessárias para processar saques via PIX são compartilhadas com nossos parceiros de pagamento seguros.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Obrigações Legais</h4>
                    <p className="text-gray-300 text-sm">
                      Quando exigido por lei, ordem judicial ou autoridades competentes.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Proteção de Direitos</h4>
                    <p className="text-gray-300 text-sm">
                      Para proteger nossos direitos, propriedade e segurança, bem como de nossos usuários.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Consentimento</h4>
                    <p className="text-gray-300 text-sm">
                      Quando você nos dá permissão específica para compartilhar certas informações.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Segurança dos Dados</h2>
            </div>

            <div className="space-y-6">
              <p className="text-gray-300">
                Implementamos múltiplas camadas de segurança para proteger suas informações:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Medidas Técnicas</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Criptografia SSL/TLS em todas as conexões</li>
                    <li>• Senhas protegidas com hash seguro</li>
                    <li>• Tokens de sessão com expiração</li>
                    <li>• Firewall e proteção contra ataques</li>
                    <li>• Backups regulares e seguros</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Medidas Organizacionais</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Acesso limitado aos dados pessoais</li>
                    <li>• Treinamento em segurança para equipe</li>
                    <li>• Políticas internas de proteção</li>
                    <li>• Monitoramento contínuo de segurança</li>
                    <li>• Auditorias regulares de segurança</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-400/10 rounded-xl p-4 border border-blue-500/20">
                <p className="text-blue-300">
                  <strong>Importante:</strong> Embora implementemos as melhores práticas de segurança, 
                  nenhum sistema é 100% seguro. Recomendamos que você mantenha suas credenciais seguras 
                  e não compartilhe informações da conta com terceiros.
                </p>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Seus Direitos</h2>
            </div>

            <div className="space-y-6">
              <p className="text-gray-300">
                Conforme a LGPD (Lei Geral de Proteção de Dados), você tem os seguintes direitos:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-400/10 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="font-semibold text-white mb-2">🔍 Acesso</h3>
                  <p className="text-gray-300 text-sm">
                    Visualizar quais dados pessoais temos sobre você
                  </p>
                </div>
                
                <div className="bg-blue-400/10 rounded-lg p-4 border border-blue-500/20">
                  <h3 className="font-semibold text-white mb-2">✏️ Correção</h3>
                  <p className="text-gray-300 text-sm">
                    Corrigir dados incorretos ou incompletos
                  </p>
                </div>
                
                <div className="bg-red-400/10 rounded-lg p-4 border border-red-500/20">
                  <h3 className="font-semibold text-white mb-2">🗑️ Exclusão</h3>
                  <p className="text-gray-300 text-sm">
                    Solicitar a exclusão de seus dados (sujeito a obrigações legais)
                  </p>
                </div>
                
                <div className="bg-green-400/10 rounded-lg p-4 border border-green-500/20">
                  <h3 className="font-semibold text-white mb-2">📁 Portabilidade</h3>
                  <p className="text-gray-300 text-sm">
                    Receber uma cópia de seus dados em formato estruturado
                  </p>
                </div>
                
                <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-500/20">
                  <h3 className="font-semibold text-white mb-2">🚫 Oposição</h3>
                  <p className="text-gray-300 text-sm">
                    Opor-se ao tratamento de seus dados para certas finalidades
                  </p>
                </div>
                
                <div className="bg-orange-400/10 rounded-lg p-4 border border-orange-500/20">
                  <h3 className="font-semibold text-white mb-2">📋 Informação</h3>
                  <p className="text-gray-300 text-sm">
                    Obter informações sobre como seus dados são tratados
                  </p>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">Como Exercer seus Direitos</h3>
                <p className="text-gray-300 text-sm">
                  Para exercer qualquer um desses direitos, entre em contato através do suporte da plataforma. 
                  Responderemos sua solicitação em até 15 dias úteis, conforme estabelecido pela LGPD.
                </p>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Retenção de Dados</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-green-400 font-bold">📊</span>
                  <div>
                    <h3 className="font-semibold text-white">Dados da Conta Ativa</h3>
                    <p className="text-gray-300 text-sm">
                      Mantidos enquanto sua conta estiver ativa e por até 5 anos após o encerramento, 
                      conforme exigido por obrigações fiscais e contábeis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-blue-400 font-bold">💳</span>
                  <div>
                    <h3 className="font-semibold text-white">Dados de Pagamento</h3>
                    <p className="text-gray-300 text-sm">
                      Histórico de transações mantido por 5 anos para fins fiscais e de auditoria.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-purple-400 font-bold">🔒</span>
                  <div>
                    <h3 className="font-semibold text-white">Logs de Segurança</h3>
                    <p className="text-gray-300 text-sm">
                      Mantidos por até 1 ano para investigação de fraudes e questões de segurança.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Contato e Alterações</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Dúvidas sobre Privacidade</h3>
                <p className="text-gray-300">
                  Se você tiver dúvidas sobre esta política de privacidade ou sobre como tratamos seus dados, 
                  entre em contato através do suporte da plataforma. Nossa equipe de proteção de dados 
                  responderá suas questões.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Alterações nesta Política</h3>
                <p className="text-gray-300">
                  Podemos atualizar esta política de privacidade ocasionalmente. Quando o fizermos, 
                  notificaremos você através da plataforma e atualizaremos a data de "Última atualização" 
                  no topo desta página.
                </p>
              </div>

              <div className="bg-blue-400/10 rounded-xl p-4 border border-blue-500/20">
                <p className="text-blue-300">
                  <strong>Data de vigência:</strong> Esta política entra em vigor a partir de {new Date().toLocaleDateString('pt-BR')} 
                  e substitui todas as versões anteriores.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-400/10 to-purple-600/10 rounded-2xl p-6 border border-blue-500/20">
            <p className="text-white font-semibold mb-2">
              Sua privacidade é nossa prioridade
            </p>
            <p className="text-gray-400 text-sm">
              Estamos comprometidos em proteger suas informações e ser transparentes sobre nossos práticas de dados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
