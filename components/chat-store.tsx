/**
 * Purpose: Client-side store for chat entries.
 * Persists to localStorage with graceful migration from the v1 key (\`sin-chats-v1\`)
 * to the new namespaced key (\`sin-code:chats\`). Idempotent.
 * Related issues: #15, #18
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

const STORAGE_KEY = 'sin-code:chats'
const STORAGE_KEY_LEGACY = 'sin-chats-v1'
const DEFAULT_CHAT: ChatEntry = { id: 'repo-review', label: 'Repo review' }

const ChatStoreContext = createContext<ChatStore | null>(null)

/**
 * Load chats from localStorage. Prefers the new key, falls back to
 * the legacy v1 key, and migrates the v1 entry to the new key in the
 * process (one-shot, then deletes the v1 key).
 */
function loadFromStorage(): ChatEntry[] {
  if (typeof window === 'undefined') return [DEFAULT_CHAT]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as ChatEntry[]
    }
    // No new key — try the legacy v1 key and migrate.
    const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Persist under the new key and drop the legacy one.
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
        } catch {
          /* non-fatal */
        }
        window.localStorage.removeItem(STORAGE_KEY_LEGACY)
        return parsed as ChatEntry[]
      }
    }
  } catch {
    // Corrupted JSON — fall through to default.
  }
  return [DEFAULT_CHAT]
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
      // Storage full or unavailable — non-fatal.
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
