// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: Settings page — backend agent config (sin agent show/set) as an
 * editable key/value form, backend status, and the model tier mapping.
 */
import { Check, Pencil, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { Starburst } from '@/components/icons'
import { TokenManager } from '@/components/token-manager'
import { UserManager } from '@/components/user-manager'
import { AuditLog } from '@/components/audit-log'
import { SIN_MODELS } from '@/lib/sin/models'
import { useSinStatus } from '@/lib/sin/use-sin'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function flattenConfig(obj: unknown, prefix = ''): Array<[string, string]> {
  if (obj == null || typeof obj !== 'object') return []
  const entries: Array<[string, string]> = []
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenConfig(value, path))
    } else {
      entries.push([path, Array.isArray(value) ? value.join(', ') : String(value)])
    }
  }
  return entries
}

function ConfigRow({
  configKey,
  value,
  onSave,
}: {
  configKey: string
  value: string
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await onSave(configKey, draft)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-48 shrink-0 truncate font-mono text-[12px] text-muted-foreground">
        {configKey}
      </span>
      {editing ? (
        <>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            className="h-7 min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 font-mono text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy}
            aria-label="Save value"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value)
              setEditing(false)
            }}
            aria-label="Cancel edit"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground">
            {value}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${configKey}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        </>
      )}
    </li>
  )
}

export function SettingsView() {
  const { data: status } = useSinStatus()
  const { data, isLoading, mutate } = useSWR('/api/sin/config', fetcher)

  const installed = status?.installed === true
  const notInstalled = data && data.ok === false
  const config = flattenConfig(data?.data)

  async function saveValue(key: string, value: string) {
    await fetch('/api/sin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    mutate()
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Backend agent configuration and model routing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Backend status */}
      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Backend
      </h2>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            installed ? 'bg-emerald-500' : 'bg-amber-500',
          )}
          aria-hidden
        />
        <span className="text-[13.5px] text-foreground">
          {installed ? `sin-code ${status.version}` : 'sin-code not installed'}
        </span>
        {installed && status.capabilities ? (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {status.capabilities.subcommandCount} subcommands ·{' '}
            {status.capabilities.mcpTools?.length} MCP tools
          </span>
        ) : null}
      </div>

      {/* Model routing */}
      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Model Routing
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {SIN_MODELS.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
              <Starburst className="size-4 shrink-0 text-brand" />
              <span className="w-32 shrink-0 text-[13px] text-foreground">
                {m.label}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-muted-foreground">
                {m.gateway}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                env: SIN_MODEL_{m.id.replace('sin-code-', '').toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-border/60 px-4 py-2.5 text-[12px] text-muted-foreground">
          Model tiers are mapped via environment variables and require a restart
          to change.
        </p>
      </div>

      {/* Agent config */}
      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Agent Configuration
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-card">
        {notInstalled ? (
          <p className="p-4 text-[13px] text-muted-foreground">
            sin-code backend not installed — configuration unavailable.
          </p>
        ) : config.length === 0 ? (
          <p className="p-4 text-[13px] text-muted-foreground">
            {isLoading ? 'Loading…' : 'No configuration reported.'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {config.map(([key, value]) => (
              <ConfigRow key={key} configKey={key} value={value} onSave={saveValue} />
            ))}
          </ul>
        )}
      </div>

      {/* Token management */}
      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        API Tokens
      </h2>
      <div className="mt-3">
        <TokenManager />
      </div>

      {/* Users */}
      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Users
      </h2>
      <div className="mt-3">
        <UserManager />
      </div>

      {/* Execution audit log */}
      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Audit Log
      </h2>
      <div className="mt-3">
        <AuditLog />
      </div>
    </div>
  )
}
