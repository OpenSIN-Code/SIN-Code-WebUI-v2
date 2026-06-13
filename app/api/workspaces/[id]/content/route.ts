/**
 * Purpose: GET workspace content (bookmarks, sources, files, projects).
 * GET /api/workspaces/[id]/content
 */
// SPDX-License-Identifier: MIT

import { guardRequest } from '@/lib/sin/guard'
import { isValidWorkspaceId } from '@/lib/workspaces'
import { getWorkspaceContent } from '@/lib/workspace-content'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardRequest(req, 'workspace-content', 120)
  if (guard) return guard
  const { id } = await params
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const content = await getWorkspaceContent(id)
  return Response.json({
    ok: true,
    data: content,
    storageReady: isSupabaseConfigured(),
  })
}
