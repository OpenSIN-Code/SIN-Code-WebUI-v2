/**
 * Purpose: Client-side store for project entries.
 * Persists to localStorage. Migrates the v1 key (\`sin-projects-v1\`, no chatIds)
 * to the new key (\`sin-code:projects\`) with the new \`chatIds: string[]\` shape.
 * Related issues: #25
 */
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type ProjectEntry = {
  id: string
  name: string
  description?: string
  /** IDs of chats that have been moved into this project via the sidebar "Move…" submenu. */
  chatIds: string[]
  updated?: string
  favorite?: boolean
}

type ProjectStore = {
  projects: ProjectEntry[]
  addProject: (name: string, description?: string) => void
  removeProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  toggleFavorite: (id: string) => void
  /** Adds \`chatId\` to \`projectId\` and removes it from any other project. */
  moveChatToProject: (chatId: string, projectId: string) => void
}

const STORAGE_KEY = 'sin-code:projects'
const STORAGE_KEY_LEGACY = 'sin-projects-v1'

const ProjectStoreContext = createContext<ProjectStore | null>(null)

function nowLabel(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function loadFromStorage(): ProjectEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectEntry[]
      if (Array.isArray(parsed)) {
        return parsed.map((p) => ({ ...p, chatIds: p.chatIds ?? [] }))
      }
    }
    // Migration: legacy v1 entries had `chatCount` instead of `chatIds`.
    const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as Array<{
        id: string
        name: string
        description?: string
        chatCount?: number
        updated?: string
        favorite?: boolean
      }>
      if (Array.isArray(parsed)) {
        const migrated: ProjectEntry[] = parsed.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          chatIds: [],
          updated: p.updated,
          favorite: p.favorite,
        }))
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        } catch {
          /* non-fatal */
        }
        window.localStorage.removeItem(STORAGE_KEY_LEGACY)
        return migrated
      }
    }
  } catch {
    // Corrupted JSON — fall through to empty.
  }
  return []
}

export function ProjectStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProjects(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch {
      // Non-fatal.
    }
  }, [projects, hydrated])

  const addProject = useCallback((name: string, description?: string) => {
    setProjects((prev) => [
      {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        name,
        description,
        chatIds: [],
        updated: nowLabel(),
      },
      ...prev,
    ])
  }, [])

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, updated: nowLabel() } : p)),
    )
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p,
      ),
    )
  }, [])

  const moveChatToProject = useCallback((chatId: string, projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          if (p.chatIds.includes(chatId)) return p
          return {
            ...p,
            chatIds: [...p.chatIds, chatId],
            updated: nowLabel(),
          }
        }
        // Remove the chat from any other project.
        if (!p.chatIds.includes(chatId)) return p
        return { ...p, chatIds: p.chatIds.filter((c) => c !== chatId) }
      }),
    )
  }, [])

  return (
    <ProjectStoreContext.Provider
      value={{
        projects,
        addProject,
        removeProject,
        renameProject,
        toggleFavorite,
        moveChatToProject,
      }}
    >
      {children}
    </ProjectStoreContext.Provider>
  )
}

export function useProjectStore() {
  const store = useContext(ProjectStoreContext)
  if (!store) {
    throw new Error('useProjectStore must be used within ProjectStoreProvider')
  }
  return store
}
