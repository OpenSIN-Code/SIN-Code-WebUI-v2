// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: Code search page — sin_scout (regex/semantic/symbol/usage) and
 * sin_discover (file discovery) with a v0-style search bar and result list.
 */
import { FileCode, Search, SquareTerminal } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { DashedSpinner } from '@/components/icons'
import { cn } from '@/lib/utils'

type SearchHit = {
  file?: string
  path?: string
  line?: number
  snippet?: string
  content?: string
  score?: number
  symbol?: string
  [key: string]: unknown
}

const MODES = [
  { id: 'scout', label: 'Code' },
  { id: 'discover', label: 'Files' },
] as const

const SCOUT_TYPES = [
  { id: 'semantic', label: 'Semantic' },
  { id: 'regex', label: 'Regex' },
  { id: 'symbol', label: 'Symbol' },
  { id: 'usage', label: 'Usage' },
] as const

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SearchView() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('scout')
  const [type, setType] = useState<(typeof SCOUT_TYPES)[number]['id']>('semantic')
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const { data, isLoading } = useSWR(activeKey, fetcher)

  function submit() {
    const q = query.trim()
    if (!q) return
    const params = new URLSearchParams({ q, mode })
    if (mode === 'scout') params.set('type', type)
    setActiveKey(`/api/sin/search?${params.toString()}`)
  }

  const hits: SearchHit[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.results)
      ? data.data.results
      : Array.isArray(data?.data?.hits)
        ? data.data.hits
        : []
  const rawText: string | undefined =
    !hits.length && typeof data?.data?.text === 'string'
      ? data.data.text
      : undefined
  const notInstalled = data && data.ok === false

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Search</h1>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        Semantic code search across the indexed codebase.
      </p>

      {/* Search bar */}
      <div className="mt-8 flex gap-2">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={
              mode === 'scout'
                ? 'Search code — symbols, usages, patterns…'
                : 'Find files by description…'
            }
            className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {isLoading && (
            <DashedSpinner className="size-4 shrink-0 animate-[spin_2s_linear_infinite] text-muted-foreground" />
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!query.trim()}
          className="h-10 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Search
        </button>
      </div>

      {/* Mode + type tabs */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'h-7 rounded-full px-3 text-[12.5px] text-muted-foreground transition-colors',
                mode === m.id && 'bg-accent text-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === 'scout' && (
          <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
            {SCOUT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  'h-7 rounded-full px-3 text-[12.5px] text-muted-foreground transition-colors',
                  type === t.id && 'bg-accent text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {notInstalled ? (
          <div className="rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
            sin-code backend not installed — search unavailable.
          </div>
        ) : !activeKey ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
            Enter a query to search the codebase via the SIN-Code index.
          </div>
        ) : isLoading ? (
          <div className="rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
            Searching…
          </div>
        ) : hits.length === 0 && !rawText ? (
          <div className="rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
            No results.
          </div>
        ) : rawText ? (
          <pre className="max-h-[480px] overflow-auto rounded-xl border border-border bg-card p-4 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {rawText}
          </pre>
        ) : (
          <ul className="flex flex-col gap-2">
            {hits.map((hit, i) => {
              const file = String(hit.file ?? hit.path ?? 'unknown')
              const snippet = hit.snippet ?? hit.content
              return (
                <li
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
                    <FileCode className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-[12px] text-foreground">
                      {file}
                      {hit.line != null && (
                        <span className="text-muted-foreground">:{String(hit.line)}</span>
                      )}
                    </span>
                    {hit.symbol ? (
                      <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {String(hit.symbol)}
                      </span>
                    ) : hit.score != null ? (
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        {Number(hit.score).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  {snippet ? (
                    <pre className="max-h-40 overflow-auto p-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                      {String(snippet)}
                    </pre>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {activeKey && hits.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <SquareTerminal className="size-3" />
          {hits.length} result{hits.length === 1 ? '' : 's'} from sin-code{' '}
          {mode === 'scout' ? `scout (${type})` : 'discover'}
        </p>
      )}
    </div>
  )
}
