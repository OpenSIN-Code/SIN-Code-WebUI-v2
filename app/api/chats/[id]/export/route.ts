/**
 * Purpose: Chat export endpoint.
 * GET /api/chats/[id]/export?format=md|json
 * Returns a downloadable file (Content-Disposition: attachment).
 */
import { chatToMarkdown } from '@/lib/chat-export'
import { isValidChatId, listChats, loadMessages } from '@/lib/storage'
import { guardRequest } from '@/lib/sin/run'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardRequest(req, 'chats', 20)
  if (guard) return guard

  const { id } = await params
  if (!isValidChatId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }

  const format = new URL(req.url).searchParams.get('format') ?? 'md'
  const [chats, messages] = await Promise.all([listChats(), loadMessages(id)])
  const meta = chats.find((c) => c.id === id) ?? { id, label: id }

  if (format === 'json') {
    return new Response(JSON.stringify({ meta, messages }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${id}.json"`,
      },
    })
  }

  return new Response(chatToMarkdown(meta, messages), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${id}.md"`,
    },
  })
}
