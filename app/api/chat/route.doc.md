# `app/api/chat/route.ts`

Streaming chat endpoint backed by the sin-code Go MCP server.

## What it does

Receives a `UIMessage[]` plus optional `model` and `agent` parameters, builds a
system prompt describing the 44 sin-code MCP tools, resolves the workspace and
its enabled tool set, and calls `streamText` from the AI SDK. The response is a
UI message stream.

## Dependencies

- `ai` (`streamText`, `convertToModelMessages`, `stepCountIs`).
- `lib/sin/mcp.ts` for the dynamic MCP toolset.
- `lib/sin/models.ts` for model resolution.
- `lib/sin/agents.ts` for agent persona injection.
- `lib/sin/guard.ts` for auth + rate limiting.
- `lib/sin/tools.ts` for the tool list and install command.
- `lib/session.ts` for the user session.
- `lib/workspaces.ts` for workspace configuration.
- `lib/settings/agent-context.ts` for custom instructions and memories.
- `lib/tools/web-search.ts` and `lib/tools/render-chart.ts` for additional UI tools.

## Important values

- `maxDuration = 120` seconds.
- `SYSTEM_PROMPT` enumerates every MCP tool and routing rules.
- `FALLBACK_NOTICE` is appended when `sin-code` is not installed.
- Tools are filtered by the workspace's `enabledTools` list.
- `stopWhen: stepCountIs(15)` caps tool loops.

## Caveats

The system prompt is static text. When a new MCP tool is added to
`lib/sin/tools.ts`, the prompt section here must also be updated to mention it.
