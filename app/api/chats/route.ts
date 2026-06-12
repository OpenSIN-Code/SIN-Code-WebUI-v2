import { isValidChatId, listChats, upsertChatMeta } from '@/lib/storage'
import { guardRequest } from '@/lib/sin/run'
import { getSession } from '@/lib/session'

export async function GET(req: Request) {
  const guard = await guardRequest(req, 'chats', 60)
  if (guard) return guard
  const session = await getSession()
  return Response.json({ ok: true, data: await listChats(session?.userId ?? 'global') })
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, 'chats', 30)
  if (guard) return guard
  const session = await getSession()

  const body: { id?: string; label?: string; favorite?: boolean; workspace_id?: string } =
    await req.json()
  if (!body.id || !isValidChatId(body.id) || !body.label?.trim()) {
    return Response.json({ ok: false, error: 'valid id and label required' }, { status: 400 })
  }
  await upsertChatMeta({
    id: body.id,
    label: body.label.trim().slice(0, 120),
    favorite: body.favorite,
    workspaceId: body.workspace_id,
    userId: session?.userId ?? 'global',
  })
  return Response.json({ ok: true })
}
