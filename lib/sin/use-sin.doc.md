# `lib/sin/use-sin.ts`

SWR hooks for all `/api/sin/*` frontend endpoints.

## What it does

Provides `useSinStatus`, `useSinAgents`, `useSinTodos`, `useSinMemory`, and
`useSinNotifications` so React components can poll backend state with consistent
refresh intervals and a shared fetcher.

## Dependencies

- `swr` for data fetching and revalidation.
- Calls the REST endpoints under `app/api/sin/*`.

## Important values

| Hook | Endpoint | Refresh interval |
|---|---|---|
| `useSinStatus` | `/api/sin/status` | 30 seconds |
| `useSinAgents` | `/api/sin/agents` | none (on mount) |
| `useSinTodos` | `/api/sin/todos` | 15 seconds |
| `useSinMemory` | `/api/sin/memory` | none |
| `useSinNotifications` | `/api/sin/notifications` | 20 seconds |

## Caveats

This is a client module; `'use client'` is declared at the top. All hooks
degrade gracefully when the backend returns `{ installed: false }` because the
fetcher just returns the JSON payload.
