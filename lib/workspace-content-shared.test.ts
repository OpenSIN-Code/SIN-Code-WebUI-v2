// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import {
  detectSourceKind,
  isHttpUrl,
  SOURCE_KINDS,
  EMPTY_WORKSPACE_CONTENT,
} from './workspace-content-shared'

describe('workspace-content-shared', () => {
  describe('detectSourceKind()', () => {
    it('classifies youtube URLs', () => {
      expect(detectSourceKind('https://www.youtube.com/watch?v=abc123')).toBe(
        'youtube',
      )
      expect(detectSourceKind('https://youtu.be/abc123')).toBe('youtube')
    })

    it('classifies document URLs', () => {
      expect(detectSourceKind('https://example.com/file.pdf')).toBe('doc')
      expect(detectSourceKind('https://example.com/readme.md')).toBe('doc')
      expect(detectSourceKind('https://example.com/data.csv')).toBe('doc')
    })

    it('defaults to webpage for generic URLs', () => {
      expect(detectSourceKind('https://example.com/page')).toBe('webpage')
    })
  })

  describe('isHttpUrl()', () => {
    it('accepts http and https URLs', () => {
      expect(isHttpUrl('http://example.com')).toBe(true)
      expect(isHttpUrl('https://example.com/path')).toBe(true)
    })

    it('rejects non-HTTP protocols', () => {
      expect(isHttpUrl('ftp://example.com')).toBe(false)
      expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    })

    it('rejects invalid URLs', () => {
      expect(isHttpUrl('not a url')).toBe(false)
      expect(isHttpUrl('')).toBe(false)
    })
  })

  describe('constants', () => {
    it('lists all source kinds', () => {
      expect(SOURCE_KINDS).toEqual(['webpage', 'youtube', 'doc'])
    })

    it('provides an empty workspace content scaffold', () => {
      expect(EMPTY_WORKSPACE_CONTENT).toEqual({
        bookmarks: [],
        sources: [],
        files: [],
        projects: [],
      })
    })
  })
})
