"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch("/api/auth/forget-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "/reset-password" }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.message || "Fehler beim Senden")
      return
    }
    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-foreground">Passwort zurücksetzen</h1>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Falls ein Konto existiert, wurde eine E-Mail mit dem Reset-Link gesendet.
          </p>
        ) : (
          <>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <label className="flex flex-col gap-1 text-sm text-foreground">
              E-Mail
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2" autoComplete="email" />
            </label>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
              Reset-Link senden
            </button>
          </>
        )}
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Zurück zum Login</Link>
      </form>
    </main>
  )
}
