/**
 * Purpose: MCP client bridge to the unified sin-code Go server (`sin-code serve`).
 * Docs: https://github.com/OpenSIN-Code/SIN-Code-Bundle/tree/main/cmd/sin-code
 * Related issues: #2
 *
 * AI SDK 6 note: the MCP client moved OUT of the `ai` package.
 * `ai/mcp-stdio` no longer exists — use `@ai-sdk/mcp` instead:
 *   - createMCPClient                from '@ai-sdk/mcp'
 *   - Experimental_StdioMCPTransport from '@ai-sdk/mcp/mcp-stdio'
 *
 * Exposes the 44 `sin_*` MCP tools to the chat model. If the binary is
 * not installed or the server crashes, returns an empty toolset so the
 * chat still works as a plain LLM conversation (graceful degradation).
 */

import { createMCPClient } from '@ai-sdk/mcp'
import { Experimental_StdioMCPTransport as StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio'
import type { ToolSet } from 'ai'

/** Resolve the sin-code binary path. Honors $SIN_CODE_BIN for CI/override. */
function resolveSinCodeBin(): string {
  return process.env.SIN_CODE_BIN ?? 'sin-code'
}

/**
 * Connect to `sin-code serve` over stdio and return the sin_* toolset.
 * Never throws; always returns a usable `close()`.
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
      }),
    })
    const tools = (await client.tools()) as ToolSet
    return {
      tools,
      close: async () => {
        await client?.close().catch((err: unknown) => {
          console.warn('[sin-mcp] error closing sin-code client:', err)
        })
      },
      available: true,
    }
  } catch (err) {
    // Binary missing or `sin-code serve` failed — degrade gracefully.
    console.warn(
      '[sin-mcp] sin-code not reachable, chat will run without tools:',
      err instanceof Error ? err.message : err,
    )
    await client?.close().catch(() => {})
    return {
      tools: {},
      close: async () => {},
      available: false,
    }
  }
}
