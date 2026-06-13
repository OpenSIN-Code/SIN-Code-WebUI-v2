// SPDX-License-Identifier: MIT

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  isDbConfigured: vi.fn().mockReturnValue(false),
  getPool: vi.fn().mockReturnValue({ query: vi.fn() }),
}))

vi.mock('@/lib/workspaces-shared', () => ({
  ALL_TOOL_KEYS: ['sin_status', 'sin_execute'],
  BUILT_IN_WORKSPACES: [],
}))

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
}))

import { isValidWorkspaceId, workspaceIdFromName } from './workspaces'

describe('workspaces pure helpers', () => {
  describe('isValidWorkspaceId()', () => {
    it('accepts lowercase hyphenated ids', () => {
      expect(isValidWorkspaceId('my-workspace')).toBe(true)
    })

    it('accepts numeric ids', () => {
      expect(isValidWorkspaceId('workspace123')).toBe(true)
    })

    it('rejects uppercase letters', () => {
      expect(isValidWorkspaceId('MyWorkspace')).toBe(false)
    })

    it('rejects ids that are too long', () => {
      expect(isValidWorkspaceId('a'.repeat(41))).toBe(false)
    })

    it('rejects empty ids', () => {
      expect(isValidWorkspaceId('')).toBe(false)
    })

    it('rejects ids with special characters', () => {
      expect(isValidWorkspaceId('my_workspace')).toBe(false)
      expect(isValidWorkspaceId('my workspace')).toBe(false)
    })
  })

  describe('workspaceIdFromName()', () => {
    it('slugifies a normal name', () => {
      const id = workspaceIdFromName('My Workspace')
      expect(id.startsWith('my-workspace-')).toBe(true)
    })

    it('falls back to workspace when the name has no valid characters', () => {
      const id = workspaceIdFromName('!!!')
      expect(id.startsWith('workspace-')).toBe(true)
    })

    it('truncates long names to 30 characters', () => {
      const id = workspaceIdFromName('a'.repeat(100))
      expect(id.startsWith('a'.repeat(30) + '-')).toBe(true)
    })

    it('includes a random hex suffix', () => {
      const id = workspaceIdFromName('Project')
      expect(id).toMatch(/^project-[a-f0-9]{6}$/)
    })
  })
})
