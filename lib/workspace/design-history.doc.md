# `lib/workspace/design-history.ts`

Public API for the Design Mode command-pattern history.

## What it does

Defines the `DesignHistoryEntry` type and exposes `getHistory`, `pushEntry`,
`undo`, `redo`, and `clearHistory`. The actual filesystem work is delegated to
`lib/workspace/design-history-fs.ts` via dynamic import so the public surface
stays clean for Next.js / Turbopack NFT analysis.

## Dependencies

- `lib/workspace/design-history-fs.ts` (dynamic import).
- Used by `lib/workspace/design-edit-fs.ts` and `app/api/workspace/design-history/route.ts`.

## Important values

- Entry type is always `'class-change'` for now.
- Each entry receives a UUID and an ISO timestamp when pushed.

## Caveats

`pushEntry` clears the redo stack (standard command-pattern behavior). Undoing
moves the entry to the redo stack; redoing moves it back.
