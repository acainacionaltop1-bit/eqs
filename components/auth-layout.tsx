import { ReactNode } from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05),transparent_50%)]"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-sm md:max-w-md">
          {/* Auth Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-lg"></div>
            <div className="relative bg-card/40 backdrop-blur-xl border border-border rounded-3xl pt-0 px-4 pb-4 md:pt-0 md:px-6 md:pb-6 shadow-2xl">
              {/* Back button */}
              <div className="absolute top-1 left-1 z-20">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 px-4 py-2"
                >
                  ← Voltar ao início
                </Link>
              </div>
              
              {/* Logo */}
              <div className="text-center -mt-4 mb-0">
                <div className="h-64 md:h-80 flex items-center justify-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    NextFund
                  </div>
                </div>
                {title && <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{title}</h1>}
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
