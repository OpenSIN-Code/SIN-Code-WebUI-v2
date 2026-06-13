// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: File viewer — sin_read with an outline sidebar (symbols) and a
 * line-numbered code pane. Clicking an outline entry scrolls to its line.
 */
import { FileCode, ListTree } from 'lucide-react'
import { useRef, useState } from 'react'
import useSWR from 'swr'
import { DashedSpinner } from '@/components/icons'
import { cn } from '@/lib/utils'

type OutlineEntry = {
  name?: string
  symbol?: string
  kind?: string
  line?: number
  [key: string]: unknown
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FileViewer() {
  const [path, setPath] = useState('')
  const [activePath, setActivePath] = useState<string | null>(null)
  const codeRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useSWR(
    activePath ? `/api/sin/file?path=${encodeURIComponent(activePath)}` : null,
    fetcher,
  )

  const notInstalled = data && data.ok === false
  const content: string =
    typeof data?.data?.content === 'string'
      ? data.data.content
      : typeof data?.data?.text === 'string'
        ? data.data.text
        : ''
  const outline: OutlineEntry[] = Array.isArray(data?.data?.outline)
    ? data.data.outline
    : Array.isArray(data?.data?.symbols)
      ? data.data.symbols
      : []
  const lines = content ? content.split('\n') : []

  function jumpToLine(line: number) {
    const el = codeRef.current?.querySelector(`[data-line="${line}"]`)
    el?.scrollIntoView({ block: 'center' })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Path bar */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
            <FileCode className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && path.trim()) setActivePath(path.trim())
              }}
              placeholder="Path to file, e.g. internal/orchestrator/runner.go"
              className="h-full min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {isLoading && (
              <DashedSpinner className="size-4 shrink-0 animate-[spin_2s_linear_infinite] text-muted-foreground" />
            )}
          </div>
          <button
            type="button"
            onClick={() => path.trim() && setActivePath(path.trim())}
            disabled={!path.trim()}
            className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Open
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Outline */}
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-border px-2 py-3 md:block">
          <div className="flex items-center gap-1.5 px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            <ListTree className="size-3" />
            Outline
          </div>
          {outline.length === 0 ? (
            <p className="px-2 text-[12px] text-muted-foreground">
              {activePath ? 'No symbols.' : 'Open a file to see its outline.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-px">
              {outline.map((entry, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => entry.line != null && jumpToLine(Number(entry.line))}
                    className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {entry.kind ? (
                      <span className="font-mono text-[9px] uppercase text-muted-foreground/60">
                        {String(entry.kind).slice(0, 3)}
                      </span>
                    ) : null}
                    <span className="truncate font-mono">
                      {String(entry.name ?? entry.symbol ?? '?')}
                    </span>
                    {entry.line != null && (
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                        {String(entry.line)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Code pane */}
        <div ref={codeRef} className="min-w-0 flex-1 overflow-auto">
          {notInstalled ? (
            <p className="p-6 text-[13px] text-muted-foreground">
              sin-code backend not installed — file viewer unavailable.
            </p>
          ) : !activePath ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[13px] text-muted-foreground">
                Enter a path to read a file via sin_read.
              </p>
            </div>
          ) : isLoading ? (
            <p className="p-6 text-[13px] text-muted-foreground">Loading…</p>
          ) : lines.length === 0 ? (
            <p className="p-6 text-[13px] text-muted-foreground">
              Empty file or unsupported response shape.
            </p>
          ) : (
            <pre className="p-4 font-mono text-[12.5px] leading-[1.6]">
              {lines.map((line, i) => (
                <div
                  key={i}
                  data-line={i + 1}
                  className="flex"
                >
                  <span
                    className={cn(
                      'w-12 shrink-0 select-none pr-4 text-right text-muted-foreground/40',
                    )}
                  >
                    {i + 1}
                  </span>
                  <code className="min-w-0 flex-1 whitespace-pre text-foreground">
                    {line || ' '}
                  </code>
                </div>
              ))}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
