// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
}))

vi.mock('ai', () => ({
  tool: (config: unknown) => config,
  generateText: mockGenerateText,
}))

import { webSearchTool } from './web-search'

describe('webSearchTool', () => {
  beforeEach(() => mockGenerateText.mockReset())

  it('description warns about post-training-cutoff facts', () => {
    expect(webSearchTool.description).toMatch(/current/i)
  })

  describe('execute() success', () => {
    it('returns a trimmed summary and mapped source urls', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'a'.repeat(4500),
        sources: [
          { url: 'https://a.example' },
          { url: 'https://b.example' },
          { type: 'doc' /* no url */ },
        ],
      })

      const r = (await (webSearchTool.execute as any)({ query: 'weather' }, {} as never)) as {
        summary: string
        sources: Array<string | null>
      }
      expect(r.summary).toHaveLength(4000)
      // the third entry has no `url`, gets mapped to null then filtered out
      expect(r.sources).toEqual(['https://a.example', 'https://b.example'])
    })

    it('caps sources to 8', async () => {
      const sources = Array.from({ length: 12 }, (_, i) => ({ url: `https://x${i}.example` }))
      mockGenerateText.mockResolvedValue({ text: 'short', sources })

      const r = (await (webSearchTool.execute as any)({ query: 'lots of sources' }, {} as never)) as {
        sources: Array<string | null>
      }
      expect(r.sources).toHaveLength(8)
    })

    it('treats undefined sources as an empty list', async () => {
      mockGenerateText.mockResolvedValue({ text: 'no-source body', sources: undefined })
      const r = (await (webSearchTool.execute as any)({ query: 'nope' }, {} as never)) as {
        summary: string
        sources: Array<string | null>
      }
      expect(r.sources).toEqual([])
      expect(r.summary).toBe('no-source body')
    })

    it('skips non-url sources entirely', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'short',
        sources: [
          { type: 'image', url: 'https://img.example' } as { type: string; url?: string },
          { type: 'doc' } as { type: string; url?: string },
        ],
      })
      const r = (await (webSearchTool.execute as any)({ query: 'mixed' })) as {
        sources: Array<string | null>
      }
      expect(r.sources).toEqual(['https://img.example'])
    })
  })

  describe('execute() failure', () => {
    it('returns an error payload when generateText rejects', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('network down'))
      const r = (await (webSearchTool.execute as any)({ query: 'nope' }, {} as never)) as {
        error: string
      }
      expect(r.error).toMatch(/network down/)
    })

    it('truncates long error messages to 200 chars', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('X'.repeat(900)))
      const r = (await (webSearchTool.execute as any)({ query: 'nope' }, {} as never)) as {
        error: string
      }
      const tail = r.error.slice('Search failed: '.length)
      expect(tail.length).toBeLessThanOrEqual(200)
    })
  })
})
