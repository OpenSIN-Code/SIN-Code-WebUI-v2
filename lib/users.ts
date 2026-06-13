/**
 * Purpose: User accounts for multi-user mode (requires DATABASE_URL).
 * Users own tokens (login identity) and chats (data scoping).
 * The env SIN_UI_TOKEN remains the irrevocable admin/root identity.
 */
// SPDX-License-Identifier: MIT

import { randomBytes } from 'node:crypto'
import { isDbConfigured } from '@/lib/is-db-configured'

export type User = {
  id: string
  name: string
  role: 'admin' | 'member'
  createdAt: string
}

export function isMultiUserEnabled(): boolean {
  return isDbConfigured()
}

export async function listUsers(): Promise<User[]> {
  const { getPool } = await import('@/lib/db')
  const { rows } = await getPool().query(
    `SELECT u.id, u.name, u.role, u.created_at,
            COUNT(t.id)::int AS token_count
     FROM users u
     LEFT JOIN access_tokens t ON t.user_id = u.id
     GROUP BY u.id ORDER BY u.created_at ASC`,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    createdAt: r.created_at.toISOString(),
    tokenCount: r.token_count,
  })) as User[]
}

export async function createUser(
  name: string,
  role: 'admin' | 'member' = 'member',
): Promise<User> {
  const { getPool } = await import('@/lib/db')
  const id = randomBytes(6).toString('hex')
  const { rows } = await getPool().query(
    `INSERT INTO users (id, name, role) VALUES ($1, $2, $3)
     RETURNING id, name, role, created_at`,
    [id, name.trim().slice(0, 60), role],
  )
  const r = rows[0]
  return { id: r.id, name: r.name, role: r.role, createdAt: r.created_at.toISOString() }
}

export async function deleteUser(id: string): Promise<boolean> {
  // Cascades: tokens and chats of this user are removed (FK ON DELETE CASCADE).
  const { getPool } = await import('@/lib/db')
  const result = await getPool().query(`DELETE FROM users WHERE id = $1`, [id])
  return (result.rowCount ?? 0) > 0
}

/** Resolve the user owning a presented token (by hash), or null. */
export async function findUserByTokenHash(hash: string): Promise<User | null> {
  const { getPool } = await import('@/lib/db')
  const { rows } = await getPool().query(
    `SELECT u.id, u.name, u.role, u.created_at
     FROM access_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.hash = $1`,
    [hash],
  )
  if (!rows[0]) return null
  const r = rows[0]
  return { id: r.id, name: r.name, role: r.role, createdAt: r.created_at.toISOString() }
}
