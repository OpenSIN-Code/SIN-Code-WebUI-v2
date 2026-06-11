# SIN-Code WebUI v2

[![CEO Audit](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/actions/workflows/ceo-audit.yml/badge.svg)](.github/workflows/ceo-audit.yml)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](.github/dependabot.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.6-black?logo=next.js)](https://nextjs.org)
[![AI SDK 6](https://img.shields.io/badge/AI_SDK-6.0.202-0a7)](https://ai-sdk.dev)
[![SIN-Code v2.5.0](https://img.shields.io/badge/sin--code-v2.5.0-0E8A86)](https://github.com/OpenSIN-Code/SIN-Code-Bundle)

**The official web frontend for the [SIN-Code](https://github.com/OpenSIN-Code/SIN-Code-Bundle) coding agent stack.** Next.js 16 + React 19 + AI SDK 6 + Tailwind 4, wired to the unified `sin-code serve` MCP server (32 subcommands · 44 tools).

---

## Table of contents

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

## Architecture

SIN-Code WebUI v2 is the **chat surface** of the SIN-Code stack. The actual coding tools (file search, code-graph, refactor verification, memory, …) live in the **`sin-code` Go binary** from the [`OpenSIN-Code/SIN-Code-Bundle`](https://github.com/OpenSIN-Code/SIN-Code-Bundle) repo (v2.5.0). The WebUI only renders and routes — every mutation is delegated to a typed `sin-code` call.

```
┌──────────────────────────────────────────────────────────┐
│ Browser                                                   │
│ ┌──────────────┐   POST /api/chat   ┌──────────────────┐ │
│ │  SinChat     │ ─────────────────▶ │ app/api/chat     │ │
│ │  (useChat)   │                    │ (streamText)     │ │
│ └──────────────┘ ◀── UI stream ──── └────────┬─────────┘ │
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
| `components/sin-chat.tsx` | `useChat` (AI SDK 6) UI with tool-call cards, stop button, and error retry. |
| `components/sin-status-tile.tsx` | Dismissible banner showing backend version + install command, copy-to-clipboard with `window.prompt` fallback. |

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

---

## Configuration

All configuration is via environment variables. None are required for a local dev run.

| Variable | Default | Purpose |
|---|---|---|
| `SIN_CODE_BIN` | `sin-code` (PATH lookup) | Override the binary path. Useful for CI or non-PATH installations. |
| `SIN_CHAT_MODEL` | `openai/gpt-5-mini` | The model used by `/api/chat`. Override with `anthropic/claude-sonnet-4.5` in environments with paid gateway access. |
| `SIN_CODE_MCP_FILTER` | *(empty — expose all)* | Substring filter for which `sin_*` MCP tools to expose (cuts startup time when only a subset is needed). |
| `AI_GATEWAY_API_KEY` | — | Vercel AI Gateway key (used by `@ai-sdk/react` transport). Lives in `.env.development.local.md` (gitignored). |

Example `.env.development.local.md` (NEVER commit this):

```bash
AI_GATEWAY_API_KEY='vck_…'
V0_RUNTIME_URL='…'
V0_CALLBACK_URL='…'
```

The repo's `.gitignore` excludes `.env*.local` by default — confirmed by `git check-ignore -v .env.development.local.md`.

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Next.js dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm tsc --noEmit` | Type-check without emitting (the only safety net for now — see Roadmap) |

---

## Project layout

```
sin-code-web-ui-v2/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # POST /api/chat  (streamText + sin-code MCP tools)
│   │   └── sin/status/route.ts  # GET  /api/sin/status
│   ├── chat/[id]/page.tsx
│   ├── chats/page.tsx
│   ├── design-systems/page.tsx
│   ├── projects/page.tsx
│   ├── search/page.tsx
│   ├── templates/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                 # Mounts <SinStatusTile /> + <SinChat /> + <AppSidebar />
│   └── globals.css
├── components/
│   ├── sin-chat.tsx             # Chat UI (useChat + tool cards)
│   ├── sin-status-tile.tsx      # Backend status banner
│   ├── app-sidebar.tsx
│   ├── chat-{header,store,view}.tsx
│   ├── chats-list.tsx
│   ├── icons.tsx
│   ├── page-shell.tsx
│   ├── prompt-box.tsx
│   └── ui/                      # shadcn primitives
├── lib/
│   ├── sin/
│   │   ├── tools.ts             # 32 subcommands + 44 MCP tools (single source of truth)
│   │   ├── client.ts            # sin-code CLI wrapper (execFile, no shell)
│   │   └── mcp.ts               # sin-code serve stdio bridge → @ai-sdk/mcp
│   └── utils.ts                 # cn() helper
├── .github/
│   ├── dependabot.yml           # weekly npm + github-actions updates
│   └── workflows/
│       ├── ceo-audit.yml        # 47-gate audit (Node/TS-aware)
│       ├── release.yml          # versioned release pipeline
│       └── sbom.yml             # CycloneDX SBOM on release
├── PLAN_MIGRATION.md            # Issue→file mapping + architecture rationale
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md (you are here)
```

---

## CI / CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `ceo-audit.yml` | `push` to `main`, `pull_request` | 47-gate SOTA audit from the `sin-code-bundle` skill. Skipped for Dependabot + Node/TS repos (no `pyproject.toml`); always reports a status so branch protection is satisfied. |
| `release.yml` | tag `v*` | Versioned release pipeline. |
| `sbom.yml` | release published | CycloneDX SBOM artifact. |
| `dependabot.yml` | weekly Monday 09:00 UTC | Grouped `npm` + `github-actions` updates with auto-rebase. |

**Branch protection on `main`:**

- ✅ `ceo-audit` status check required
- ✅ 1 approving PR review required
- ✅ Linear history required
- ✅ Force-pushes blocked, deletions blocked
- ✅ Admins included

---

## Contributing

1. **Issues first.** Open a GitHub issue describing the change, even for small ones. Use the labels `kind/*`, `priority/*`, `scope/*` (already configured in the repo).
2. **Conventional Commits.** `feat(scope): …`, `fix(scope): …`, `chore: …`, `docs: …`. The commit body should reference the issue(s) it closes (`Closes #N`).
3. **PR against `main`.** Title mirrors the commit prefix. Body must include:
   - Summary of the change
   - Verification commands run (`pnpm tsc --noEmit`, `curl localhost:3000/api/sin/status`, …)
   - Risk assessment
4. **Self-approval is blocked by GitHub** for repos with `required_approving_review_count: 1` and is **not bypassable by admins** since late 2023. You need a second reviewer. If you don't have one yet, ask in the issue thread for a maintainer to be added.
5. **PR-linkage bugs:** force-pushing to a PR branch can break GitHub's `head_sha ↔ check_run` linkage. If `ceo-audit` reports `blocked` despite a green run, push an empty commit to retrigger a fresh run, or ask a maintainer to temporarily lower `required_approving_review_count` to 0 in branch protection.

---

## Roadmap

Open items the next iteration should tackle:

- [ ] **Add `pnpm tsc --noEmit` + `pnpm lint` CI** — the only safety net right now is a local `tsc` run by the author. Add a `.github/workflows/ci.yml` that runs on every PR and gates merges.
- [ ] **Add `pnpm test`** — the codebase has no tests yet. Start with unit tests for `lib/sin/client.ts` (mock `execFile`).
- [ ] **Code-owners** — add a `CODEOWNERS` file so PRs auto-request review from the right people.
- [ ] **Dependabot bypass via Web UI** — `bypass_actors` is not settable via REST v3; must be configured in the GitHub Web UI (Settings → Branches → main → Allow specified actors to bypass).
- [ ] **Sidebar routes** — the `app/{chat,chats,projects,search,templates,design-systems}/` routes exist as scaffolds but aren't wired to real data yet.
- [ ] **`sin-code` version badge in the sidebar** — surface the installed version in a persistent place, not just the dismissable tile.
- [ ] **Snyk / CodeQL** — beyond `ceo-audit`, add CodeQL for SAST and Dependabot security updates.
- [ ] **Docker image** — for easy self-hosting, ship a `Dockerfile` and a `docker-compose.yml` with the WebUI + a `sin-code` binary baked in.

See [open issues](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/issues) for the full backlog.

---

## Related repositories

- **[`OpenSIN-Code/SIN-Code-Bundle`](https://github.com/OpenSIN-Code/SIN-Code-Bundle)** — the `sin-code` Go binary, the 32 subcommands, and the 44 MCP tools. Source of truth for everything this WebUI calls.
- **[`OpenSIN-Code/SIN-Code-Honcho-Rollback-Skill`](https://github.com/OpenSIN-Code/SIN-Code-Honcho-Rollback-Skill)** — memory rollback / snapshot for the agent layer.

---

## License

[MIT](LICENSE) — see `LICENSE` file (or add one if it doesn't exist yet; this repo does not ship one yet).

---

<p align="center">
  Built with <code>sin-code</code> · powered by <a href="https://github.com/OpenSIN-Code">OpenSIN-Code</a>
</p>
