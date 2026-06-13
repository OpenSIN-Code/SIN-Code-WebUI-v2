// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import {
  SIN_CODE_SUBCOMMANDS,
  SIN_MCP_TOOLS,
  SIN_CODE_INSTALL_CMD,
  SIN_CODE_REPO_URL,
} from './tools'

describe('sin-code tools registry', () => {
  it('exposes a non-empty subcommand list', () => {
    expect(SIN_CODE_SUBCOMMANDS.length).toBeGreaterThan(0)
  })

  it('includes core discovery and execution subcommands', () => {
    expect(SIN_CODE_SUBCOMMANDS).toEqual(
      expect.arrayContaining([
        'discover',
        'execute',
        'map',
        'grasp',
        'scout',
        'harvest',
        'orchestrate',
        'serve',
        'security',
        'sbom',
        'config',
        'todo',
        'memory',
        'read',
        'write',
        'edit',
        'lsp',
        'tui',
        'webui',
      ]),
    )
  })

  it('exposes a non-empty MCP tool list', () => {
    expect(SIN_MCP_TOOLS.length).toBeGreaterThan(0)
  })

  it('includes todo and memory MCP tools', () => {
    expect(SIN_MCP_TOOLS).toEqual(
      expect.arrayContaining([
        'sin_todo_add',
        'sin_todo_list',
        'sin_todo_complete',
        'sin_memory_add',
        'sin_memory_list',
        'sin_memory_search',
      ]),
    )
  })

  it('includes the install command constant', () => {
    expect(SIN_CODE_INSTALL_CMD).toContain('go install')
    expect(SIN_CODE_INSTALL_CMD).toContain('SIN-Code-Bundle/cmd/sin-code@latest')
  })

  it('includes the repo URL constant', () => {
    expect(SIN_CODE_REPO_URL).toBe(
      'https://github.com/OpenSIN-Code/SIN-Code-Bundle',
    )
  })
})
