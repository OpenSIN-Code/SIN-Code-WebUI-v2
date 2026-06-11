import { experimental_createMCPClient as createMCPClient } from 'ai'
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio'
import type { ToolSet } from 'ai'

/**
 * Connect to the SIN-Code-Bundle unified MCP server (`sin serve`)
 * over stdio and expose its 37 tools (sin_read, sin_edit, sin_bash,
 * sin_search, sckg/impact, semantic_diff, recall/remember, ...) to
 * the model.
 *
 * Graceful degradation: if `sin` is not installed or the server
 * fails to start, we return an empty toolset and the chat still
 * works as a plain LLM conversation.
 */
export async function getSinTools(): Promise<{
  tools: ToolSet
  close: () => Promise<void>
  available: boolean
}> {
  try {
    const client = await createMCPClient({
      transport: new StdioMCPTransport({
        command: 'sin',
        args: ['serve'],
      }),
    })
    const tools = await client.tools()
    return {
      tools,
      close: () => client.close(),
      available: true,
    }
  } catch {
    // sin not installed or sin serve failed — degrade gracefully
    return {
      tools: {},
      close: async () => {},
      available: false,
    }
  }
}
