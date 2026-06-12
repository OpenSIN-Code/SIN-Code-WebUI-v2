# AGENTS.md — SIN-Code WebUI v2

> Project-local rules for AI agents working in this repo.
> Supersedes (does not duplicate) the global `~/.config/opencode/AGENTS.md`
> — read both. Global rules are a baseline; project rules below are SOTA.
>
> **Audience:** any AI coding agent (opencode, Claude Code, Codex, etc.)
> acting on this repository.

---

## 1. What this project is

**SIN-Code WebUI v2** is the chat surface of the
[**SIN-Code**](https://github.com/OpenSIN-Code/SIN-Code-Bundle) stack:

```
┌───────────────────────────────────────────────────────────┐
│ Browser                                                   │
│   SinChat (useChat, AI SDK 6)                            │
│     ↕ POST /api/chat + /api/sin/status                    │
│   app/api/chat/route.ts (streamText)                      │
│     ↕ spawn `sin-code` Go binary via @ai-sdk/mcp stdio    │
│   lib/sin/{client,mcp,tools}.ts                           │
└───────────────────────────────────────────────────────────┘
```

- **Frontend:** Next.js 16.2.6 + React 19 + AI SDK 6 + Tailwind 4
- **Backend:** `sin-code` Go binary v2.5.0 (sibling repo: SIN-Code-Bundle)
- **Single source of truth:** `lib/sin/tools.ts` exports the 32 subcommands
  + 44 MCP tools. NEVER hand-maintain a copy elsewhere — import from there.
- **Storage:** all client state in localStorage (chat, project, design-system
  stores). No DB, no backend persistence.

---

## 2. Repository layout

```
sin-code-web-ui-v2/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # streamText + sin-code MCP tools
│   │   └── sin/status/route.ts  # backend status JSON
│   ├── chat/[id]/page.tsx
│   ├── chats/page.tsx
│   ├── design-systems/page.tsx
│   ├── projects/page.tsx
│   ├── search/page.tsx
│   ├── templates/page.tsx
│   ├── layout.tsx               # Providers: ChatStore, ProjectStore, DesignSystemStore
│   ├── page.tsx                 # SinStatusTile + SinChat + AppSidebar
│   └── globals.css
├── components/
│   ├── sin-chat.tsx             # useChat + tool badges + stop/retry
│   ├── sin-status-tile.tsx      # useSWR + clipboard fallback
│   ├── app-sidebar.tsx          # SidebarChatRow (Favorites/Recent/Projects)
│   ├── chat-header.tsx          # Share + Publish + activeProject badge
│   ├── chat-header-with-project.tsx  # Client wrapper resolving activeProject
│   ├── chat-store.tsx           # ChatEntry + localStorage (sin-code:chats)
│   ├── project-store.tsx        # ProjectEntry + chatIds + moveChatToProject
│   ├── projects-list.tsx        # /projects page
│   ├── projects-section.tsx     # Sidebar collapsible section
│   ├── design-system-store.tsx
│   ├── design-systems-list.tsx
│   ├── search-panel.tsx
│   ├── share-menu.tsx           # Visibility + copy link
│   ├── publish-menu.tsx         # Simulated deploy popover
│   ├── page-shell.tsx
│   ├── prompt-box.tsx
│   ├── chats-list.tsx
│   ├── icons.tsx
│   ├── chat-{header,store,view}.tsx
│   └── ui/                      # shadcn primitives
├── lib/
│   ├── sin/
│   │   ├── tools.ts             # 32 subcommands + 44 MCP tools (SINGLE SOURCE)
│   │   ├── client.ts            # sin-code CLI wrapper (execFile, no shell)
│   │   └── mcp.ts               # sin-code serve stdio bridge → @ai-sdk/mcp
│   └── utils.ts
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ceo-audit.yml        # 47-gate SOTA audit (Node/TS-aware)
│       ├── release.yml          # Versioned release pipeline
│       ├── sbom.yml             # CycloneDX SBOM
│       └── docker.yml           # Multi-arch build + push to ghcr.io
├── scripts/
│   ├── orb-up.sh                # Start stack on OrbStack (or Docker fallback)
│   ├── orb-down.sh              # Stop stack
│   └── tunnel-up.sh             # cloudflared quick-tunnel
├── Dockerfile                   # Multi-stage: deps → sin-code → builder → runner
├── docker-compose.yml            # webui + caddy (and optional sin-code service)
├── Caddyfile                     # Reverse proxy + SSE flush
├── .dockerignore
├── .env.example
├── PLAN_MIGRATION.md             # Backend integration history
├── PLAN_DEPLOY.md                # Self-hosting guide
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

5. **NEVER ship a real `vck_…` key, API token, or any
   `AI_GATEWAY_API_KEY` value into the repo.** The
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

### 5.3 Pull requests
- Title mirrors the commit prefix. Body includes: summary, verification
  commands run, risk assessment.
- `ceo-audit` workflow must be green.
- This repo has **`required_approving_review_count: 1`** but **no
  second approver available**. So we use the **force-push trick** for
  solo development (see §5.5).

### 5.4 Quality gates
- `pnpm tsc --noEmit` → exit 0
- `pnpm build` → success
- `docker compose config` → valid (no dependency cycle)
- Secret scan on staged diff → 0 hits
- ceo-audit workflow → SUCCESS

### 5.5 Force-push protocol (when no second reviewer exists)
The repo enforces `required_approving_review_count: 1` and
`--admin` does NOT bypass this rule (GitHub security feature,
late 2023). The work-around is:
```bash
# 1. Lower reviews to 0
gh api --method PUT repos/{owner}/{repo}/branches/main/protection \
  --input <(echo '{"required_status_checks":null,"enforce_admins":true,
  "required_pull_request_reviews":{"required_approving_review_count":0}}')

# 2. Force-push main
git push origin main --force

# 3. Restore strict protection
gh api --method PUT repos/{owner}/{repo}/branches/main/protection \
  --input <(echo '{"required_status_checks":{"strict":true,"contexts":["ceo-audit"]},
  "enforce_admins":true,"required_pull_request_reviews":{"required_approving_review_count":1}}')
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

### 5.8 Subagent PR squash-merge collision (package.json)
When multiple subagent PRs each modify `package.json` and are
squash-merged sequentially, the later PR **silently overwrites**
the earlier PR's dependency changes. Symptom: CI passes for the
later PR but breaks on `main` because a transitive dependency
(e.g. `vitest` types) is missing. Fix: before merging N+1
subagent PRs that touch `package.json`, verify the union of all
devDependencies is present:
```bash
# Compare package.json from each subagent PR branch
git diff main..feat/branch-N -- package.json
# If anything is missing, restore it on a fix branch
git checkout -b fix/restore-deps
# Edit package.json, then:
pnpm install
pnpm tsc --noEmit
pnpm test
git add package.json pnpm-lock.yaml
git commit -m "fix(deps): restore <dep> from <PR#>"
```
This happened in PR #48 over PR #45 — fixed in commit `a93a5f1`.

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
- After solving a non-obvious bug (e.g. the PR-linkage bug in §5.6).
- After a new "hard rule" is established (e.g. §4 items).
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

---

## 8. What is OUT of scope here

- **`SIN-Code-Bundle` Go code** — that's a different repo. Open an
  issue / PR there.
- **Real Vercel deploys** — the chat header's `Publish` button is
  UI-only. Real deploys go through Docker + Cloudflare Tunnel
  (see `PLAN_DEPLOY.md`).
- **Database / multi-user persistence** — all stores are
  localStorage. A real backend would be a separate repo.

---

## 9. Open follow-ups (live issue tracker)

The previous 34 issues have all been closed and shipped. Open
All previously listed follow-ups have been shipped. See the live issue list for current open work.

### Completed (retained for reference)
- `pnpm tsc --noEmit` in CI ✅ — `.github/workflows/tsc-check.yml` runs on every PR/push to main
- `pnpm test` setup ✅ — vitest configured with `lib/utils.test.ts` and `lib/sin/client.test.ts` (15 tests passing)
- `CODEOWNERS` file ✅ — all areas owned by `@jeremy` with section comments
- Settings System ✅ — Preferences, API Keys, Integrations, Members, Usage, General, Memories, Skills (file-based persistence in `.sin-webui/`)
- Workspace Panel ✅ — Preview, Code, Design, Database tabs with tab state persistence
- v0-style Chat UI ✅ — Markdown rendering, Tool Calls, Code Blocks, Shimmer loading, Prompt Composer
- Design Mode ✅ — Drag-to-Move canvas, Floating Layers, Inspector sidebar, Apply/Reset workflow
- Agent Context Injection ✅ — Custom Instructions + Memories into system prompt via `buildAgentContext()`
- Sound Notifications ✅ — audio feedback for events (configurable in settings)
- Theme Sync ✅ — next-themes integration with system/light/dark modes
- CI/CD Pipeline ✅ — `tsc-check.yml`, `lint.yml`, `build.yml` workflows
- Docker Support ✅ — multi-stage Dockerfile + docker-compose.yml + Caddyfile reverse proxy
- File-based Persistence ✅ — `.sin-webui/` workspace with JSON stores (settings, workspaces, memories, projects)

### Open Issues (check before starting any new task)
- **#59** — fix(auth): resolve 401 on all /api/* routes after Better Auth + Kysely integration
- **#60** — fix(build): eliminate the last Turbopack NFT warning in design-edit route
- **#61** — feat(design-mode): wire ⌘Z / ⌘⇧Z keyboard shortcuts for Undo/Redo
- **#62** — ci: verify ceo-audit + tsc-check are green on main @ 30de716

Check the live issue list before starting any new task.

---

## 10. Quick health check

Before you call a task done:
```bash
pnpm tsc --noEmit             # 0 errors
pnpm build                   # success
./scripts/orb-up.sh          # full stack running
curl -sf localhost:8080/api/sin/status | jq
# → expect {installed: true, version: "v2.5.0", capabilities: {subcommandCount: 32, mcpTools: 44}}
./scripts/orb-down.sh
```

If any of these fail, fix it before reporting done.

---

## §5.9 Migrations-Pflicht bei UI-Refactorings

Wenn ein neues Layout/Routing-System eingeführt wird, MÜSSEN alle alten
Einstiegspunkte (Index-Routen, Legacy-Pages) im selben PR migriert oder
auf Redirects umgestellt werden. Ein PR ist erst fertig, wenn die
betroffenen Routen im Browser (Screenshot) verifiziert wurden — ein
grüner tsc/build-Check ist KEIN Beweis für korrektes Rendering.

## §5.10 No Orphaned Components

After every UI refactoring, verify that all old entry points are migrated or
redirected. A PR is only done when the affected routes are verified in the
browser (screenshot) — a green tsc/build check is NO proof of correct
rendering. Use `sin-discover` to detect orphaned components (exported but not
imported anywhere in nav/sidebar). After wiring a new component, delete the
legacy file in the same PR. Never leave dangling components.

## §5.11 Routing Protection

When deploying to Docker + Cloudflare Tunnel on macOS:

- Port 3000 may be occupied by other processes (whatsapp-bridge, other dev
  servers) — always check with `lsof -i :3000` before assuming port is free
- Remap Docker container to `3100:3000` in docker-compose.yml to avoid conflicts
- Update `~/.cloudflared/config-sin-code-webui.yml` to point to `localhost:3100`
- Restart cloudflared tunnel after config changes:
  ```bash
  pkill -f "cloudflared tunnel"
  nohup cloudflared tunnel --config ~/.cloudflared/config-sin-code-webui.yml run sin-code-webui &
  ```
- Verify with `curl -s https://sincode-webui.delqhi.com/api/health` — expect
  Next.js JSON, NOT Express "Invalid Host header"
- If live domain returns Express headers, a local process (not the container)
  is hijacking the tunnel

---

Last updated: aligned with main @ `30de716` (post #58 merge).
