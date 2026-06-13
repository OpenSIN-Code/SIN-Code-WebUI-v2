/**
 * Purpose: Workspace project links (associate existing projects).
 * Projects live client-side (localStorage), so the client passes
 * projectId + name when linking.
 * POST   /api/workspaces/[id]/projects { projectId, name }
 * DELETE /api/workspaces/[id]/projects { linkId }
 */
// SPDX-License-Identifier: MIT

import { guardRequest } from '@/lib/sin/guard'
import { isValidWorkspaceId } from '@/lib/workspaces'
import { addProjectLink, removeProjectLink } from '@/lib/workspace-content'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardRequest(req, 'workspace-content', 60)
  if (guard) return guard
  const { id } = await params
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const body = (await req.json()) as { projectId?: string; name?: string }
  if (!body.projectId || !body.name) {
    return Response.json(
      { ok: false, error: 'projectId and name required' },
      { status: 400 },
    )
  }
  const link = await addProjectLink(id, {
    projectId: body.projectId,
    name: body.name,
  })
  return Response.json({ ok: true, data: link })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardRequest(req, 'workspace-content', 60)
  if (guard) return guard
  const { id } = await params
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const { linkId } = (await req.json()) as { linkId?: string }
  if (!linkId) {
    return Response.json({ ok: false, error: 'linkId required' }, { status: 400 })
  }
  await removeProjectLink(id, linkId)
  return Response.json({ ok: true })
}
