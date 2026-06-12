/**
 * Purpose: Lightweight in-memory sliding-window rate limiter for the
 * self-hosted single-instance deployment. No external dependencies.
 * Note: resets on server restart; for multi-instance setups swap this
 * for a Redis-backed limiter.
 */

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

const PRUNE_INTERVAL_MS = 5 * 60_000
let lastPrune = Date.now()

function prune(windowMs: number) {
  const now = Date.now()
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)
    if (bucket.timestamps.length === 0) buckets.delete(key)
  }
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  prune(windowMs)
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    }
  }

  bucket.timestamps.push(now)
  buckets.set(key, bucket)
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { ok: false, error: 'Rate limit exceeded' },
    {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfterSeconds) },
    },
  )
}
