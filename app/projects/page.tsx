import { LayoutGrid, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { EmptyState, PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Projects - SIN-Code WebUI v2',
}

export default function ProjectsPage() {
  return (
    <PageShell
      title="Projects"
      action={
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Project
        </button>
      }
    >
      <EmptyState
        icon={LayoutGrid}
        title="No projects yet"
        description="Projects keep your chats, integrations and deployments organized in one place."
      />
    </PageShell>
  )
}
