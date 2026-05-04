import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const handleCallback = async () => {
      try {
        // Set a timeout for authentication
        const authPromise = exchangeCodeForSessionToken();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        );

        await Promise.race([authPromise, timeoutPromise]);
        navigate('/home');
      } catch (error) {
        console.error('Auth error:', error);
        setError('Erro na autenticação. Redirecionando...');
        
        // Wait 3 seconds then redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();

    return () => clearInterval(timer);
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Erro na Autenticação</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <p className="text-sm text-white/50">Você será redirecionado automaticamente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-green-500 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Finalizando Login</h2>
        <p className="text-white/70 mb-4">Aguarde enquanto configuramos sua conta...</p>
        
        {timeElapsed > 5 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">
              ⏳ Isso está demorando mais que o normal. Aguarde mais um momento...
            </p>
          </div>
        )}

        {timeElapsed > 10 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              💡 Se continuar travado, tente fechar e abrir o navegador novamente, ou use o login por email.
            </p>
          </div>
        )}
        
        <div className="text-sm text-white/50 mt-4">
          Tempo decorrido: {timeElapsed}s
        </div>
      </div>
    </div>
  );
}
