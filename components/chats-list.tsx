/**
 * Purpose: /chats list — each row is a link with a hover-revealed
 * favorite toggle (amber star) and a timestamp.
 * Related issues: #23
 */
'use client'

import { Clock, SquarePen, Star } from 'lucide-react'
import Link from 'next/link'
import { useChatStore } from '@/components/chat-store'
import { cn } from '@/lib/utils'

export function ChatsList() {
  const { recentChats, toggleFavorite } = useChatStore()

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
        <div
          key={chat.id}
          className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-border/60 hover:bg-card"
        >
          <Link
            href={`/chat/${chat.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
              <SquarePen className="size-3.5 text-muted-foreground" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-foreground">
                {chat.label}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Drafts
              </span>
            </span>
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {'1:22 PM'}
          </span>
          <button
            type="button"
            aria-label={
              chat.favorite ? 'Remove from favorites' : 'Add to favorites'
            }
            aria-pressed={!!chat.favorite}
            onClick={() => toggleFavorite(chat.id)}
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground',
              !chat.favorite && 'opacity-0 group-hover:opacity-100',
            )}
          >
            <Star
              className={cn(
                'size-3.5',
                chat.favorite && 'fill-amber-400 text-amber-400',
              )}
            />
          </button>
        </div>
      ))}
    </div>
  )
}
