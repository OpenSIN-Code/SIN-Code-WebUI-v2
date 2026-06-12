'use client'

/**
 * Purpose: Persistent sin-code backend badge for the sidebar footer.
 * Green dot + version when installed, amber dot when missing.
 */
import { useSinStatus } from '@/lib/sin/use-sin'
import { cn } from '@/lib/utils'

export function SinVersionBadge({ collapsed }: { collapsed?: boolean }) {
  const { data } = useSinStatus()
  const installed = data?.installed === true

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5',
        collapsed && 'justify-center px-0',
      )}
      title={
        installed
          ? `sin-code ${data.version}`
          : 'sin-code backend not installed'
      }
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          installed ? 'bg-emerald-500' : 'bg-amber-500',
        )}
        aria-hidden
      />
      {!collapsed && (
        <span className="truncate font-mono text-[11px] text-muted-foreground">
          {installed ? `sin-code ${data.version}` : 'backend offline'}
        </span>
      )}
      <span className="sr-only">
        {installed ? 'SIN-Code backend connected' : 'SIN-Code backend not installed'}
      </span>
    </div>
  )
}
