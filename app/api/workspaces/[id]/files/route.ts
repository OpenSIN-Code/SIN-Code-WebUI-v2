/**
 * Purpose: Workspace file uploads, backed by Supabase Storage (self-hosted).
 * POST   /api/workspaces/[id]/files   (multipart/form-data, field "file")
 * DELETE /api/workspaces/[id]/files   { fileId }
 *
 * Bytes live in the Supabase Storage bucket; metadata lives in the
 * workspace-content store. If Supabase is not configured, POST returns 503
 * so the UI can show a clear "storage not connected" state.
 */
import { guardRequest } from '@/lib/sin/guard'
import { isValidWorkspaceId } from '@/lib/workspaces'
import {
  addFileRecord,
  getWorkspaceContent,
  removeFileRecord,
} from '@/lib/workspace-content'
import {
  ensureWorkspaceBucket,
  getSupabaseAdmin,
  isSupabaseConfigured,
  WORKSPACE_BUCKET,
} from '@/lib/supabase'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardRequest(req, 'workspace-files', 30)
  if (guard) return guard
  const { id } = await params
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  if (!isSupabaseConfigured()) {
    return Response.json(
      { ok: false, error: 'File storage is not connected.' },
      { status: 503 },
    )
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: 'file required' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: 'file exceeds 25 MB limit' },
      { status: 413 },
    )
  }

  try {
    await ensureWorkspaceBucket()
    const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 200)
    const objectPath = `${id}/${Date.now()}-${safeName}`
    const bytes = new Uint8Array(await file.arrayBuffer())
    const admin = getSupabaseAdmin()
    const { error } = await admin.storage
      .from(WORKSPACE_BUCKET)
      .upload(objectPath, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 502 })
    }
    const record = await addFileRecord(id, {
      name: file.name,
      path: objectPath,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    })
    return Response.json({ ok: true, data: record })
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardRequest(req, 'workspace-files', 30)
  if (guard) return guard
  const { id } = await params
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const { fileId } = (await req.json()) as { fileId?: string }
  if (!fileId) {
    return Response.json({ ok: false, error: 'fileId required' }, { status: 400 })
  }
  const content = await getWorkspaceContent(id)
  const file = content.files.find((f) => f.id === fileId)
  if (file && isSupabaseConfigured()) {
    try {
      await getSupabaseAdmin().storage.from(WORKSPACE_BUCKET).remove([file.path])
    } catch {
      // Best effort — still remove the metadata record below.
    }
  }
  await removeFileRecord(id, fileId)
  return Response.json({ ok: true })
}
