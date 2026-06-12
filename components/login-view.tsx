'use client'

/**
 * Purpose: Token login screen (v0-style centered card). Posts the access
 * token to /api/auth/login and redirects to the originally requested page.
 */
import { ArrowRight, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DashedSpinner, Starburst } from '@/components/icons'

export function LoginView({ next }: { next?: string }) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    const value = token.trim()
    if (!value || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: value }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Sign in failed')
        return
      }
      router.push(next && next.startsWith('/') ? next : '/')
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <Starburst className="size-10 text-brand" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              SIN-Code
            </h1>
            <p className="mt-1 text-balance text-[13.5px] text-muted-foreground">
              Enter your access token to continue.
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_4px_0_oklch(0_0_0/15%)]">
          <div className="flex flex-col gap-3 p-4">
            <label
              htmlFor="token"
              className="text-[12px] font-medium text-muted-foreground"
            >
              Access token
            </label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 focus-within:ring-1 focus-within:ring-ring">
              <KeyRound className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                }}
                placeholder="SIN_UI_TOKEN"
                autoComplete="current-password"
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {error && (
              <p role="alert" className="text-[12.5px] text-destructive">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!token.trim() || busy}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? (
                <DashedSpinner className="size-4 animate-[spin_2s_linear_infinite]" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-muted-foreground">
          The token is set via the <code className="rounded-[3px] bg-muted px-1 py-0.5 font-mono text-[0.85em]">SIN_UI_TOKEN</code> environment
          variable on the server.
        </p>
      </div>
    </main>
  )
}
