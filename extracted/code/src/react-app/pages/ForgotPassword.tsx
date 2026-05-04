import { useState } from 'react';
import { AuthLayout } from '@/react-app/components/AuthLayout';
import { Input } from '@/react-app/components/ui/input';
import { Button } from '@/react-app/components/ui/button';
import { FormField } from '@/react-app/components/ui/form-field';
import { Loader2, Mail, Copy, CheckCircle } from 'lucide-react';
import { Link } from 'react-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          setResetToken(data.token);
          setMessage('Código de recuperação gerado! Copie o código abaixo e use na próxima tela.');
        } else {
          setMessage(data.message);
        }
      } else {
        alert(data.error || 'Erro ao processar solicitação');
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = resetToken;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFormValid = email.trim();

  if (resetToken) {
    return (
      <AuthLayout
        title="Código de Recuperação"
        subtitle="Anote este código para alterar sua senha"
      >
        <div className="absolute top-1 left-1 z-20">
          <Link
            to="/login"
            className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2 px-4 py-2"
          >
            ← Voltar ao login
          </Link>
        </div>

        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-green-400 text-sm mb-4">
              {message}
            </p>
            
            <div className="bg-black/40 border border-white/20 rounded-xl p-4 mb-4">
              <p className="text-white/70 text-xs mb-2">Seu código de recuperação:</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-bold text-green-400 tracking-widest select-all">
                  {resetToken}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copiar código"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/70" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-green-400 text-xs mt-2">
                  ✅ Código copiado!
                </p>
              )}
            </div>

            <p className="text-white/60 text-xs mb-2">
              Este código expira em 15 minutos
            </p>
            <p className="text-yellow-400 text-xs">
              💡 Guarde este código em local seguro antes de continuar
            </p>
          </div>

          <Link to={`/reset-password/${resetToken}`}>
            <Button variant="nextfund" className="w-full">
              CONTINUAR PARA ALTERAR SENHA
            </Button>
          </Link>

          <div className="text-center">
            <Link
              to="/login"
              className="text-white/70 hover:text-green-400 transition-colors text-sm"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Esqueceu a Senha?"
      subtitle="Digite seu email para receber um código de recuperação"
    >
      <div className="absolute top-1 left-1 z-20">
        <Link
          to="/login"
          className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2 px-4 py-2"
        >
          ← Voltar ao login
        </Link>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 text-center">
          <p className="text-blue-400 text-sm">
            💡 Você receberá um código de 6 dígitos para criar uma nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="E-mail" required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Mail className="h-4 w-4 text-white/70" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
                required
              />
            </div>
          </FormField>

          <Button
            type="submit"
            variant="nextfund"
            className="w-full py-3 text-base"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                GERANDO CÓDIGO...
              </span>
            ) : (
              "GERAR CÓDIGO DE RECUPERAÇÃO"
            )}
          </Button>
        </form>

        {message && !resetToken && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 text-center">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}

        <div className="text-center">
          <span className="text-white/70">Lembrou da senha? </span>
          <Link
            to="/login"
            className="text-green-400 hover:text-green-300 transition-colors font-medium"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
