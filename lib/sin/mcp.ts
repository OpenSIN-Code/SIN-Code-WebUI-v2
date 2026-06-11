/**
 * Purpose: MCP client bridge to the unified sin-code Go server (`sin-code serve`).
 * Docs: https://github.com/OpenSIN-Code/SIN-Code-Bundle/tree/main/cmd/sin-code
 * Related issues: #2
 *
 * Exposes all 19+ `sin_*` MCP tools to the AI SDK chat model. If the binary
 * is not installed or the server crashes, we return an empty toolset so the
 * chat still works as a plain LLM conversation (graceful degradation).
 */

import { createMCPClient } from 'ai/mcp-stdio'
import { StdioMCPTransport } from 'ai/mcp-stdio'
import type { ToolSet } from 'ai'

/** Resolve the sin-code binary path. Honors $SIN_CODE_BIN for CI/override;
 *  defaults to PATH lookup. */
function resolveSinCodeBin(): string {
  return process.env.SIN_CODE_BIN ?? 'sin-code'
}

/**
 * Connect to `sin-code serve` over stdio and return the 19+ sin_* tools.
 * Always-safe: never throws. Always-closes: client.close() is awaited in
 * the returned `close` function (or skipped if the server never came up).
 */
export async function getSinTools(): Promise<{
  tools: ToolSet
  close: () => Promise<void>
  available: boolean
}> {
  let client: Awaited<ReturnType<typeof createMCPClient>> | null = null

  try {
    client = await createMCPClient({
      transport: new StdioMCPTransport({
        command: resolveSinCodeBin(),
        args: ['serve'],
        env: {
          ...process.env,
          // Optional: filter which tools sin-code exposes (cuts startup time
          // when only a subset is needed). Empty = expose all 19+.
          SIN_CODE_MCP_FILTER: process.env.SIN_CODE_MCP_FILTER ?? '',
        },
      }),
    })
    const tools = await client.tools()
    return {
      tools,
      close: async () => {
        if (client) {
          await client.close().catch((err) => {
            console.warn('[sin-mcp] error closing sin-code client:', err)
          })
        }
      },
      available: true,
    }
  } catch (err) {
    // Binary missing or sin-code serve crashed — degrade gracefully.
    console.warn(
      '[sin-mcp] sin-code not reachable, chat will run without tools:',
      err instanceof Error ? err.message : err,
    )
    if (client) {
      await client.close().catch(() => {})
    }
    return {
      tools: {},
      close: async () => {},
      available: false,
    }
  }
}
