# `lib/sin/orchestrator-stream.ts` + `orchestrator-stream-impl.ts`

Long-running SSE stream for the `sin-code orchestrator-run` subcommand.

## What it does

`orchestrator-stream.ts` is a thin NFT-clean façade that dynamically imports
`orchestrator-stream-impl.ts`. The impl file spawns `sin-code orchestrator-run`
and streams stdout/stderr back to the browser as Server-Sent Events.

## Dependencies

- `orchestrator-stream.ts` is called by `app/api/sin/orchestrator/stream/route.ts`.
- `orchestrator-stream-impl.ts` imports `node:child_process` dynamically inside
the `ReadableStream` start function.

## Why two files

Next.js 16.2.6 / Turbopack still flags any module that transitively references
`node:child_process`, `fs`, `path`, or `process.cwd()` at the route boundary
(Issues #59 / #60). The two-layer dynamic import keeps the route handler clean.
`orchestrator-stream.ts` is marked `/* __sin_nft_clean__ */` for visibility.

## Important values

- Timeout: 280 seconds (just under the 5-minute edge limit).
- Events: `line`, `error`, `done`.
- The abort signal sends `SIGTERM` to the child.

## Caveats

If the binary is missing, the stream emits an `error` event with a human-readable
message and closes. The caller is responsible for setting `Cache-Control: no-cache`
headers; those are already set in the response returned by the impl.
