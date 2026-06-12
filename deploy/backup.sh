#!/usr/bin/env bash
# Purpose: Nightly backup for the sincode-webui deployment.
# Dumps Postgres + archives the data volume, keeps the last 14 backups.
# Cron: 0 3 * * * /opt/sincode-webui/deploy/backup.sh >> /var/log/sin-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sincode-webui}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/sincode-webui}"
KEEP=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
cd "$COMPOSE_DIR"

# 1. Postgres dump (custom format -> compact + selective restore possible)
docker compose exec -T db pg_dump -U sin -d sincode -Fc \
  > "$BACKUP_DIR/db-$STAMP.dump"

# 2. File-store volume (data/: file-mode chats, tokens, audit, shares)
docker run --rm \
  -v "$(docker compose config --format json | jq -r '.volumes["sin-data"].name // "sincode-webui_sin-data"')":/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/data-$STAMP.tar.gz" -C /data .

# 3. Rotation: keep the newest $KEEP of each kind
for prefix in db data; do
  ls -1t "$BACKUP_DIR/$prefix-"* 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm --
done

echo "backup $STAMP done: $(du -sh "$BACKUP_DIR" | cut -f1) total"

# ── Restore (manual, on demand) ─────────────────────────────────────────
# Postgres: docker compose exec -T db pg_restore -U sin -d sincode --clean < db-<stamp>.dump
# Volume:   docker run --rm -v sincode-webui_sin-data:/data -v $BACKUP_DIR:/backup \
#             alpine sh -c "rm -rf /data/* && tar xzf /backup/data-<stamp>.tar.gz -C /data"
