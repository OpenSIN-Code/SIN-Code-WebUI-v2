/**
 * Purpose: Workspace sources (web pages, YouTube, docs).
 * POST   /api/workspaces/[id]/sources { kind?, title, url, note? }
 * DELETE /api/workspaces/[id]/sources { sourceId }
 */
// SPDX-License-Identifier: MIT

import { guardRequest } from '@/lib/sin/guard'
import { isValidWorkspaceId } from '@/lib/workspaces'
import { addSource, removeSource } from '@/lib/workspace-content'
import {
  detectSourceKind,
  isHttpUrl,
  SOURCE_KINDS,
  type SourceKind,
} from '@/lib/workspace-content-shared'

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
  const body = (await req.json()) as {
    kind?: string
    title?: string
    url?: string
    note?: string
  }
  if (!body.url || !isHttpUrl(body.url)) {
    return Response.json({ ok: false, error: 'valid url required' }, { status: 400 })
  }
  const kind: SourceKind = SOURCE_KINDS.includes(body.kind as SourceKind)
    ? (body.kind as SourceKind)
    : detectSourceKind(body.url)
  const source = await addSource(id, {
    kind,
    title: body.title?.trim() || new URL(body.url).hostname,
    url: body.url,
    note: body.note,
  })
  return Response.json({ ok: true, data: source })
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
  const { sourceId } = (await req.json()) as { sourceId?: string }
  if (!sourceId) {
    return Response.json({ ok: false, error: 'sourceId required' }, { status: 400 })
  }
  await removeSource(id, sourceId)
  return Response.json({ ok: true })
}
