# `lib/auth/better-auth.ts`

Better Auth configuration using the Kysely adapter.

## What it does

Lazy-initializes a `better-auth` instance backed by the project's existing
PostgreSQL pool via `@better-auth/kysely-adapter`. When `DATABASE_URL` or
`BETTER_AUTH_SECRET` is missing, the function returns `null` and the legacy
token-auth system (`lib/auth.ts` / `lib/session.ts`) remains active.

## Dependencies

- `better-auth` and `@better-auth/kysely-adapter`.
- `lib/db.ts` for `getDb()` and `getPool()`.
- `lib/is-db-configured.ts` for the database availability check.
- Used by `app/api/auth/[...all]/route.ts` and `lib/session.ts`.

## Important values

- `BETTER_AUTH_SECRET` is required for the instance to be enabled.
- `BETTER_AUTH_URL` defaults to `http://localhost:3000`.
- Trusted origins include `localhost:3000` and `localhost:3100` so Docker port
  remapping does not break auth callbacks.
- First user is assigned `role='owner'`; subsequent users are `member`.

## Caveats

`getAuth()` caches the instance in `_auth`. If env vars change at runtime, the
process must be restarted. The `AuthInstance` and `Session` types are currently
`any` until better-auth types are fully wired across the project.
