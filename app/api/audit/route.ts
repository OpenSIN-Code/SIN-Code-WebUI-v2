/**
 * Purpose: Audit log query API (root token only).
 * GET /api/audit?limit=200[&actor=…][&action=…][&failed=1][&format=csv]
 */
// SPDX-License-Identifier: MIT

import { cookies, headers } from 'next/headers'
import { auditToCsv, readAudit } from '@/lib/storage'
import { AUTH_COOKIE, verifyToken } from '@/lib/auth'
import { clientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(req: Request) {
  const limit = rateLimit(`${clientIp(req)}:audit`, 20, 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieToken = cookieStore.get(AUTH_COOKIE)?.value
  const headerToken = headerStore
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')

  if (!verifyToken(cookieToken) && !verifyToken(headerToken)) {
    return Response.json(
      { ok: false, error: 'Audit log requires the root token' },
      { status: 403 },
    )
  }

  const url = new URL(req.url)
  const entries = await readAudit({
    limit: Number(url.searchParams.get('limit')) || 200,
    actor: url.searchParams.get('actor') ?? undefined,
    action: url.searchParams.get('action') ?? undefined,
    failedOnly: url.searchParams.get('failed') === '1',
  })

  if (url.searchParams.get('format') === 'csv') {
    return new Response(auditToCsv(entries), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sin-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return Response.json({ ok: true, data: entries })
}
