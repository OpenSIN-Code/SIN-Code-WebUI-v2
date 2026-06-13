// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReadFile = vi.fn()
const mockWriteFile = vi.fn()
const mockReaddir = vi.fn()
const mockMkdir = vi.fn()
const mockUnlink = vi.fn()

vi.mock('fs', () => ({
  promises: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
    readdir: (...args: unknown[]) => mockReaddir(...args),
    mkdir: (...args: unknown[]) => mockMkdir(...args),
    unlink: (...args: unknown[]) => mockUnlink(...args),
  },
}))

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path')
  return actual
})

import {
  readPreferences,
  writePreferences,
  listFiles,
  readFileContent,
  writeFileContent,
  deleteFile,
  safeResolve,
  DEFAULT_PREFERENCES,
} from './store'

describe('settings/store', () => {
  beforeEach(() => {
    mockReadFile.mockReset()
    mockWriteFile.mockReset()
    mockReaddir.mockReset()
    mockMkdir.mockReset().mockResolvedValue(undefined)
    mockUnlink.mockReset()
  })

  describe('safeResolve()', () => {
    it('resolves inside the user directory', () => {
      const r = safeResolve('global', 'preferences.json')
      expect(r).toContain('preferences.json')
    })

    it('sanitizes unsafe characters in userId', () => {
      const r = safeResolve('../etc', 'passwd')
      // _ replaces .. and / stays as path separator
      expect(r).toContain('__etc')
      expect(r).not.toContain('..')
    })

    it('rejects path traversal', () => {
      expect(() => safeResolve('global', '..', '..', 'etc', 'passwd')).toThrow(/Invalid path/)
    })
  })

  describe('readPreferences()', () => {
    it('returns defaults when the file is missing', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      expect(await readPreferences('global')).toEqual(DEFAULT_PREFERENCES)
    })

    it('merges stored values over defaults', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ chatPosition: 'right', theme: 'dark' }))
      const r = await readPreferences('global')
      expect(r.chatPosition).toBe('right')
      expect(r.theme).toBe('dark')
      // unchanged default
      expect(r.suggestions).toBe(true)
    })
  })

  describe('writePreferences()', () => {
    it('writes the JSON and creates the directory', async () => {
      await writePreferences('global', DEFAULT_PREFERENCES)
      expect(mockMkdir).toHaveBeenCalled()
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      const body = mockWriteFile.mock.calls[0][1] as string
      expect(JSON.parse(body)).toMatchObject(DEFAULT_PREFERENCES)
    })
  })

  describe('listFiles()', () => {
    it('returns markdown names sorted alphabetically', async () => {
      mockReaddir.mockResolvedValue([
        { name: 'zeta.md', isFile: () => true },
        { name: 'alpha.md', isFile: () => true },
        { name: 'README.txt', isFile: () => true },
        { name: 'subdir', isFile: () => false },
      ])
      const r = await listFiles('global', 'memories', 'user')
      expect(r).toEqual(['alpha.md', 'zeta.md'])
    })

    it('returns [] when readdir fails', async () => {
      mockReaddir.mockRejectedValue(new Error('ENOENT'))
      expect(await listFiles('global', 'memories', 'user')).toEqual([])
    })
  })

  describe('readFileContent()', () => {
    it('returns the file body when present', async () => {
      mockReadFile.mockResolvedValue('hello world')
      expect(await readFileContent('global', 'memories', 'user', 'note.md')).toBe('hello world')
    })

    it('returns null when the file is missing', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      expect(await readFileContent('global', 'memories', 'user', 'note.md')).toBeNull()
    })
  })

  describe('writeFileContent()', () => {
    it('ensures parent dir and writes the file', async () => {
      await writeFileContent('global', 'memories', 'user', 'note.md', '# hi')
      expect(mockMkdir).toHaveBeenCalled()
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteFile()', () => {
    it('removes the file', async () => {
      await deleteFile('global', 'memories', 'user', 'note.md')
      expect(mockUnlink).toHaveBeenCalled()
    })
  })
})
