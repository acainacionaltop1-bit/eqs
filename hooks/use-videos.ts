'use client'

import useSWR from 'swr'
import type { Video } from '@/types/database'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Falha ao buscar dados')
  }
  return res.json()
}

export function useVideos(options?: { category?: string; featured?: boolean; limit?: number }) {
  const params = new URLSearchParams()
  if (options?.category) params.set('category', options.category)
  if (options?.featured) params.set('featured', 'true')
  if (options?.limit) params.set('limit', options.limit.toString())

  const url = `/api/videos${params.toString() ? `?${params.toString()}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<{ videos: Video[] }>(url, fetcher)

  return {
    videos: data?.videos || [],
    isLoading,
    isError: error,
    mutate,
  }
}
