/**
 * Purpose: Single chat API.
 * GET    /api/chats/[id]              — load messages
 * PUT    /api/chats/[id] { messages } — save messages
 * DELETE /api/chats/[id]              — delete chat + messages
 */
import type { UIMessage } from 'ai'
import {
  deleteChat,
  isValidChatId,
  loadMessages,
  saveMessages,
} from '@/lib/storage'
import { guardRequest } from '@/lib/sin/run'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const guard = await guardRequest(req, 'chats', 60)
  if (guard) return guard

  const { id } = await params
  if (!isValidChatId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  return Response.json({ ok: true, data: await loadMessages(id) })
}

export async function PUT(req: Request, { params }: Params) {
  const guard = await guardRequest(req, 'chats', 30)
  if (guard) return guard

  const { id } = await params
  if (!isValidChatId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const { messages }: { messages?: UIMessage[] } = await req.json()
  if (!Array.isArray(messages)) {
    return Response.json(
      { ok: false, error: 'messages array required' },
      { status: 400 },
    )
  }
  await saveMessages(id, messages)
  return Response.json({ ok: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const guard = await guardRequest(req, 'chats', 30)
  if (guard) return guard

  const { id } = await params
  if (!isValidChatId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  await deleteChat(id)
  return Response.json({ ok: true })
}
