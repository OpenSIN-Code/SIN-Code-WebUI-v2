/**
 * Purpose: Token management API (root token only).
 * GET    /api/auth/tokens        — list managed tokens (no hashes)
 * POST   /api/auth/tokens {name} — create; returns plaintext ONCE
 * DELETE /api/auth/tokens {id}   — revoke
 */
import { cookies, headers } from 'next/headers'
import { AUTH_COOKIE, verifyToken } from '@/lib/auth'
import { clientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { createToken, listTokens, revokeToken } from '@/lib/storage'

async function assertRoot(req: Request): Promise<Response | null> {
  const limit = rateLimit(`${clientIp(req)}:tokens`, 10, 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieToken = cookieStore.get(AUTH_COOKIE)?.value
  const headerToken = headerStore
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')

  if (verifyToken(cookieToken) || verifyToken(headerToken)) return null
  return Response.json(
    { ok: false, error: 'Token management requires the root token' },
    { status: 403 },
  )
}

export async function GET(req: Request) {
  const denied = await assertRoot(req)
  if (denied) return denied
  return Response.json({ ok: true, data: await listTokens() })
}

export async function POST(req: Request) {
  const denied = await assertRoot(req)
  if (denied) return denied

  const { name }: { name?: string } = await req.json()
  if (!name?.trim()) {
    return Response.json({ ok: false, error: 'name required' }, { status: 400 })
  }
  const created = await createToken(name)
  return Response.json({ ok: true, data: created })
}

export async function DELETE(req: Request) {
  const denied = await assertRoot(req)
  if (denied) return denied

  const { id }: { id?: string } = await req.json()
  if (!id) {
    return Response.json({ ok: false, error: 'id required' }, { status: 400 })
  }
  const removed = await revokeToken(id)
  return Response.json({ ok: removed })
}
