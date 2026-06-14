# `lib/sin/mcp.ts`

MCP client bridge that exposes the **sin-code Go server** PLUS a curated
set of sibling MCP servers to the chat model.

## What it does

Connects to one or more stdio MCP servers using the AI SDK 6 MCP client
and returns a merged `ToolSet`. If a binary is missing, the corresponding
child call returns an empty toolset so the chat still functions as a plain
LLM conversation.

Currently supported servers (auto-spawned in parallel by
`getAllMcpTools()`):

| Command | Args | Resolves binary via |
|---|---|---|
| `sin-code` | `serve` | `$SIN_CODE_BIN` or `sin-code` |
| `autodev-mcp` | `[]` | `$AUTODEV_MCP_BIN` or `autodev-mcp` |

Future siblings (planned) will join this file conditionally:
- `sin-websearch serve` (#91)
- `sin-context-bridge serve`

## Dependencies

- `@ai-sdk/mcp` (`createMCPClient`) and `@ai-sdk/mcp/mcp-stdio`
  (`Experimental_StdioMCPTransport`).
- `ai` for the `ToolSet` type.
- Called by `app/api/chat/route.ts` before every streaming request.

## Why these decisions

AI SDK 6 removed the MCP client from the `ai` package. The old import path
`ai/mcp-stdio` no longer exists; `@ai-sdk/mcp` is the supported replacement.
This module centralizes that wiring so route handlers never import the wrong
path.

Sibling servers are spawned in **parallel** (`Promise.all`) and merged into
a single `ToolSet`. Each client's lifecycle is tracked individually by its
`available` flag so a missing autodev binary doesn't break sin-code tools.

## Important values

- sin-code command: `sin-code serve` (or `$SIN_CODE_BIN serve`).
- autodev-mcp command: `autodev-mcp` (or `$AUTODEV_MCP_BIN`).
- Returns `{ tools: ToolSet, close: () => Promise<void>, available: { 'sin-code': boolean; autodev: boolean } }`.

## Caveats

- `close()` is returned even when a binary fails (no-op then), so callers
  can `await mcp.close()` without guarding.
- The `available` flag is used to append a fallback notice to the system
  prompt when **sin-code** is missing. Both autodev-mcp and the future
  sin-websearch clients drop their own tools silently — they don't add
  a fallback for the model.
- Tool names cannot collide across siblings. Sibling authors MUST prefix
  their tools (e.g. `autodev_status`, `sin_websearch_search`).
