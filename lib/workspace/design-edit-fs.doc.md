# `lib/workspace/design-edit-fs.ts`

Filesystem layer for applying Design Mode class edits.

## What it does

Provides `applyClassEdit`, which reads a file, locates a class string near the
reported line, replaces it, writes the file back, and pushes a history entry for
undo/redo. It also validates that the requested path stays inside the workspace
root.

## Dependencies

- `node:fs` and `node:path`.
- `lib/workspace/design-history.ts` for history tracking.
- Called by `app/api/workspace/design-edit/route.ts`.

## Important values

- Search window: ±3 lines around the reported line number.
- Writes are performed after a successful replace; if the old class string is
  not found, a 409 Conflict is returned.

## Security notes

`safeResolve` rejects paths that escape the workspace root, preventing
path-traversal edits outside the project.

## Caveats

The line number reported by the design canvas may be slightly off due to edits
since the last scan, so the search window is intentionally generous.
