import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'NextFund - Ganhe Dinheiro Assistindo Vídeos',
  description: 'Plataforma de recompensas por vídeos. Assista vídeos, responda perguntas e ganhe dinheiro real via PIX.',
  keywords: ['ganhar dinheiro', 'assistir videos', 'recompensas', 'pix', 'renda extra'],
  authors: [{ name: 'NextFund' }],
  openGraph: {
    title: 'NextFund - Ganhe Dinheiro Assistindo Vídeos',
    description: 'Plataforma de recompensas por vídeos. Assista e ganhe!',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} bg-background`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
