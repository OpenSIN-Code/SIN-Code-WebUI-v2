-- Purpose: Initial schema for the SIN-Code WebUI persistent store.
-- Run once: psql "$DATABASE_URL" -f scripts/001_init.sql

CREATE TABLE IF NOT EXISTS chats (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  chat_id     TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_tokens (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  hash         TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  args        TEXT NOT NULL DEFAULT '',
  ok          BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error       TEXT,
  ip          TEXT
);

CREATE INDEX IF NOT EXISTS idx_chats_updated   ON chats (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ts        ON audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_log (actor);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_log (action);
