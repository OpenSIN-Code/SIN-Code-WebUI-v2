# `lib/sin/agents.ts`

Agent mode definitions that specialize the chat model's behavior.

## What it does

Defines five agent modes (`auto`, `build`, `review`, `plan`, `scout`). Each mode
injects a routing policy into the system prompt so the model behaves like a
specialized SIN-Code agent rather than a generic chatbot.

## Dependencies

- `agentPrompt()` is called from `app/api/chat/route.ts`.
- The prompt text references concrete MCP tools (e.g. `sin_read`, `sin_edit`,
  `sin_oracle`) so the agent modes stay aligned with `lib/sin/tools.ts`.

## Important values

- `auto` — empty prompt; SIN routes tools automatically.
- `build` — implements end-to-end changes; mandatory read → edit → diff →
  verify loop.
- `review` — read-only critic; allowed tools are whitelisted explicitly.
- `plan` — decomposes work into orchestrated tasks and todos.
- `scout` — read-only codebase exploration with file paths and line references.

## Caveats

The prompt strings are authoritative. When MCP tools are renamed or added, the
agent prompts should be reviewed for stale references.
