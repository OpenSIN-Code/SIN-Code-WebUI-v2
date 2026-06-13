# SIN-Code WebUI

Self-hosted web interface for the SIN-Code agent backend. Next.js 16,
React 19, AI SDK 6 (Vercel AI Gateway), with optional PostgreSQL or a local
file store.

## Architecture

```
Browser ── nginx / Caddy (TLS, SSE pass-through)
            └── Next.js (standalone, :3000 localhost-only)
                  ├── /api/chat              AI SDK streaming + sin-code tools
                  ├── /api/sin/*             whitelisted sin-code subcommands
                  ├── /api/workspaces/*      workspace CRUD + design mode
                  ├── /api/chats, /share     chat persistence + public share links
                  ├── /api/auth/*            Better Auth (optional)
                  └── sin-code binary        spawned via execFile (no shell)
            └── Postgres 17 (optional)       chats, tokens, users, audit, shares
```

The `sin-code` Go binary is bundled inside the Docker image. In local dev it is
picked up from `PATH` or overridden with `SIN_CODE_BIN`. See
[PLAN_MIGRATION.md](./PLAN_MIGRATION.md) for the backend integration history
and [PLAN_DEPLOY.md](./PLAN_DEPLOY.md) for deployment instructions.

## Features

### v0-style chat UI

- Markdown rendering with fenced code blocks, tables, and copy buttons.
- Tool-call badges that show running/done/error states and expandable JSON details.
- Auto-scrolling message stream, shimmer loading indicators, and sound
  notifications when a turn completes.
- Model picker (Pro / Fast / Mini tiers) and send/stop controls in the prompt
  composer.

### Agent modes

The system prompt can be specialized with one of five modes:

- **Auto** — SIN routes tools automatically.
- **Builder** — implements end-to-end changes with a read → edit → diff → verify
  loop.
- **Reviewer** — read-only adversarial critic with evidence-based claims.
- **Planner** — decomposes work into orchestrated tasks and todos.
- **Scout** — read-only codebase exploration with file paths and line references.

### Workspaces

Built-in workspaces (`Code`, `Writing`, `Data`) plus user-created custom
workspaces. Each workspace has:

- A layout (`chat`, `writing`, `data`).
- A system prompt appended to the model prompt.
- An enabled-tool list filtered from the 44 sin-code MCP tools.
- A default model.

The chat route merges the workspace configuration into the streaming request.

### Design Mode

Interactive design canvas with:

- Drag-to-move floating layers.
- Inspector sidebar for class edits.
- Apply/Reset workflow with command-pattern history.
- Undo/Redo (`⌘Z` / `⌘⇧Z`) persisted in `.sin-webui/design-history.jsonl`.

### Workspace Panel

Side panel tabs for:

- **Preview** — live render of the current artifact.
- **Code** — file tree and editor for the active workspace.
- **Design** — Design Mode canvas and inspector.
- **Database** — schema and query explorer (placeholder).

### Settings System

File-based settings under `.sin-webui/` for:

- Preferences (theme, sound, language).
- API Keys (Vercel AI Gateway, optional integrations).
- Integrations (skills, MCP servers).
- Members / Usage / General / Memories / Skills.

### Auth

Two auth modes coexist:

- **Better Auth** (optional): email + password with Kysely + PostgreSQL. First
  user becomes `owner`, later users are `member`.
- **Legacy token auth**: root token (`SIN_UI_TOKEN`) + managed tokens
  (SHA-256 hashed, revocable). Active when Better Auth is disabled.

Rate limiting is per-identity and applied via `guardRequest` in every route.

### Storage

- **PostgreSQL** when `DATABASE_URL` is set (chats, users, audit, shares).
- **File store** when `DATABASE_URL` is unset: JSON stores under `.sin-webui/`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SIN_UI_TOKEN` | prod | Root access token; unset = open dev mode |
| `DATABASE_URL` | no | PostgreSQL store; unset = file store |
| `BETTER_AUTH_SECRET` | no | Enables Better Auth when `DATABASE_URL` is set |
| `BETTER_AUTH_URL` | no | Better Auth base URL (default `http://localhost:3000`) |
| `AI_GATEWAY_API_KEY` | yes | Model access via Vercel AI Gateway |
| `SIN_CODE_BIN` | no | Path to `sin-code` binary |
| `SIN_DATA_DIR` | no | File-store location (default `data/`) |
| `SIN_WORKSPACE_DIR` | no | Workspace root for design mode / file tree (default `process.cwd()`) |
| `SIN_MODEL_PRO/FAST/MINI` | no | Model tier overrides |
| `SIN_CHAT_MODEL` | no | Default fallback model |

## Deployment

See `docker-compose.yml` and `deploy/nginx.conf`. Quick path:

```bash
cp .env.example .env            # fill in secrets
pnpm install                    # or let Docker build it
docker compose up -d --build
# if using Postgres:
docker compose exec -T db psql -U sin -d sincode < scripts/001_init.sql
docker compose exec -T db psql -U sin -d sincode < scripts/002_users.sql
docker compose exec -T db psql -U sin -d sincode < scripts/003_shares.sql
```

Backups: `deploy/backup.sh` (cron, 14-day rotation).

For OrbStack + Cloudflare Tunnel details, see [PLAN_DEPLOY.md](./PLAN_DEPLOY.md).

## Local development

```bash
pnpm install && pnpm dev
```

Without `SIN_UI_TOKEN`/`DATABASE_URL` everything runs open with the file store
— no setup needed.

## Useful checks

```bash
pnpm tsc --noEmit
pnpm build
pnpm test
```

Verify the backend status:

```bash
curl -sf localhost:3000/api/sin/status | jq
# expect { installed: true, version: "v2.5.0", capabilities: { subcommandCount: 32, mcpTools: 44 } }
```

## Documentation

This repo follows the **CoDocs** standard: every significant code file has a
`.doc.md` companion in the same directory and a `Purpose:` / `Docs:` header in
the source file. Run `sin codocs check` to validate references.

## License

SPDX-License-Identifier: MIT

See [LICENSE](./LICENSE) for the full text.
