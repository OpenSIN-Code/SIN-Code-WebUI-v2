/**
 * Purpose: Share-menu popover for chat headers (visibility + copy link).
 * Falls back to window.prompt for the clipboard write if blocked (sandboxed iframes).
 * Related issues: #16
 */
// SPDX-License-Identifier: MIT

'use client'

import { Check, Globe, Link2, Lock, Share2, Users } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Visibility = 'private' | 'team' | 'public'

const options: {
  value: Visibility
  label: string
  description: string
  icon: typeof Lock
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can view this chat',
    icon: Lock,
  },
  {
    value: 'team',
    label: 'Team',
    description: 'Members of your team can view',
    icon: Users,
  },
  {
    value: 'public',
    label: 'Anyone with the link',
    description: 'Anyone with the link can view',
    icon: Globe,
  },
]

export function ShareMenu({ chatId }: { chatId?: string }) {
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url = chatId
      ? `${window.location.origin}/chat/${chatId}`
      : window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard API blocked (sandboxed iframe, http in production, …)
      window.prompt('Copy the link:', url)
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Share"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          />
        }
      >
        <Share2 className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Who can view this chat
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setVisibility(option.value)}
            >
              <option.icon className="size-4" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px]">{option.label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
              {visibility === option.value && (
                <Check className="size-4 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyLink}>
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? 'Link copied' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
