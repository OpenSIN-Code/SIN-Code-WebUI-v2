'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Purpose: Reusable v0-style empty state — centered icon tile, title,
 * description, and an optional call-to-action. Replaces the flat dashed
 * boxes used across Chats, Memory, and other list views.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center ${className ?? ''}`}
    >
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-medium text-foreground text-balance">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
