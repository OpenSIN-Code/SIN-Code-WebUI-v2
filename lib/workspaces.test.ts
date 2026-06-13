// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockReadFile, mockWriteFile, mockMkdir, mockRename, mockPoolQuery, mockIsDbConfigured } = vi.hoisted(() => ({
  mockReadFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockRename: vi.fn(),
  mockPoolQuery: vi.fn(),
  mockIsDbConfigured: vi.fn().mockReturnValue(false),
}))

vi.mock('@/lib/db', () => ({
  isDbConfigured: (...args: unknown[]) => mockIsDbConfigured(...args),
  getPool: () => ({ query: (...args: unknown[]) => mockPoolQuery(...args) }),
}))

vi.mock('@/lib/workspaces-shared', () => ({
  ALL_TOOL_KEYS: ['sin_status', 'sin_execute', 'web_search'],
  BUILT_IN_WORKSPACES: [{ id: 'code', name: 'code', builtIn: true }],
}))

vi.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  rename: (...args: unknown[]) => mockRename(...args),
}))

import { isValidWorkspaceId, workspaceIdFromName } from './workspaces'

const loadWorkspacesModule = () => import('./workspaces')

// -------------------------------------------------------------------------
// Pure helpers — no module state.
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// FS branch — DB unconfigured, fs mocked per-test.
// -------------------------------------------------------------------------
describe('workspaces fs branch', () => {
  beforeEach(() => {
    mockIsDbConfigured.mockReturnValue(false)
    mockReadFile.mockReset().mockRejectedValue(new Error('ENOENT'))
    mockWriteFile.mockReset()
    mockMkdir.mockReset()
    mockRename.mockReset()
    mockPoolQuery.mockReset()
  })

  it('upsertCustomWorkspace sanitizes input and persists via file', async () => {
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
    mockRename.mockResolvedValue(undefined)
    const mod = await loadWorkspacesModule()
    const name = 'Short' + '!'.repeat(60)
    await mod.upsertCustomWorkspace(
      {
        id: 'my-ws',
        name: '  ' + name + '  ',
        description: '   ' + 'A'.repeat(200) + '   ',
        icon: 'rocket',
        systemPrompt: 'B'.repeat(5000),
        enabledTools: ['sin_status', 'web_search', 'unknown-tool'],
        defaultModel: 'anthropic/claude-sonnet-4.5',
        layout: 'chat',
      },
      'user-1',
    )
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    const body = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as Array<{
      id: string
      name: string
      description: string
      systemPrompt: string
      enabledTools: string[]
      builtIn: boolean
      userId: string | null
    }>
    expect(body[0].id).toBe('my-ws')
    expect(body[0].name.length).toBe(60)
    expect(body[0].name.startsWith('Short')).toBe(true)
    expect(body[0].name.endsWith('!')).toBe(true)
    expect(body[0].description.length).toBe(160)
    expect(body[0].description.startsWith('A')).toBe(true)
    expect(body[0].systemPrompt.length).toBe(4000)
    expect(body[0].enabledTools).toEqual(['sin_status', 'web_search'])
    expect(body[0].builtIn).toBe(false)
    expect(body[0].userId).toBe('user-1')
    expect(mockMkdir).toHaveBeenCalled()
    expect(mockRename).toHaveBeenCalled()
    expect(mockPoolQuery).not.toHaveBeenCalled()
  })

  it('upsertCustomWorkspace rejects reserved built-in ids', async () => {
    const mod = await loadWorkspacesModule()
    await expect(
      mod.upsertCustomWorkspace(
        {
          id: 'code',
          name: 'X',
          description: '',
          icon: '',
          systemPrompt: '',
          enabledTools: [],
          defaultModel: '',
          layout: 'chat',
        },
        null,
      ),
    ).rejects.toThrow(/reserved/)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('listWorkspaces reads from fs and merges with built-ins', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 'extra',
          name: 'Extra',
          description: '',
          icon: '',
          systemPrompt: '',
          enabledTools: ['sin_status'],
          defaultModel: '',
          layout: 'chat',
          userId: null,
          builtIn: false,
        },
      ]),
    )
    const mod = await loadWorkspacesModule()
    const ws = await mod.listWorkspaces('u1')
    expect(ws.map((w) => w.id)).toEqual(['code', 'extra'])
    expect(ws.find((w) => w.id === 'extra')!.builtIn).toBe(false)
    expect(ws.find((w) => w.id === 'extra')!.enabledTools).toEqual(['sin_status'])
    expect(mockPoolQuery).not.toHaveBeenCalled()
  })

  it('getWorkspace returns built-in first, then fs lookup', async () => {
    mockReadFile.mockResolvedValueOnce('[]')
    const mod = await loadWorkspacesModule()
    expect((await mod.getWorkspace('code', 'u1'))!.id).toBe('code')
    expect(await mod.getWorkspace('unknown', 'u1')).toBeNull()
  })

  it('deleteCustomWorkspace returns false for built-in IDs', async () => {
    const mod = await loadWorkspacesModule()
    expect(await mod.deleteCustomWorkspace('code', 'u1')).toBe(false)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('deleteCustomWorkspace returns false when id is not present', async () => {
    mockReadFile.mockResolvedValueOnce('[]')
    const mod = await loadWorkspacesModule()
    expect(await mod.deleteCustomWorkspace('not-here', 'u1')).toBe(false)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('deleteCustomWorkspace removes entry and writes file', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify([
        { id: 'a', builtIn: false, name: 'A' },
        { id: 'b', builtIn: false, name: 'B' },
      ]),
    )
    mockWriteFile.mockResolvedValue(undefined)
    const mod = await loadWorkspacesModule()
    expect(await mod.deleteCustomWorkspace('a', 'u1')).toBe(true)
    const body = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as Array<{ id: string }>
    expect(body.map((w) => w.id)).toEqual(['b'])
  })
})

// -------------------------------------------------------------------------
// DB branch — DB configured, fs calls should be 0.
// -------------------------------------------------------------------------
describe('workspaces db branch', () => {
  beforeEach(() => {
    mockIsDbConfigured.mockReturnValue(true)
    mockReadFile.mockReset()
    mockWriteFile.mockReset()
    mockMkdir.mockReset()
    mockRename.mockReset()
    mockPoolQuery.mockReset()
  })

  it('listWorkspaces queries pool with userId when present', async () => {
    mockPoolQuery.mockResolvedValue({
      rows: [
        {
          id: 'extra',
          name: 'Extra',
          description: '',
          icon: '',
          system_prompt: '',
          enabled_tools: ['sin_status'],
          default_model: '',
          layout: 'chat',
          user_id: 'u1',
          builtIn: false,
        },
      ],
    })
    const mod = await loadWorkspacesModule()
    const ws = await mod.listWorkspaces('u1')
    expect(ws.find((w) => w.id === 'extra')!.enabledTools).toEqual(['sin_status'])
    expect(mockPoolQuery).toHaveBeenCalled()
    const [sql, params] = mockPoolQuery.mock.calls[0]
    expect(sql).toMatch(/user_id/)
    expect((params as unknown[])[0]).toBe('u1')
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  it('listWorkspaces queries pool without userId filter when userId is null', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] })
    const mod = await loadWorkspacesModule()
    await mod.listWorkspaces(null)
    const [sql, params] = mockPoolQuery.mock.calls[0]
    expect(sql).not.toMatch(/OR user_id/)
    expect(params).toEqual([])
  })

  it('listWorkspaces returns just the built-in when pool returns no rows', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] })
    const mod = await loadWorkspacesModule()
    const ws = await mod.listWorkspaces('u1')
    expect(ws.length).toBe(1)
    expect(ws[0].id).toBe('code')
  })

  it('upsertCustomWorkspace inserts via pool when DB configured', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] })
    const mod = await loadWorkspacesModule()
    await mod.upsertCustomWorkspace(
      {
        id: 'new-ws',
        name: 'New',
        description: 'd',
        icon: '',
        systemPrompt: 'sp',
        enabledTools: ['sin_status'],
        defaultModel: 'm',
        layout: 'chat',
      },
      'u1',
    )
    expect(mockPoolQuery).toHaveBeenCalledTimes(1)
    const [sql, params] = mockPoolQuery.mock.calls[0]
    expect(sql).toMatch(/INSERT INTO workspaces/)
    expect(sql).toMatch(/ON CONFLICT/)
    expect((params as unknown[])[0]).toBe('new-ws')
    expect((params as unknown[]).at(-1)).toBe('u1')
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('upsertCustomWorkspace sanitizes and filters tools in DB branch too', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [] })
    const mod = await loadWorkspacesModule()
    await mod.upsertCustomWorkspace(
      {
        id: 'sanit',
        name: '   ' + 'X'.repeat(80) + '   ',
        description: ' '.repeat(300),
        icon: '',
        systemPrompt: 'C'.repeat(5000),
        enabledTools: ['sin_status', 'unknown-tool'],
        defaultModel: '',
        layout: 'chat',
      },
      'u2',
    )
    const [sql, params] = mockPoolQuery.mock.calls[0]
    expect(sql).toMatch(/INSERT INTO workspaces/)
    const p = params as Array<string | string[] | null>
    expect((p[1] as string).length).toBe(60)
    expect((p[2] as string).length).toBe(0)
    expect((p[4] as string).length).toBe(4000)
    expect(p[5]).toEqual(['sin_status'])
    expect(p[p.length - 1]).toBe('u2')
  })

  it('upsertCustomWorkspace hits the reserved-id early-return when DB configured', async () => {
    const mod = await loadWorkspacesModule()
    await expect(
      mod.upsertCustomWorkspace(
        {
          id: 'code',
          name: 'X',
          description: '',
          icon: '',
          systemPrompt: '',
          enabledTools: [],
          defaultModel: '',
          layout: 'chat',
        },
        null,
      ),
    ).rejects.toThrow(/reserved/)
    expect(mockPoolQuery).not.toHaveBeenCalled()
  })

  it('deleteCustomWorkspace returns true when rowCount > 0', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 1 })
    const mod = await loadWorkspacesModule()
    expect(await mod.deleteCustomWorkspace('x', 'u1')).toBe(true)
    const [sql, params] = mockPoolQuery.mock.calls[0]
    expect(sql).toMatch(/user_id = \$2/)
    expect(params).toEqual(['x', 'u1'])
  })

  it('deleteCustomWorkspace returns false when rowCount is 0', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 })
    const mod = await loadWorkspacesModule()
    expect(await mod.deleteCustomWorkspace('x', 'u1')).toBe(false)
  })

  it('deleteCustomWorkspace DB path with null userId skips user filter', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 1 })
    const mod = await loadWorkspacesModule()
    expect(await mod.deleteCustomWorkspace('x', null)).toBe(true)
    const [sql, params] = mockPoolQuery.mock.calls[0]
    expect(sql).toMatch(/DELETE FROM workspaces WHERE id/)
    expect(params).toEqual(['x'])
  })
})
