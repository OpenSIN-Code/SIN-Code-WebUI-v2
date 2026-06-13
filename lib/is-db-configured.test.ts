// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isDbConfigured } from './is-db-configured'

describe('isDbConfigured()', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns true when DATABASE_URL is set', () => {
    process.env.DATABASE_URL = 'postgres://localhost/db'
    expect(isDbConfigured()).toBe(true)
  })

  it('returns false when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL
    expect(isDbConfigured()).toBe(false)
  })
})
