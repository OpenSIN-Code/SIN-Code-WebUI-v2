/**
 * Purpose: Share management for a chat (owner or admin only).
 * GET    /api/chats/[id]/share — current share state
 * POST   /api/chats/[id]/share — create share, returns public URL slug
 * DELETE /api/chats/[id]/share — revoke share
 */
// SPDX-License-Identifier: MIT

import { guardRequest } from '@/lib/sin/guard'
import { getSession } from '@/lib/session'
import { getShareByChatId, shareChat, unshareChat } from '@/lib/shares'
import { isValidChatId, ownsChat } from '@/lib/storage'

type Params = { params: Promise<{ id: string }> }

async function authorize(req: Request, id: string): Promise<Response | null> {
  const guard = await guardRequest(req, 'shares', 20)
  if (guard) return guard
  if (!isValidChatId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const session = await getSession()
  if (!(await ownsChat(id, session?.userId ?? null))) {
    return Response.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
  return null
}

export async function GET(req: Request, { params }: Params) {
  const { id } = await params
  const denied = await authorize(req, id)
  if (denied) return denied
  const share = await getShareByChatId(id)
  return Response.json({ ok: true, data: share ? { slug: share.slug } : null })
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const denied = await authorize(req, id)
  if (denied) return denied
  const session = await getSession()
  const share = await shareChat(id, session?.actor ?? null)
  return Response.json({ ok: true, data: { slug: share.slug } })
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params
  const denied = await authorize(req, id)
  if (denied) return denied
  return Response.json({ ok: await unshareChat(id) })
}
