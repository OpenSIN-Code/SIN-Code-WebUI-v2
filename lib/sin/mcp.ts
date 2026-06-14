/**
 * Purpose: MCP client bridge to the unified sin-code Go server (`sin-code serve`)
 * + sibling servers (autodev-mcp, future sin-websearch).
 * Docs: mcp.doc.md
 * Related issues: #2 (core), #91 (auto-detection pattern, applied to autodev)
 *
 * AI SDK 6 note: the MCP client moved OUT of the `ai` package.
 * `ai/mcp-stdio` no longer exists — use `@ai-sdk/mcp` instead:
 *   - createMCPClient                from '@ai-sdk/mcp'
 *   - Experimental_StdioMCPTransport from '@ai-sdk/mcp/mcp-stdio'
 *
 * Exposes the 44 `sin_*` MCP tools to the chat model plus, when the
 * respective binaries exist, the autodev-* MCP tools from
 * https://github.com/OpenSIN-Code/autodev-cli. If a binary is not
 * installed or the server crashes, returns an empty toolset so the
 * chat still works as a plain LLM conversation (graceful degradation).
 */
// SPDX-License-Identifier: MIT


import { createMCPClient } from '@ai-sdk/mcp'
import { Experimental_StdioMCPTransport as StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio'
import type { ToolSet } from 'ai'

/** Resolve the sin-code binary path. Honors $SIN_CODE_BIN for CI/override. */
function resolveSinCodeBin(): string {
  return process.env.SIN_CODE_BIN ?? 'sin-code'
}

/** Resolve the autodev-mcp binary path. NO env override yet (PyPI install only). */
function resolveAutodevMcpBin(): string {
  return process.env.AUTODEV_MCP_BIN ?? 'autodev-mcp'
}

/**
 * Connect to a stdio MCP server, return its toolset as a flat ToolSet.
 * Never throws; always returns a usable `close()`. `available` sentinel
 * lets callers know whether the underlying binary was reachable so we
 * can log audience-friendly hints in the UI.
 *
 * The optional `toolPrefix` keeps namespaces distinct (e.g. autodev
 * registers tools named `autodev_status` while sin-code registers
 * `sin_status` — different prefixes prevent collisions when both are
 * loaded in the same chat).
 */
async function getMcpToolsFrom(
  bin: string,
  args: string[],
  label: string,
): Promise<{ tools: ToolSet; close: () => Promise<void>; available: boolean }> {
  let client: Awaited<ReturnType<typeof createMCPClient>> | null = null

  try {
    client = await createMCPClient({
      transport: new StdioMCPTransport({ command: bin, args }),
    })
    const tools = (await client.tools()) as ToolSet
    return {
      tools,
      close: async () => {
        await client?.close().catch((err: unknown) => {
          console.warn(`[sin-mcp] error closing ${label} client:`, err)
        })
      },
      available: true,
    }
  } catch (err) {
    // Binary missing or server failed — degrade gracefully.
    console.warn(
      `[sin-mcp] ${label} not reachable, skipping its tools:`,
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

/**
 * Connect to `sin-code serve` over stdio and return the sin_* toolset.
 * Never throws; always returns a usable `close()`.
 */
export async function getSinTools(): Promise<{
  tools: ToolSet
  close: () => Promise<void>
  available: boolean
}> {
  return getMcpToolsFrom(resolveSinCodeBin(), ['serve'], 'sin-code')
}

/**
 * Connect to `autodev-mcp` (https://github.com/OpenSIN-Code/autodev-cli)
 * over stdio and return the 4 `autodev_*` tools. Gracefully returns an
 * empty toolset if the Python package is not installed.
 */
export async function getAutodevTools(): Promise<{
  tools: ToolSet
  close: () => Promise<void>
  available: boolean
}> {
  return getMcpToolsFrom(resolveAutodevMcpBin(), [], 'autodev-mcp')
}

/**
 * Aggregate MCP clients: spawns every sibling server in parallel, merges
 * their toolsets into a single ToolSet, and returns a single combined
 * `close()` that closes every client. The chat agent receives one big
 * toolset, individual clients stay isolated.
 */
export async function getAllMcpTools(): Promise<{
  tools: ToolSet
  close: () => Promise<void>
  available: { 'sin-code': boolean; autodev: boolean }
}> {
  const [sin, autodev] = await Promise.all([getSinTools(), getAutodevTools()])
  const tools: ToolSet = { ...sin.tools, ...autodev.tools }
  return {
    tools,
    close: async () => {
      await Promise.all([sin.close(), autodev.close()])
    },
    available: { 'sin-code': sin.available, autodev: autodev.available },
  }
}
