'use client'
/**
 * Purpose: Workspaces page — card grid in the Templates style.
 * Click a card -> new chat preconfigured for that workspace.
 * Custom workspaces can be created, edited and deleted inline.
 */
import { BarChart3, Code2, Globe, MessageCircle, NotebookPen, PenLine, Pencil, Play, Plus, Sparkles, Trash2, } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { WorkspaceEditor } from '@/components/workspace-editor'
import { useChatStore } from '@/components/chat-store'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/lib/workspaces-shared'

const ICONS: Record<string, typeof Code2> = {
  code: Code2,
  'message-circle': MessageCircle,
  globe: Globe,
  'bar-chart': BarChart3,
  notebook: NotebookPen,
  'pen-line': PenLine,
  sparkles: Sparkles,
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function WorkspacesView() {
  const router = useRouter()
  const { addChat } = useChatStore()
  const { data, mutate } = useSWR('/api/workspaces', fetcher)
  const [editing, setEditing] = useState<Workspace | 'new' | null>(null)
  const workspaces: Workspace[] = Array.isArray(data?.data) ? data.data : []

  async function openWorkspace(ws: Workspace) {
    router.push(`/workspaces/${ws.id}`)
  }

  async function startChat(ws: Workspace) {
    const id = `chat-${Date.now().toString(36)}`
    await addChat({
      id,
      label: `New ${ws.name} chat`,
      workspaceId: ws.id,
    })
    router.push(`/chat/${id}?ws=${ws.id}&m=${encodeURIComponent(ws.defaultModel)}`)
  }

  async function removeWorkspace(id: string) {
    await fetch('/api/workspaces', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[15px] font-medium text-foreground">Workspaces</h1>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          New workspace
        </button>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => {
          const Icon = ICONS[ws.icon] ?? Sparkles
          return (
            <div
              key={ws.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-muted-foreground/30"
            >
              <button
                type="button"
                onClick={() => openWorkspace(ws)}
                aria-label={`Open ${ws.name} workspace`}
                className="flex flex-col text-left"
              >
                <div className="m-3 flex aspect-[16/10] items-center justify-center rounded-lg bg-muted/50">
                  <Icon className="size-8 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <div className="flex flex-col gap-1 px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-foreground">
                      {ws.name}
                    </span>
                    {!ws.builtIn && (
                      <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        custom
                      </span>
                    )}
                  </div>
                  <p className="text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
                    {ws.description}
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] text-muted-foreground/70">
                    {ws.enabledTools.length === 0
                      ? 'no tools'
                      : `${ws.enabledTools.length} tools`}{' '}
                    · {ws.defaultModel.split('/')[1]}
                  </p>
                </div>
              </button>

              <div className="absolute right-2 top-5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => startChat(ws)}
                  aria-label={`Start a new ${ws.name} chat`}
                  className="flex size-7 items-center justify-center rounded-md bg-card/80 text-muted-foreground backdrop-blur hover:text-foreground"
                >
                  <Play className="size-3.5" />
                </button>
                {!ws.builtIn && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(ws)}
                      aria-label={`Edit ${ws.name}`}
                      className="flex size-7 items-center justify-center rounded-md bg-card/80 text-muted-foreground backdrop-blur hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWorkspace(ws.id)}
                      aria-label={`Delete ${ws.name}`}
                      className="flex size-7 items-center justify-center rounded-md bg-card/80 text-muted-foreground backdrop-blur hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setEditing('new')}
          className={cn(
            'flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl',
            'border border-dashed border-border text-muted-foreground',
            'transition-colors hover:border-muted-foreground/40 hover:text-foreground',
          )}
        >
          <Plus className="size-6" />
          <span className="text-[13px]">Create custom workspace</span>
        </button>
      </div>

      {editing && (
        <WorkspaceEditor
          workspace={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
