/**
 * Purpose: Status tile for the SIN-Code backend (visible on the homepage).
 * Docs: fetches /api/sin/status; shows install command when binary missing.
 * Related issues: #5
 */

'use client'

import useSWR from 'swr'
import { Check, Copy, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { SIN_CODE_REPO_URL } from '@/lib/sin/tools'

type Status =
  | { installed: false; error: string; installCmd: string }
  | {
      installed: true
      version: string
      capabilities: { hasMCP: boolean; subcommandCount: number; mcpTools: string[] }
    }

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<Status>)

export function SinStatusTile() {
  const { data: status } = useSWR<Status>('/api/sin/status', fetcher, {
    revalidateOnFocus: false,
  })
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !status) return null

  async function copyInstall() {
    if (!status || status.installed) return
    try {
      await navigator.clipboard.writeText(status.installCmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API can be blocked (e.g. sandboxed iframes) —
      // fall back to showing the command for manual copying.
      window.prompt('Copy the install command:', status.installCmd)
    }
  }

  if (status.installed) {
    return (
      <div className="mb-4 flex w-full max-w-[672px] items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-300">
        <Check className="size-3.5 shrink-0" aria-hidden />
        <span className="font-mono">
          sin-code {status.version} · {status.capabilities.subcommandCount} subcommands ·{' '}
          {status.capabilities.mcpTools.length} MCP tools
        </span>
        <a
          href={SIN_CODE_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto underline-offset-2 hover:underline"
        >
          docs
        </a>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="text-emerald-700/60 hover:text-emerald-700 dark:text-emerald-300/60 dark:hover:text-emerald-300"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 flex w-full max-w-[672px] items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
      <span className="font-mono">sin-code backend not installed — tools disabled</span>
      <button
        type="button"
        onClick={copyInstall}
        className="ml-auto flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] hover:bg-amber-500/20"
      >
        {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
        {copied ? 'copied' : 'copy install cmd'}
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="text-amber-700/60 hover:text-amber-700 dark:text-amber-300/60 dark:hover:text-amber-300"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
