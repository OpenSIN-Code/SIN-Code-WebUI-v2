/**
 * Purpose: Architecture overview API.
 * GET /api/sin/map?view=map|adw
 * Backed by: `sin-code map` (architecture) and `sin-code adw` (debt).
 */
import { runSin, sinJson } from '@/lib/sin/run'

export async function GET(req: Request) {
  const view = new URL(req.url).searchParams.get('view') ?? 'map'
  if (view === 'adw') return sinJson(await runSin('adw'))
  return sinJson(await runSin('map'))
}
