import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Erro de Autenticação</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro durante o processo de autenticação. Isso pode acontecer se o link expirou ou já foi utilizado.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Tentar Novamente
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
