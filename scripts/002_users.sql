-- Purpose: Multi-user support. Users own tokens and chats.
-- Run after 001_init.sql: psql "$DATABASE_URL" -f scripts/002_users.sql

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bind tokens and chats to users. NULL = legacy/root-owned (visible to admins).
ALTER TABLE access_tokens ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE chats         ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tokens_user ON access_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user  ON chats (user_id);
