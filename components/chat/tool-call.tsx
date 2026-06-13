/**
 * Purpose: Collapsible tool-call badge for assistant messages.
 * Docs: tool-call.doc.md
 */
// SPDX-License-Identifier: MIT

"use client"

import { useState } from "react"
import {
  ChevronRight,
  Check,
  Loader2,
  CircleX,
  Terminal,
  FileText,
  Search,
  Globe,
  Wrench,
} from "lucide-react"

const TOOL_ICONS: Record<string, typeof Wrench> = {
  bash: Terminal,
  read: FileText,
  write: FileText,
  edit: FileText,
  grep: Search,
  glob: Search,
  websearch: Globe,
  webfetch: Globe,
}

export interface ToolCallProps {
  toolName: string
  label: string
  state: "running" | "done" | "error"
  detail?: string
}

export function ToolCall({ toolName, label, state, detail }: ToolCallProps) {
  const [open, setOpen] = useState(false)
  const Icon = TOOL_ICONS[toolName.toLowerCase()] ?? Wrench

  return (
    <div className="animate-fade-up my-1">
      <button
        type="button"
        onClick={() => detail && setOpen((v) => !v)}
        aria-expanded={open}
        className={`group flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors ${
          detail ? "hover:bg-accent/60" : "cursor-default"
        }`}
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          {state === "running" ? (
            <Loader2 className="size-3.5 animate-spin-slow text-muted-foreground" />
          ) : state === "error" ? (
            <CircleX className="size-3.5 text-destructive" />
          ) : (
            <Check className="size-3.5 text-muted-foreground" />
          )}
        </span>
        <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <span
          className={`flex-1 truncate text-[13px] ${
            state === "running"
              ? "animate-shimmer-text font-medium"
              : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        {detail && (
          <ChevronRight
            className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        )}
      </button>
      {open && detail && (
        <div className="animate-accordion-down mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-2">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
            {detail}
          </pre>
        </div>
      )}
    </div>
  )
}
