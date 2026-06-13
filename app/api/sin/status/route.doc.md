# `app/api/sin/status/route.ts`

Backend status endpoint for the sin-code Go binary.

## What it does

Calls `getSinCodeStatus()` and returns either an `installed: false` payload or
an `installed: true` payload with version, subcommand count, and the full list
of MCP tool names.

## Dependencies

- `lib/sin/client.ts` for the binary probe.
- `lib/sin/tools.ts` for `SIN_MCP_TOOLS` and `SIN_CODE_SUBCOMMANDS`.
- Consumed by `components/sin-status-tile.tsx` and `lib/sin/use-sin.ts`.

## Important values

- Response shape matches `SinCodeStatus` from `lib/sin/client.ts`.
- Capabilities block: `{ hasMCP, subcommandCount, mcpTools }`.

## Caveats

The full tool list is returned here so the frontend never hardcodes MCP tool
names. Keep this response shape in sync with the `Status` type in the status tile.
