import type { LucideIcon } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'

export function PageShell({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-6">
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
          {action}
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </main>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-xs text-pretty text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
