/**
 * Purpose: Client-side store for project entries (used by /projects).
 * Persists to localStorage so the UI survives reloads.
 * Related issues: #14
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
  chatCount: number
  updated?: string
  favorite?: boolean
}

type ProjectStore = {
  projects: ProjectEntry[]
  addProject: (name: string, description?: string) => void
  removeProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  toggleFavorite: (id: string) => void
}

const STORAGE_KEY = 'sin-projects-v1'

const ProjectStoreContext = createContext<ProjectStore | null>(null)

function loadFromStorage(): ProjectEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ProjectEntry[]) : []
  } catch {
    return []
  }
}

function nowLabel(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ProjectStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Always start with [] to match SSR. Hydrate from localStorage on mount.
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
      // localStorage may be full or blocked — non-fatal.
    }
  }, [projects, hydrated])

  const addProject = useCallback((name: string, description?: string) => {
    setProjects((prev) => [
      {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        name,
        description,
        chatCount: 0,
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

  return (
    <ProjectStoreContext.Provider
      value={{ projects, addProject, removeProject, renameProject, toggleFavorite }}
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
