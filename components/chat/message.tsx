"use client"

import { useState } from "react"
import { Copy, Check, RotateCcw } from "lucide-react"

interface MessageProps {
  role: "user" | "assistant"
  children: React.ReactNode
  rawText?: string
  isStreaming?: boolean
  onRetry?: () => void
}

export function Message({ role, children, rawText, isStreaming, onRetry }: MessageProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!rawText) return
    await navigator.clipboard.writeText(rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (role === "user") {
    return (
      <div className="animate-fade-up flex justify-end py-2">
        <div className="max-w-[80%] rounded-2xl bg-secondary px-4 py-2.5 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up group py-2">
      <div className={`text-sm leading-relaxed ${isStreaming ? "streaming-cursor" : ""}`}>
        {children}
      </div>
      {!isStreaming && (
        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy message"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
