/**
 * Purpose: Agent configuration API for the Settings page.
 * GET  /api/sin/config                       — current agent config (agent show)
 * POST /api/sin/config { key, value }        — set a config value (agent set)
 */
import { runSin, sinJson } from '@/lib/sin/run'

const SAFE_KEY = /^[\w.-]{1,64}$/

export async function GET() {
  return sinJson(await runSin('agent', ['show']))
}

export async function POST(req: Request) {
  const { key, value }: { key?: string; value?: string } = await req.json()
  if (!key || !SAFE_KEY.test(key)) {
    return Response.json({ ok: false, error: 'invalid key' }, { status: 400 })
  }
  if (typeof value !== 'string' || value.length > 512) {
    return Response.json({ ok: false, error: 'invalid value' }, { status: 400 })
  }
  return sinJson(await runSin('agent', ['set', key, value]))
}
