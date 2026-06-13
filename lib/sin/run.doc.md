# `lib/sin/run.ts`

Generic, audited runner for whitelisted sin-code subcommands.

## What it does

Provides `runSin` and `sinJson` for the `/api/sin/*` route handlers. It
verifies the caller, validates the subcommand and arguments, executes the binary
via `execFile` (no shell), and writes an audit entry for every run.

## Dependencies

- `lib/sin/tools.ts` for the subcommand whitelist and install command.
- `lib/session.ts` for actor resolution.
- `lib/storage.ts` for audit logging.
- `lib/auth.ts` for token verification.

## Security notes

- `assertAuthed()` checks both the session cookie and the `Authorization`
  header.
- `SAFE_TOKEN` allows only safe flag/path/identifier tokens; rejections happen
  before the binary is spawned.
- `execFile` is used instead of `exec` to avoid shell injection.

## Important values

- `SAFE_TOKEN = /^[\w@./:=,\- ]{1,512}$/`
- Timeout: 30 seconds; max buffer: 8 MiB.
- ENOENT responses include the install command so the frontend can show a fix.

## Caveats

`runSin` is intended for routes that need a one-shot JSON response (e.g.
`/api/sin/todos`). Long-running orchestrator output is handled by
`lib/sin/orchestrator-stream.ts` instead.
