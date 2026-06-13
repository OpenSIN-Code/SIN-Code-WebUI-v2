# `components/sin-status-tile.tsx`

Status tile for the SIN-Code backend on the homepage.

## What it does

Fetches `/api/sin/status` with SWR and displays the installed version,
subcommand count, and MCP tool count. When the binary is missing, it shows a
warning with a copyable install command.

## Dependencies

- `swr` for data fetching.
- `lucide-react` icons.
- `lib/sin/tools.ts` for `SIN_CODE_REPO_URL`.
- Used on `app/page.tsx`.

## Important values

- Polls on mount only (`revalidateOnFocus: false`).
- Can be dismissed by the user.
- Falls back to a `window.prompt` when the clipboard API is unavailable.

## Caveats

The tile is a visual indicator; it does not block the chat UI. The chat route
adds a fallback notice to the system prompt when the binary is missing.
