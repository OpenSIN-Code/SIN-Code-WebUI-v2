// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit, clientIp, rateLimitResponse } from './rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rateLimit()', () => {
    it('allows requests under the limit', () => {
      const result = rateLimit('ip-1', 3, 60_000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
      expect(result.retryAfterSeconds).toBe(0)
    })

    it('blocks requests at the limit', () => {
      rateLimit('ip-2', 2, 60_000)
      rateLimit('ip-2', 2, 60_000)
      const blocked = rateLimit('ip-2', 2, 60_000)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
    })

    it('allows requests again after the window passes', () => {
      rateLimit('ip-3', 1, 60_000)
      vi.advanceTimersByTime(60_001)
      const result = rateLimit('ip-3', 1, 60_000)
      expect(result.allowed).toBe(true)
    })

    it('reports the retry-after time for blocked requests', () => {
      rateLimit('ip-4', 1, 60_000)
      vi.advanceTimersByTime(20_000)
      const blocked = rateLimit('ip-4', 1, 60_000)
      expect(blocked.allowed).toBe(false)
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
      expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(40)
    })
  })

  describe('clientIp()', () => {
    it('prefers x-forwarded-for first entry', () => {
      const req = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8',
          'x-real-ip': '9.10.11.12',
        },
      })
      expect(clientIp(req)).toBe('1.2.3.4')
    })

    it('falls back to x-real-ip', () => {
      const req = new Request('http://example.com', {
        headers: { 'x-real-ip': '9.10.11.12' },
      })
      expect(clientIp(req)).toBe('9.10.11.12')
    })

    it('returns unknown when no headers are present', () => {
      const req = new Request('http://example.com')
      expect(clientIp(req)).toBe('unknown')
    })
  })

  describe('rateLimitResponse()', () => {
    it('returns a 429 response with Retry-After header', () => {
      const response = rateLimitResponse({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 42,
      })
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('42')
    })
  })
})
