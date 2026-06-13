# `lib/sin/client.ts`

Typed wrapper around the `sin-code` Go binary for the WebUI backend.

## What it does

Provides `runSinCodeCommand` and `getSinCodeStatus`, which spawn the Go binary
via `execFile` (no shell) and return structured JSON. If the binary is missing,
both functions degrade gracefully to an `installed: false` payload.

## Dependencies

- `lib/sin/tools.ts` for the subcommand whitelist and install command.
- `node:child_process` and `node:util`.
- Used by `app/api/sin/status/route.ts` and any backend route that probes the
  binary synchronously.

## Security notes

- Uses `execFile`, not `exec`, so arguments are passed as an array without shell
  interpolation.
- `SAFE_ARG` regex allows only identifier/path-like tokens; everything else is
  filtered out before execution.
- Subcommand is validated against `SIN_CODE_SUBCOMMANDS` before the binary is
  ever touched.

## Important values

- `SAFE_ARG = /^[a-zA-Z0-9_./:=@~,+-]+$/` — the only acceptable argument shape.
- Default timeout: 30 seconds; status probe: 5 seconds.
- Max output buffer: 8 MiB.

## Caveats

`runSinCodeCommand` always appends `--format json` to the argument list. For
subcommands that emit plain text (e.g. help), the raw stdout is returned as a
string payload.
