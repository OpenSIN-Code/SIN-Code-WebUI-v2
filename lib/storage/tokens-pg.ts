/**
 * Purpose: Postgres implementation of the access token store.
 * Same exported signatures as the file-based lib/tokens.ts.
 */
// SPDX-License-Identifier: MIT

import { createHash, randomBytes } from 'node:crypto'
import { getPool } from '@/lib/db'
import type { TokenRecord } from '@/lib/tokens'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function listTokens(): Promise<Omit<TokenRecord, 'hash'>[]> {
  const { rows } = await getPool().query(
    `SELECT id, name, created_at, last_used_at
     FROM access_tokens ORDER BY created_at DESC`,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at.toISOString(),
    lastUsedAt: r.last_used_at?.toISOString() ?? null,
  }))
}

export async function createToken(
  name: string,
): Promise<{ id: string; token: string }> {
  const token = `sin_${randomBytes(24).toString('hex')}`
  const id = randomBytes(6).toString('hex')
  await getPool().query(
    `INSERT INTO access_tokens (id, name, hash) VALUES ($1, $2, $3)`,
    [id, name.trim().slice(0, 60), hashToken(token)],
  )
  return { id, token }
}

export async function revokeToken(id: string): Promise<boolean> {
  const result = await getPool().query(
    `DELETE FROM access_tokens WHERE id = $1`,
    [id],
  )
  return (result.rowCount ?? 0) > 0
}

export async function verifyStoredToken(token: string): Promise<boolean> {
  const result = await getPool().query(
    `UPDATE access_tokens
     SET last_used_at = NOW()
     WHERE hash = $1
       AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '1 minute')
     RETURNING id`,
    [hashToken(token)],
  )
  if ((result.rowCount ?? 0) > 0) return true
  // Row may exist but was updated <1min ago — plain existence check.
  const { rows } = await getPool().query(
    `SELECT 1 FROM access_tokens WHERE hash = $1`,
    [hashToken(token)],
  )
  return rows.length > 0
}

export async function findTokenName(token: string): Promise<string | null> {
  const { rows } = await getPool().query(
    `SELECT name FROM access_tokens WHERE hash = $1`,
    [hashToken(token)],
  )
  return rows[0]?.name ?? null
}
