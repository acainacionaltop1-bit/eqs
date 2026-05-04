import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-4">
        {/* Error illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-red-400/20 to-red-600/20 rounded-full flex items-center justify-center border border-red-500/30">
            <span className="text-6xl">🔍</span>
          </div>
          <h1 className="text-8xl font-bold text-transparent bg-gradient-to-r from-red-400 to-red-600 bg-clip-text mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2">
            Página Não Encontrada
          </h2>
          <p className="text-gray-400 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Link
            to="/home"
            className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 transform hover:scale-[1.02]"
          >
            <Home className="w-5 h-5" />
            Ir para Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
        </div>

        {/* Help text */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400">
            Se você acredita que isso é um erro, entre em contato com o suporte ou tente acessar uma das páginas principais do aplicativo.
          </p>
        </div>
      </div>
    </div>
  );
}
