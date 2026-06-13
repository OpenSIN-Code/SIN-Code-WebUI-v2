/**
 * Purpose: Loading indicators for the submitted state.
 * Docs: thinking-indicator.doc.md
 */
// SPDX-License-Identifier: MIT

"use client"

const PHRASES = [
  "Thinking",
  "Reading files",
  "Searching the codebase",
  "Generating",
  "Working on it",
]

export function ThinkingIndicator({ label }: { label?: string }) {
  return (
    <div className="animate-fade-up flex items-center gap-2 px-1 py-2">
      <span className="animate-shimmer-text text-[13px] font-medium">
        {label ?? PHRASES[0]}…
      </span>
    </div>
  )
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-pulse-dot size-1.5 rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
