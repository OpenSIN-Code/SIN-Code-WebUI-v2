/**
 * Purpose: Postgres implementation of the audit log.
 * Same exported signatures as the file-based lib/audit.ts.
 */
// SPDX-License-Identifier: MIT

import { getPool } from '@/lib/db'
import type { AuditEntry } from '@/lib/audit'

export async function audit(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
  try {
    await getPool().query(
      `INSERT INTO audit_log (actor, action, args, ok, duration_ms, error, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.actor,
        entry.action,
        entry.args,
        entry.ok,
        entry.durationMs,
        entry.error ?? null,
        entry.ip ?? null,
      ],
    )
  } catch {
    // Audit is best-effort; never break the request.
  }
}

export async function readAudit(options?: {
  limit?: number
  actor?: string
  action?: string
  failedOnly?: boolean
}): Promise<AuditEntry[]> {
  const limit = Math.min(options?.limit ?? 200, 1000)
  const where: string[] = []
  const params: unknown[] = []

  if (options?.actor) {
    params.push(options.actor)
    where.push(`actor = $${params.length}`)
  }
  if (options?.action) {
    params.push(options.action)
    where.push(`action = $${params.length}`)
  }
  if (options?.failedOnly) {
    where.push(`ok = FALSE`)
  }
  params.push(limit)

  const { rows } = await getPool().query(
    `SELECT ts, actor, action, args, ok, duration_ms, error, ip
     FROM audit_log
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ts DESC LIMIT $${params.length}`,
    params,
  )
  return rows.map((r) => ({
    ts: r.ts.toISOString(),
    actor: r.actor,
    action: r.action,
    args: r.args,
    ok: r.ok,
    durationMs: r.duration_ms,
    error: r.error ?? undefined,
    ip: r.ip ?? undefined,
  }))
}
