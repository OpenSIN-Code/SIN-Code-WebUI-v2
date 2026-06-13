// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isAuthConfigured, verifyToken, verifyAnyToken } from './auth'

const mockVerifyStoredToken = vi.fn()

vi.mock('@/lib/storage', () => ({
  verifyStoredToken: (...args: unknown[]) => mockVerifyStoredToken(...args),
}))

describe('auth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.SIN_UI_TOKEN
    mockVerifyStoredToken.mockReset()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('isAuthConfigured()', () => {
    it('returns true when SIN_UI_TOKEN is set', () => {
      process.env.SIN_UI_TOKEN = 'root-token'
      expect(isAuthConfigured()).toBe(true)
    })

    it('returns false when SIN_UI_TOKEN is missing', () => {
      expect(isAuthConfigured()).toBe(false)
    })
  })

  describe('verifyToken()', () => {
    it('returns true for an exact root token match', () => {
      process.env.SIN_UI_TOKEN = 'root-token'
      expect(verifyToken('root-token')).toBe(true)
    })

    it('returns false when token differs', () => {
      process.env.SIN_UI_TOKEN = 'root-token'
      expect(verifyToken('wrong-token')).toBe(false)
    })

    it('returns false when token is missing', () => {
      process.env.SIN_UI_TOKEN = 'root-token'
      expect(verifyToken(undefined)).toBe(false)
      expect(verifyToken(null)).toBe(false)
    })

    it('returns false when root token is not configured', () => {
      expect(verifyToken('any-token')).toBe(false)
    })

    it('rejects tokens with different lengths to prevent timing leaks', () => {
      process.env.SIN_UI_TOKEN = 'short'
      expect(verifyToken('much-longer-token')).toBe(false)
    })
  })

  describe('verifyAnyToken()', () => {
    it('returns true for root token', async () => {
      process.env.SIN_UI_TOKEN = 'root-token'
      expect(await verifyAnyToken('root-token')).toBe(true)
      expect(mockVerifyStoredToken).not.toHaveBeenCalled()
    })

    it('falls back to stored token verification', async () => {
      mockVerifyStoredToken.mockResolvedValue(true)
      expect(await verifyAnyToken('stored-token')).toBe(true)
      expect(mockVerifyStoredToken).toHaveBeenCalledWith('stored-token')
    })

    it('returns false when both root and stored checks fail', async () => {
      mockVerifyStoredToken.mockResolvedValue(false)
      expect(await verifyAnyToken('nope')).toBe(false)
    })

    it('returns false for missing token', async () => {
      expect(await verifyAnyToken(undefined)).toBe(false)
      expect(mockVerifyStoredToken).not.toHaveBeenCalled()
    })
  })
})
