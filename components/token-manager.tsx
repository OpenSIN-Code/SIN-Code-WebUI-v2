'use client'

/**
 * Purpose: Access token manager card for the Settings page.
 * Create named tokens (plaintext shown once), list with last-used,
 * and revoke. Requires root-token session; otherwise shows a hint.
 */
import { Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

type TokenMeta = {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TokenManager() {
  const { data, mutate } = useSWR('/api/auth/tokens', fetcher)
  const [name, setName] = useState('')
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const tokens: TokenMeta[] = Array.isArray(data?.data) ? data.data : []
  const forbidden = data && data.ok === false

  async function create() {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = await res.json()
      if (json.ok) {
        setFreshToken(json.data.token)
        setName('')
        mutate()
      }
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id: string) {
    await fetch('/api/auth/tokens', {
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
      {forbidden ? (
        <p className="p-4 text-[13px] text-muted-foreground">
          Token management requires a session with the root token
          (SIN_UI_TOKEN).
        </p>
      ) : (
        <>
          <div className="flex gap-2 border-b border-border/60 p-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') create()
              }}
              placeholder="Token name, e.g. laptop, ci-pipeline…"
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={create}
              disabled={!name.trim() || busy}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Create
            </button>
          </div>

          {freshToken && (
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
              <KeyRound className="size-4 shrink-0 text-muted-foreground" />
              <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground">
                {freshToken}
              </code>
              <button
                type="button"
                onClick={copyFresh}
                aria-label={copied ? 'Copied' : 'Copy token'}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                Shown once — copy it now
              </span>
            </div>
          )}

          {tokens.length === 0 ? (
            <p className="p-4 text-[13px] text-muted-foreground">
              No managed tokens yet. The root token from SIN_UI_TOKEN always
              works.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                  <span className="w-40 shrink-0 truncate text-[13px] text-foreground">
                    {t.name}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                    created {t.createdAt.slice(0, 10)}
                    {t.lastUsedAt
                      ? ` · last used ${t.lastUsedAt.slice(0, 16).replace('T', ' ')}`
                      : ' · never used'}
                  </span>
                  <button
                    type="button"
                    onClick={() => revoke(t.id)}
                    aria-label={`Revoke token ${t.name}`}
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
