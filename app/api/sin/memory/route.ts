/**
 * Purpose: Memory browser API.
 * GET  /api/sin/memory[?q=…]      — list or search memories
 * POST /api/sin/memory { content } — persist a memory
 */
import { runSin, sinJson } from '@/lib/sin/run'

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')
  if (q) return sinJson(await runSin('memory', ['search', q]))
  return sinJson(await runSin('memory', ['list']))
}

export async function POST(req: Request) {
  const { content }: { content?: string } = await req.json()
  if (!content?.trim()) {
    return Response.json({ ok: false, error: 'content required' }, { status: 400 })
  }
  return sinJson(await runSin('memory', ['add', content.trim()]))
}
