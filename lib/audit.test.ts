// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import { auditToCsv, type AuditEntry } from './audit'

describe('auditToCsv()', () => {
  it('renders the header and one row per entry', () => {
    const entries: AuditEntry[] = [
      {
        ts: '2026-01-01T00:00:00.000Z',
        actor: 'root',
        action: 'execute',
        args: '{}',
        ok: true,
        durationMs: 12,
      },
    ]
    const csv = auditToCsv(entries)
    const rows = csv.split('\n')
    expect(rows[0]).toBe(
      'timestamp,actor,action,args,ok,duration_ms,error,ip',
    )
    expect(rows[1]).toContain('root')
    expect(rows[1]).toContain('execute')
  })

  it('escapes quotes and commas by wrapping fields', () => {
    const entries: AuditEntry[] = [
      {
        ts: '2026-01-01T00:00:00.000Z',
        actor: 'root',
        action: 'execute',
        args: '{"key":"value with "quotes""}',
        ok: true,
        durationMs: 0,
        error: 'error, with commas',
      },
    ]
    const csv = auditToCsv(entries)
    expect(csv).toContain('""quotes""')
    expect(csv).toContain('"error, with commas"')
  })

  it('renders empty values for missing optional fields', () => {
    const entries: AuditEntry[] = [
      {
        ts: '2026-01-01T00:00:00.000Z',
        actor: 'anonymous',
        action: 'chat',
        args: '',
        ok: false,
        durationMs: 5,
      },
    ]
    const csv = auditToCsv(entries)
    const row = csv.split('\n')[1]
    expect(row).toContain('""') // error
    expect(row.endsWith(',""')).toBe(true) // ip
  })

  it('returns only the header for empty input', () => {
    expect(auditToCsv([])).toBe(
      'timestamp,actor,action,args,ok,duration_ms,error,ip',
    )
  })
})
