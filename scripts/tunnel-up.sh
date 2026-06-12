#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# scripts/tunnel-up.sh — public URL via Cloudflare quick tunnel
# No domain or account required. Runs `cloudflared tunnel --url`
# which prints a `*.trycloudflare.com` URL that you can share.
# Useful for testing on a phone or sharing a WIP with a colleague.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
    echo "❌ cloudflared not on PATH. Install: brew install cloudflared"
    exit 1
fi

WEBUI_PORT="${WEBUI_PORT:-8080}"

# Make sure the stack is running first.
RUNTIME="docker"
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ 'docker' is not on PATH."
    exit 1
fi

if ! $RUNTIME compose ps --status running 2>/dev/null | grep -q 'webui\|caddy'; then
    echo "⚠️  Stack is not running. Starting it first via orb-up.sh…"
    "$(dirname "$0")/orb-up.sh"
fi

# Pick the right local port: caddy is exposed on $WEBUI_PORT (default 8080).
# We tunnel to that port; caddy then routes to the webui container.
echo "🌐 Starting Cloudflare quick tunnel → http://localhost:${WEBUI_PORT}"
echo "   Press Ctrl-C to stop the tunnel."
echo
# `--url` starts a quick tunnel (no DNS / no creds).
# `--no-autoupdate` keeps the version stable for the duration of the run.
exec cloudflared tunnel --no-autoupdate --url "http://localhost:${WEBUI_PORT}"
