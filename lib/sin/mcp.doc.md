# `lib/sin/mcp.ts`

MCP client bridge that exposes the sin-code Go server to the chat model.

## What it does

Connects to `sin-code serve` over stdio using the AI SDK 6 MCP client and returns
the dynamic `sin_*` toolset. If the binary is missing or crashes, the function
returns an empty toolset so the chat can still function as a plain LLM.

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

## Important values

- Command: `sin-code serve` (or `$SIN_CODE_BIN serve`).
- Returns `{ tools, close, available }`.

## Caveats

`close()` is returned even on failure so callers can always `await sin.close()`
without guarding for null. The `available` flag is used to append a fallback
notice to the system prompt when the binary is missing.
