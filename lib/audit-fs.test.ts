// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMkdir = vi.fn()
const mockAppendFile = vi.fn()
const mockReadFile = vi.fn()
const mockReaddir = vi.fn()

vi.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  appendFile: (...args: unknown[]) => mockAppendFile(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
}))

vi.mock('node:path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path')
  return actual
})

import { audit, readAudit } from './audit-fs'

describe('audit-fs', () => {
  beforeEach(() => {
    mockMkdir.mockReset()
    mockAppendFile.mockReset()
    mockReadFile.mockReset()
    mockReaddir.mockReset()
    // Default: readdir works
    mockReaddir.mockResolvedValue([])
  })

  describe('audit()', () => {
    it('writes a JSONL line under .sin-webui/audit/', async () => {
      mockMkdir.mockResolvedValue(undefined)
      mockAppendFile.mockResolvedValue(undefined)
      await audit({ actor: 'root', action: 'chat', args: '{}', ok: true, durationMs: 12 })
      expect(mockMkdir).toHaveBeenCalled()
      expect(mockAppendFile).toHaveBeenCalledTimes(1)
      const [file, body, enc] = mockAppendFile.mock.calls[0]
      expect(file).toMatch(/audit-\d{4}-\d{2}\.jsonl$/)
      expect(enc).toBe('utf8')
      expect(body).toMatch(/"actor":"root"/)
      expect(body).toMatch(/"ts":"\d{4}-\d{2}-\d{2}T/)
    })

    it('swallows errors to keep logging best-effort', async () => {
      mockMkdir.mockResolvedValue(undefined)
      mockAppendFile.mockRejectedValue(new Error('disk full'))
      await expect(
        audit({ actor: 'root', action: 'x', args: '{}', ok: true, durationMs: 0 }),
      ).resolves.toBeUndefined()
    })

    it('swallows mkdir errors too', async () => {
      mockMkdir.mockRejectedValue(new Error('eperm'))
      await expect(
        audit({ actor: 'root', action: 'x', args: '{}', ok: true, durationMs: 0 }),
      ).resolves.toBeUndefined()
      expect(mockAppendFile).not.toHaveBeenCalled()
    })
  })

  describe('readAudit()', () => {
    it('returns [] when readdir fails', async () => {
      mockReaddir.mockRejectedValue(new Error('ENOENT'))
      expect(await readAudit()).toEqual([])
    })

    it('returns [] when no audit files exist', async () => {
      mockReaddir.mockResolvedValue(['readme.md', 'other.json'])
      expect(await readAudit()).toEqual([])
    })

    it('sorts files by name (newest first) and parses newest 2', async () => {
      mockReaddir.mockResolvedValue(['audit-2025-01.jsonl', 'audit-2025-02.jsonl', 'audit-2025-03.jsonl'])
      mockReadFile.mockResolvedValue('{"ts":"d","actor":"a","action":"x","args":"","ok":true,"durationMs":1}\n')
      const result = await readAudit({ limit: 5 })
      // expect newest 2 files read
      expect(mockReadFile).toHaveBeenCalledTimes(2)
      // expect newest first
      const calls = mockReadFile.mock.calls.map((c) => String(c[0]))
      expect(String(calls[0])).toContain('2025-03')
      expect(String(calls[1])).toContain('2025-02')
      expect(result.length).toBe(2)
    })

    it('skips corrupt lines', async () => {
      mockReaddir.mockResolvedValue(['audit-2025-01.jsonl'])
      mockReadFile.mockResolvedValue('not-json\n{"ok":true,"actor":"a","action":"x","args":"","durationMs":1,"ts":"d"}\n')
      const r = await readAudit()
      expect(r.length).toBe(1)
    })

    it('skips unreadable files', async () => {
      mockReaddir.mockResolvedValue(['audit-2025-01.jsonl'])
      mockReadFile.mockRejectedValue(new Error('EACCES'))
      expect(await readAudit()).toEqual([])
    })

    it('filters by actor / action / failedOnly', async () => {
      mockReaddir.mockResolvedValue(['audit-2025-01.jsonl'])
      mockReadFile.mockResolvedValue(
        JSON.stringify({ ts: 'd', actor: 'alice', action: 'chat', args: '', ok: true, durationMs: 1 }) +
          '\n' +
          JSON.stringify({ ts: 'd', actor: 'bob', action: 'chat', args: '', ok: false, durationMs: 1, error: 'x' }) +
          '\n' +
          JSON.stringify({ ts: 'd', actor: 'alice', action: 'audit', args: '', ok: false, durationMs: 1, error: 'y' }),
      )
      expect((await readAudit({ actor: 'alice' })).length).toBe(2)
      expect((await readAudit({ action: 'audit' })).length).toBe(1)
      expect((await readAudit({ failedOnly: true })).length).toBe(2)
    })

    it('caps to limit (max 1000)', async () => {
      mockReaddir.mockResolvedValue(['audit-2025-01.jsonl'])
      const line = JSON.stringify({ ts: 'd', actor: 'a', action: 'x', args: '', ok: true, durationMs: 1 })
      mockReadFile.mockResolvedValue(Array.from({ length: 1500 }, () => line).join('\n'))
      expect((await readAudit({ limit: 5 })).length).toBe(5)
      expect((await readAudit({ limit: 9999 })).length).toBe(1000)
    })
  })
})
