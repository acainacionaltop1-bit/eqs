import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateAffiliateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function getVipLevelName(level: number): string {
  const names: Record<number, string> = {
    0: 'Gratuito',
    1: 'Bronze',
    2: 'Prata',
    3: 'Ouro',
    4: 'Platina',
    5: 'Diamante',
    6: 'Elite',
  }
  return names[level] || 'Gratuito'
}

export function getVipLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: 'text-gray-400',
    1: 'text-amber-600',
    2: 'text-gray-300',
    3: 'text-yellow-400',
    4: 'text-cyan-400',
    5: 'text-blue-400',
    6: 'text-purple-400',
  }
  return colors[level] || 'text-gray-400'
}
