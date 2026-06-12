/**
 * Purpose: Notifications API for the sidebar bell.
 * GET  /api/sin/notifications        — list
 * POST /api/sin/notifications { id } — mark read
 */
import { runSin, sinJson } from '@/lib/sin/run'

export async function GET() {
  return sinJson(await runSin('notifications', ['list']))
}

export async function POST(req: Request) {
  const { id }: { id?: string } = await req.json()
  if (!id) {
    return Response.json({ ok: false, error: 'id required' }, { status: 400 })
  }
  return sinJson(await runSin('notifications', ['mark-read', id]))
}
