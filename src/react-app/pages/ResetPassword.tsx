import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AuthLayout } from '@/react-app/components/AuthLayout';
import { Input } from '@/react-app/components/ui/input';
import { Button } from '@/react-app/components/ui/button';
import { FormField } from '@/react-app/components/ui/form-field';
import { Loader2, Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/reset-password/${token}`);
      const data = await response.json();

      if (response.ok) {
        setUserInfo(data);
      } else {
        setError(data.error || 'Código inválido ou expirado');
      }
    } catch (error) {
      setError('Erro ao verificar código');
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        alert(data.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.password.length >= 6 && formData.password === formData.confirmPassword;

  if (isValidating) {
    return (
      <AuthLayout
        title="Verificando Código"
        subtitle="Aguarde enquanto validamos seu código"
      >
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-white/70">Validando código de recuperação...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout
        title="Código Inválido"
        subtitle="O código de recuperação não é válido"
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <p className="text-white/60 text-xs">
              O código pode ter expirado ou já foi usado. Solicite um novo código.
            </p>
          </div>

          <Link to="/esqueci-senha">
            <Button variant="nextfund" className="w-full">
              SOLICITAR NOVO CÓDIGO
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

  if (success) {
    return (
      <AuthLayout
        title="Senha Alterada!"
        subtitle="Sua nova senha foi definida com sucesso"
      >
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-green-400 text-sm mb-4">
              Senha alterada com sucesso!
            </p>
            <p className="text-white/60 text-xs">
              Você será redirecionado para o login em alguns segundos...
            </p>
          </div>

          <Link to="/login">
            <Button variant="nextfund" className="w-full">
              IR PARA LOGIN
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nova Senha"
      subtitle={`Defina uma nova senha para ${userInfo?.email}`}
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
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 text-center">
          <p className="text-green-400 text-sm">
            ✅ Código válido para: <strong>{userInfo?.name || userInfo?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nova Senha" required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-4 w-4 text-white/70" />
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua nova senha"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-12"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-green-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <FormField label="Confirmar Nova Senha" required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-4 w-4 text-white/70" />
              </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10 pr-12"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-green-400 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          {formData.password && formData.confirmPassword && (
            <div className="text-sm">
              {formData.password === formData.confirmPassword ? (
                <div className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  As senhas coincidem
                </div>
              ) : (
                <div className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  As senhas não coincidem
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-400 text-xs font-medium mb-1">📋 Requisitos da senha:</p>
            <ul className="text-white/60 text-xs space-y-1">
              <li className={formData.password.length >= 6 ? "text-green-400" : "text-white/60"}>
                • Mínimo de 6 caracteres {formData.password.length >= 6 ? "✓" : ""}
              </li>
              <li className={formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? "text-green-400" : "text-white/60"}>
                • Confirmação deve coincidir {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? "✓" : ""}
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="nextfund"
            className="w-full py-3 text-base"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                ALTERANDO SENHA...
              </span>
            ) : (
              "ALTERAR SENHA"
            )}
          </Button>
        </form>

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
