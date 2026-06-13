// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import {
  ALL_TOOL_KEYS,
  BUILT_IN_WORKSPACES,
  type Workspace,
} from './workspaces-shared'

describe('workspaces-shared', () => {
  it('exposes all tool keys', () => {
    expect(ALL_TOOL_KEYS).toEqual(
      expect.arrayContaining([
        'sin_status',
        'sin_execute',
        'sin_todos',
        'sin_memory',
        'sin_agents',
        'sin_search',
        'sin_map',
        'web_search',
        'render_chart',
      ]),
    )
    expect(ALL_TOOL_KEYS).toHaveLength(9)
  })

  it('provides built-in workspaces with required fields', () => {
    expect(BUILT_IN_WORKSPACES.length).toBeGreaterThan(0)
    for (const ws of BUILT_IN_WORKSPACES) {
      expect(ws.builtIn).toBe(true)
      expect(ws.id).toBeTruthy()
      expect(ws.name).toBeTruthy()
      expect(ws.systemPrompt).toBeTruthy()
      expect(ws.layout).toMatch(/^(chat|writing|data)$/)
      expect(Array.isArray(ws.enabledTools)).toBe(true)
    }
  })

  it('includes the code and chat presets', () => {
    const ids = BUILT_IN_WORKSPACES.map((w: Workspace) => w.id)
    expect(ids).toContain('code')
    expect(ids).toContain('chat')
  })
})
