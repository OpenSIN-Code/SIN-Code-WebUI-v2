/**
 * Purpose: Auth + rate-limit guard used by route handlers.
 * Lives in its own module (loaded via `await import()` from heavy
 * callers) so Turbopack's NFT tracer doesn't pull node:fs / node:child_process
 * at the route boundary (#59 / #60).
 */
import { getSession } from '@/lib/session'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * Combined guard for route handlers: auth + rate limit in one call.
 */
export async function guardRequest(
  req: Request,
  group: string,
  limit = 30,
  windowMs = 60_000,
): Promise<Response | null> {
  const session = await getSession()
  if (!session) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const identity = session.kind === 'user' ? `u:${session.userId}` : `s:${session.actor}`
  const budget = session.isAdmin ? limit * 3 : limit

  const result = rateLimit(`${identity}:${group}`, budget, windowMs)
  if (!result.allowed) return rateLimitResponse(result)
  return null
}
