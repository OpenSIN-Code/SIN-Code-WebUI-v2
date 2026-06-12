/**
 * Purpose: Chat list API.
 * GET  /api/chats                      — list chat metadata
 * POST /api/chats { id, label, favorite? } — create/update a chat entry
 */
import { isValidChatId, listChats, upsertChatMeta, deleteChat, loadMessages, saveMessages } from '@/lib/storage'
import { guardRequest } from '@/lib/sin/run'

export async function GET(req: Request) {
  const guard = await guardRequest(req, 'chats', 60)
  if (guard) return guard
  return Response.json({ ok: true, data: await listChats() })
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, 'chats', 30)
  if (guard) return guard

  const body: { id?: string; label?: string; favorite?: boolean; workspace_id?: string } =
    await req.json()
  if (!body.id || !isValidChatId(body.id) || !body.label?.trim()) {
    return Response.json(
      { ok: false, error: 'valid id and label required' },
      { status: 400 },
    )
  }
  await upsertChatMeta({
    id: body.id,
    label: body.label.trim().slice(0, 120),
    favorite: body.favorite,
    workspaceId: body.workspace_id,
  })
  return Response.json({ ok: true })
}
