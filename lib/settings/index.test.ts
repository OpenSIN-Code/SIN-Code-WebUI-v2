// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReadFile = vi.fn()
const mockWriteFile = vi.fn()
const mockMkdir = vi.fn()
const mockAppendFile = vi.fn()
const mockUnlink = vi.fn()
const mockReaddir = vi.fn()

vi.mock('fs', () => ({
  promises: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
    mkdir: (...args: unknown[]) => mockMkdir(...args),
    appendFile: (...args: unknown[]) => mockAppendFile(...args),
    unlink: (...args: unknown[]) => mockUnlink(...args),
    readdir: (...args: unknown[]) => mockReaddir(...args),
  },
}))

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path')
  return actual
})

import { buildAgentContext } from './agent-context'
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  verifyApiKey,
} from './api-keys'
import { logActivity, readActivity, summarize } from './activity'

describe('settings/agent-context', () => {
  beforeEach(() => {
    mockReadFile.mockReset()
    mockWriteFile.mockReset().mockResolvedValue(undefined)
    mockMkdir.mockReset().mockResolvedValue(undefined)
    mockReaddir.mockReset()
    mockAppendFile.mockReset().mockResolvedValue(undefined)
    mockUnlink.mockReset()
  })

  it('returns empty string when preferences have no custom instructions and no memories', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT')) // preferences
    mockReaddir.mockResolvedValue([]) // memories list
    expect(await buildAgentContext('global')).toBe('')
  })

  it('renders priorities + memories with section headers', async () => {
    // Default readdir returns Dirent-shaped objects so listFiles filter works.
    mockReaddir.mockResolvedValue([])
    mockReadFile.mockReset()
    mockReadFile.mockResolvedValueOnce(JSON.stringify({ customInstructions: 'Be concise.' }))
    mockReaddir.mockResolvedValueOnce([
      Object.assign(Object.create({ isFile: () => true }), { name: 'sprint-log.md' }),
    ] as never)
    mockReadFile.mockResolvedValueOnce('Ship by Friday.')
    const ctx = await buildAgentContext('global')
    expect(ctx).toMatch(/# User Custom Instructions/)
    expect(ctx).toMatch(/Be concise\./)
    expect(ctx).toMatch(/# Memory \(user\/sprint-log\.md\)/)
    expect(ctx).toMatch(/Ship by Friday\./)
    expect(ctx).toMatch(/---/)
  })

  it('skips empty/whitespace-only memory files', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({ customInstructions: '   ' }))
    mockReaddir.mockResolvedValueOnce(['empty.md'])
    mockReadFile.mockResolvedValueOnce('   ')
    expect(await buildAgentContext('global')).toBe('')
  })
})

describe('settings/api-keys', () => {
  beforeEach(() => {
    mockReadFile.mockReset()
    mockWriteFile.mockReset().mockResolvedValue(undefined)
    mockMkdir.mockReset().mockResolvedValue(undefined)
  })

  it('listApiKeys returns records without the hash', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify([
        {
          id: 'k1',
          name: 'prod',
          prefix: 'sin_abcde',
          hash: 'do-not-show',
          createdAt: 'd',
          lastUsedAt: null,
        },
      ]),
    )
    const r = await listApiKeys('global')
    expect(r).toHaveLength(1)
    expect((r[0] as Record<string, unknown>).hash).toBeUndefined()
    expect(r[0].id).toBe('k1')
  })

  it('createApiKey returns the plaintext once and appends a hashed record', async () => {
    mockReadFile.mockResolvedValue('[]')
    const { plaintext, record } = await createApiKey('global', 'staging')
    expect(plaintext).toMatch(/^sin_[a-f0-9]+/)
    expect(plaintext.length).toBe(4 + 48)
    expect((record as Record<string, unknown>).hash).toBeUndefined()
    // the file write contains the hashed record
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    const persisted = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as Array<{
      hash: string
      prefix: string
      name: string
    }>
    expect(persisted).toHaveLength(1)
    expect(persisted[0].hash).toMatch(/^[a-f0-9]{64}$/)
    expect(persisted[0].prefix).toBe(plaintext.slice(0, 10))
    expect(persisted[0].name).toBe('staging')
  })

  it('createApiKey truncates name to 64 chars', async () => {
    mockReadFile.mockResolvedValue('[]')
    const { record } = await createApiKey('global', 'x'.repeat(200))
    expect((record as { name: string }).name).toHaveLength(64)
  })

  it('revokeApiKey returns false when key id is not present', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([{ id: 'k1', name: 'a', prefix: 'p', hash: 'h', createdAt: 'd', lastUsedAt: null }]))
    expect(await revokeApiKey('global', 'unknown')).toBe(false)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('revokeApiKey returns true and rewrites when id is present', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([{ id: 'k1', name: 'a', prefix: 'p', hash: 'h', createdAt: 'd', lastUsedAt: null }]))
    expect(await revokeApiKey('global', 'k1')).toBe(true)
    const rewritten = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as unknown[]
    expect(rewritten).toEqual([])
  })

  it('verifyApiKey returns false when no record matches the hash', async () => {
    mockReadFile.mockResolvedValue('[]')
    expect(await verifyApiKey('sin_bogus')).toBe(false)
  })

  it('verifyApiKey: matching the plaintext updates lastUsedAt on the matching record', async () => {
    mockReadFile.mockResolvedValueOnce('[]')
    const { plaintext } = await createApiKey('global', 'test')
    const stored = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as Array<{
      hash: string
      lastUsedAt: string | null
    }>
    expect(stored[0].lastUsedAt).toBeNull()

    mockReadFile.mockResolvedValueOnce(JSON.stringify(stored))
    expect(await verifyApiKey(plaintext)).toBe(true)
    const lastWrite = mockWriteFile.mock.calls.at(-1) as [string, string]
    const after = JSON.parse(lastWrite[1]) as Array<{ lastUsedAt: string | null }>
    expect(after[0].lastUsedAt).not.toBeNull()
  })
})

describe('settings/activity', () => {
  beforeEach(() => {
    mockReadFile.mockReset()
    mockWriteFile.mockReset().mockResolvedValue(undefined)
    mockMkdir.mockReset().mockResolvedValue(undefined)
    mockAppendFile.mockReset().mockResolvedValue(undefined)
  })

  it('logActivity appends a JSONL line', async () => {
    await logActivity('global', { type: 'chat', model: 'gpt-5', tokensIn: 10 })
    expect(mockMkdir).toHaveBeenCalled()
    expect(mockAppendFile).toHaveBeenCalledTimes(1)
    const line = mockAppendFile.mock.calls[0][1] as string
    expect(line).toMatch(/"ts":"\d{4}-\d{2}-\d{2}T/)
    expect(line).toMatch(/"type":"chat"/)
    expect(line.endsWith('\n')).toBe(true)
  })

  it('logActivity scopes to per-user dir', async () => {
    await logActivity('alice@x.com', { type: 'tool_call' })
    const dir = mockMkdir.mock.calls[0][0] as string
    expect(dir).toContain('users')
    expect(dir).not.toContain('@')
  })

  it('readActivity returns parsed events in reverse order, skipping garbage', async () => {
    mockReadFile.mockResolvedValue(
      [
        JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', type: 'chat' }),
        'not-json',
        JSON.stringify({ ts: '2026-01-02T00:00:00.000Z', type: 'tool_call' }),
      ].join('\n'),
    )
    const r = await readActivity('global', 100)
    expect(r).toHaveLength(2)
    expect(r[0].ts.startsWith('2026-01-02')).toBe(true)
    expect(r[1].ts.startsWith('2026-01-01')).toBe(true)
  })

  it('readActivity returns [] when file missing', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
    expect(await readActivity('global')).toEqual([])
  })

  it('summarize aggregates counters and trims to last 14 days', () => {
    const events = [
      { ts: '2026-01-01T00:00:00Z', type: 'chat', tokensIn: 5, tokensOut: 3 },
      { ts: '2026-01-02T00:00:00Z', type: 'tool_call', tokensIn: 1, tokensOut: 0 },
      { ts: '2026-01-02T01:00:00Z', type: 'chat', tokensIn: 2, tokensOut: 1 },
      // Old day that should be trimmed
      { ts: '2020-01-01T00:00:00Z', type: 'chat', tokensIn: 0, tokensOut: 0 },
    ] as never
    const s = summarize(events)
    expect(s.totalChats).toBe(3)
    expect(s.totalToolCalls).toBe(1)
    expect(s.totalTokensIn).toBe(8)
    expect(s.totalTokensOut).toBe(4)
    expect(s.byDay.length).toBeLessThanOrEqual(14)
    // byDay sorted ascending
    for (let i = 1; i < s.byDay.length; i++) {
      expect(s.byDay[i].date >= s.byDay[i - 1].date).toBe(true)
    }
  })

  it('summarize handles empty input', () => {
    const s = summarize([])
    expect(s).toEqual({
      totalChats: 0,
      totalToolCalls: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      byDay: [],
    })
  })
})
