'use client'

/**
 * Purpose: Collapsible tool-call card (v0-style task card) for sin_* MCP
 * tool invocations inside the chat stream. Shows live state, input args,
 * and output once available.
 */
import { Check, ChevronRight, CircleAlert, Wrench } from 'lucide-react'
import { useState } from 'react'
import { DashedSpinner } from '@/components/icons'
import { cn } from '@/lib/utils'

export type ToolPartLike = {
  type: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

function pretty(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function ToolCallCard({ part }: { part: ToolPartLike }) {
  const [open, setOpen] = useState(false)
  const toolName = part.type.replace(/^tool-/, '')
  const running =
    part.state === 'input-streaming' || part.state === 'input-available'
  const failed = part.state === 'output-error'
  const done = part.state === 'output-available'

  const input = pretty(part.input)
  const output = failed ? (part.errorText ?? 'Tool error') : pretty(part.output)

  return (
    <div className="my-1 overflow-hidden rounded-lg border border-border/60 bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/50"
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-90',
          )}
        />
        {running ? (
          <DashedSpinner className="size-3.5 shrink-0 animate-[spin_2s_linear_infinite] text-muted-foreground" />
        ) : failed ? (
          <CircleAlert className="size-3.5 shrink-0 text-destructive" />
        ) : done ? (
          <Check className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <Wrench className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="font-mono text-[12px] text-foreground">{toolName}</span>
        <span
          className={cn(
            'ml-auto rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground',
            failed && 'border-destructive/30 text-destructive',
          )}
        >
          {failed ? 'error' : running ? 'running' : 'done'}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60">
          {input && (
            <div className="px-3 py-2">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Input
              </div>
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {input}
              </pre>
            </div>
          )}
          {(done || failed) && output && (
            <div className="px-3 pb-2">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {failed ? 'Error' : 'Output'}
              </div>
              <pre
                className={cn(
                  'max-h-64 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed',
                  failed ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
