import type { Metadata } from 'next'
import { WorkspaceDetailView } from '@/components/workspace-detail-view'

export const metadata: Metadata = {
  title: 'Workspace - SIN-Code WebUI v2',
}

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WorkspaceDetailView workspaceId={id} />
}
