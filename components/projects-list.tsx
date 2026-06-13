/**
 * Purpose: Project list + "New Project" button, wired to the project store.
 * Related issues: #14
 */
// SPDX-License-Identifier: MIT

'use client'

import {
  Clock,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Star,
} from 'lucide-react'
import { EmptyState } from '@/components/page-shell'
import { useProjectStore } from '@/components/project-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NewProjectButton() {
  const { addProject } = useProjectStore()

  return (
    <button
      type="button"
      onClick={() => {
        const name = window.prompt('Project name')
        const trimmed = name?.trim()
        if (trimmed) addProject(trimmed)
      }}
      className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="size-4" />
      New Project
    </button>
  )
}

export function ProjectsList() {
  const { projects, removeProject, renameProject, toggleFavorite } =
    useProjectStore()

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No projects yet"
        description="Projects keep your chats, integrations and deployments organized in one place."
      />
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-border/60 hover:bg-card"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
            <LayoutGrid className="size-3.5 text-muted-foreground" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1.5 truncate text-sm text-foreground">
              {project.name}
              {project.favorite && (
                <Star
                  className="size-3 shrink-0 text-amber-500"
                  fill="currentColor"
                  aria-label="Favorite"
                />
              )}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {project.chatIds.length}{' '}
              {project.chatIds.length === 1 ? 'chat' : 'chats'}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {project.updated ?? 'Just now'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Project options"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100 data-[popup-open]:opacity-100"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => toggleFavorite(project.id)}
              >
                {project.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const next = window.prompt('Rename project', project.name)
                  const trimmed = next?.trim()
                  if (trimmed && trimmed !== project.name) {
                    renameProject(project.id, trimmed)
                  }
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${project.name}"? This cannot be undone.`,
                    )
                  ) {
                    removeProject(project.id)
                  }
                }}
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
