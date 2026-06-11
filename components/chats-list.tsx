'use client'

import { Clock, SquarePen } from 'lucide-react'
import Link from 'next/link'
import { useChatStore } from '@/components/chat-store'

export function ChatsList() {
  const { recentChats } = useChatStore()

  if (recentChats.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        You haven&apos;t created any chats yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {recentChats.map((chat) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-border/60 hover:bg-card"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
            <SquarePen className="size-3.5 text-muted-foreground" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-foreground">{chat.label}</span>
            <span className="truncate text-xs text-muted-foreground">Drafts</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {chat.updated ?? '1:22 PM'}
          </span>
        </Link>
      ))}
    </div>
  )
}
