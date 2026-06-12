'use client'

/**
 * Purpose: SWR hooks for all /api/sin/* endpoints.
 * Single place for polling intervals and the `installed:false` fallback.
 */
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useSinStatus() {
  return useSWR('/api/sin/status', fetcher, { refreshInterval: 30_000 })
}

export function useSinAgents() {
  return useSWR('/api/sin/agents', fetcher)
}

export function useSinTodos(view: 'list' | 'ready' | 'blocked' = 'list') {
  return useSWR(`/api/sin/todos?view=${view}`, fetcher, {
    refreshInterval: 15_000,
  })
}

export function useSinMemory(q?: string) {
  const key = q ? `/api/sin/memory?q=${encodeURIComponent(q)}` : '/api/sin/memory'
  return useSWR(key, fetcher)
}

export function useSinNotifications() {
  return useSWR('/api/sin/notifications', fetcher, { refreshInterval: 20_000 })
}
