# `app/api/workspaces/route.ts`

Workspace CRUD endpoint.

## What it does

- `GET` — lists built-in and custom workspaces for the current actor.
- `POST` — creates or updates a custom workspace.
- `DELETE` — deletes a custom workspace owned by the current actor.

## Dependencies

- `lib/sin/guard.ts` for auth + rate limiting.
- `lib/session.ts` for the user session.
- `lib/workspaces.ts` for workspace persistence logic.

## Important values

- Valid layouts: `chat`, `writing`, `data`.
- Default model: `anthropic/claude-sonnet-4.5`.
- Workspace ids must satisfy `isValidWorkspaceId()`.

## Caveats

Built-in workspaces cannot be deleted from this endpoint. Custom workspaces are
scoped per user when Better Auth is enabled.
