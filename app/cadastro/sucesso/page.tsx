import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CadastroSucessoPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Conta Criada com Sucesso!</h1>
          <p className="text-muted-foreground">
            Enviamos um email de confirmação para você. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <Mail className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground text-left">
            Não recebeu o email? Verifique sua pasta de spam ou solicite um novo email de confirmação.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Ir para Login
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
