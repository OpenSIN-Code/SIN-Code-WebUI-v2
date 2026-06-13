// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn()', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('deduplicates tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('merges arrays and objects', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })

  it('handles null and undefined gracefully', () => {
    expect(cn('a', null, undefined, 'b')).toBe('a b')
  })
})
