# `lib/sin/client.test.ts`

Unit tests for the `sin-code` CLI wrapper in `lib/sin/client.ts`.

## What it does

Mocks `node:child_process.execFile` and `node:util.promisify` to test
`runSinCodeCommand` and `getSinCodeStatus` without calling the real binary.

## Dependencies

- `vitest` for the test runner.
- `lib/sin/client.ts` is the module under test.

## Scenarios covered

- Successful JSON output is parsed and returned.
- Plain-text stdout falls back to a string payload.
- Unsafe arguments are filtered by the `SAFE_ARG` regex.
- Non-zero exit codes produce `{ ok: false, error, exitCode }`.
- ENOENT returns `{ installed: false, installCmd }`.
- Unknown subcommands are rejected before `execFile` runs.
- String exit codes (e.g. max buffer exceeded) are handled gracefully.

## Caveats

The mock for `promisify` is intentionally custom because the real `util.promisify`
expects a callback-style function. The mock bridges the callback to a Promise
so the tests can drive `execFile` through the same path as production code.
