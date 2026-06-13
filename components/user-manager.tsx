// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: User management card for the Settings page (admin only).
 * Create users (initial token shown once), list with role badge, delete.
 */
import { Check, Copy, Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

type UserRow = {
  id: string
  name: string
  role: 'admin' | 'member'
  createdAt: string
  tokenCount?: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function UserManager() {
  const { data, mutate } = useSWR('/api/users', fetcher)
  const [name, setName] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const users: UserRow[] = Array.isArray(data?.data) ? data.data : []
  const unavailable = data && data.ok === false

  async function create() {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, role: asAdmin ? 'admin' : 'member' }),
      })
      const json = await res.json()
      if (json.ok) {
        setFreshToken(json.data.token)
        setName('')
        setAsAdmin(false)
        mutate()
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  async function copyFresh() {
    if (!freshToken) return
    await navigator.clipboard.writeText(freshToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {unavailable ? (
        <p className="p-4 text-[13px] text-muted-foreground">
          {data.error === 'Multi-user requires DATABASE_URL'
            ? 'Multi-user mode requires the Postgres store (DATABASE_URL).'
            : 'User management requires an admin session.'}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 border-b border-border/60 p-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') create()
              }}
              placeholder="New user name…"
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setAsAdmin((v) => !v)}
              aria-pressed={asAdmin}
              className={cn(
                'h-9 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground hover:text-foreground',
                asAdmin && 'bg-accent text-foreground',
              )}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={create}
              disabled={!name.trim() || busy}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Create user
            </button>
          </div>

          {freshToken && (
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
              <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground">
                {freshToken}
              </code>
              <button
                type="button"
                onClick={copyFresh}
                aria-label={copied ? 'Copied' : 'Copy initial token'}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                Initial token — hand it to the user now
              </span>
            </div>
          )}

          {users.length === 0 ? (
            <p className="p-4 text-[13px] text-muted-foreground">
              No users yet. Created users sign in with their own token and
              only see their own chats.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <span className="w-40 shrink-0 truncate text-[13px] text-foreground">
                    {u.name}
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 font-mono text-[10px]',
                      u.role === 'admin'
                        ? 'border-brand/40 text-brand'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {u.role}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                    {u.tokenCount ?? 0} token{(u.tokenCount ?? 0) === 1 ? '' : 's'} ·
                    since {u.createdAt.slice(0, 10)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(u.id)}
                    aria-label={`Delete user ${u.name}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
