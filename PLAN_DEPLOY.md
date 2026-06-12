# PLAN: Deployment — Docker + OrbStack + Cloudflare Tunnel

This document is the **single source of truth** for how to run
SIN-Code WebUI v2 locally, on a dev machine, and in production.

> Last verified against: `a718702` (post PR #18) + deploy work in PR #34.

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│ Public Internet (browser, phone, share-link)             │
└──────────────────────┬────────────────────────────────────┘
                       │ https (Cloudflare Tunnel OR domain)
                       ▼
┌───────────────────────────────────────────────────────────┐
│ Cloudflare edge (free tier)                               │
│  ├─ *.trycloudflare.com (quick tunnel, dev)                │
│  └─ sin-code.example.com (named tunnel, prod)             │
└──────────────────────┬────────────────────────────────────┘
                       │ TLS
                       ▼
┌───────────────────────────────────────────────────────────┐
│ caddy :80 / :443 (reverse proxy + auto-HTTPS)             │
│  → webui:3000  (Next.js standalone)                       │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────┐
│ webui (Next.js 16, standalone)                             │
│  ├─ /api/chat       → streamText → LLM gateway             │
│  ├─ /api/sin/status → reads status from sin-code binary    │
│  └─ lib/sin/{client,mcp}.ts → execFile/spawns             │
│         │                                                │
│         ▼                                                │
│  sin-code binary (BUNDLED INSIDE THE IMAGE)                │
│  ├─ 32 subcommands (CLI)                                 │
│  └─ 44 MCP tools (sin_*)                                  │
└───────────────────────────────────────────────────────────┘
```

The **`sin-code` Go binary is bundled inside the webui image**
(downloaded in the Dockerfile's `sin-code` stage from the official
SIN-Code-Bundle release). The webui spawns it via `execFile` /
`StdioMCPTransport` — same process tree, no extra service to manage.

If you need a **dedicated** sin-code service (e.g. to share one
across multiple webui replicas), enable the `tools` profile:

```bash
orb compose --profile tools up -d
```

This starts the `ghcr.io/opensin-code/sin-code:v2.5.0` image on
port 8090 and the webui can be pointed at it via `SIN_CODE_BIN` env
pointing at the host's port.

---

## Topology A: Local dev on macOS (OrbStack)

> **Why OrbStack, not Docker Desktop?** Per the repo AGENTS.md,
> Docker Desktop on macOS is unstable. OrbStack provides a Docker-
> compatible engine (the plain `docker` command works — verified
> via `docker context show` returning `orbstack`) backed by native
> macOS virtualization. The `orb` binary itself is for managing
> Linux machines, **not** containers — container commands use
> `docker` directly. See `~/.config/opencode/AGENTS.md`.

### One-time setup

```bash
# 1. Install OrbStack
brew install orbstack

# 2. Install cloudflared (for public URLs)
brew install cloudflared

# 3. Clone the repo + install deps
cd ~/dev
git clone https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2
cd SIN-Code-WebUI-v2
pnpm install

# 4. Fill in secrets
cp .env.example .env
# → edit .env, set AI_GATEWAY_API_KEY=vck_…
```

### Daily usage

```bash
# Start the stack (uses `docker`, backed by OrbStack on macOS)
./scripts/orb-up.sh
# → builds the image, starts 3 containers, prints endpoints

# Open the UI
open http://localhost:8080

# Make it public (optional — get a trycloudflare.com URL)
./scripts/tunnel-up.sh
# → prints https://<random>.trycloudflare.com (Ctrl-C to stop)

# Tail logs
docker compose logs -f webui

# Stop everything
./scripts/orb-down.sh           # keep volumes
./scripts/orb-down.sh --volumes # nuke caddy certs too
```

### Port map

| Port | Service | Public? |
|---|---|---|
| 8080 | caddy (HTTP) → webui | yes (or via tunnel) |
| 3000 | webui (Next.js) | no — internal only |
| 8090 | sin-code stdio bridge (optional profile) | no — internal only |

---

## Topology B: Local dev on Linux / WSL

Same commands, but `orb` is unavailable. The scripts auto-fall-back
to plain `docker`:

```bash
docker compose up -d
docker compose logs -f webui
```

---

## Topology C: Production on a VPS (Hetzner / DO / Fly)

> The same `docker-compose.yml` runs unchanged on any Linux VPS
> with Docker installed. The VPS becomes a one-command install.

### Provisioning (Ubuntu 24.04 LTS, ~€4/mo at Hetzner)

```bash
# 1. SSH in
ssh root@your-vps

# 2. Install Docker + clone
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
git clone https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2
cd SIN-Code-WebUI-v2

# 3. Fill in secrets
cp .env.example .env
nano .env  # set AI_GATEWAY_API_KEY, TUNNEL_TOKEN (if using named tunnel)

# 4. (Optional but recommended) named Cloudflare tunnel
#    See: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
cloudflared tunnel login
cloudflared tunnel create sin-code-webui
cloudflared tunnel token sin-code-webui  # paste into .env as TUNNEL_TOKEN

# 5. Start
./scripts/orb-up.sh  # works with `docker` fallback on Linux

# 6. (If not using cloudflared) point a real domain at the VPS
#    and Caddy will auto-issue a Let's Encrypt cert.
```

### Why Cloudflare Tunnel instead of exposing ports?

- **No firewall holes** — the VPS doesn't expose 80/443 to the world
- **Free TLS** — Cloudflare terminates TLS at the edge
- **DDoS protection** — built-in
- **DDoS-aware origin** — the tunnel is outbound, so attackers can't reach the VPS directly
- **One domain per stack** — bind `sin-code.example.com` without changing VPS firewall

---

## Build details

### Why `output: 'standalone'`?

Next.js 16 produces a **self-contained** Node.js server in
`.next/standalone/` that includes only the files actually used by
your app (no `node_modules` for unused packages). The Dockerfile
copies that + the `.next/static/` folder + `public/` into a slim
`node:22-slim` image. Result: ~250 MB image, no `pnpm install`
at runtime, no 1 GB `node_modules` in the container.

### Where does the sin-code binary come from?

The Dockerfile has a `sin-code` build stage that downloads the
official release tarball from
`https://github.com/OpenSIN-Code/SIN-Code-Bundle/releases`.
Override with `--build-arg SIN_CODE_VERSION=v2.5.1`.

If the release URL changes, the Dockerfile falls back to
`/releases/latest/download/`. The binary is verified with
`--version` at build time so a broken download fails the build.

### Caching

- **Buildx cache** is enabled via `cache-from: type=gha` and
  `cache-to: type=gha,mode=max` in the GH workflow
- Local builds with OrbStack are similarly cached by default

---

## Environment variables

| Variable | Default | Where | Purpose |
|---|---|---|---|
| `AI_GATEWAY_API_KEY` | *(required)* | .env | Vercel AI Gateway key (or any OpenAI/Anthropic compat key) |
| `SIN_CHAT_MODEL` | `openai/gpt-5-mini` | .env | Model id passed to `streamText` |
| `SIN_CODE_BIN` | `/usr/local/bin/sin-code` | Dockerfile | Path to the bundled binary |
| `WEBUI_PORT` | `8080` | .env | Host port for caddy |
| `SIN_CODE_PORT` | `8090` | .env | Host port for the optional sin-code service |
| `TUNNEL_NAME` | `sin-code-webui` | .env | Cloudflare tunnel name |
| `TUNNEL_TOKEN` | *(empty → no tunnel)* | .env | Cloudflare tunnel auth token |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `orb` not found | OrbStack not installed | `brew install orbstack` |
| `docker compose config` errors | compose file syntax | run `docker compose config` to see error |
| `webui` unhealthy | bad `AI_GATEWAY_API_KEY` | check container logs, fix `.env`, restart |
| `caddy` exits immediately | port 80 already in use | change `WEBUI_PORT=8080` to `WEBUI_PORT=8888` |
| Cloudflare tunnel says "no such host" | `cloudflared` not authenticated | `cloudflared tunnel login` |
| `sin-code` binary not running | missing in PATH inside container | check Dockerfile's `sin-code` stage, re-build |
| CORS errors from `/api/*` | browser hitting wrong origin | access via `http://localhost:8080`, not `http://localhost:3000` directly |

---

## Rollback / teardown

```bash
# Soft: keep data, stop containers
./scripts/orb-down.sh

# Hard: nuke data too
./scripts/orb-down.sh --volumes
docker system prune -a   # also cleans up dangling images
```

---

## Production checklist

- [ ] `.env` has a real `AI_GATEWAY_API_KEY`
- [ ] `TUNNEL_TOKEN` set (if using Cloudflare tunnel)
- [ ] Caddy logs show no startup errors: `docker compose logs caddy`
- [ ] WebUI is reachable: `curl -s localhost:8080/api/sin/status | jq`
- [ ] Cloudflare tunnel URL responds to HTTPS
- [ ] Auto-restart works: `docker compose restart` and check `docker compose ps`
- [ ] Disk usage sane: `docker system df` (<5 GB expected)

---

## Related

- [`PLAN_MIGRATION.md`](./PLAN_MIGRATION.md) — the sin-code backend integration plan
- [`README.md`](./README.md) — project overview, setup, scripts
- [SIN-Code-Bundle releases](https://github.com/OpenSIN-Code/SIN-Code-Bundle/releases)
- [OrbStack docs](https://docs.orbstack.dev/)
- [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
