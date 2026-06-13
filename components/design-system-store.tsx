/**
 * Purpose: Client-side store for design systems.
 * Persists to localStorage so the list survives reloads.
 * Related issues: #22
 * Docs: design-system-store.doc.md
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

export type DesignSystemEntry = {
  id: string
  name: string
  primaryColor: string
  updated?: string
}

type DesignSystemStore = {
  designSystems: DesignSystemEntry[]
  addDesignSystem: (name: string) => void
  removeDesignSystem: (id: string) => void
}

const STORAGE_KEY = 'sin-code:design-systems'
// v0-aligned OKLCH fallback palette for auto-generated user design systems.
// Hues mirror the original defaults (green, blue, amber, red, teal) but are
// expressed in the same perceptual color space used by the rest of the system.
const PALETTE = [
  'oklch(0.69 0.17 158)',
  'oklch(0.64 0.19 255)',
  'oklch(0.77 0.16 80)',
  'oklch(0.64 0.25 25)',
  'oklch(0.71 0.13 181)',
]

const DesignSystemStoreContext = createContext<DesignSystemStore | null>(null)

function loadFromStorage(): DesignSystemEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DesignSystemEntry[]) : []
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

export function DesignSystemStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [designSystems, setDesignSystems] = useState<DesignSystemEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDesignSystems(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(designSystems))
    } catch {
      // Non-fatal.
    }
  }, [designSystems, hydrated])

  const addDesignSystem = useCallback((name: string) => {
    setDesignSystems((prev) => [
      {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        name,
        primaryColor: PALETTE[prev.length % PALETTE.length] ?? PALETTE[0],
        updated: nowLabel(),
      },
      ...prev,
    ])
  }, [])

  const removeDesignSystem = useCallback((id: string) => {
    setDesignSystems((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return (
    <DesignSystemStoreContext.Provider
      value={{ designSystems, addDesignSystem, removeDesignSystem }}
    >
      {children}
    </DesignSystemStoreContext.Provider>
  )
}

export function useDesignSystemStore() {
  const store = useContext(DesignSystemStoreContext)
  if (!store) {
    throw new Error(
      'useDesignSystemStore must be used within DesignSystemStoreProvider',
    )
  }
  return store
}
