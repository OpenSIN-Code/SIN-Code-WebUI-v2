# `app/api/auth/[...all]/route.ts`

Better Auth catch-all handler.

## What it does

Proxies all GET and POST requests to `better-auth` via `toNextJsHandler`. If
Better Auth is not configured (no `DATABASE_URL` + `BETTER_AUTH_SECRET`), returns
503 with `{ error: 'Auth not configured' }`.

## Dependencies

- `lib/auth/better-auth.ts` for `getAuth()`.
- `better-auth/next-js` for the Next.js handler adapter.

## Important values

- Path: `/api/auth/*`.
- Both GET and POST are supported because Better Auth uses both verbs.

## Caveats

This route is public by necessity (Better Auth handles its own session
cookies). The legacy token-auth layer (`lib/auth.ts`) remains active when Better
Auth is disabled.
