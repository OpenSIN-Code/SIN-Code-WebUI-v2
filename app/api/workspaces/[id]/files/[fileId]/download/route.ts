/**
 * Purpose: Issue a short-lived signed URL to download a workspace file
 * from Supabase Storage, then redirect to it.
 * GET /api/workspaces/[id]/files/[fileId]/download
 */
// SPDX-License-Identifier: MIT

import { guardRequest } from '@/lib/sin/guard'
import { isValidWorkspaceId } from '@/lib/workspaces'
import { getFileRecord } from '@/lib/workspace-content'
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  WORKSPACE_BUCKET,
} from '@/lib/supabase'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const guard = await guardRequest(req, 'workspace-files', 60)
  if (guard) return guard
  const { id, fileId } = await params
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  if (!isSupabaseConfigured()) {
    return Response.json(
      { ok: false, error: 'File storage is not connected.' },
      { status: 503 },
    )
  }
  const file = await getFileRecord(id, fileId)
  if (!file) {
    return Response.json({ ok: false, error: 'not found' }, { status: 404 })
  }
  const { data, error } = await getSupabaseAdmin()
    .storage.from(WORKSPACE_BUCKET)
    .createSignedUrl(file.path, 60, { download: file.name })
  if (error || !data) {
    return Response.json(
      { ok: false, error: error?.message ?? 'sign failed' },
      { status: 502 },
    )
  }
  return Response.redirect(data.signedUrl, 302)
}
