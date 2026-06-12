'use client'

/**
 * Purpose: Architecture overview card — toggles between the sin_map
 * module graph and sin_adw debt report. Embeddable on Projects/Home.
 */
import { Network, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const VIEWS = [
  { id: 'map', label: 'Architecture', Icon: Network },
  { id: 'adw', label: 'Debt', Icon: ShieldAlert },
] as const

export function ArchitectureCard() {
  const [view, setView] = useState<(typeof VIEWS)[number]['id']>('map')
  const { data, isLoading } = useSWR(`/api/sin/map?view=${view}`, fetcher)

  const notInstalled = data && data.ok === false
  const body =
    typeof data?.data?.text === 'string'
      ? data.data.text
      : data?.data != null
        ? JSON.stringify(data.data, null, 2)
        : ''

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <span className="text-[13px] font-medium text-foreground">
          Codebase Overview
        </span>
        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] text-muted-foreground transition-colors',
                view === id && 'bg-accent text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {notInstalled ? (
          <p className="text-[13px] text-muted-foreground">
            sin-code backend not installed.
          </p>
        ) : isLoading ? (
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        ) : body ? (
          <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {body}
          </pre>
        ) : (
          <p className="text-[13px] text-muted-foreground">No data reported.</p>
        )}
      </div>
    </div>
  )
}
