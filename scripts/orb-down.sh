#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# scripts/orb-down.sh — stop the SIN-Code WebUI v2 stack
# Pass --volumes to also delete the caddy_data / caddy_config
# volumes (next start will re-issue certs).
# ──────────────────────────────────────────────────────────────
set -euo pipefail

RUNTIME="docker"
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ 'docker' is not on PATH."
    exit 1
fi

echo "🛑 Stopping SIN-Code WebUI v2 via $RUNTIME compose…"

if [[ "${1:-}" == "--volumes" || "${1:-}" == "-v" ]]; then
    $RUNTIME compose down -v
    echo "🗑️  Volumes deleted."
else
    $RUNTIME compose down
fi

echo "✅ Done. Start again with: ./scripts/orb-up.sh"
