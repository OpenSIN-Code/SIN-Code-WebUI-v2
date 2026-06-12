-- Purpose: Public read-only share links for chats.
-- Run after 002_users.sql: psql "$DATABASE_URL" -f scripts/003_shares.sql

CREATE TABLE IF NOT EXISTS chat_shares (
  slug        TEXT PRIMARY KEY,           -- unguessable, e.g. 16 random hex chars
  chat_id     TEXT NOT NULL UNIQUE REFERENCES chats(id) ON DELETE CASCADE,
  created_by  TEXT,                       -- actor string for the audit trail
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_chat ON chat_shares (chat_id);
