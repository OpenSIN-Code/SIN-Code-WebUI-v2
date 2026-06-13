// SPDX-License-Identifier: MIT

'use client'

import {
  BarChart3,
  ChevronDown,
  FileCode,
  FileKey,
  FileText,
  GitBranch,
  Globe,
  LayoutTemplate,
  MoreHorizontal,
  Puzzle,
  Share2,
  Star,
} from 'lucide-react'
import { DashedSpinner, VercelTriangle } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ChatHeader({ title, chatId }: { title: string; chatId?: string }) {
  function exportChat(format: 'md' | 'json') {
    if (!chatId) return
    const a = document.createElement('a')
    a.href = `/api/chats/${chatId}/export?format=${format}`
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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

        {/* Slash separator */}
        <span className="select-none text-[14px] text-border/80">/</span>

        {/* Star */}
        <button
          type="button"
          aria-label="Add to favorites"
          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Star className="size-3.5" />
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
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {chatId && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => exportChat('md')}>
                    <FileText className="size-4" />Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportChat('json')}>
                    <FileCode className="size-4" />Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Transfer&hellip;</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right actions */}
      {/* "..." project options */}
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
      <button
        type="button"
        aria-label="Share"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Share2 className="size-4" />
      </button>
    </header>
  )
}
