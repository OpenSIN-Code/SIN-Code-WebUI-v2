'use client'

/**
 * Purpose: Memory browser — search/list sin-brain memories and add new ones.
 */
import { Brain, CirclePlus, Search } from 'lucide-react'
import { useState } from 'react'
import { useSinMemory } from '@/lib/sin/use-sin'
import { EmptyState } from '@/components/ui/empty-state'

type MemoryItem = {
  id?: string | number
  content?: string
  kind?: string
  [key: string]: unknown
}

export function MemoryView() {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState<string | undefined>()
  const [newMemory, setNewMemory] = useState('')
  const { data, mutate, isLoading } = useSinMemory(activeQuery)

  const memories: MemoryItem[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.memories)
      ? data.data.memories
      : []
  const notInstalled = data && data.ok === false

  async function addMemory() {
    const content = newMemory.trim()
    if (!content) return
    setNewMemory('')
    await fetch('/api/sin/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    mutate()
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Memory</h1>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        Persistent project memory from the sin-code backend.
      </p>

      <div className="mt-8 flex gap-2">
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setActiveQuery(query.trim() || undefined)
            }}
            placeholder="Search memories…"
            className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setActiveQuery(query.trim() || undefined)}
          className="h-9 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Search
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addMemory()
          }}
          placeholder="Remember something (decision / convention / fix / pitfall)…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={addMemory}
          disabled={!newMemory.trim()}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <CirclePlus className="size-3.5" />
          Remember
        </button>
      </div>

      {notInstalled ? (
        <div className="mt-6">
          <EmptyState
            icon={Brain}
            title="Backend not connected"
            description="The sin-code backend isn't installed, so persistent memory is unavailable."
          />
        </div>
      ) : memories.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Brain}
            title={isLoading ? 'Loading memories…' : 'No memories yet'}
            description={
              isLoading
                ? undefined
                : 'Capture decisions, conventions, fixes, and pitfalls above so the agent remembers them across sessions.'
            }
          />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {memories.map((m, i) => (
              <li key={String(m.id ?? i)} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border">
                  <Brain className="size-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-relaxed text-foreground">
                    {String(m.content ?? JSON.stringify(m))}
                  </p>
                  {m.kind ? (
                    <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {String(m.kind)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
