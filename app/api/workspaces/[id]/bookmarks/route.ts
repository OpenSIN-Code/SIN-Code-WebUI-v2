/**
 * Purpose: Workspace bookmarks (URL widgets).
 * POST   /api/workspaces/[id]/bookmarks { title, url, description? }
 * DELETE /api/workspaces/[id]/bookmarks { bookmarkId }
 */
// SPDX-License-Identifier: MIT

import { guardRequest } from '@/lib/sin/guard'
import { isValidWorkspaceId } from '@/lib/workspaces'
import { addBookmark, removeBookmark } from '@/lib/workspace-content'
import { isHttpUrl } from '@/lib/workspace-content-shared'

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
    title?: string
    url?: string
    description?: string
  }
  if (!body.url || !isHttpUrl(body.url)) {
    return Response.json({ ok: false, error: 'valid url required' }, { status: 400 })
  }
  const bookmark = await addBookmark(id, {
    title: body.title?.trim() || new URL(body.url).hostname,
    url: body.url,
    description: body.description,
  })
  return Response.json({ ok: true, data: bookmark })
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
  const { bookmarkId } = (await req.json()) as { bookmarkId?: string }
  if (!bookmarkId) {
    return Response.json({ ok: false, error: 'bookmarkId required' }, { status: 400 })
  }
  await removeBookmark(id, bookmarkId)
  return Response.json({ ok: true })
}
