/**
 * Purpose: Fenced code block with copy button and language label.
 * Docs: code-block.doc.md
 */
// SPDX-License-Identifier: MIT

"use client"

import { useState } from "react"
import { Copy, Check, FileCode2 } from "lucide-react"

export function CodeBlock({
  language,
  filename,
  code,
}: {
  language?: string
  filename?: string
  code: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-up my-3 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/50 px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <FileCode2 className="size-3.5" strokeWidth={1.75} />
          {filename ?? language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto bg-card p-3">
        <code className="font-mono text-[13px] leading-relaxed">{code}</code>
      </pre>
    </div>
  )
}
