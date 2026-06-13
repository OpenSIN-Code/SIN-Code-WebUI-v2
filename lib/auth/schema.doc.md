# `lib/auth/schema.ts`

Drizzle schema describing the Better Auth tables.

## What it does

Defines `users`, `sessions`, `accounts`, and `verifications` tables using
`drizzle-orm/pg-core`. This schema is aligned with the project's existing
PostgreSQL infrastructure and is used for typed queries outside the
better-auth adapter flow.

## Dependencies

- `drizzle-orm/pg-core`.
- Mirrors the tables created by better-auth's Kysely adapter.

## Important values

- `users.role` defaults to `member`.
- `sessions.userId` and `accounts.userId` cascade on user deletion.

## Caveats

The schema is intended for read-only / migration / reporting queries. The actual
auth persistence is handled by the Kysely adapter in `lib/auth/better-auth.ts`.
