/**
 * Purpose: Client-side store for chat entries (used by sidebar + chat header).
 * Persists to localStorage so renames/deletes survive reloads.
 * Related issues: #15
 */
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type ChatEntry = {
  id: string
  label: string
  updated?: string
  favorite?: boolean
}

type ChatStore = {
  recentChats: ChatEntry[]
  addChat: (chat: ChatEntry) => void
  removeChat: (id: string) => void
  renameChat: (id: string, label: string) => void
  toggleFavorite: (id: string) => void
}

const STORAGE_KEY = 'sin-chats-v1'
const DEFAULT_CHAT: ChatEntry = { id: 'repo-review', label: 'Repo review' }

const ChatStoreContext = createContext<ChatStore | null>(null)

function loadFromStorage(): ChatEntry[] {
  if (typeof window === 'undefined') return [DEFAULT_CHAT]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [DEFAULT_CHAT]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_CHAT]
    return parsed as ChatEntry[]
  } catch {
    return [DEFAULT_CHAT]
  }
}

function nowLabel(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  // Always start with the SSR-safe default. Hydrate from localStorage on mount.
  const [recentChats, setRecentChats] = useState<ChatEntry[]>([DEFAULT_CHAT])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setRecentChats(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentChats))
    } catch {
      // Non-fatal.
    }
  }, [recentChats, hydrated])

  const addChat = useCallback((chat: ChatEntry) => {
    setRecentChats((prev) => {
      if (prev.some((c) => c.id === chat.id)) return prev
      return [{ ...chat, updated: nowLabel() }, ...prev]
    })
  }, [])

  const removeChat = useCallback((id: string) => {
    setRecentChats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const renameChat = useCallback((id: string, label: string) => {
    setRecentChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, label, updated: nowLabel() } : c)),
    )
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setRecentChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
    )
  }, [])

  return (
    <ChatStoreContext.Provider
      value={{ recentChats, addChat, removeChat, renameChat, toggleFavorite }}
    >
      {children}
    </ChatStoreContext.Provider>
  )
}

export function useChatStore() {
  const store = useContext(ChatStoreContext)
  if (!store) {
    throw new Error('useChatStore must be used within ChatStoreProvider')
  }
  return store
}
