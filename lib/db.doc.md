# `lib/db.ts`

Postgres pool singleton + Kysely instance for the WebUI backend.

## What it does

Provides a global `pg.Pool` and a `Kysely<any>` instance, both lazy-created on
demand. `isDbConfigured()` checks for `DATABASE_URL`. If the env var is unset,
the file store (`lib/storage.ts`) is used instead.

## Dependencies

- `pg` and `kysely`.
- Used by `lib/auth/better-auth.ts` (Kysely adapter) and `app/api/health/route.ts`.

## Important values

- Pool `max: 5` connections.
- `idleTimeoutMillis: 30_000`.
- Instances are cached on `globalThis` to avoid re-creating them during hot reload.

## Caveats

`getPool()` and `getDb()` throw if `DATABASE_URL` is not set. Callers should
guard with `isDbConfigured()` first. The Kysely instance uses `any` for the
database type because the schema is managed by better-auth, not by a Kysely
migrations folder.
