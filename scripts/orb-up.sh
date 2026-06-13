#!/usr/bin/env bash

# SPDX-License-Identifier: MIT
# ──────────────────────────────────────────────────────────────
# scripts/orb-up.sh — start the SIN-Code WebUI v2 stack on OrbStack
# (or Docker, as a fallback). One command, no fuss.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

# Detect container runtime. Per the repo AGENTS.md: macOS uses
# OrbStack, which provides a Docker-compatible engine via the plain
# `docker` command (the `orb` binary is for managing Linux machines,
# not containers). We verify Docker + Compose are available.
if command -v docker >/dev/null 2>&1; then
    RUNTIME="docker"
    if ! docker context show 2>/dev/null | grep -q 'orbstack'; then
        echo "⚠️  Docker is on PATH but not pointing at OrbStack. On macOS, install OrbStack:"
        echo "   brew install orbstack"
        echo "   Falling back to plain Docker Desktop (slower on macOS)."
    fi
else
    echo "❌ 'docker' is not on PATH. Install OrbStack (macOS) or Docker Engine (Linux):"
    echo "   macOS:  brew install orbstack"
    echo "   Linux:  https://docs.docker.com/engine/install/"
    exit 1
fi

# Sanity: docker compose v2 plugin (orb ships with it).
if ! $RUNTIME compose version >/dev/null 2>&1; then
    echo "❌ '$RUNTIME compose' is unavailable. Update your runtime."
    exit 1
fi

# Make sure .env exists (docker compose auto-loads it). If not, copy
# from .env.example and warn the user to fill in secrets.
if [[ ! -f .env && -f .env.example ]]; then
    echo "📋 .env missing — copying from .env.example (fill in AI_GATEWAY_API_KEY)."
    cp .env.example .env
fi

# Build + start. Use --detach so the script returns control.
echo "🚀 Starting SIN-Code WebUI v2 via $RUNTIME compose…"
$RUNTIME compose up -d --build

# Tail a few useful lines + a status check.
echo
echo "─── Status ───"
$RUNTIME compose ps

echo
echo "─── Endpoints ───"
WEBUI_PORT="${WEBUI_PORT:-8080}"
echo "  WebUI  →  http://localhost:${WEBUI_PORT}"
echo "  Caddy  →  http://localhost:${WEBUI_PORT}  (reverse-proxied)"
echo "  Health →  curl -s http://localhost:${WEBUI_PORT}/api/sin/status | jq"

echo
echo "─── Logs ───"
echo "  $RUNTIME compose logs -f webui      # chat + API logs"
echo "  $RUNTIME compose logs -f caddy      # proxy logs"
echo
echo "✅ Done. Tear down with: ./scripts/orb-down.sh"
