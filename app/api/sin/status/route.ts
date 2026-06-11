/**
 * Purpose: Expose sin-code backend status to the frontend.
 * Docs: GET /api/sin/status → { installed, version?, capabilities?, installCmd? }
 * Related issues: #3
 */

import { getSinCodeStatus } from '@/lib/sin/client'

const MCP_TOOLS = [
  'sin_discover', 'sin_execute', 'sin_map', 'sin_grasp', 'sin_scout',
  'sin_harvest', 'sin_orchestrate', 'sin_ibd', 'sin_poc', 'sin_sckg',
  'sin_adw', 'sin_oracle', 'sin_efm', 'sin_read', 'sin_write',
  'sin_edit', 'sin_lsp', 'sin_index', 'sin_todo', 'sin_memory',
  'sin_notifications',
] as const

export async function GET() {
  const status = await getSinCodeStatus()

  if (!status.installed) {
    return Response.json(status, { status: 200 })
  }

  return Response.json(
    {
      installed: true,
      version: status.version,
      capabilities: {
        hasMCP: true,
        subcommandCount: status.subcommands.length,
        mcpTools: MCP_TOOLS,
      },
    },
    { status: 200 },
  )
}
