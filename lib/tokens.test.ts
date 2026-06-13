// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const files = new Map<string, string>()
const mockReadFile = vi.fn()
const mockWriteFile = vi.fn()
const mockMkdir = vi.fn()
const mockRename = vi.fn()

vi.mock('node:fs/promises', () => ({
  readFile: (path: string, encoding: string) => mockReadFile(path, encoding),
  writeFile: (path: string, content: string, encoding: string) =>
    mockWriteFile(path, content, encoding),
  mkdir: (path: string, options: { recursive: boolean }) =>
    mockMkdir(path, options),
  rename: (oldPath: string, newPath: string) => mockRename(oldPath, newPath),
}))

import {
  createToken,
  listTokens,
  revokeToken,
  verifyStoredToken,
  findTokenName,
} from './tokens'

beforeEach(() => {
  files.clear()
  vi.clearAllMocks()
  mockReadFile.mockImplementation(async (path: string) => {
    if (!files.has(path)) throw new Error('ENOENT')
    return files.get(path)!
  })
  mockWriteFile.mockImplementation(async (path: string, content: string) => {
    files.set(path, content)
  })
  mockMkdir.mockResolvedValue(undefined)
  mockRename.mockImplementation(async (oldPath: string, newPath: string) => {
    if (files.has(oldPath)) {
      files.set(newPath, files.get(oldPath)!)
      files.delete(oldPath)
    }
  })
  vi.spyOn(process, 'cwd').mockReturnValue('/test')
})

describe('tokens', () => {
  it('creates a token with the sin_ prefix and hides hashes when listing', async () => {
    const { id, token } = await createToken('My Token')

    expect(token).toMatch(/^sin_[a-f0-9]{48}$/)
    expect(id).toMatch(/^[a-f0-9]{12}$/)

    const records = await listTokens()
    expect(records).toHaveLength(1)
    expect(records[0]).toHaveProperty('id', id)
    expect(records[0]).toHaveProperty('name', 'My Token')
    expect(records[0]).not.toHaveProperty('hash')
  })

  it('revokes an existing token', async () => {
    await createToken('A')
    const records = await listTokens()
    const id = records[0].id

    expect(await revokeToken(id)).toBe(true)
    expect(await listTokens()).toHaveLength(0)
  })

  it('revokeToken returns false when id is unknown', async () => {
    expect(await revokeToken('unknown')).toBe(false)
  })

  it('verifyStoredToken returns true for a matching token', async () => {
    const { token } = await createToken('B')
    expect(await verifyStoredToken(token)).toBe(true)
  })

  it('verifyStoredToken returns false for an unknown token', async () => {
    expect(await verifyStoredToken('sin_000000000000000000000000000000000000000000000000')).toBe(false)
  })

  it('findTokenName returns the token name for a matching token', async () => {
    const { token } = await createToken('Named Token')
    expect(await findTokenName(token)).toBe('Named Token')
  })

  it('findTokenName returns null for an unknown token', async () => {
    expect(await findTokenName('sin_unknown')).toBeNull()
  })

  it('trims token names to 60 characters', async () => {
    await createToken('a'.repeat(100))
    const records = await listTokens()
    expect(records[0].name).toHaveLength(60)
  })
})
