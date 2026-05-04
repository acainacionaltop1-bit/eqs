import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { AuthLayout } from '@/react-app/components/AuthLayout';
import { Input } from '@/react-app/components/ui/input';
import { Button } from '@/react-app/components/ui/button';
import { FormField } from '@/react-app/components/ui/form-field';
import { Loader2, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router';
export default function Cadastro() {
  const {
    redirectToLogin,
    isFetching,
    isRedirecting
  } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    affiliateCode: ''
  });

  // Check for affiliate code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, affiliateCode: refCode }));
    }
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          affiliate_code: formData.affiliateCode || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, wait a moment then redirect to dashboard
        if (data.user?.bonus_videos > 0) {
          alert(`Conta criada com sucesso! Você ganhou ${data.user.bonus_videos} vídeos bônus por usar um código de indicação!`);
        }
        setTimeout(() => {
          window.location.href = '/home';
        }, 100);
      } else {
        alert(data.error || 'Erro ao criar conta');
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const isFormValid = formData.name.trim() && formData.email.trim() && formData.password;
  return (
    <AuthLayout title="" subtitle="">
      {/* Back button in upper left */}
      <div className="absolute top-1 left-1 z-20">
        <Link
          to="/"
          className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2 px-4 py-2"
        >
          ← Voltar ao início
        </Link>
      </div>
      
      <div className="space-y-3">
        {/* Google Signup Button */}
        <button onClick={redirectToLogin} disabled={isFetching || isRedirecting} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-green-500/25 transform hover:scale-[1.02] disabled:hover:scale-100">
          {(isFetching || isRedirecting) ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isRedirecting ? 'Conectando com Google...' : 'Carregando...'}</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Criar Conta com Google
            </>
          )}
        </button>

        {/* Dica para usuários */}
        {isRedirecting && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 text-center">
            <p className="text-blue-400 text-sm">
              💡 Aguarde... Você será redirecionado para o Google. Se demorar muito, tente usar o cadastro por email abaixo.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="space-y-3">
          <div className="text-center text-xs uppercase text-white/60">
            ou cadastre-se com email
          </div>
          <div className="border-t border-white/20"></div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <FormField label="Nome completo" required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <User className="h-4 w-4 text-white/70" />
              </div>
              <Input id="name" name="name" type="text" placeholder="Seu nome completo" value={formData.name} onChange={handleInputChange} className="pl-10" autoComplete="name" required />
            </div>
          </FormField>

          <FormField label="E-mail" required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Mail className="h-4 w-4 text-white/70" />
              </div>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={handleInputChange} className="pl-10" autoComplete="email" required />
            </div>
          </FormField>

          <FormField label="Senha" required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-4 w-4 text-white/70" />
              </div>
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Crie uma senha segura" value={formData.password} onChange={handleInputChange} className="pl-10 pr-12" autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-green-400 transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Código de indicação (opcional)">
            <Input id="affiliateCode" name="affiliateCode" type="text" placeholder="Digite o código se foi convidado" value={formData.affiliateCode} onChange={handleInputChange} autoCapitalize="characters" />
            {formData.affiliateCode && <div className="text-xs text-white/70 bg-green-500/10 border border-green-500/20 rounded-lg p-2 mt-2">
                🎁 Você ganhará vídeos extras ao se cadastrar com este código!
              </div>}
          </FormField>

          <Button type="submit" variant="nextfund" className="w-full py-3 text-base" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                CRIANDO CONTA...
              </span> : "CRIAR CONTA"}
          </Button>
        </form>

        

        <div className="text-center">
          <span className="text-white/70">Já tem uma conta? </span>
          <Link to="/login" className="text-green-400 hover:text-green-300 transition-colors font-medium">
            Fazer login
          </Link>
        </div>

        
      </div>
    </AuthLayout>
  );
}
