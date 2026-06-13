'use client'

import { Clock, MessageSquarePlus, SquarePen } from 'lucide-react'
import Link from 'next/link'
import { useChatStore } from '@/components/chat-store'
import { EmptyState } from '@/components/ui/empty-state'

export function ChatsList() {
  const { recentChats } = useChatStore()

  if (recentChats.length === 0) {
    return (
      <EmptyState
        icon={MessageSquarePlus}
        title="No chats yet"
        description="Start a conversation from the home screen or pick a workspace to begin building."
        action={
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <MessageSquarePlus className="size-4" />
            New chat
          </Link>
        }
      />
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
            Recent
          </span>
        </Link>
      ))}
    </div>
  )
}
