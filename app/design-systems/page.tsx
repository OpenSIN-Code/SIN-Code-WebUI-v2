import { Plus, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { EmptyState, PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Design Systems - SIN-Code WebUI v2',
}

export default function DesignSystemsPage() {
  return (
    <PageShell
      title="Design Systems"
      action={
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Design System
        </button>
      }
    >
      <EmptyState
        icon={Users}
        title="No design systems yet"
        description="Define colors, typography and components once, and reuse them across every generation."
      />
    </PageShell>
  )
}
