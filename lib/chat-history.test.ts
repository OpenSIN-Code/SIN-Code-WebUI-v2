// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMkdir = vi.fn()
const mockReadFile = vi.fn()
const mockReaddir = vi.fn()
const mockWriteFile = vi.fn()
const mockRename = vi.fn()
const mockUnlink = vi.fn()

vi.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  rename: (...args: unknown[]) => mockRename(...args),
  unlink: (...args: unknown[]) => mockUnlink(...args),
}))

import {
  isValidChatId,
  listChats,
  upsertChatMeta,
  deleteChat,
  loadMessages,
  saveMessages,
  pruneOrphans,
  ownsChat,
} from './chat-history'

describe('chat-history', () => {
  beforeEach(() => {
    mockMkdir.mockReset().mockResolvedValue(undefined)
    mockReadFile.mockReset()
    mockReaddir.mockReset()
    mockWriteFile.mockReset().mockResolvedValue(undefined)
    mockRename.mockReset().mockResolvedValue(undefined)
    mockUnlink.mockReset()
  })

  describe('isValidChatId()', () => {
    it.each([
      ['abc', true],
      ['a-b-c', true],
      ['abc123', true],
      ['', false],
      ['AB', false],
      ['a'.repeat(81), false],
      ['with space', false],
      ['with/slash', false],
    ])('"%s" → %s', (id, expected) => {
      expect(isValidChatId(id)).toBe(expected)
    })
  })

  describe('listChats()', () => {
    it('ensures dir, returns [] on read failure', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      const r = await listChats()
      expect(r).toEqual([])
      expect(mockMkdir).toHaveBeenCalled()
    })

    it('parses node and sorts by updatedAt desc', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          { id: 'b', label: 'B', favorite: false, updatedAt: '2026-01-02T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 'a', label: 'A', favorite: false, updatedAt: '2026-01-05T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
        ]),
      )
      const r = await listChats()
      expect(r.map((c) => c.id)).toEqual(['a', 'b'])
    })
  })

  describe('upsertChatMeta()', () => {
    it('creates new entry if absent, prepends to index', async () => {
      mockReadFile.mockResolvedValue('[]')
      await upsertChatMeta({ id: 'new', label: 'New' })
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      const [_, bodyRaw] = mockWriteFile.mock.calls[0]
      const body = JSON.parse(bodyRaw as string) as Array<{ id: string; favorite?: boolean }>
      expect(body[0].id).toBe('new')
      expect(body[0].favorite).toBe(false)
      expect(mockRename).toHaveBeenCalledTimes(1)
    })

    it('merges into existing and bumps updatedAt', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          {
            id: 'a',
            label: 'A',
            favorite: false,
            updatedAt: '2025-01-01T00:00:00.000Z',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ]),
      )
      mockWriteFile.mockResolvedValue(undefined)
      await upsertChatMeta({ id: 'a', label: 'renamed', favorite: true })
      const [_, bodyRaw] = mockWriteFile.mock.calls[0]
      const body = JSON.parse(bodyRaw as string) as Array<{ id: string; label: string; favorite: boolean }>
      expect(body.length).toBe(1)
      expect(body[0]).toEqual(expect.objectContaining({ id: 'a', label: 'renamed', favorite: true }))
    })
  })

  describe('deleteChat()', () => {
    it('removes from index and unlinks chat file', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([
          { id: 'a', label: 'A', favorite: false, updatedAt: 'd', createdAt: 'd' },
          { id: 'b', label: 'B', favorite: false, updatedAt: 'd', createdAt: 'd' },
        ]),
      )
      mockUnlink.mockResolvedValue(undefined)
      await deleteChat('a')
      const [_, bodyRaw] = mockWriteFile.mock.calls[0]
      const body = JSON.parse(bodyRaw as string) as Array<{ id: string }>
      expect(body.map((c) => c.id)).toEqual(['b'])
      expect(mockUnlink).toHaveBeenCalledTimes(1)
    })

    it('silently swallows unlink errors', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([{ id: 'a', label: 'A', favorite: false, updatedAt: 'd', createdAt: 'd' }]),
      )
      mockUnlink.mockRejectedValue(new Error('ENOENT'))
      await expect(deleteChat('a')).resolves.toBeUndefined()
    })
  })

  describe('loadMessages()', () => {
    it('returns [] when missing', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      expect(await loadMessages('a')).toEqual([])
    })

    it('returns parsed messages when present', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify([{ id: 'm1', role: 'user' }]))
      const r = await loadMessages('a')
      expect(r[0]).toEqual({ id: 'm1', role: 'user' })
    })
  })

  describe('saveMessages()', () => {
    it('writes the messages JSON atomically', async () => {
      mockWriteFile.mockResolvedValue(undefined)
      await saveMessages('a', [{ id: 'm1', role: 'user' }] as never)
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      expect(mockRename).toHaveBeenCalledTimes(1)
    })
  })

  describe('ownsChat()', () => {
    it('always returns true in single-user mode', async () => {
      expect(await ownsChat('a', null)).toBe(true)
      expect(await ownsChat('a', 'any')).toBe(true)
    })
  })

  describe('pruneOrphans()', () => {
    it('deletes chat files missing from index', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([{ id: 'a', label: 'A', favorite: false, updatedAt: 'd', createdAt: 'd' }]),
      )
      mockReaddir.mockResolvedValue(['a.json', 'b.json', 'index.json'])
      mockUnlink.mockResolvedValue(undefined)
      await pruneOrphans()
      // 'a.json' is in index → not deleted
      // 'b.json' is orphan → deleted
      expect(mockUnlink).toHaveBeenCalledTimes(1)
      const [file] = mockUnlink.mock.calls[0]
      expect(String(file)).toMatch(/b\.json$/)
    })

    it('does not delete non-JSON files or index.json', async () => {
      mockReadFile.mockResolvedValue('[]')
      mockReaddir.mockResolvedValue(['index.json', 'readme.txt', 'snapshot.zip'])
      await pruneOrphans()
      expect(mockUnlink).not.toHaveBeenCalled()
    })

    it('ignores orphan files whose name does not pass the SAFE_ID regex', async () => {
      mockReadFile.mockResolvedValue('[]')
      mockReaddir.mockResolvedValue(['Not Valid.json', 'index.json'])
      await pruneOrphans()
      expect(mockUnlink).not.toHaveBeenCalled()
    })

    it('swallows unlink errors silently', async () => {
      mockReadFile.mockResolvedValue('[]')
      mockReaddir.mockResolvedValue(['orphan.json', 'index.json'])
      mockUnlink.mockRejectedValue(new Error('EACCES'))
      await expect(pruneOrphans()).resolves.toBeUndefined()
    })
  })
})
