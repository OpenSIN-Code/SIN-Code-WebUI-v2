/**
 * Purpose: Single source of truth for the sin-code Go backend surface.
 * Docs: https://github.com/OpenSIN-Code/SIN-Code-Bundle (cmd/sin-code)
 * Related issues: #1, #2, #3, #4, #5
 *
 * Generated from SIN-Code-Bundle@main:
 * - Subcommands: cmd/sin-code/main.go (32 registered commands)
 * - MCP tools:   cmd/sin-code/internal/serve.go (44 sin_* tools)
 *
 * IMPORTANT: keep these lists in sync with the Go source. Do NOT
 * hand-maintain divergent copies in route handlers or prompts —
 * import from this module instead.
 */

/** All 32 sin-code subcommands (v2.5.0). Source: cmd/sin-code/main.go */
export const SIN_CODE_SUBCOMMANDS = [
  // Core analysis & search (13)
  'discover',
  'execute',
  'map',
  'grasp',
  'scout',
  'harvest',
  'orchestrate',
  'ibd',
  'poc',
  'sckg',
  'adw',
  'oracle',
  'efm',
  // Server & security (4)
  'serve',
  'security',
  'sbom',
  'config',
  // Lifecycle (1)
  'self-update',
  // State (3)
  'todo',
  'notifications',
  'memory',
  // Read/Write/Edit/LSP (4)
  'read',
  'write',
  'edit',
  'lsp',
  // Plugin & index (2)
  'plugin',
  'index',
  // Orchestrator (4)
  'orchestrator-run',
  'orchestrator-agents',
  'orchestrator-plan',
  'agent',
  // UI (2)
  'tui',
  'webui',
] as const

export type SinCodeSubcommand = (typeof SIN_CODE_SUBCOMMANDS)[number]

/** All 44 MCP tools exposed by `sin-code serve`. Source: cmd/sin-code/internal/serve.go */
export const SIN_MCP_TOOLS = [
  // Architecture & code-graph
  'sin_sckg',
  'sin_map',
  'sin_grasp',
  'sin_adw',
  // Search & discovery
  'sin_discover',
  'sin_scout',
  'sin_harvest',
  'sin_read',
  // Mutation
  'sin_write',
  'sin_edit',
  'sin_index',
  // Verification
  'sin_poc',
  'sin_ibd',
  'sin_oracle',
  'sin_efm',
  // Execution & orchestration
  'sin_execute',
  'sin_orchestrate',
  'sin_orchestrator_run',
  'sin_orchestrator_plan',
  'sin_orchestrator_agents',
  // Agents
  'sin_agent_show',
  'sin_agent_set',
  'sin_agent_doctor',
  // LSP
  'sin_lsp_servers',
  // Todo
  'sin_todo_add',
  'sin_todo_list',
  'sin_todo_show',
  'sin_todo_complete',
  'sin_todo_claim',
  'sin_todo_ready',
  'sin_todo_blocked',
  'sin_todo_search',
  'sin_todo_prime',
  'sin_todo_stats',
  'sin_todo_dep_add',
  'sin_todo_deps',
  // Memory
  'sin_memory_add',
  'sin_memory_list',
  'sin_memory_search',
  'sin_memory_prime',
  'sin_memory_stats',
  // Notifications
  'sin_notifications_list',
  'sin_notifications_stats',
  'sin_notifications_mark_read',
] as const

export type SinMcpTool = (typeof SIN_MCP_TOOLS)[number]

export const SIN_CODE_INSTALL_CMD =
  'go install github.com/OpenSIN-Code/SIN-Code-Bundle/cmd/sin-code@latest'

export const SIN_CODE_REPO_URL = 'https://github.com/OpenSIN-Code/SIN-Code-Bundle'
