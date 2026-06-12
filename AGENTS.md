# AGENTS.md — SIN-Code WebUI v2

> Project-local rules for AI agents working in this repo.
> Supersedes (does not duplicate) the global `~/.config/opencode/AGENTS.md`
> — read both. Global rules are a baseline; project rules below are SOTA.
>
> **Audience:** any AI coding agent (opencode, Claude Code, Codex, etc.)
> acting on this repository.

🟢 **Live deployment:** https://sincode-webui.delqhi.com
(Cloudflare named tunnel `sin-code-webui` → OrbStack Docker stack)

---

## 1. What this project is

**SIN-Code WebUI v2** is the chat surface of the
[**SIN-Code**](https://github.com/OpenSIN-Code/SIN-Code-Bundle) stack:

```
┌───────────────────────────────────────────────────────────┐
│ Browser                                                   │
│   SinChat (useChat, AI SDK 6)                            │
│     ↕ POST /api/chat + /api/sin/status + /api/publish    │
│   app/api/chat/route.ts (streamText)                      │
│     ↕ spawn `sin-code` Go binary via @ai-sdk/mcp stdio    │
│   lib/sin/{client,mcp,tools}.ts                           │
└───────────────────────────────────────────────────────────┘
```

- **Frontend:** Next.js 16.2.6 + React 19 + AI SDK 6 + Tailwind 4
- **Backend:** `sin-code` Go binary v2.5.0 (sibling repo: SIN-Code-Bundle)
- **Single source of truth:** `lib/sin/tools.ts` exports the 32 subcommands
  + 44 MCP tools. NEVER hand-maintain a copy elsewhere — import from there.
- **Storage:** all client state in localStorage (chat, project, design-system,
  sidebar stores). No DB, no backend persistence.
- **Deployment:** Docker (webui + caddy reverse proxy) on OrbStack on macOS,
  exposed via Cloudflare named tunnel. Multi-stage Dockerfile with the
  `sin-code` binary bundled inside the webui image.
- **Public URL:** `https://sincode-webui.delqhi.com` (named tunnel
  `sin-code-webui` → `localhost:8080`)

---

## 2. Repository layout

```
sin-code-web-ui-v2/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # streamText + sin-code MCP tools
│   │   ├── publish/route.ts      # POST /api/publish → GitHub workflow_dispatch
│   │   └── sin/status/route.ts   # backend status JSON
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
│   ├── sin-chat.tsx              # useChat + tool badges + stop/retry
│   ├── sin-status-tile.tsx       # useSWR + clipboard fallback
│   ├── app-sidebar.tsx           # Favorites/Recent/Projects + collapsible
│   ├── chat-header.tsx           # Share + Publish + activeProject badge
│   ├── chat-header-with-project.tsx  # Client wrapper resolving activeProject
│   ├── chat-view.tsx             # FollowUpBar (send/mic + model selector)
│   ├── chat-store.tsx            # ChatEntry + favorites (sin-code:chats)
│   ├── project-store.tsx         # ProjectEntry + chatIds + moveChatToProject
│   ├── projects-list.tsx         # /projects page
│   ├── projects-section.tsx      # Sidebar collapsible per-project section
│   ├── design-system-store.tsx
│   ├── design-systems-list.tsx
│   ├── sidebar-store.tsx         # Collapsed state (sin-code:sidebar-collapsed)
│   ├── search-panel.tsx          # Live filter over chats
│   ├── share-menu.tsx            # Visibility + copy link
│   ├── publish-menu.tsx          # /api/publish integration + error states
│   ├── chats-list.tsx            # Hover-revealed star toggle
│   ├── page-shell.tsx
│   ├── prompt-box.tsx
│   ├── icons.tsx
│   └── ui/                       # shadcn primitives
├── lib/
│   ├── sin/
│   │   ├── tools.ts              # 32 subcommands + 44 MCP tools (SINGLE SOURCE)
│   │   ├── client.ts             # sin-code CLI wrapper (execFile, no shell) — 100% tested
│   │   ├── client.test.ts        # 11 vitest unit tests
│   │   └── mcp.ts                # sin-code serve stdio bridge → @ai-sdk/mcp
│   └── utils.ts
├── .github/
│   ├── CODEOWNERS                # Auto-review routing (@Delqhi strict for backend/CI)
│   ├── dependabot.yml
│   └── workflows/
│       ├── ceo-audit.yml         # 47-gate SOTA audit (Node/TS-aware)
│       ├── typescript.yml        # pnpm tsc + pnpm lint (Node 22, pnpm 10)
│       ├── docker.yml            # Multi-arch build + push to ghcr.io
│       ├── release.yml           # Versioned release pipeline
│       └── sbom.yml              # CycloneDX SBOM
├── scripts/
│   ├── orb-up.sh                 # Start stack on OrbStack (or Docker fallback)
│   ├── orb-down.sh               # Stop stack
│   └── tunnel-up.sh              # cloudflared quick-tunnel
├── Dockerfile                    # 4-stage: deps → sin-code → builder → runner
├── docker-compose.yml            # webui + caddy (+ optional sin-code service)
├── Caddyfile                     # Reverse proxy + SSE flush
├── eslint.config.mjs             # next/core-web-vitals + hydration-safe overrides
├── vitest.config.ts              # vitest + v8 coverage
├── .dockerignore
├── .env.example
├── PLAN_MIGRATION.md             # Backend integration history
├── PLAN_DEPLOY.md                # Self-hosting guide (live URL, troubleshoot)
├── README.md
└── AGENTS.md (this file)
```

---

## 3. The SIN-Code stack — every repo you touch

| Repo | Role | When you change it |
|---|---|---|
| **[SIN-Code-Bundle](https://github.com/OpenSIN-Code/SIN-Code-Bundle)** | The `sin-code` Go binary. Source of truth for subcommands + MCP tools. Release tarballs at `releases/download/{tag}/sin-code-linux-{arch}.tar.gz`. | When the binary gains a new subcommand or MCP tool — update `lib/sin/tools.ts` here to match. |
| **[SIN-Code-WebUI-v2](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2)** | This repo. The chat surface. | Most of your work. |
| **[SIN-Code-Context-Bridge-Skill](https://github.com/OpenSIN-Code/SIN-Code-Context-Bridge-Skill)** | Unified context query across SCKG + sin-brain + GitNexus. | Use via the `sin_context` MCP tool when an agent needs cross-source context. |
| **[SIN-Brain](https://github.com/OpenSIN-Code/SIN-Brain)** (private) | "Ultra-best self-editing, evidence-grounded memory cortex". Persistent rules + memory across sessions. | Use via `sin_context` for cross-session recall. Adds rules via the brain MCP tools. |

Skills: `~/.config/opencode/skills/` has **30+** SIN skills (ceo-audit,
sin-git-workflow, sin-frontend-design, sin-context-bridge, sin-honcho,
sin-honcho-rollback, sin-doc-coauthoring, sin-mcp-server-builder, etc.).
Read the relevant `SKILL.md` once per session.

---

## 4. Hard rules — what NEVER to do

These are the rules we've established by experience. Violating any
of them has cost us a force-push in the past.

1. **NEVER hand-maintain the subcommand / MCP tool lists anywhere
   except `lib/sin/tools.ts`.** Update the file, let the rest of the
   code import from it. Hardcoding a count of "32" or "44" anywhere
   is wrong — use `SIN_MCP_TOOLS.length`.

2. **NEVER call `sin` (Python CLI). It is deprecated.** The Go
   binary is `sin-code`. Per `OpenSIN-Code/SIN-Code-Bundle/AGENTS.md`
   v1.1.0+, the Python CLI is permanently retired.

3. **NEVER use the obsolete `ai/mcp-stdio` import.** In AI SDK 6
   (`ai@6.0.202`), the MCP client moved to `@ai-sdk/mcp`:
   ```ts
   import { createMCPClient } from '@ai-sdk/mcp'
   import { Experimental_StdioMCPTransport as StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio'
   ```

4. **NEVER use `child_process.exec` for sin-code calls.** Use
   `execFile` (no shell) + per-token regex sanitization. The
   current `SAFE_ARG = /^[a-zA-Z0-9_./:=@~,+-]+$/` in
   `lib/sin/client.ts` is the only acceptable form.

5. **NEVER ship a real `vck_…` key, `ghp_…` token, GitHub PAT,
   or any production secret into the repo.** The
   `.env.development.local.md` is gitignored. If a real key
   appears in chat history or a diff, ROTATE IT.

6. **NEVER use the `orb` binary for Docker containers.** The
   `orb` command is for managing OrbStack Linux machines only.
   Container commands use plain `docker` (OrbStack provides a
   Docker-compatible engine). The `orb-up.sh` / `orb-down.sh`
   scripts auto-detect and use `docker` directly.

7. **NEVER use `header_up` outside a `reverse_proxy` block in
   Caddyfile.** It's nginx syntax; Caddy rejects it. Always put
   `header_up …` inside the `reverse_proxy` braces.

8. **NEVER read localStorage during the initial `useState`
   initializer in a store.** It causes React hydration mismatches.
   Always start with a deterministic default, hydrate in
   `useEffect` on mount. See `components/chat-store.tsx:73` for
   the canonical pattern.

9. **NEVER edit `pnpm-lock.yaml` by hand.** Always run
   `pnpm install` to regenerate it. If the lockfile is out of
   sync with `package.json`, Docker builds fail with
   `ERR_PNPM_OUTDATED_LOCKFILE` (real bug from #48).

10. **NEVER point Cloudflare at `*.pages.dev` via a tunnel.**
    `pages.dev` is a Cloudflare-Pages-managed domain. Tunnels
    can only point at domains you control DNS for (e.g.
    `*.delqhi.com`). Use a real subdomain or deploy to
    Cloudflare Pages directly (not currently supported by
    this repo's architecture).

---

## 5. Workflow conventions — how we ship

### 5.1 Issues
- One issue per discrete change. Labels: `kind/{bug,feature,refactor,docs,enhancement,ci,infrastructure}`,
  `priority/{P0,P1,P2,P3}`, `scope/{frontend,backend,ai,devops,code-quality}`.
- Body has **context**, **goal**, **acceptance criteria**, **related issues**.

### 5.2 Conventional Commits
- `feat(scope): …`, `fix(scope): …`, `chore: …`, `docs: …`,
  `refactor(scope): …`, `ci: …`, `feat(infrastructure): …`.
- Body references the issues it closes (`Closes #N #M`).
- One logical change per commit.
- Add `Co-authored-by: <agent-name> <noreply@anthropic.com>` trailer
  when a subagent produces the commit.

### 5.3 Pull requests
- Title mirrors the commit prefix. Body includes: summary, verification
  commands run, risk assessment.
- `ceo-audit` + `typescript` workflow checks must be green.
- This repo has **`required_approving_review_count: 1`** but **no
  second approver available**. So we use the **force-push trick** for
  solo development (see §5.5).
- When multiple subagents produce parallel PRs, squash-merge them
  one at a time (lowering protection, merging, restoring).

### 5.4 Quality gates
- `pnpm tsc --noEmit` → exit 0
- `pnpm build` → success
- `pnpm test` → all tests pass (11 tests, 100% statements on `lib/sin/client.ts`)
- `pnpm lint` → exit 0
- `docker compose config` → valid (no dependency cycle)
- Secret scan on staged diff → 0 hits
- `ceo-audit` workflow → SUCCESS
- `typescript` workflow → SUCCESS

### 5.5 Force-push protocol (when no second reviewer exists)
The repo enforces `required_approving_review_count: 1` and
`--admin` does NOT bypass this rule (GitHub security feature,
late 2023). The work-around is:
```bash
# 1. Lower reviews to 0
gh api --method PUT repos/{owner}/{repo}/branches/main/protection \
  --input <(echo '{"required_status_checks":null,"enforce_admins":true,
  "required_pull_request_reviews":{"required_approving_review_count":0},
  "required_linear_history":false,"allow_force_pushes":true}')

# 2. Squash-merge the PR (or force-push main directly)
gh pr merge N --squash --admin
# OR
git push origin main --force

# 3. Restore strict protection
gh api --method PUT repos/{owner}/{repo}/branches/main/protection \
  --input <(echo '{"required_status_checks":{"strict":true,"contexts":["ceo-audit","typescript"]},
  "enforce_admins":true,"required_pull_request_reviews":{"required_approving_review_count":1},
  "required_linear_history":true,"allow_force_pushes":false}')
```
Use sparingly. When a second maintainer is added, replace this with
normal PR + review.

### 5.6 PR-linkage bug workaround
Force-pushing a PR branch can break GitHub's
`head_sha ↔ check_run` linkage: the workflow run completes with
`success` but the PR still shows `blocked`. Fix: push a non-empty
commit (e.g. touch a file) to retrigger with fresh `head_sha`.

### 5.7 Lockfile sync (after package.json changes)
PRs that modify `package.json` MUST also regenerate `pnpm-lock.yaml`
in the same commit. Otherwise the Docker build fails:
```bash
pnpm install   # regenerates lockfile
git add pnpm-lock.yaml
git commit -m "fix(deps): regenerate pnpm-lock.yaml"
```
This happened in PR #48 (added eslint deps) — see commit `09ae541`.

---

## 6. sin-brain — how to use it for memory

[sin-brain](https://github.com/OpenSIN-Code/SIN-Brain) (private) is
a persistent, self-editing memory cortex. In this repo, the right
way to use it:

### When to query sin-brain
- Before making non-trivial changes, query for prior decisions
  on the same area. Example:
  `sin_context(query="project-store migration history", sources="sin_brain,gitnexus")`
- When a user says "we discussed this before" or "last time we did X",
  query sin-brain before guessing.
- When the user says "remember that…", write to sin-brain via
  `sin_memory add` so future sessions have it.

### When to write to sin-brain
- After solving a non-obvious bug (e.g. the PR-linkage bug in §5.6,
  the lockfile-sync bug in §5.7).
- After a new "hard rule" is established (e.g. §4 items 9 and 10
  are recent additions from real bugs).
- After a successful migration (e.g. `sin` → `sin-code`).

### When NOT to use sin-brain
- Trivial questions that grep can answer.
- Hypotheticals ("what if we used X?"). Query first, only save if
  actually decided.

If `sin-brain` is not installed locally (binary is 0 bytes /
missing), degrade gracefully: `grep -r 'sin-code' lib/` and the
issue history are good enough substitutes for most queries.

---

## 7. Common tasks — recipes

### "Add a new sin-code subcommand to the WebUI"
1. Add the subcommand to `SIN_CODE_SUBCOMMANDS` in `lib/sin/tools.ts`.
2. Done. `runSinCodeCommand()` already accepts any whitelisted sub.
3. (Optional) If the subcommand is exposed via MCP, also add it
   to `SIN_MCP_TOOLS` and update `app/api/chat/route.ts` system prompt.

### "Wire a new UI element to a store"
1. Add the field + action to the store (`components/<name>-store.tsx`).
2. Add the field to the SSR-safe default.
3. Hydrate from localStorage in `useEffect` (never in `useState`).
4. Export the provider from `app/layout.tsx` if it's a new store.
5. For SSR consistency, prefix `localStorage.setItem` with a
   `hydrated` guard to avoid clobbering on the first render.

### "Add a new page route"
1. Create `app/<route>/page.tsx`. Server Component for static
   content, mark `'use client'` only if needed.
2. If using stores, the page must be inside `<ProjectStoreProvider>`
   etc. (already set up in `app/layout.tsx`).
3. Add the route to `components/app-sidebar.tsx` `navItems` array.
4. Add a brief description to `README.md` if it's user-facing.

### "Add a CI workflow"
1. New file under `.github/workflows/`.
2. Use pinned actions by major version (`@v4` not `@main`).
3. Set `permissions:` block explicitly. Never rely on implicit
   `write-all`.
4. Add the workflow's check to branch protection if it should
   gate merges.
5. Self-test on a branch PR before relying on it.

### "Deploy to production"
1. `./scripts/orb-up.sh` — builds + starts the Docker stack
2. `./scripts/tunnel-up.sh` — quick tunnel for testing
   (random `*.trycloudflare.com` URL)
3. For a permanent URL on your own domain, create a named
   tunnel: `cloudflared tunnel create sin-code-webui` +
   `cloudflared tunnel route dns sin-code-webui <subdomain>`
4. Verify: `curl -sf https://<url>/api/sin/status`
5. See `PLAN_DEPLOY.md` for the full topology.

---

## 8. What is OUT of scope here

- **`SIN-Code-Bundle` Go code** — that's a different repo. Open an
  issue / PR there.
- **Real Vercel deploys** — the chat header's `Publish` button
  triggers `/api/publish` which fires a GitHub `workflow_dispatch`
  to rebuild the Docker image and redeploy via Cloudflare Tunnel.
  Real Vercel deploys are still not supported (Pages Functions can't
  host the long-lived `sin-code` stdio process).
- **Database / multi-user persistence** — all stores are
  localStorage. A real backend would be a separate repo.
- **Cloudflare Pages deployment** — would require architectural
  changes (no long-lived processes on Pages). Use the
  Docker + Cloudflare Tunnel approach instead.

---

## 9. Open follow-ups (live issue tracker)

All 41 issues have been closed and shipped. The current
roadmap lives in the live issue list — check it before
starting any new task.

**Recently shipped (issues #1–#48):**
- `#1–#7` — sin-code backend integration (Python → Go migration)
- `#8–#17` — chat UI, stores, share menu, README
- `#18–#23` — favorites, publish menu (UI), search, templates, design systems
- `#24–#27` — Move to Project submenu, project-store, send/mic + model selector
- `#28–#31` — model wired to /api/chat, active-project badge, sidebar projects
- `#32–#34` — Docker + OrbStack + Cloudflare Tunnel deployment
- `#35` — AGENTS.md (was #41)
- `#36` — pnpm tsc + pnpm lint CI (PR #48)
- `#37` — vitest + 11 unit tests (PR #45)
- `#38` — CODEOWNERS (PR #43)
- `#39` — real /api/publish (PR #44)
- `#40` — collapsible sidebar (PR #47)

See [`PLAN_MIGRATION.md`](PLAN_MIGRATION.md) for the full
issue-by-issue history.

---

## 10. Quick health check

Before you call a task done:
```bash
pnpm tsc --noEmit             # 0 errors
pnpm build                   # success
pnpm test                    # 11/11 pass
pnpm lint                    # 0 errors
./scripts/orb-up.sh          # full stack running
curl -sf localhost:8080/api/sin/status | jq
# → expect {installed: true, version: "v2.5.0", capabilities: {subcommandCount: 32, mcpTools: 44}}
curl -sf https://sincode-webui.delqhi.com/api/sin/status | jq  # production
./scripts/orb-down.sh
```

If any of these fail, fix it before reporting done.

---

Last updated: aligned with main @ `09ae541` (post #36–#40 + live deployment).
