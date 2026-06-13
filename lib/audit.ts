/**
 * Purpose: Append-only audit log for sin-code executions.
 * Storage: .sin-webui/audit/audit-YYYY-MM.jsonl (one JSON object per line,
 * rotated monthly). Tokens are never logged in plaintext — only a
 * short identifier (root / token name / anonymous).
 *
 * This file is a thin re-export over lib/audit-fs.ts (loaded via
 * `await import()`) so the NFT tracer never sees node:fs at the call
 * boundary (#59 / #60).
 */
// SPDX-License-Identifier: MIT


export type AuditEntry = {
  ts: string
  actor: string
  action: string
  args: string
  ok: boolean
  durationMs: number
  error?: string
  ip?: string
}

let _impl: typeof import('./audit-fs') | null = null

async function impl(): Promise<typeof import('./audit-fs')> {
  if (!_impl) _impl = await import('./audit-fs')
  return _impl
}

export async function audit(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
  return (await impl()).audit(entry)
}

export async function readAudit(options?: {
  limit?: number
  actor?: string
  action?: string
  failedOnly?: boolean
}): Promise<AuditEntry[]> {
  return (await impl()).readAudit(options)
}

export function auditToCsv(entries: AuditEntry[]): string {
  // Pure transform — no fs calls. Re-implement here to stay synchronous.
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = 'timestamp,actor,action,args,ok,duration_ms,error,ip'
  const rows = entries.map((e) =>
    [e.ts, e.actor, e.action, e.args, e.ok, e.durationMs, e.error ?? '', e.ip ?? '']
      .map(esc)
      .join(','),
  )
  return [header, ...rows].join('\n')
}
