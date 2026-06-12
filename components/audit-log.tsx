'use client'

/**
 * Purpose: Audit log card for the Settings page. Table of sin-code
 * executions with actor/action filters, failed-only toggle and CSV export.
 * Root-token sessions only; others see a hint.
 */
import { Download, RefreshCw, ScrollText } from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

type AuditEntry = {
  ts: string
  actor: string
  action: string
  args: string
  ok: boolean
  durationMs: number
  error?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AuditLog() {
  const [failedOnly, setFailedOnly] = useState(false)
  const [actorFilter, setActorFilter] = useState<string>('')

  const key = `/api/audit?limit=200${failedOnly ? '&failed=1' : ''}${
    actorFilter ? `&actor=${encodeURIComponent(actorFilter)}` : ''
  }`
  const { data, isLoading, mutate } = useSWR(key, fetcher, {
    refreshInterval: 30_000,
  })

  const entries: AuditEntry[] = Array.isArray(data?.data) ? data.data : []
  const forbidden = data && data.ok === false

  const actors = useMemo(
    () => Array.from(new Set(entries.map((e) => e.actor))).sort(),
    [entries],
  )

  function exportCsv() {
    const a = document.createElement('a')
    a.href = `${key}&format=csv`
    a.download = 'sin-audit.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
        <ScrollText className="size-4 text-muted-foreground" />
        <span className="text-[13px] font-medium text-foreground">
          Execution Log
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            aria-label="Filter by actor"
            className="h-7 rounded-md border border-border bg-transparent px-2 text-[12px] text-muted-foreground focus:outline-none"
          >
            <option value="">All actors</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFailedOnly((v) => !v)}
            className={cn(
              'h-7 rounded-full border border-border px-3 text-[12px] text-muted-foreground hover:text-foreground',
              failedOnly && 'bg-destructive/10 text-destructive border-destructive/30',
            )}
          >
            Failed only
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            aria-label="Refresh log"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={exportCsv}
            aria-label="Export as CSV"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Download className="size-3.5" />
          </button>
        </div>
      </div>

      {forbidden ? (
        <p className="p-4 text-[13px] text-muted-foreground">
          The audit log requires a session with the root token (SIN_UI_TOKEN).
        </p>
      ) : entries.length === 0 ? (
        <p className="p-4 text-[13px] text-muted-foreground">
          {isLoading ? 'Loading…' : 'No executions logged yet.'}
        </p>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border/60">
                <th className="px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Time
                </th>
                <th className="px-2 py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Actor
                </th>
                <th className="px-2 py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Action
                </th>
                <th className="hidden px-2 py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground md:table-cell">
                  Args
                </th>
                <th className="px-2 py-2 text-right font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  ms
                </th>
                <th className="px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 last:border-0"
                  title={e.error}
                >
                  <td className="whitespace-nowrap px-4 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {e.ts.slice(5, 19).replace('T', ' ')}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {e.actor}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px] text-foreground">
                    {e.action}
                  </td>
                  <td className="hidden max-w-48 truncate px-2 py-1.5 font-mono text-[11px] text-muted-foreground md:table-cell">
                    {e.args}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-[11px] text-muted-foreground">
                    {e.durationMs}
                  </td>
                  <td className="px-4 py-1.5">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 font-mono text-[10px]',
                        e.ok
                          ? 'border-border text-muted-foreground'
                          : 'border-destructive/30 text-destructive',
                      )}
                    >
                      {e.ok ? 'ok' : 'error'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
