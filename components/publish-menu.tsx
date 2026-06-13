/**
 * Purpose: Publish / Deploy popover for the chat header.
 * Tries Vercel first (if VERCEL_TOKEN is set), otherwise falls back
 * to GitHub Actions workflow_dispatch.
 * Cycles through idle → deploying → deployed or error. Idempotent.
 * Related issues: #19, #39, #55
 */
// SPDX-License-Identifier: MIT

'use client'

import { AlertCircle, Check, ExternalLink, Globe, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DeployState = 'idle' | 'deploying' | 'deployed' | 'error'

export function PublishMenu({ chatId }: { chatId?: string }) {
  const [state, setState] = useState<DeployState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)

  const fallbackDomain = `${chatId ?? 'preview'}.vercel.app`
  const domain = deployUrl ?? fallbackDomain

  const handlePublish = async () => {
    if (state === 'deploying') return
    setState('deploying')
    setErrorMessage(null)

    try {
      // Try Vercel first (#55)
      let res = await fetch('/api/publish/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: chatId ?? 'sin-app',
          target: 'preview',
        }),
      })

      let data = await res.json()

      // Fallback to GitHub Actions if Vercel is not configured
      if (res.status === 503 && data.message?.includes('not configured')) {
        res = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            visibility: 'private',
          }),
        })
        data = await res.json()
      }

      if (!res.ok) {
        setState('error')
        setErrorMessage(data.message ?? `Deploy failed (${res.status})`)
        return
      }

      if (data.deployment?.url) {
        setDeployUrl(data.deployment.url)
      }
      setState('deployed')
    } catch (err) {
      setState('error')
      const msg = err instanceof Error ? err.message : 'Network error'
      setErrorMessage(msg)
    }
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
              Deploy the latest version of this chat to a public URL via
              Vercel or GitHub Actions.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
              {domain}
            </span>
            {state === 'deployed' && (
              <a
                href={domain.startsWith('http') ? domain : `https://${domain}`}
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

          {state === 'error' && (
            <div className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              <span className="break-words">{errorMessage}</span>
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
            {state === 'error' && 'Retry'}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
