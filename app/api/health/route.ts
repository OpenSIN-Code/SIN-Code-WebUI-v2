/**
 * Purpose: Health endpoint for Docker healthchecks and uptime monitoring.
 * Public by design (no auth) — returns only a coarse status, no details.
 */
import { isDbConfigured, getPool } from '@/lib/db'

export async function GET() {
  let db: 'ok' | 'error' | 'file' = 'file'
  if (isDbConfigured()) {
    try {
      await getPool().query('SELECT 1')
      db = 'ok'
    } catch {
      db = 'error'
    }
  }
  return Response.json(
    { ok: db !== 'error', db },
    { status: db === 'error' ? 503 : 200 },
  )
}
