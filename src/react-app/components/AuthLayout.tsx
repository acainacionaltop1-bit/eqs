import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-sm md:max-w-md">
          {/* Auth Card - Now encompasses logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-3xl blur-lg"></div>
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl pt-0 px-4 pb-4 md:pt-0 md:px-6 md:pb-6 shadow-2xl">
              {/* Logo inside card */}
              <div className="text-center -mt-4 mb-0">
                <img 
                  src="https://mocha-cdn.com/01999c98-c3d7-7a52-aad8-d779286efadd/1000808270-removebg-preview-(2).png" 
                  alt="NextFund Logo" 
                  className={`h-64 md:h-80 mx-auto ${title ? 'mb-2' : 'mb-2'}`} 
                />
                {title && <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h1>}
                {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
              </div>

              {children}
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
