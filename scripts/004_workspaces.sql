-- Purpose: Workspaces = configured work modes (system prompt, tools, model, layout).
-- Built-in presets live in code; this table stores user-created custom workspaces.
-- Run after 003_shares.sql: psql "$DATABASE_URL" -f scripts/004_workspaces.sql
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'sparkles',
  system_prompt TEXT NOT NULL DEFAULT '',
  enabled_tools TEXT[] NOT NULL DEFAULT '{}',
  default_model TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4.5',
  layout TEXT NOT NULL DEFAULT 'chat' CHECK (layout IN ('chat', 'writing', 'data')),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL = built-in override
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chats remember which workspace they were started in.
ALTER TABLE chats ADD COLUMN IF NOT EXISTS workspace_id TEXT NOT NULL DEFAULT 'code';

CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces (user_id);
CREATE INDEX IF NOT EXISTS idx_chats_workspace ON chats (workspace_id);
