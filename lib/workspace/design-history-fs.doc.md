# `lib/workspace/design-history-fs.ts`

Filesystem implementation of the Design Mode undo/redo stacks.

## What it does

Stores JSONL history and redo stacks in `.sin-webui/design-history.jsonl` and
`.sin-webui/design-redo.jsonl`. Exports `getHistory`, `pushEntry`, `undo`, `redo`,
and `clearHistory`.

## Dependencies

- `node:fs` and `node:path`.
- Imported dynamically by `lib/workspace/design-history.ts` to keep the public
  API NFT-clean.

## Important values

- `MAX_ENTRIES = 100` per stack; older entries are discarded.
- History is stored as JSONL, one entry per line.

## Caveats

`undo` and `redo` mutate the actual source file by swapping the old/new class
strings. If the file has changed since the entry was recorded, the operation may
throw. Callers should handle errors and refresh the canvas state.
