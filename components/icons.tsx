'use client'

import { cn } from '@/lib/utils'

/** v0 starburst / model-picker icon */
export function Starburst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn('size-4', className)}>
      <path d="M12 1.5c.4 0 .74.27.85.65l1.6 5.5a2 2 0 0 0 1.36 1.36l5.5 1.6a.89.89 0 0 1 0 1.7l-5.5 1.6a2 2 0 0 0-1.36 1.36l-1.6 5.5a.89.89 0 0 1-1.7 0l-1.6-5.5a2 2 0 0 0-1.36-1.36l-5.5-1.6a.89.89 0 0 1 0-1.7l5.5-1.6a2 2 0 0 0 1.36-1.36l1.6-5.5A.89.89 0 0 1 12 1.5Z" />
      <path d="M19.5 1.25c.17 0 .31.11.36.27l.5 1.72c.09.3.32.53.62.62l1.72.5a.375.375 0 0 1 0 .72l-1.72.5c-.3.09-.53.32-.62.62l-.5 1.72a.375.375 0 0 1-.72 0l-.5-1.72a.94.94 0 0 0-.62-.62l-1.72-.5a.375.375 0 0 1 0-.72l1.72-.5c.3-.09.53-.32.62-.62l.5-1.72a.375.375 0 0 1 .36-.27Z" />
    </svg>
  )
}

/** Dashed-circle spinner used for in-progress chats and Drafts breadcrumb */
export function DashedSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={cn('size-4', className)}>
      <circle cx="12" cy="12" r="9" strokeDasharray="4 4" />
    </svg>
  )
}

/** Sidebar nav icons — pixel-matched to v0 */
export function NavIconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn('size-4', className)}>
      <circle cx="6.5" cy="6.5" r="4" />
      <path d="M11 11 14 14" />
    </svg>
  )
}

export function NavIconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn('size-4', className)}>
      <path d="M1.5 7 8 1.5 14.5 7V14a.5.5 0 0 1-.5.5H10v-4H6v4H2a.5.5 0 0 1-.5-.5Z" />
    </svg>
  )
}

export function NavIconProjects({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn('size-4', className)}>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  )
}

export function NavIconChats({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn('size-4', className)}>
      <path d="M14 9.5a1.5 1.5 0 0 1-1.5 1.5H4.5L2 13.5V3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5Z" />
    </svg>
  )
}

export function NavIconDesignSystems({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn('size-4', className)}>
      <circle cx="8" cy="5" r="2.5" />
      <circle cx="3.5" cy="11.5" r="2" />
      <circle cx="12.5" cy="11.5" r="2" />
      <path d="M8 7.5v1m0 0-4 2.5m4-2.5 4 2.5" />
    </svg>
  )
}

export function NavIconTemplates({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn('size-4', className)}>
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
      <path d="M1.5 5.5h13M5.5 5.5v9" />
    </svg>
  )
}

/** Vercel triangle — used in the header "..." menu */
export function VercelTriangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn('size-4', className)}>
      <path d="M12 2 22 20H2Z" />
    </svg>
  )
}
