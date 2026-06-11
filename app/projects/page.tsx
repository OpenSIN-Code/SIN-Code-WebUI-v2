import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { NewProjectButton, ProjectsList } from '@/components/projects-list'

export const metadata: Metadata = {
  title: 'Projects - SIN-Code WebUI v2',
}

export default function ProjectsPage() {
  return (
    <PageShell title="Projects" action={<NewProjectButton />}>
      <ProjectsList />
    </PageShell>
  )
}
