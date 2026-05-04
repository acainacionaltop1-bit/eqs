import { Link } from 'react-router';
import { ArrowLeft, Shield, Users, DollarSign, AlertCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Termos de Uso e Política de Privacidade
          </h1>
          <p className="text-gray-400 text-lg">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Terms of Use */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Termos de Uso</h2>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">1. Aceitação dos Termos</h3>
                <p>
                  Ao acessar e usar nossa plataforma, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer um desses termos, não deve usar nosso serviço.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">2. Descrição do Serviço</h3>
                <p>
                  Nossa plataforma oferece oportunidades de ganhar dinheiro assistindo a vídeos publicitários. Os usuários podem acumular ganhos que podem ser sacados via PIX, sujeito aos termos e condições estabelecidos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">3. Elegibilidade</h3>
                <p>
                  Você deve ter pelo menos 18 anos de idade para usar nosso serviço. Ao se registrar, você confirma que atende a este requisito de idade e que todas as informações fornecidas são verdadeiras e precisas.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">4. Conta do Usuário</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Você é responsável por manter a confidencialidade de sua conta</li>
                  <li>Cada pessoa só pode ter uma conta ativa</li>
                  <li>É proibido criar múltiplas contas ou usar contas de terceiros</li>
                  <li>Reservamo-nos o direito de suspender contas suspeitas de atividade fraudulenta</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">5. Ganhos e Pagamentos</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Os ganhos são creditados após assistir completamente aos vídeos</li>
                  <li>Valor mínimo para saque: R$ 20,00</li>
                  <li>Pagamentos são processados via PIX em até 7 dias úteis</li>
                  <li>Reservamo-nos o direito de verificar a autenticidade das atividades antes do pagamento</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">6. Uso Proibido</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Uso de bots, scripts ou automação para assistir vídeos</li>
                  <li>Criação de múltiplas contas</li>
                  <li>Compartilhamento de credenciais de acesso</li>
                  <li>Tentativas de manipular o sistema de ganhos</li>
                  <li>Atividades fraudulentas ou enganosas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Política de Privacidade</h2>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">1. Informações Coletadas</h3>
                <p>
                  Coletamos as seguintes informações:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Informações de registro (nome, e-mail)</li>
                  <li>Dados de uso da plataforma</li>
                  <li>Informações de pagamento (chave PIX)</li>
                  <li>Dados de atividade (vídeos assistidos, ganhos)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">2. Uso das Informações</h3>
                <p>
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Processar pagamentos</li>
                  <li>Comunicar atualizações e ofertas</li>
                  <li>Prevenir fraudes e atividades suspeitas</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">3. Compartilhamento de Dados</h3>
                <p>
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Processar pagamentos através de nossos provedores de pagamento</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Proteger nossos direitos e propriedade</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">4. Segurança</h3>
                <p>
                  Implementamos medidas de segurança adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">5. Seus Direitos</h3>
                <p>
                  Você tem o direito de:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir dados incorretos</li>
                  <li>Solicitar a exclusão de sua conta</li>
                  <li>Revogar consentimentos dados</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Termos de Pagamento</h2>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">1. Sistema de Ganhos</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ganhos são creditados automaticamente após assistir vídeos completamente</li>
                  <li>Valores variam conforme o nível do usuário (R$ 2,00 a R$ 3,00 por vídeo)</li>
                  <li>Limite diário de vídeos baseado no nível do usuário</li>
                  <li>Bônus especiais podem ser concedidos via roleta diária</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">2. Saques</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Valor mínimo para saque: R$ 20,00</li>
                  <li>Saques processados apenas via PIX</li>
                  <li>Tempo de processamento: até 7 dias úteis</li>
                  <li>Verificação de identidade pode ser solicitada</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">3. Programa de Afiliados</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ganhe 10% dos ganhos dos usuários indicados</li>
                  <li>Comissões creditadas automaticamente</li>
                  <li>Link de indicação único para cada usuário</li>
                  <li>Sem limite de indicações</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact and Changes */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Alterações e Contato</h2>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Alterações nos Termos</h3>
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações serão comunicadas através da plataforma e entrarão em vigor imediatamente após a publicação.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Contato</h3>
                <p>
                  Para dúvidas sobre estes termos ou nossa política de privacidade, entre em contato através do suporte da plataforma.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Lei Aplicável</h3>
                <p>
                  Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes do Brasil.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
            <p className="text-white font-semibold mb-2">
              Ao usar nossa plataforma, você concorda com estes termos
            </p>
            <p className="text-gray-400 text-sm">
              Para questões específicas, consulte nossa equipe de suporte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
