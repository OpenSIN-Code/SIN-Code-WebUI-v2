/**
 * Purpose: Share link store. A share maps an unguessable slug to a chat
 * and makes it publicly readable (read-only). Postgres when DATABASE_URL
 * is set, otherwise data/shares.json.
 */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPool, isDbConfigured } from '@/lib/db'

export type Share = {
  slug: string
  chatId: string
  createdBy: string | null
  createdAt: string
}

const SAFE_SLUG = /^[a-f0-9]{16}$/
const DATA_DIR = process.env.SIN_DATA_DIR || path.join(process.cwd(), 'data')
const SHARES_FILE = path.join(DATA_DIR, 'shares.json')

export function isValidSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug)
}

// ── File fallback ──────────────────────────────────────────────────────
async function readFileShares(): Promise<Share[]> {
  try {
    return JSON.parse(await readFile(SHARES_FILE, 'utf8')) as Share[]
  } catch {
    return []
  }
}

async function writeFileShares(shares: Share[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${SHARES_FILE}.tmp-${Date.now()}`
  await writeFile(tmp, JSON.stringify(shares, null, 2), 'utf8')
  await rename(tmp, SHARES_FILE)
}

// ── Public API ─────────────────────────────────────────────────────────
/** Create (or return the existing) share for a chat. */
export async function shareChat(
  chatId: string,
  createdBy: string | null,
): Promise<Share> {
  const slug = randomBytes(8).toString('hex')
  if (isDbConfigured()) {
    const { rows } = await getPool().query(
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
    const result = await getPool().query(
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
    const { rows } = await getPool().query(
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
    const { rows } = await getPool().query(
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
