# `app/api/publish/vercel/route.ts`

Vercel deployment endpoint.

## What it does

Creates a real deployment on Vercel using the workspace files. Requires a
`VERCEL_TOKEN` and uses `lib/vercel/deploy.ts` to push the deployment.

## Dependencies

- `lib/session.ts` for auth.
- `lib/vercel/client.ts` for configuration check.
- `lib/vercel/deploy.ts` for the deployment creation.

## Important values

- Default project name: `sin-app`.
- Default target: `preview`.
- Returns 202 on success with `{ deployment: { id, url, state } }`.

## Caveats

This is a real deploy, not a simulation. The `Publish` button in the UI may also
show a simulated popover; this route is the backend counterpart for actual
Vercel deploys.
