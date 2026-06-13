/**
 * Purpose: Expose sin-code backend status to the frontend.
 * Docs: route.doc.md
 * Related issues: #3, #5
 *
 * The response shape matches `SinCodeStatus` from lib/sin/client.ts and the
 * `Status` type in components/sin-status-tile.tsx — keep all three in sync.
 */
// SPDX-License-Identifier: MIT


import { getSinCodeStatus } from '@/lib/sin/client'
import { SIN_MCP_TOOLS } from '@/lib/sin/tools'

export async function GET() {
  const status = await getSinCodeStatus()

  if (!status.installed) {
    // { installed: false, error, installCmd }
    return Response.json(status)
  }

  return Response.json({
    installed: true as const,
    version: status.version,
    capabilities: {
      hasMCP: true,
      subcommandCount: status.subcommands.length,
      mcpTools: SIN_MCP_TOOLS,
    },
  })
}
