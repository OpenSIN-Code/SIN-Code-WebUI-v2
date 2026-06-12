/**
 * Purpose: Append-only audit log for sin-code executions.
 * Storage: data/audit/audit-YYYY-MM.jsonl (one JSON object per line,
 * rotated monthly). Tokens are never logged in plaintext — only a
 * short identifier (root / token name / anonymous).
 */
import { appendFile, mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const AUDIT_DIR = path.join(DATA_DIR, 'audit')

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

function currentFile(): string {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return path.join(AUDIT_DIR, `audit-${month}.jsonl`)
}

export async function audit(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
  try {
    await mkdir(AUDIT_DIR, { recursive: true })
    const record: AuditEntry = { ts: new Date().toISOString(), ...entry }
    await appendFile(currentFile(), `${JSON.stringify(record)}\n`, 'utf8')
  } catch {
    // Swallow: logging is best-effort.
  }
}

export async function readAudit(options?: {
  limit?: number
  actor?: string
  action?: string
  failedOnly?: boolean
}): Promise<AuditEntry[]> {
  const limit = Math.min(options?.limit ?? 200, 1000)
  let files: string[] = []
  try {
    files = (await readdir(AUDIT_DIR))
      .filter((f) => f.startsWith('audit-') && f.endsWith('.jsonl'))
      .sort()
      .reverse()
      .slice(0, 2)
  } catch {
    return []
  }

  const entries: AuditEntry[] = []
  for (const file of files) {
    try {
      const raw = await readFile(path.join(AUDIT_DIR, file), 'utf8')
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        try {
          entries.push(JSON.parse(line) as AuditEntry)
        } catch {
          // Skip corrupt lines.
        }
      }
    } catch {
      // Skip unreadable files.
    }
  }

  let result = entries.reverse()
  if (options?.actor) {
    result = result.filter((e) => e.actor === options.actor)
  }
  if (options?.action) {
    result = result.filter((e) => e.action === options.action)
  }
  if (options?.failedOnly) {
    result = result.filter((e) => !e.ok)
  }
  return result.slice(0, limit)
}

export function auditToCsv(entries: AuditEntry[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = 'timestamp,actor,action,args,ok,duration_ms,error,ip'
  const rows = entries.map((e) =>
    [e.ts, e.actor, e.action, e.args, e.ok, e.durationMs, e.error ?? '', e.ip ?? '']
      .map(esc)
      .join(','),
  )
  return [header, ...rows].join('\n')
}
