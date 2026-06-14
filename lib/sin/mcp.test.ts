// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSinTools, mockSinClose, mockSinClientFail } = vi.hoisted(() => ({
  mockSinTools: vi.fn(),
  mockSinClose: vi.fn().mockResolvedValue(undefined),
  mockSinClientFail: vi.fn().mockReturnValue(false),
}))

const { mockAutodevTools, mockAutodevClose } = vi.hoisted(() => ({
  mockAutodevTools: vi.fn(),
  mockAutodevClose: vi.fn().mockResolvedValue(undefined),
}))

const { mockAutodevFail } = vi.hoisted(() => ({
  mockAutodevFail: vi.fn().mockReturnValue(false),
}))

const { mockWebsearchTools, mockWebsearchClose } = vi.hoisted(() => ({
  mockWebsearchTools: vi.fn(),
  mockWebsearchClose: vi.fn().mockResolvedValue(undefined),
}))

const { mockWebsearchFail } = vi.hoisted(() => ({
  mockWebsearchFail: vi.fn().mockReturnValue(false),
}))

vi.mock('@ai-sdk/mcp', () => ({
  createMCPClient: ((opts: { transport: { serverParams?: { command: string; args: string[] } } }) => {
    const cmd = opts.transport?.serverParams?.command
    if (cmd === 'sin-code') {
      if (mockSinClientFail()) throw new Error('binary missing')
      return Promise.resolve({ tools: mockSinTools, close: mockSinClose })
    }
    if (cmd === 'autodev-mcp') {
      if (mockAutodevFail()) throw new Error('binary missing')
      return Promise.resolve({ tools: mockAutodevTools, close: mockAutodevClose })
    }
    // sin-websearch pyproject.toml registers entry-point as
    // `sin-websearch-server` — see resolveSinWebsearchBin().
    if (cmd === 'sin-websearch-server') {
      if (mockWebsearchFail()) throw new Error('binary missing')
      return Promise.resolve({ tools: mockWebsearchTools, close: mockWebsearchClose })
    }
    throw new Error(`unexpected MCP command: ${String(cmd)}`)
  }) as unknown as typeof import('@ai-sdk/mcp').createMCPClient,
}))

vi.mock('@ai-sdk/mcp/mcp-stdio', () => ({
  // Minimal stub — pipeline mcp.ts wraps serverParams so the factory mock
  // can pattern-match on transport.serverParams.command.
  Experimental_StdioMCPTransport: class MockTransport {
    serverParams: { command: string; args?: string[] }
    constructor(serverParams: { command: string; args?: string[] }) {
      this.serverParams = serverParams
    }
  },
}))

import { getSinTools, getAutodevTools, getSinWebsearchTools, getAllMcpTools } from './mcp'

beforeEach(() => {
  mockSinTools.mockReset()
  mockSinClose.mockReset().mockResolvedValue(undefined)
  mockSinClientFail.mockReset().mockReturnValue(false)
  mockAutodevTools.mockReset()
  mockAutodevClose.mockReset().mockResolvedValue(undefined)
  mockAutodevFail.mockReset().mockReturnValue(false)
  mockWebsearchTools.mockReset()
  mockWebsearchClose.mockReset().mockResolvedValue(undefined)
  mockWebsearchFail.mockReset().mockReturnValue(false)
})

describe('getSinTools', () => {
  it('returns the sin_* toolset when sin-code is reachable', async () => {
    mockSinTools.mockResolvedValue({ sin_status: { description: 'status' } })
    const r = await getSinTools()
    expect(r.available).toBe(true)
    expect(r.tools).toEqual({ sin_status: { description: 'status' } })
    await r.close()
    expect(mockSinClose).toHaveBeenCalled()
  })

  it('degrades gracefully when sin-code binary is missing', async () => {
    mockSinClientFail.mockReturnValue(true)
    const r = await getSinTools()
    expect(r.available).toBe(false)
    expect(r.tools).toEqual({})
    await r.close()  // should be no-op
    expect(mockSinClose).not.toHaveBeenCalled()
  })
})

describe('getAutodevTools', () => {
  it('returns the autodev_* toolset when autodev-mcp is reachable', async () => {
    mockAutodevTools.mockResolvedValue({
      autodev_status: { description: 'status' },
      autodev_lessons: { description: 'lessons' },
    })
    const r = await getAutodevTools()
    expect(r.available).toBe(true)
    expect(r.tools).toEqual({
      autodev_status: { description: 'status' },
      autodev_lessons: { description: 'lessons' },
    })
    await r.close()
    expect(mockAutodevClose).toHaveBeenCalled()
  })

  it('degrades gracefully when autodev-mcp binary is missing', async () => {
    mockAutodevFail.mockReturnValue(true)
    const r = await getAutodevTools()
    expect(r.available).toBe(false)
    expect(r.tools).toEqual({})
    await r.close()
    expect(mockAutodevClose).not.toHaveBeenCalled()
  })
})

describe('getSinWebsearchTools', () => {
  it('returns the websearch_* toolset when sin-websearch-server is reachable', async () => {
    mockWebsearchTools.mockResolvedValue({
      websearch_search: { description: 'multi-key pool search' },
      websearch_status: { description: 'pool stats' },
    })
    const r = await getSinWebsearchTools()
    expect(r.available).toBe(true)
    expect(r.tools).toEqual({
      websearch_search: { description: 'multi-key pool search' },
      websearch_status: { description: 'pool stats' },
    })
    await r.close()
    expect(mockWebsearchClose).toHaveBeenCalled()
  })

  it('degrades gracefully when sin-websearch-server binary is missing', async () => {
    mockWebsearchFail.mockReturnValue(true)
    const r = await getSinWebsearchTools()
    expect(r.available).toBe(false)
    expect(r.tools).toEqual({})
    await r.close()
    expect(mockWebsearchClose).not.toHaveBeenCalled()
  })
})

describe('getAllMcpTools', () => {
  it('merges sin + autodev + websearch toolsets via Promise.all', async () => {
    mockSinTools.mockResolvedValue({ sin_status: {}, sin_execute: {} })
    mockAutodevTools.mockResolvedValue({ autodev_status: {}, autodev_lessons: {} })
    mockWebsearchTools.mockResolvedValue({
      websearch_search: {},
      websearch_status: {},
    })
    const r = await getAllMcpTools()
    expect(Object.keys(r.tools).sort()).toEqual([
      'autodev_lessons',
      'autodev_status',
      'sin_execute',
      'sin_status',
      'websearch_search',
      'websearch_status',
    ])
    expect(r.available['sin-code']).toBe(true)
    expect(r.available.autodev).toBe(true)
    expect(r.available['sin-websearch']).toBe(true)
    await r.close()
    expect(mockSinClose).toHaveBeenCalled()
    expect(mockAutodevClose).toHaveBeenCalled()
    expect(mockWebsearchClose).toHaveBeenCalled()
  })

  it('reports sin-code unavailable while siblings stay up', async () => {
    mockSinClientFail.mockReturnValue(true)
    mockAutodevTools.mockResolvedValue({ autodev_status: {} })
    mockWebsearchTools.mockResolvedValue({ websearch_search: {} })
    const r = await getAllMcpTools()
    expect(r.available['sin-code']).toBe(false)
    expect(r.available.autodev).toBe(true)
    expect(r.available['sin-websearch']).toBe(true)
    expect(r.tools).toEqual({ autodev_status: {}, websearch_search: {} })
    await r.close()
    expect(mockAutodevClose).toHaveBeenCalled()
    expect(mockWebsearchClose).toHaveBeenCalled()
  })

  it('returns partial toolset when only sin-websearch drops out', async () => {
    mockSinTools.mockResolvedValue({ sin_status: {} })
    mockAutodevTools.mockResolvedValue({ autodev_status: {} })
    mockWebsearchFail.mockReturnValue(true)
    const r = await getAllMcpTools()
    expect(r.available['sin-code']).toBe(true)
    expect(r.available.autodev).toBe(true)
    expect(r.available['sin-websearch']).toBe(false)
    expect(r.tools).toEqual({ sin_status: {}, autodev_status: {} })
    await r.close()
  })

  it('returns empty toolset when all three clients drop out, no exception', async () => {
    mockSinClientFail.mockReturnValue(true)
    mockAutodevFail.mockReturnValue(true)
    mockWebsearchFail.mockReturnValue(true)
    const r = await getAllMcpTools()
    expect(r.available['sin-code']).toBe(false)
    expect(r.available.autodev).toBe(false)
    expect(r.available['sin-websearch']).toBe(false)
    expect(r.tools).toEqual({})
    await r.close()
  })

  it('keeps a single toolset key when sibling names ever collide (sin_* > autodev_* > websearch_*)', async () => {
    // Defensive: if a future sibling ever shipped a colliding name, last
    // spread wins (websearch_* beats autodev_* beats sin_*). Documented
    // intent in lib/sin/mcp.ts.
    mockSinTools.mockResolvedValue({ shared_key: { source: 'sin' } })
    mockAutodevTools.mockResolvedValue({ shared_key: { source: 'autodev' } })
    mockWebsearchTools.mockResolvedValue({ shared_key: { source: 'websearch' } })
    const r = await getAllMcpTools()
    expect(Object.keys(r.tools)).toEqual(['shared_key'])
    expect(
      (r.tools as unknown as { shared_key: { source: string } }).shared_key
        .source,
    ).toBe('websearch')
  })
})
