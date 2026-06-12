/**
 * Purpose: Code search API for the Search page.
 * GET /api/sin/search?q=…&mode=scout|discover[&type=regex|semantic|symbol|usage]
 * Backed by: `sin-code scout` and `sin-code discover`.
 */
import { runSin, sinJson } from '@/lib/sin/run'

const SCOUT_TYPES = ['regex', 'semantic', 'symbol', 'usage'] as const

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()
  const mode = url.searchParams.get('mode') ?? 'scout'
  const type = url.searchParams.get('type') ?? 'semantic'

  if (!q) {
    return Response.json({ ok: false, error: 'q required' }, { status: 400 })
  }

  if (mode === 'discover') {
    return sinJson(await runSin('discover', [q]))
  }

  const searchType = SCOUT_TYPES.includes(type as (typeof SCOUT_TYPES)[number])
    ? type
    : 'semantic'
  return sinJson(await runSin('scout', [q, '--type', searchType]))
}
