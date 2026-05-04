import Link from 'next/link'
import { Play, Gift, Users, TrendingUp, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NextFund
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button variant="primary" size="sm">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Ganhe Dinheiro
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Assistindo Vídeos</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Transforme seu tempo livre em dinheiro real. Assista vídeos, responda perguntas simples e receba via PIX.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro">
              <Button variant="primary" size="lg" className="text-lg">
                <Play className="w-5 h-5 mr-2" />
                Começar a Ganhar
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="default" size="lg" className="text-lg">
                Já Tenho Conta
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary">R$ 2,00</div>
              <div className="text-sm text-muted-foreground">Por vídeo</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">15+</div>
              <div className="text-sm text-muted-foreground">Vídeos por dia</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">PIX</div>
              <div className="text-sm text-muted-foreground">Saque rápido</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Play className="w-8 h-8" />}
              title="Assista Vídeos"
              description="Escolha vídeos do nosso catálogo e assista até o final para ganhar recompensas."
            />
            <FeatureCard
              icon={<Gift className="w-8 h-8" />}
              title="Ganhe Recompensas"
              description="Cada vídeo assistido adiciona dinheiro ao seu saldo. Quanto mais assiste, mais ganha!"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Saque via PIX"
              description="Solicite seu saque a qualquer momento e receba diretamente na sua conta via PIX."
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Vantagens</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard
              icon={<Users className="w-6 h-6" />}
              title="Programa de Afiliados"
              description="Convide amigos e ganhe bônus em cada indicação."
            />
            <BenefitCard
              icon={<Zap className="w-6 h-6" />}
              title="Planos VIP"
              description="Aumente seus ganhos com planos exclusivos."
            />
            <BenefitCard
              icon={<Shield className="w-6 h-6" />}
              title="100% Seguro"
              description="Seus dados estão protegidos conosco."
            />
            <BenefitCard
              icon={<Gift className="w-6 h-6" />}
              title="Cupons e Bônus"
              description="Promoções exclusivas para nossos usuários."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-border rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-4">Pronto para Começar?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Crie sua conta gratuita agora e comece a ganhar dinheiro assistindo vídeos. É rápido, fácil e seguro!
            </p>
            <Link href="/cadastro">
              <Button variant="primary" size="lg" className="text-lg">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 NextFund. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/suporte" className="hover:text-foreground transition-colors">
              Suporte
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card/50 border border-border rounded-xl p-6">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
