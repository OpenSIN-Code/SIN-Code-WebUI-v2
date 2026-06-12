/**
 * Purpose: One-shot migration of the file-based store (data/) into Postgres.
 * Usage: DATABASE_URL=postgres://… node scripts/migrate-files-to-pg.mjs
 * Idempotent: upserts chats/tokens, skips audit lines already present
 * is not attempted — audit history is appended once; re-running will
 * duplicate audit rows, so only run the audit section on a fresh table.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const DATA_DIR = process.env.SIN_DATA_DIR || path.join(process.cwd(), 'data')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function migrateChats() {
  const chatsDir = path.join(DATA_DIR, 'chats')
  const index = await readJson(path.join(chatsDir, 'index.json'), [])
  let count = 0
  for (const meta of index) {
    await pool.query(
      `INSERT INTO chats (id, label, favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label,
         favorite = EXCLUDED.favorite, updated_at = EXCLUDED.updated_at`,
      [meta.id, meta.label, meta.favorite ?? false, meta.createdAt, meta.updatedAt],
    )
    const messages = await readJson(path.join(chatsDir, `${meta.id}.json`), [])
    await pool.query(
      `INSERT INTO chat_messages (chat_id, messages) VALUES ($1, $2::jsonb)
       ON CONFLICT (chat_id) DO UPDATE SET messages = EXCLUDED.messages`,
      [meta.id, JSON.stringify(messages)],
    )
    count++
  }
  console.log(`chats: migrated ${count}`)
}

async function migrateTokens() {
  const tokens = await readJson(path.join(DATA_DIR, 'tokens.json'), [])
  for (const t of tokens) {
    await pool.query(
      `INSERT INTO access_tokens (id, name, hash, created_at, last_used_at)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (hash) DO NOTHING`,
      [t.id, t.name, t.hash, t.createdAt, t.lastUsedAt],
    )
  }
  console.log(`tokens: migrated ${tokens.length}`)
}

async function migrateAudit() {
  const auditDir = path.join(DATA_DIR, 'audit')
  let files = []
  try {
    files = (await readdir(auditDir)).filter((f) => f.endsWith('.jsonl'))
  } catch {
    console.log('audit: no files')
    return
  }
  let count = 0
  for (const file of files) {
    const raw = await readFile(path.join(auditDir, file), 'utf8')
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      try {
        const e = JSON.parse(line)
        await pool.query(
          `INSERT INTO audit_log (ts, actor, action, args, ok, duration_ms, error, ip)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [e.ts, e.actor, e.action, e.args, e.ok, e.durationMs, e.error ?? null, e.ip ?? null],
        )
        count++
      } catch {
        /* skip corrupt lines */
      }
    }
  }
  console.log(`audit: migrated ${count} entries`)
}

await migrateChats()
await migrateTokens()
await migrateAudit()
await pool.end()
console.log('done')
