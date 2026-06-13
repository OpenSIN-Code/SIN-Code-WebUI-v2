/**
 * Purpose: Client-side store for sidebar collapsed/expanded state.
 * Persists to localStorage under `sin-code:sidebar-collapsed`.
 * SSR-safe: deterministic default (false), hydrate in useEffect.
 * Related issues: #40
 */
// SPDX-License-Identifier: MIT

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type SidebarStore = {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (value: boolean) => void
}

const STORAGE_KEY = 'sin-code:sidebar-collapsed'
const DEFAULT_COLLAPSED = false

const SidebarStoreContext = createContext<SidebarStore | null>(null)

function loadFromStorage(): boolean {
  if (typeof window === 'undefined') return DEFAULT_COLLAPSED
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) return raw === 'true'
  } catch {
    // Storage unavailable
  }
  return DEFAULT_COLLAPSED
}

export function SidebarStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsedState] = useState<boolean>(DEFAULT_COLLAPSED)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCollapsedState(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // Storage full or unavailable
    }
  }, [collapsed, hydrated])

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => !prev)
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
  }, [])

  return (
    <SidebarStoreContext.Provider
      value={{ collapsed, toggleCollapsed, setCollapsed }}
    >
      {children}
    </SidebarStoreContext.Provider>
  )
}

export function useSidebarStore() {
  const store = useContext(SidebarStoreContext)
  if (!store) {
    throw new Error('useSidebarStore must be used within SidebarStoreProvider')
  }
  return store
}
