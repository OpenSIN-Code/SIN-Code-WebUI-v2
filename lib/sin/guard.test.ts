// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockRateLimit = vi.fn()

vi.mock('@/lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitResponse: (result: { reason: string }) =>
    new Response(JSON.stringify({ ok: false, reason: result.reason }), { status: 429 }),
}))

import { guardRequest } from './guard'

describe('guardRequest', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockRateLimit.mockReset()
  })

  it('returns 401 when there is no session', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await guardRequest(new Request('http://x'), 'chat', 1, 1)
    expect(res?.status).toBe(401)
    expect(await res?.json()).toEqual({ ok: false, error: 'Unauthorized' })
  })

  it('returns null when within rate budget', async () => {
    mockGetSession.mockResolvedValue({ kind: 'user', userId: 'u1', isAdmin: false })
    mockRateLimit.mockReturnValue({ allowed: true, remaining: 30 })
    const res = await guardRequest(new Request('http://x'), 'chat')
    expect(res).toBeNull()
    expect(mockRateLimit).toHaveBeenCalledWith('u:u1:chat', 30, 60_000)
  })

  it('returns 429 when rate limit denies', async () => {
    mockGetSession.mockResolvedValue({ kind: 'user', userId: 'u2', isAdmin: false })
    mockRateLimit.mockReturnValue({ allowed: false, reason: 'burst', remaining: 0 })
    const res = await guardRequest(new Request('http://x'), 'chat')
    expect(res?.status).toBe(429)
  })

  it('uses tripled budget for admin users', async () => {
    mockGetSession.mockResolvedValue({ kind: 'user', userId: 'root', isAdmin: true })
    mockRateLimit.mockReturnValue({ allowed: true })
    await guardRequest(new Request('http://x'), 'chat', 10, 60_000)
    expect(mockRateLimit).toHaveBeenCalledWith('u:root:chat', 30, 60_000)
  })

  it('formats service-token identity vs user', async () => {
    mockGetSession.mockResolvedValue({ kind: 'service', actor: 'svc', isAdmin: false })
    mockRateLimit.mockReturnValue({ allowed: true })
    await guardRequest(new Request('http://x'), 'enhance', 5, 60_000)
    expect(mockRateLimit).toHaveBeenCalledWith('s:svc:enhance', 5, 60_000)
  })

  it('respects custom limit and window', async () => {
    mockGetSession.mockResolvedValue({ kind: 'user', userId: 'u3', isAdmin: false })
    mockRateLimit.mockReturnValue({ allowed: true })
    await guardRequest(new Request('http://x'), 'audit', 1, 1000)
    expect(mockRateLimit).toHaveBeenCalledWith('u:u3:audit', 1, 1000)
  })
})
