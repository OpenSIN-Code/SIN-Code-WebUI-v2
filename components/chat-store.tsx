'use client'

import { createContext, useCallback, useContext, useState } from 'react'

export type ChatEntry = {
  id: string
  label: string
  updated?: string
}

type ChatStore = {
  recentChats: ChatEntry[]
  addChat: (chat: ChatEntry) => void
  removeChat: (id: string) => void
  renameChat: (id: string, label: string) => void
}

const ChatStoreContext = createContext<ChatStore | null>(null)

const initialChats: ChatEntry[] = [{ id: 'repo-review', label: 'Repo review' }]

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [recentChats, setRecentChats] = useState<ChatEntry[]>(initialChats)

  const addChat = useCallback((chat: ChatEntry) => {
    setRecentChats((prev) => {
      if (prev.some((c) => c.id === chat.id)) return prev
      const updated = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
      return [{ ...chat, updated }, ...prev]
    })
  }, [])

  const removeChat = useCallback((id: string) => {
    setRecentChats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const renameChat = useCallback((id: string, label: string) => {
    setRecentChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, label } : c)),
    )
  }, [])

  return (
    <ChatStoreContext.Provider
      value={{ recentChats, addChat, removeChat, renameChat }}
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
