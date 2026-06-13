# `next.config.mjs`

Next.js configuration for the SIN-Code WebUI v2.

## What it does

Configures the Next.js build and runtime behavior for a self-hosted,
Docker-friendly deployment.

## Dependencies

- `next` — the framework that consumes this config.
- `Dockerfile` — copies the `.next/standalone` output produced by this config.

## Important values

- `output: 'standalone'` — produces a self-contained server bundle.
- `images.unoptimized: true` — required for static export / Docker runtime.
- `outputFileTracingExcludes` — prevents Turbopack NFT from pulling native
  modules, runtime data, and test files into the standalone trace.
- Security headers returned by `headers()`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` — disables unused browser features.

## Caveats

- `typescript.ignoreBuildErrors: true` is intentional for CI/CD stability
  (type errors are caught by `pnpm tsc --noEmit` separately).
- CSP is intentionally omitted from this config; it would require careful
  tuning for the dynamic chat UI and is better added via middleware once
  tested end-to-end.
