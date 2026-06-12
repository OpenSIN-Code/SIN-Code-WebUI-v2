# SIN-Code WebUI v2

[![CEO Audit](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/actions/workflows/ceo-audit.yml/badge.svg)](.github/workflows/ceo-audit.yml)
[![TypeScript](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/actions/workflows/typescript.yml/badge.svg)](.github/workflows/typescript.yml)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](.github/dependabot.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.6-black?logo=next.js)](https://nextjs.org)
[![AI SDK 6](https://img.shields.io/badge/AI_SDK-6.0.202-0a7)](https://ai-sdk.dev)
[![SIN-Code v2.5.0](https://img.shields.io/badge/sin--code-v2.5.0-0E8A86)](https://github.com/OpenSIN-Code/SIN-Code-Bundle)
[![Live](https://img.shields.io/badge/live-sincode--webui.delqhi.com-2ea44f?logo=cloudflare)](https://sincode-webui.delqhi.com)

**The official web frontend for the [SIN-Code](https://github.com/OpenSIN-Code/SIN-Code-Bundle) coding agent stack.** Next.js 16 + React 19 + AI SDK 6 + Tailwind 4, wired to the unified `sin-code serve` MCP server (32 subcommands · 44 tools).

🟢 **Live:** [https://sincode-webui.delqhi.com](https://sincode-webui.delqhi.com) — Cloudflare Tunnel, Docker stack, sin-code v2.5.0.

---

## Table of contents

- [Live deployment](#live-deployment)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [CI / CD](#ci--cd)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Live deployment

| | |
|---|---|
| **Public URL** | https://sincode-webui.delqhi.com |
| **Hosting** | OrbStack (Docker) on macOS |
| **Reverse proxy** | Caddy 2.8 (auto-TLS) |
| **Tunnel** | Cloudflare named tunnel `sin-code-webui` (CNAME `sincode-webui.delqhi.com`) |
| **Image** | `sin-code-webui-v2:local` (multi-stage Dockerfile, `output: 'standalone'`) |
| **Backend** | `sin-code` Go binary v2.5.0 bundled inside the webui image |
| **Health** | `curl -sf https://sincode-webui.delqhi.com/api/sin/status` |

```bash
$ curl -sf https://sincode-webui.delqhi.com/api/sin/status | jq '.installed, .version, .capabilities.subcommandCount, (.capabilities.mcpTools | length)'
true
"v2.5.0"
32
44
```

See [`PLAN_DEPLOY.md`](PLAN_DEPLOY.md) for the full topology + troubleshooting.

---

## Architecture

SIN-Code WebUI v2 is the **chat surface** of the SIN-Code stack. The actual coding tools (file search, code-graph, refactor verification, memory, …) live in the **`sin-code` Go binary** from the [`OpenSIN-Code/SIN-Code-Bundle`](https://github.com/OpenSIN-Code/SIN-Code-Bundle) repo (v2.5.0). The WebUI only renders and routes — every mutation is delegated to a typed `sin-code` call.

```
┌──────────────────────────────────────────────────────────┐
│ Browser                                                   │
│ ┌──────────────┐   POST /api/chat   ┌──────────────────┐ │
│ │  SinChat     │ ─────────────────▶ │ app/api/chat     │ │
│ │  (useChat)   │                    │ (streamText)     │ │
│ └──────────────┘ ◀── UI stream ──── └────────┬─────────┘ │
│ ┌──────────────┐   POST /api/publish ┌──────┴─────────┐ │
│ │ PublishMenu  │ ─────────────────▶ │ /api/publish    │ │
│ │              │ ◀── 202 Accepted ── │ (workflow_disp) │ │
│ └──────────────┘                     └────────────────┘ │
└────────────────────────────────────────────────┘         │
                                                         │
                        ┌────────────────────────────────┘
                        ▼  spawn: `sin-code serve` (stdio)
         ┌────────────────────────────────────────┐
         │  sin-code (Go binary, v2.5.0)          │
         │  ├─ 32 subcommands (CLI)               │
         │  └─ 44 MCP tools (sin_*)               │
         │     ├─ sin_sckg  (code-graph)          │
         │     ├─ sin_scout (search)              │
         │     ├─ sin_edit  (surgical edits)      │
         │     ├─ sin_orchestrate (multi-task)    │
         │     └─ …                               │
         └────────────────────────────────────────┘
```

**Single source of truth:** All subcommand + tool names are declared once in [`lib/sin/tools.ts`](lib/sin/tools.ts) and imported by the API routes, the chat system prompt, and the status tile. Adding a new `sin-code` tool means editing one file.

The runtime contract is:

| Component | Responsibility |
|---|---|
| `lib/sin/tools.ts` | Whitelist of 32 subcommands + 44 MCP tools + install cmd + repo URL (generated from `cmd/sin-code/main.go` + `internal/serve.go`). |
| `lib/sin/client.ts` | Typed wrapper around `sin-code <subcommand> --format json`. Uses `execFile` (no shell) + per-token regex sanitization. Graceful `{ installed: false, installCmd }` fallback. |
| `lib/sin/mcp.ts` | MCP client bridge: spawns `sin-code serve` over stdio, exposes the 44 `sin_*` tools to the AI SDK `streamText` call. |
| `app/api/chat/route.ts` | Server endpoint. `streamText` with the MCP toolset + a 44-tool-aware routing system prompt. |
| `app/api/sin/status/route.ts` | JSON status endpoint for the UI tile (version, subcommand count, MCP tool list). |
| `app/api/publish/route.ts` | POST endpoint. Triggers GitHub `workflow_dispatch` on `docker.yml` → rebuild + redeploy. |
| `components/sin-chat.tsx` | `useChat` (AI SDK 6) UI with tool-call cards, stop button, and error retry. |
| `components/sin-status-tile.tsx` | Dismissible banner showing backend version + install command, copy-to-clipboard with `window.prompt` fallback. |
| `components/chat-store.tsx` | Chats + favorites in `localStorage` (key: `sin-code:chats`). SSR-safe. |
| `components/project-store.tsx` | Projects + chatIds in `localStorage` (key: `sin-code:projects`). `moveChatToProject` action. |
| `components/design-system-store.tsx` | Design systems in `localStorage`. |
| `components/sidebar-store.tsx` | Sidebar collapsed state in `localStorage` (key: `sin-code:sidebar-collapsed`). |
| `components/app-sidebar.tsx` | Favorites / Recent / Projects sections, collapsible, with `Move to Project` submenu. |

See [`PLAN_MIGRATION.md`](PLAN_MIGRATION.md) for the issue-by-issue migration rationale.

---

## Quick start

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 20.x | Next.js 16 baseline |
| pnpm | ≥ 9.x | Workspace package manager (repo ships `pnpm-lock.yaml`) |
| `sin-code` | v2.5.0 | The backend (optional at first — chat works without it) |

### Install

```bash
git clone https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2
cd SIN-Code-WebUI-v2
pnpm install
```

### (Optional) Install the `sin-code` backend

The chat and the status tile work without `sin-code`, but the 44 MCP tools are only available when the binary is on `PATH`:

```bash
go install github.com/OpenSIN-Code/SIN-Code-Bundle/cmd/sin-code@latest
# Binary lands in $(go env GOPATH)/bin — add it to PATH or set SIN_CODE_BIN.
```

### Run the dev server

```bash
pnpm dev
# → http://localhost:3000
```

The status tile at the top will show ✅ `sin-code vX.Y.Z · 32 subcommands · 44 MCP tools` when the binary is found, or ⚠️ `sin-code backend not installed — tools disabled` with a copy-install-cmd button.

### First chat test

1. Open `http://localhost:3000`
2. Type "What calls `runSinCodeCommand`?" — the model should call `sin_scout` (or `sin_sckg`) and show a tool card in the streaming response.
3. If you see `retry` after an error, the backend is missing — install it (see above).

### Run the production stack (Docker + Cloudflare Tunnel)

See [`PLAN_DEPLOY.md`](PLAN_DEPLOY.md). TL;DR:

```bash
./scripts/orb-up.sh          # builds + starts webui + caddy
./scripts/tunnel-up.sh       # public https://*.trycloudflare.com URL
```

For a **named tunnel** to your own domain:

```bash
cloudflared tunnel create sin-code-webui
cloudflared tunnel route dns sin-code-webui sincode-webui.delqhi.com
cloudflared tunnel --config ~/.cloudflared/config-sin-code-webui.yml run sin-code-webui
```

---

## Configuration

All configuration is via environment variables. None are required for a local dev run.

| Variable | Default | Purpose |
|---|---|---|
| `SIN_CODE_BIN` | `sin-code` (PATH lookup) | Override the binary path. Useful for CI or non-PATH installations. |
| `SIN_CHAT_MODEL` | `openai/gpt-5-mini` | The model used by `/api/chat`. Override with `anthropic/claude-sonnet-4.5` in environments with paid gateway access. |
| `SIN_CODE_MCP_FILTER` | *(empty — expose all)* | Substring filter for which `sin_*` MCP tools to expose (cuts startup time when only a subset is needed). |
| `AI_GATEWAY_API_KEY` | — | Vercel AI Gateway key (used by `@ai-sdk/react` transport). Lives in `.env.development.local.md` (gitignored). |
| `GITHUB_REPO` | — | Repo slug (`OpenSIN-Code/SIN-Code-WebUI-v2`) used by `/api/publish` to trigger a workflow dispatch. |
| `GITHUB_TOKEN` | — | Personal access token with `workflow` scope. Required by `/api/publish`. |
| `WEBUI_PORT` | `8080` | Host port for caddy (set to a free port if `8080` is taken). |
| `SIN_CODE_PORT` | `8090` | Host port for the optional sin-code service (`tools` profile). |

Example `.env.development.local.md` (NEVER commit this):

```bash
AI_GATEWAY_API_KEY='vck_…'
GITHUB_TOKEN='ghp_…'
GITHUB_REPO='OpenSIN-Code/SIN-Code-WebUI-v2'
```

The repo's `.gitignore` excludes `.env*.local` by default — confirmed by `git check-ignore -v .env.development.local.md`.

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Next.js dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint (next/core-web-vitals) |
| `pnpm tsc --noEmit` | Type-check without emitting |
| `pnpm test` | Run vitest unit tests once |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:coverage` | Vitest with v8 coverage report |
| `./scripts/orb-up.sh` | Build + start Docker stack (webui + caddy) on OrbStack/Docker |
| `./scripts/orb-down.sh` | Stop the Docker stack (add `--volumes` to wipe caddy certs) |
| `./scripts/tunnel-up.sh` | Start a Cloudflare **quick** tunnel (random `*.trycloudflare.com` URL) |

---

## Project layout

```
sin-code-web-ui-v2/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # POST /api/chat     (streamText + sin-code MCP tools)
│   │   ├── publish/route.ts      # POST /api/publish  (GitHub workflow_dispatch)
│   │   └── sin/status/route.ts   # GET  /api/sin/status
│   ├── chat/[id]/page.tsx
│   ├── chats/page.tsx
│   ├── design-systems/page.tsx
│   ├── projects/page.tsx
│   ├── search/page.tsx
│   ├── templates/page.tsx
│   ├── layout.tsx                # Providers: Chat, Project, DesignSystem, Sidebar
│   ├── page.tsx                  # SinStatusTile + SinChat + AppSidebar
│   └── globals.css
├── components/
│   ├── sin-chat.tsx              # Chat UI (useChat + tool cards)
│   ├── sin-status-tile.tsx       # Backend status banner
│   ├── app-sidebar.tsx           # Favorites/Recent/Projects + collapsible
│   ├── chat-header.tsx           # Share + Publish + activeProject badge
│   ├── chat-header-with-project.tsx
│   ├── chat-store.tsx            # Chats + favorites (sin-code:chats)
│   ├── project-store.tsx         # Projects + chatIds (sin-code:projects)
│   ├── design-system-store.tsx
│   ├── sidebar-store.tsx         # Collapsed state (sin-code:sidebar-collapsed)
│   ├── projects-list.tsx         # /projects page
│   ├── projects-section.tsx      # Sidebar per-project section
│   ├── design-systems-list.tsx
│   ├── search-panel.tsx          # Live filter over chats
│   ├── share-menu.tsx            # Visibility + copy link
│   ├── publish-menu.tsx          # /api/publish integration + error states
│   ├── chats-list.tsx            # Hover-revealed star toggle
│   ├── page-shell.tsx
│   ├── prompt-box.tsx
│   ├── icons.tsx
│   ├── chat-view.tsx             # FollowUpBar (send/mic + model selector)
│   └── ui/                       # shadcn primitives
├── lib/
│   ├── sin/
│   │   ├── tools.ts              # 32 subcommands + 44 MCP tools (single source of truth)
│   │   ├── client.ts             # sin-code CLI wrapper (execFile, no shell) + 100% tested
│   │   ├── client.test.ts        # 11 vitest unit tests
│   │   └── mcp.ts                # sin-code serve stdio bridge → @ai-sdk/mcp
│   └── utils.ts                  # cn() helper
├── .github/
│   ├── CODEOWNERS                # Auto-review routing (@Delqhi for backend/CI)
│   ├── dependabot.yml            # weekly npm + github-actions updates
│   └── workflows/
│       ├── ceo-audit.yml         # 47-gate audit (Node/TS-aware)
│       ├── typescript.yml        # pnpm tsc + pnpm lint (NEW)
│       ├── docker.yml            # Multi-arch build + push to ghcr.io
│       ├── release.yml           # Versioned release pipeline
│       └── sbom.yml              # CycloneDX SBOM on release
├── scripts/
│   ├── orb-up.sh                 # Start stack (Docker on OrbStack / Linux)
│   ├── orb-down.sh               # Stop stack
│   └── tunnel-up.sh              # Cloudflare quick tunnel
├── Dockerfile                    # 4-stage: deps → sin-code → builder → runner
├── docker-compose.yml            # webui + caddy (+ optional sin-code profile)
├── Caddyfile                     # Reverse proxy + SSE flush
├── eslint.config.mjs             # next/core-web-vitals + hydration-safe overrides
├── vitest.config.ts              # vitest + coverage
├── .dockerignore
├── .env.example
├── PLAN_MIGRATION.md             # Issue→file mapping + architecture rationale
├── PLAN_DEPLOY.md                # Self-hosting guide (live URL, troubleshoot)
├── README.md (you are here)
└── AGENTS.md                     # Project-specific agent rules
```

---

## CI / CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `ceo-audit.yml` | `push` to `main`, `pull_request` | 47-gate SOTA audit. Skipped for Dependabot + Node/TS repos. |
| `typescript.yml` | `push` to `main`, `pull_request` | `pnpm tsc --noEmit` + `pnpm lint` (Node 22, pnpm 10, frozen lockfile). |
| `docker.yml` | `push` to `main`, tag `v*` | Multi-arch build + push to `ghcr.io/opensin-code/sin-code-webui-v2`. |
| `release.yml` | tag `v*` | Versioned release pipeline. |
| `sbom.yml` | release published | CycloneDX SBOM artifact. |
| `dependabot.yml` | weekly Monday 09:00 UTC | Grouped `npm` + `github-actions` updates with auto-rebase. |

**Branch protection on `main`:**

- ✅ `ceo-audit` status check required
- ✅ `typescript` status check required
- ✅ 1 approving PR review required
- ✅ Linear history required
- ✅ Force-pushes blocked, deletions blocked
- ✅ Admins included

**CODEOWNERS** auto-requests `@Delqhi` for backend (`lib/sin/`, `app/api/`), CI/CD infrastructure, and secrets-sensitive paths.

---

## Contributing

1. **Issues first.** Open a GitHub issue describing the change, even for small ones. Use the labels `kind/*`, `priority/*`, `scope/*` (already configured in the repo).
2. **Conventional Commits.** `feat(scope): …`, `fix(scope): …`, `chore: …`, `docs: …`. The commit body should reference the issue(s) it closes (`Closes #N`).
3. **PR against `main`.** Title mirrors the commit prefix. Body must include:
   - Summary of the change
   - Verification commands run (`pnpm tsc --noEmit`, `curl localhost:8080/api/sin/status`, …)
   - Risk assessment
4. **Self-approval is blocked by GitHub** for repos with `required_approving_review_count: 1` and is **not bypassable by admins** since late 2023. You need a second reviewer. If you don't have one yet, use the **force-push trick** documented in [`AGENTS.md`](AGENTS.md#55-force-push-protocol-when-no-second-reviewer-exists).
5. **PR-linkage bugs:** force-pushing to a PR branch can break GitHub's `head_sha ↔ check_run` linkage. If `ceo-audit` reports `blocked` despite a green run, push an empty commit to retrigger a fresh run, or ask a maintainer to temporarily lower `required_approving_review_count` to 0 in branch protection.
6. **Never commit secrets.** `vck_…`, `ghp_…`, `github_pat_…` must never appear in a diff. If you accidentally commit one, ROTATE it.

Read [`AGENTS.md`](AGENTS.md) for the full project-specific agent rules + 8 hard rules.

---

## Roadmap

✅ **Recently shipped (all closed):**
- ✅ `pnpm tsc --noEmit` + `pnpm lint` in CI (`#36`, PR #48)
- ✅ `pnpm test` with vitest + 11 unit tests for `lib/sin/client.ts` (`#37`, PR #45)
- ✅ `CODEOWNERS` file (`#38`, PR #43)
- ✅ Real `/api/publish` endpoint via GitHub `workflow_dispatch` (`#39`, PR #44)
- ✅ Collapsible app-sidebar with localStorage persistence (`#40`, PR #47)
- ✅ Self-hosted Docker + OrbStack + Cloudflare Tunnel deployment (`#34`, commit 86872a4)
- ✅ Live at `https://sincode-webui.delqhi.com` (named tunnel `sin-code-webui`)

🟡 **Next iteration candidates:**
- [ ] **Cloudflare Pages vs. Pages Functions** — explore whether the webui can be adapted to run as a Pages Function (would lose the long-lived `sin-code` stdio process but gain edge deployment). Currently blocked by architecture.
- [ ] **Multi-user persistence** — localStorage works for solo dev; a real backend (Postgres + auth) would unlock teams.
- [ ] **`sin-code` version badge in the sidebar** — surface the installed version in a persistent place, not just the dismissable tile.
- [ ] **CodeQL** — beyond `ceo-audit`, add CodeQL for SAST and Dependabot security updates.
- [ ] **Named tunnel automated provisioning** — `./scripts/tunnel-up.sh` should accept `--named` and create the tunnel + DNS route in one step (currently requires manual `cloudflared tunnel create` + `cloudflared tunnel route dns`).
- [ ] **Sidebar collapsibility polish** — the current toggle hides text labels but the new-chat button is still text-only; consider icon-only mode.

See [open issues](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/issues) for the full backlog.

---

## Related repositories

- **[`OpenSIN-Code/SIN-Code-Bundle`](https://github.com/OpenSIN-Code/SIN-Code-Bundle)** — the `sin-code` Go binary, the 32 subcommands, and the 44 MCP tools. Source of truth for everything this WebUI calls.
- **[`OpenSIN-Code/SIN-Code-Honcho-Rollback-Skill`](https://github.com/OpenSIN-Code/SIN-Code-Honcho-Rollback-Skill)** — memory rollback / snapshot for the agent layer.
- **[`OpenSIN-Code/SIN-Code-Context-Bridge-Skill`](https://github.com/OpenSIN-Code/SIN-Code-Context-Bridge-Skill)** — unified context query across SCKG + sin-brain + GitNexus.

---

## License

[MIT](LICENSE) — see `LICENSE` file (or add one if it doesn't exist yet; this repo does not ship one yet).

---

<p align="center">
  Built with <code>sin-code</code> · powered by <a href="https://github.com/OpenSIN-Code">OpenSIN-Code</a> · live at <a href="https://sincode-webui.delqhi.com">sincode-webui.delqhi.com</a>
</p>
