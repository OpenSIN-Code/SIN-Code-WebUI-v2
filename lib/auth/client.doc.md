# `lib/auth/client.ts`

React client for Better Auth.

## What it does

Creates a `better-auth/react` client and re-exports the common sign-in / sign-up
/ sign-out / session hooks. This is the only place React components should import
auth helpers from.

## Dependencies

- `better-auth/react`.
- Used by client components that need `useSession`, `signIn`, `signOut`, etc.

## Important values

- The client is created without explicit base URL; Better Auth defaults to the
  current origin.

## Caveats

This is a client module; `'use client'` is declared at the top. Server code
must use `lib/session.ts` or `lib/auth/better-auth.ts` instead.
