/**
 * Purpose: Publish / Deploy popover (simulated) for the chat header.
 * Cycles through idle → deploying → deployed; idempotent.
 * Related issues: #19
 */
'use client'

import { Check, ExternalLink, Globe, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DeployState = 'idle' | 'deploying' | 'deployed'

export function PublishMenu({ chatId }: { chatId?: string }) {
  const [state, setState] = useState<DeployState>('idle')

  const domain = `${chatId ?? 'preview'}.vercel.app`

  const handlePublish = () => {
    if (state === 'deploying') return
    setState('deploying')
    window.setTimeout(() => setState('deployed'), 2000)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="ml-0.5 flex h-7 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          />
        }
      >
        Publish
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              Publish your app
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Deploy the latest version of this chat to a public URL on Vercel.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
              {domain}
            </span>
            {state === 'deployed' && (
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open deployment"
                className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>

          {state === 'deployed' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3.5 text-emerald-600" />
              Deployed just now
            </div>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={state === 'deploying'}
            className="flex h-8 items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {state === 'deploying' && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            {state === 'idle' && 'Publish'}
            {state === 'deploying' && 'Publishing…'}
            {state === 'deployed' && 'Update'}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
