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

import { getSinTools, getAutodevTools, getAllMcpTools } from './mcp'

beforeEach(() => {
  mockSinTools.mockReset()
  mockSinClose.mockReset().mockResolvedValue(undefined)
  mockSinClientFail.mockReset().mockReturnValue(false)
  mockAutodevTools.mockReset()
  mockAutodevClose.mockReset().mockResolvedValue(undefined)
  mockAutodevFail.mockReset().mockReturnValue(false)
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

describe('getAllMcpTools', () => {
  it('merges sin and autodev toolsets via Promise.all', async () => {
    mockSinTools.mockResolvedValue({ sin_status: {}, sin_execute: {} })
    mockAutodevTools.mockResolvedValue({ autodev_status: {}, autodev_lessons: {} })
    const r = await getAllMcpTools()
    expect(Object.keys(r.tools).sort()).toEqual([
      'autodev_lessons',
      'autodev_status',
      'sin_execute',
      'sin_status',
    ])
    expect(r.available['sin-code']).toBe(true)
    expect(r.available.autodev).toBe(true)
    await r.close()
    expect(mockSinClose).toHaveBeenCalled()
    expect(mockAutodevClose).toHaveBeenCalled()
  })

  it('reports sin-code unavailable while autodev stays up', async () => {
    mockSinClientFail.mockReturnValue(true)
    mockAutodevTools.mockResolvedValue({ autodev_status: {} })
    const r = await getAllMcpTools()
    expect(r.available['sin-code']).toBe(false)
    expect(r.available.autodev).toBe(true)
    expect(r.tools).toEqual({ autodev_status: {} })
    await r.close()
    expect(mockAutodevClose).toHaveBeenCalled()
  })

  it('returns empty toolset when both clients drop out, no exception', async () => {
    mockSinClientFail.mockReturnValue(true)
    mockAutodevFail.mockReturnValue(true)
    const r = await getAllMcpTools()
    expect(r.available['sin-code']).toBe(false)
    expect(r.available.autodev).toBe(false)
    expect(r.tools).toEqual({})
    await r.close()
  })
})
