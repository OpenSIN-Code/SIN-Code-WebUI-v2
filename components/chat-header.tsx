/**
 * Purpose: Chat page header — breadcrumb, title dropdown, project menu, share.
 * Wired to chat-store (rename, delete, favorite) and ShareMenu (visibility + link).
 * Related issues: #15, #16
 */
'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart3,
  ChevronDown,
  FileKey,
  GitBranch,
  Globe,
  LayoutTemplate,
  MoreHorizontal,
  Puzzle,
  Star,
} from 'lucide-react'
import { DashedSpinner, VercelTriangle } from '@/components/icons'
import { useChatStore } from '@/components/chat-store'
import { ShareMenu } from '@/components/share-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ChatHeader({
  title,
  chatId,
}: {
  title: string
  chatId?: string
}) {
  const router = useRouter()
  const { removeChat, renameChat, toggleFavorite, recentChats } = useChatStore()
  const isFavorite = chatId
    ? recentChats.find((c) => c.id === chatId)?.favorite
    : false

  function handleDelete() {
    if (!chatId) return
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    removeChat(chatId)
    router.push('/chats')
  }

  function handleRename() {
    if (!chatId) return
    const next = window.prompt('Rename chat', title)
    const trimmed = next?.trim()
    if (trimmed && trimmed !== title) renameChat(chatId, trimmed)
  }

  function handleToggleFavorite() {
    if (!chatId) return
    toggleFavorite(chatId)
  }

  return (
    <header className="flex h-11 shrink-0 items-center gap-1.5 border-b border-border/60 px-3">
      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-0.5 text-[13px]">
        {/* Drafts */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <DashedSpinner className="size-3" />
          <span>Drafts</span>
        </button>

        <span className="select-none text-[14px] text-border/80">/</span>

        {/* Star */}
        <button
          type="button"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
          onClick={handleToggleFavorite}
          disabled={!chatId}
          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 data-[favorite=true]:text-amber-500"
          data-favorite={isFavorite ? 'true' : 'false'}
        >
          <Star
            className="size-3.5"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>

        {/* Title dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[13px] font-medium text-foreground hover:bg-accent"
              />
            }
          >
            {title}
            <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleRename} disabled={!chatId}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggleFavorite}
                disabled={!chatId}
              >
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>Settings</DropdownMenuItem>
              <DropdownMenuItem disabled>Transfer&hellip;</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={!chatId}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Project options"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <VercelTriangle className="size-4" />Vercel Project
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Puzzle className="size-4" />Integrations
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileKey className="size-4" />Environment Variables
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GitBranch className="size-4" />GitHub
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LayoutTemplate className="size-4" />Template
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Globe className="size-4" />Domains
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BarChart3 className="size-4" />Analytics
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share */}
      <ShareMenu chatId={chatId} />
    </header>
  )
}
