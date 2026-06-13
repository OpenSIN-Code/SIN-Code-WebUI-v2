# `lib/sin/guard.ts`

Combined authentication + rate-limit guard for route handlers.

## What it does

Exports `guardRequest`, which verifies the session and applies a per-identity
rate limit. If either check fails, it returns a `Response` that the caller should
return immediately. Otherwise it returns `null` to signal "proceed".

## Dependencies

- `lib/session.ts` for session resolution.
- `lib/rate-limit.ts` for token-bucket rate limiting.
- Used by almost every API route under `app/api/*`.

## Why this module exists

`guardRequest` was extracted into its own module (Issue #59) because importing
`child_process`/`fs` at the route boundary triggered Turbopack NFT warnings.
Keeping auth and rate-limit logic here lets the heavy execution modules load
via dynamic import only where needed.

## Important values

- Admins get 3× the rate-limit budget.
- Default: 30 requests per 60-second window.
- Identity is `u:<userId>` for Better Auth sessions or `s:<actor>` for token
  sessions.

## Caveats

Always `const guard = await guardRequest(...); if (guard) return guard;` at the
start of a route handler.
