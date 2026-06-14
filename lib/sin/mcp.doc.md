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
| `sin-websearch-server` | `[]` | `$SIN_WEBSEARCH_BIN` or `sin-websearch-server` |

Future siblings (planned) will join this file conditionally:
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

## Sister project — AutoDev-CLI

The `autodev-mcp` server is owned by
[`OpenSIN-Code/autodev-cli`](https://github.com/OpenSIN-Code/autodev-cli).
Its consumer-side design (bridge pattern, no business logic in the MCP
adapter, stdout JSON-RPC + 300 s timeout) is documented in
[`docs/MCP.md`](https://github.com/OpenSIN-Code/autodev-cli/blob/main/docs/MCP.md).

## Sister project — sin-websearch

The `sin-websearch-server` MCP exposes the
[SerpAPI multi-key pool](https://github.com/OpenSIN-Code/sin-websearch)
to the chat model. Five tools (`websearch_search`, `websearch_status`,
`websearch_cache`, `websearch_history`, `websearch_rate_limit`). Tool
names carry the `websearch_*` prefix to avoid colliding with the
sin-code `sin_*` namespace.

Install: `pipx install sin-websearch` (note: the entry-point script is
named `sin-websearch-server`, not `sin-websearch` — see
`resolveSinWebsearchBin()`).

## Checklist — add a new sibling

When extending this file to a third / fourth / … sibling:

1. Add the server command to the table in **What it does**.
2. Update the `available` map type in `lib/sin/mcp.ts:getAllMcpTools()`.
3. Add the tool list to a new `*_MCP_TOOLS` const in `lib/sin/tools.ts`
   — never hand-maintain a copy elsewhere. Also export `*_REPO_URL`
   and `*_INSTALL_CMD` for the Settings panel.
4. Add `*.test.ts` exercising success + degrade paths (5–6 per sibling).
5. Update this `.doc.md` and `AGENTS.md` §3 row.
6. Cross-link the sibling's user-facing docs in this section.
