# `app/api/health/route.ts`

Public health endpoint for container and uptime monitoring.

## What it does

Returns `{ ok, db }` where `db` is `ok`, `error`, or `file` depending on whether
`DATABASE_URL` is set and whether the PostgreSQL pool can execute `SELECT 1`.

## Dependencies

- `lib/db.ts` for `isDbConfigured()` and `getPool()`.
- Used by Docker `HEALTHCHECK` instructions.

## Important values

- `dynamic = 'force-dynamic'` and `runtime = 'nodejs'`.
- Returns 503 when the database is configured but unreachable.

## Caveats

This endpoint is intentionally public and returns no sensitive details. Do not
add session or database contents to the response.
