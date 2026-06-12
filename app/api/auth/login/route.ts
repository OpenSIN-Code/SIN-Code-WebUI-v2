/**
 * Purpose: Session endpoints.
 * POST   /api/auth/login { token } — set httpOnly session cookie
 * DELETE /api/auth/login           — clear session (logout)
 */
import { cookies } from 'next/headers'
import { AUTH_COOKIE, isAuthConfigured, verifyAnyToken } from '@/lib/auth'
import { clientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const limit = rateLimit(`${clientIp(req)}:login`, 10, 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)
  if (!isAuthConfigured()) {
    return Response.json(
      { ok: false, error: 'SIN_UI_TOKEN is not configured on the server' },
      { status: 503 },
    )
  }

  const { token }: { token?: string } = await req.json()
  if (!(await verifyAnyToken(token))) {
    return Response.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
  return Response.json({ ok: true })
}
