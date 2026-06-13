# `components/chat/tool-call.tsx`

Collapsible tool-call badge for assistant messages.

## What it does

Displays a running/done/error badge for each tool invocation, including an
icon, label, and optional expandable JSON detail panel.

## Dependencies

- `lucide-react` icons.
- Used by `components/chat/chat-view.tsx`.

## Important values

- States: `running`, `done`, `error`.
- Icon mapping for common tool names (`bash`, `read`, `write`, `edit`, `grep`,
  `glob`, `websearch`, `webfetch`). Unknown tools fall back to `Wrench`.

## Caveats

Tool detail is displayed as pretty-printed JSON. If the detail string is not
valid JSON, the raw string is shown instead.
