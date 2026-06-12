# SIN-Code WebUI

Self-hosted web interface for the SIN-Code agent backend. Next.js 16,
AI SDK 6 (Vercel AI Gateway), Postgres (Neon-compatible) or file store.

## Architecture

    Browser ── nginx (TLS, SSE pass-through)
                 └── Next.js (standalone, :3000 localhost-only)
                       ├── /api/chat            AI SDK streaming + sin-code tools
                       ├── /api/sin/*           whitelisted sin-code subcommands
                       ├── /api/chats, /share   persistence + public share links
                       └── sin-code binary      spawned via execFile (no shell)
                 └── Postgres 17 (chats, tokens, users, audit, shares)

## Security model

- Auth: root token (`SIN_UI_TOKEN` env) + managed tokens (SHA-256 hashed,
  revocable). Multi-user mode binds tokens to users; chats are scoped per user.
- Two layers: `proxy.ts` (coarse gate) + `guardRequest` in every route
  (real verification + per-identity rate limiting).
- Command execution: whitelist of subcommands, argument token validation,
  `execFile` without shell, timeout + output cap. Every execution is audited.

## Environment variables

| Variable             | Required | Purpose                                  |
| -------------------- | -------- | ---------------------------------------- |
| `SIN_UI_TOKEN`       | prod     | Root access token; unset = open dev mode |
| `DATABASE_URL`       | no       | Postgres store; unset = file store       |
| `AI_GATEWAY_API_KEY` | yes      | Model access via Vercel AI Gateway       |
| `SIN_CODE_BIN`       | no       | Path to sin-code binary                  |
| `SIN_DATA_DIR`       | no       | File-store location (default `data/`)    |
| `SIN_MODEL_PRO/FAST/MINI` | no  | Model tier overrides                     |

## Deployment

See `docker-compose.yml` and `deploy/nginx.conf`. Quick path:

    cp .env.example .env            # fill in secrets
    docker compose up -d --build
    docker compose exec -T db psql -U sin -d sincode < scripts/001_init.sql
    docker compose exec -T db psql -U sin -d sincode < scripts/002_users.sql
    docker compose exec -T db psql -U sin -d sincode < scripts/003_shares.sql

Backups: `deploy/backup.sh` (cron, 14-day rotation).

## Local development

    pnpm install && pnpm dev

Without `SIN_UI_TOKEN`/`DATABASE_URL` everything runs open with the
file store — no setup needed.
