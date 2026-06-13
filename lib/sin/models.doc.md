# `lib/sin/models.ts`

Model tier definitions and gateway resolution for the chat UI.

## What it does

Maps friendly UI ids (`sin-code-pro`, `sin-code-fast`, `sin-code-mini`) to real
Vercel AI Gateway model strings. Each tier can be overridden via environment
variables; raw gateway strings are also allowed to pass through.

## Dependencies

- Used by `components/chat/chat-view-wrapper.tsx` and `app/api/chat/route.ts`.
- `lib/sin/tools.ts` is unrelated; model configuration lives here.

## Important values

| UI id | Default gateway | Override env |
|---|---|---|
| `sin-code-pro` | `anthropic/claude-sonnet-4.5` | `SIN_MODEL_PRO` |
| `sin-code-fast` | `openai/gpt-5-mini` | `SIN_MODEL_FAST` |
| `sin-code-mini` | `google/gemini-3-flash` | `SIN_MODEL_MINI` |

- Fallback when no id matches: `process.env.SIN_CHAT_MODEL` or
  `openai/gpt-5-mini`.

## Caveats

`resolveModel` accepts any string containing `/` as a raw gateway id. This lets
operators set `SIN_CHAT_MODEL=anthropic/claude-opus-4.6` without adding a new
tier.
