/**
 * Purpose: Design systems list + "New Design System" button (client component).
 * Related issues: #22
 */
// SPDX-License-Identifier: MIT

'use client'

import { Clock, MoreHorizontal, Palette, Plus } from 'lucide-react'
import { useDesignSystemStore } from '@/components/design-system-store'
import { EmptyState } from '@/components/page-shell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NewDesignSystemButton() {
  const { addDesignSystem } = useDesignSystemStore()

  return (
    <button
      type="button"
      onClick={() => {
        const name = window.prompt('Design system name')
        const trimmed = name?.trim()
        if (trimmed) addDesignSystem(trimmed)
      }}
      className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="size-4" />
      New Design System
    </button>
  )
}

export function DesignSystemsList() {
  const { designSystems, removeDesignSystem } = useDesignSystemStore()

  if (designSystems.length === 0) {
    return (
      <EmptyState
        icon={Palette}
        title="No design systems yet"
        description="Define colors, typography and components once, and reuse them across every generation."
      />
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {designSystems.map((ds) => (
        <div
          key={ds.id}
          className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-border/60 hover:bg-card"
        >
          <span
            aria-hidden="true"
            className="size-8 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: ds.primaryColor }}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-foreground">{ds.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {ds.primaryColor}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {ds.updated ?? 'Just now'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Design system options"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100 data-[popup-open]:opacity-100"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => removeDesignSystem(ds.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  )
}
