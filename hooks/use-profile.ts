'use client'

import useSWR from 'swr'
import type { Profile } from '@/types/database'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Falha ao buscar dados')
  }
  return res.json()
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<{ user: Profile }>('/api/users/me', fetcher)

  return {
    profile: data?.user,
    isLoading,
    isError: error,
    mutate,
  }
}
