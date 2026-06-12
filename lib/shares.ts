/**
 * Purpose: Share link store. A share maps an unguessable slug to a chat
 * and makes it publicly readable (read-only). Postgres when DATABASE_URL
 * is set, otherwise data/shares.json.
 *
 * NOTE: pg is lazy-loaded inside isDbConfigured() branches to prevent
 * Turbopack's NFT tracer from pulling native bindings into the server chunk.
 */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { isDbConfigured } from '@/lib/db'

export type Share = {
  slug: string
  chatId: string
  createdBy: string | null
  createdAt: string
}

const SAFE_SLUG = /^[a-f0-9]{16}$/

let _dataDir: string | null = null
function dataDir(): string {
  if (!_dataDir) _dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), '.sin-webui')
  return _dataDir
}

let _sharesFile: string | null = null
function sharesFile(): string {
  if (!_sharesFile) _sharesFile = path.join(dataDir(), 'shares.json')
  return _sharesFile
}

export function isValidSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug)
}

// ── File fallback ──────────────────────────────────────────────────────
async function readFileShares(): Promise<Share[]> {
  try {
    return JSON.parse(await readFile(sharesFile(), 'utf8')) as Share[]
  } catch {
    return []
  }
}

async function writeFileShares(shares: Share[]): Promise<void> {
  await mkdir(dataDir(), { recursive: true })
  const tmp = `${sharesFile()}.tmp-${Date.now()}`
  await writeFile(tmp, JSON.stringify(shares, null, 2), 'utf8')
  await rename(tmp, sharesFile())
}

async function pgQuery<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<{ rows: T[]; rowCount?: number }> {
  const { getPool } = await import('@/lib/db')
  return getPool().query(sql, params) as unknown as Promise<{ rows: T[]; rowCount?: number }>
}

// ── Public API ─────────────────────────────────────────────────────────
/** Create (or return the existing) share for a chat. */
export async function shareChat(
  chatId: string,
  createdBy: string | null,
): Promise<Share> {
  const slug = randomBytes(8).toString('hex')
  if (isDbConfigured()) {
    const { rows } = await pgQuery<{
      slug: string; chat_id: string; created_by: string | null; created_at: Date
    }>(
      `INSERT INTO chat_shares (slug, chat_id, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (chat_id) DO UPDATE SET chat_id = EXCLUDED.chat_id
       RETURNING slug, chat_id, created_by, created_at`,
      [slug, chatId, createdBy],
    )
    const r = rows[0]
    return {
      slug: r.slug,
      chatId: r.chat_id,
      createdBy: r.created_by,
      createdAt: r.created_at.toISOString(),
    }
  }
  const shares = await readFileShares()
  const existing = shares.find((s) => s.chatId === chatId)
  if (existing) return existing
  const share: Share = {
    slug,
    chatId,
    createdBy,
    createdAt: new Date().toISOString(),
  }
  await writeFileShares([share, ...shares])
  return share
}

export async function unshareChat(chatId: string): Promise<boolean> {
  if (isDbConfigured()) {
    const result = await pgQuery(
      `DELETE FROM chat_shares WHERE chat_id = $1`,
      [chatId],
    )
    return (result.rowCount ?? 0) > 0
  }
  const shares = await readFileShares()
  const next = shares.filter((s) => s.chatId !== chatId)
  if (next.length === shares.length) return false
  await writeFileShares(next)
  return true
}

export async function getShareByChatId(chatId: string): Promise<Share | null> {
  if (isDbConfigured()) {
    const { rows } = await pgQuery<{
      slug: string; chat_id: string; created_by: string | null; created_at: Date
    }>(
      `SELECT slug, chat_id, created_by, created_at FROM chat_shares WHERE chat_id = $1`,
      [chatId],
    )
    if (!rows[0]) return null
    const r = rows[0]
    return {
      slug: r.slug,
      chatId: r.chat_id,
      createdBy: r.created_by,
      createdAt: r.created_at.toISOString(),
    }
  }
  return (await readFileShares()).find((s) => s.chatId === chatId) ?? null
}

export async function getShareBySlug(slug: string): Promise<Share | null> {
  if (!isValidSlug(slug)) return null
  if (isDbConfigured()) {
    const { rows } = await pgQuery<{
      slug: string; chat_id: string; created_by: string | null; created_at: Date
    }>(
      `SELECT slug, chat_id, created_by, created_at FROM chat_shares WHERE slug = $1`,
      [slug],
    )
    if (!rows[0]) return null
    const r = rows[0]
    return {
      slug: r.slug,
      chatId: r.chat_id,
      createdBy: r.created_by,
      createdAt: r.created_at.toISOString(),
    }
  }
  return (await readFileShares()).find((s) => s.slug === slug) ?? null
}