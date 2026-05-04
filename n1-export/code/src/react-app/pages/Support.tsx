import { Link } from 'react-router';
import { ArrowLeft, MessageCircle, Mail, Clock, HelpCircle, User, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/react-app/components/ui/toast';

export default function Support() {
  const [messageForm, setMessageForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageForm.name.trim() || !messageForm.email.trim() || !messageForm.message.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (messageForm.message.trim().length < 10) {
      toast.error('A mensagem deve ter pelo menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Mensagem enviada com sucesso!');
        setMessageForm({ name: '', email: '', message: '' });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      question: "Como funciona o sistema de ganhos?",
      answer: "Você ganha dinheiro assistindo vídeos publicitários. Cada vídeo vale entre R$ 2,00 e R$ 3,00, dependendo do seu nível. Os ganhos são creditados automaticamente após assistir o vídeo completo.",
      category: "Ganhos",
      icon: DollarSign
    },
    {
      question: "Qual é o valor mínimo para saque?",
      answer: "O valor mínimo para solicitar um saque é R$ 20,00. Os saques são processados via PIX em até 7 dias úteis.",
      category: "Pagamentos",
      icon: DollarSign
    },
    {
      question: "Como funciona o sistema de níveis?",
      answer: "Existem 5 níveis na plataforma. Você progride assistindo vídeos e indicando amigos. Níveis mais altos têm maiores ganhos por vídeo e limites diários maiores.",
      category: "Níveis",
      icon: User
    },
    {
      question: "Posso ter mais de uma conta?",
      answer: "Não. Cada pessoa pode ter apenas uma conta. Contas duplicadas podem ser suspensas permanentemente.",
      category: "Conta",
      icon: AlertTriangle
    },
    {
      question: "Como funciona o programa de afiliados?",
      answer: "Você ganha 10% dos ganhos de cada pessoa que indicar. Compartilhe seu link único e ganhe comissões vitalícias.",
      category: "Afiliados",
      icon: User
    },
    {
      question: "Por que meu saque está pendente?",
      answer: "Saques podem levar até 7 dias úteis para serem processados. Em alguns casos, pode ser necessária verificação adicional de identidade.",
      category: "Pagamentos",
      icon: Clock
    },
    {
      question: "Como funciona a roleta diária?",
      answer: "Todo dia você pode girar a roleta uma vez gratuitamente para ganhar prêmios: dinheiro extra, vídeos bônus ou nada.",
      category: "Bônus",
      icon: CheckCircle
    },
    {
      question: "O que são vídeos bônus?",
      answer: "Vídeos bônus não contam no seu limite diário. Você pode ganhá-los na roleta diária ou através de promoções especiais.",
      category: "Vídeos",
      icon: CheckCircle
    }
  ];

  const categories = ["Todos", "Ganhos", "Pagamentos", "Níveis", "Conta", "Afiliados", "Bônus", "Vídeos"];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{
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
            Central de Ajuda
          </h1>
          <p className="text-gray-400 text-lg">
            Encontre respostas para suas dúvidas ou entre em contato conosco
          </p>
        </div>

        {/* Quick Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20 text-center">
            <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Chat ao Vivo</h3>
            <p className="text-gray-400 text-sm mb-4">
              Fale conosco em tempo real
            </p>
            <button className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
              Iniciar Chat
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl p-6 border border-green-500/20 text-center">
            <Mail className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">E-mail</h3>
            <p className="text-gray-400 text-sm mb-4">
              Resposta em até 24h
            </p>
            <a 
              href="mailto:nextfundpagamentos@gmail.com"
              className="w-full bg-green-400 hover:bg-green-500 text-black font-semibold py-2 px-4 rounded-xl transition-colors inline-block"
            >
              nextfundpagamentos@gmail.com
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Perguntas Frequentes</h2>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <details key={index} className="group">
                  <summary className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">{item.question}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                      <svg 
                        className="w-5 h-5 text-gray-400 transform group-open:rotate-180 transition-transform" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="p-4 pt-0">
                    <p className="text-gray-300 ml-8">{item.answer}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-12 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Envie sua mensagem</h2>
          
          <form onSubmit={handleSubmitMessage} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={messageForm.name}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={messageForm.email}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Mensagem *
              </label>
              <textarea
                rows={6}
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none resize-none"
                placeholder="Descreva sua dúvida ou problema detalhadamente... (mínimo 10 caracteres)"
                required
                minLength={10}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {messageForm.message.length}/1000 caracteres
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                'Enviar Mensagem'
              )}
            </button>
          </form>
        </div>

        {/* Operating Hours */}
        <div className="mt-8 bg-gradient-to-r from-yellow-400/10 to-orange-600/10 rounded-2xl p-6 border border-yellow-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Horário de Atendimento</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Suporte por Chat</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>Segunda a Sexta: 8h às 22h</li>
                <li>Sábado: 9h às 18h</li>
                <li>Domingo: 14h às 20h</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">Suporte por E-mail</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>24 horas por dia, 7 dias por semana</li>
                <li>Resposta em até 24 horas</li>
                <li>Casos urgentes: até 6 horas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
