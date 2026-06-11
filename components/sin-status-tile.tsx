/**
 * Purpose: Status tile for the SIN-Code backend (visible on the homepage).
 * Docs: fetches /api/sin/status; shows install button when binary missing.
 * Related issues: #5
 */

'use client'

import { Check, Copy, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Status =
  | { installed: false; error: string; installCmd: string }
  | {
      installed: true
      version: string
      capabilities: { hasMCP: boolean; subcommandCount: number; mcpTools: string[] }
    }

const DISMISS_KEY = 'sin-status-tile-dismissed'

export function SinStatusTile() {
  const [status, setStatus] = useState<Status | null>(null)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    fetch('/api/sin/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() =>
        setStatus({
          installed: false,
          error: 'fetch failed',
          installCmd: 'go install github.com/OpenSIN-Code/SIN-Code-Bundle/cmd/sin-code@latest',
        }),
      )
  }, [])

  if (dismissed || !status) return null

  async function copyInstall() {
    if (!status || status.installed) return
    await navigator.clipboard.writeText(status.installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (status.installed) {
    return (
      <div className="mb-4 flex w-full max-w-[672px] items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-300">
        <Check className="size-3.5 shrink-0" />
        <span className="font-mono">
          sin-code v{status.version} · {status.capabilities.subcommandCount} subcommands ·{' '}
          {status.capabilities.mcpTools.length} MCP tools
        </span>
        <a
          href="https://github.com/OpenSIN-Code/SIN-Code-Bundle"
          target="_blank"
          rel="noreferrer"
          className="ml-auto underline-offset-2 hover:underline"
        >
          docs
        </a>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="text-emerald-700/60 hover:text-emerald-700 dark:text-emerald-300/60"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 flex w-full max-w-[672px] items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
      <TriangleAlert className="size-3.5 shrink-0" />
      <span className="font-mono">sin-code backend not installed — tools disabled</span>
      <button
        type="button"
        onClick={copyInstall}
        className="ml-auto flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] hover:bg-amber-500/20"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? 'copied' : 'copy install cmd'}
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="text-amber-700/60 hover:text-amber-700"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
