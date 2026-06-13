# `lib/workspace/files-fs.ts`

Filesystem layer for the workspace file tree.

## What it does

Builds a filtered tree of the workspace root, reads individual files, and
enforces a maximum file size for display. Hidden directories like `node_modules`,
`.git`, `.next`, `.sin-webui`, and `dist` are skipped.

## Dependencies

- `node:fs` and `node:path`.
- Called by `app/api/workspace/files/route.ts` and related workspace routes.

## Important values

- `MAX_FILE_SIZE = 512 KiB`. Files larger than this display a placeholder.
- Workspace root defaults to `process.cwd()` and can be overridden with
  `SIN_WORKSPACE_DIR`.

## Security notes

`safeResolve` rejects paths that escape the workspace root.

## Caveats

The tree is built recursively on every request; for very large repos this may
be slow. Consider caching if the tree endpoint becomes a bottleneck.
