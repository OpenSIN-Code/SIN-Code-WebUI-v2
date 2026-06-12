/**
 * Purpose: File viewer API.
 * GET /api/sin/file?path=…   — sin_read with hashline anchors + outline.
 */
import { runSin, sinJson } from '@/lib/sin/run'

const SAFE_PATH = /^[\w@./\-]{1,512}$/

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get('path')?.trim()
  if (!path || !SAFE_PATH.test(path) || path.includes('..')) {
    return Response.json({ ok: false, error: 'invalid path' }, { status: 400 })
  }
  return sinJson(await runSin('read', [path]))
}
