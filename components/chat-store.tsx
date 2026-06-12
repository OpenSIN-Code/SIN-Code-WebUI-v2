'use client'

/**
 * Purpose: Chat list store — server-backed via /api/chats with SWR.
 * Replaces the previous localStorage-only implementation; the API shape
 * (addChat/removeChat/renameChat/toggleFavorite/recentChats) is unchanged
 * so all consumers keep working.
 */
import useSWR from 'swr'

export type ChatEntry = {
  id: string
  label: string
  favorite?: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postChat(body: Record<string, unknown>) {
  await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function useChatStore() {
  const { data, mutate } = useSWR('/api/chats', fetcher, {
    refreshInterval: 30_000,
  })

  const recentChats: ChatEntry[] = Array.isArray(data?.data) ? data.data : []

  async function addChat(entry: { id: string; label: string }) {
    mutate(
      { ok: true, data: [{ ...entry, favorite: false }, ...recentChats] },
      { revalidate: false },
    )
    await postChat({ id: entry.id, label: entry.label })
    mutate()
  }

  async function removeChat(id: string) {
    mutate(
      { ok: true, data: recentChats.filter((c) => c.id !== id) },
      { revalidate: false },
    )
    await fetch(`/api/chats/${id}`, { method: 'DELETE' })
    mutate()
  }

  async function renameChat(id: string, label: string) {
    const chat = recentChats.find((c) => c.id === id)
    if (!chat) return
    mutate(
      {
        ok: true,
        data: recentChats.map((c) => (c.id === id ? { ...c, label } : c)),
      },
      { revalidate: false },
    )
    await postChat({ id, label, favorite: chat.favorite })
    mutate()
  }

  async function toggleFavorite(id: string) {
    const chat = recentChats.find((c) => c.id === id)
    if (!chat) return
    mutate(
      {
        ok: true,
        data: recentChats.map((c) =>
          c.id === id ? { ...c, favorite: !c.favorite } : c,
        ),
      },
      { revalidate: false },
    )
    await postChat({ id, label: chat.label, favorite: !chat.favorite })
    mutate()
  }

  return { recentChats, addChat, removeChat, renameChat, toggleFavorite }
}
