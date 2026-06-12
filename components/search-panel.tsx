/**
 * Purpose: Live-filtering search panel for the /search page.
 * Filters the chat store by label substring (case-insensitive).
 * Related issues: #20
 */
'use client'

import { Search, SquarePen } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useChatStore } from '@/components/chat-store'

export function SearchPanel() {
  const { recentChats } = useChatStore()
  const [query, setQuery] = useState('')

  const trimmed = query.trim().toLowerCase()
  const results = trimmed
    ? recentChats.filter((c) => c.label.toLowerCase().includes(trimmed))
    : recentChats

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex h-10 items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:border-ring">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
          }}
          placeholder="Search chats, projects and templates..."
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <kbd className="flex h-5 shrink-0 items-center rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground">
          ESC
        </kbd>
      </div>
      <div className="flex flex-col gap-1">
        <p className="px-2 text-xs font-medium text-muted-foreground">
          {trimmed ? `Results (${results.length})` : 'Recent'}
        </p>
        {results.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No chats found for &quot;{query.trim()}&quot;
          </p>
        ) : (
          results.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent"
            >
              <SquarePen className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{chat.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {chat.label}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
