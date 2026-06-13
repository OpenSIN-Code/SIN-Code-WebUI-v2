// SPDX-License-Identifier: MIT

"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/auth/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn.email({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message ?? "Login fehlgeschlagen")
      return
    }
    router.push(from)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Anmelden</h1>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <label className="flex flex-col gap-1 text-sm text-foreground">
        E-Mail
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2" autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Passwort
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2" autoComplete="current-password" />
      </label>
      <button type="submit" disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
        {loading ? "Anmelden…" : "Anmelden"}
      </button>
      <div className="flex justify-between text-sm">
        <Link href="/register" className="text-muted-foreground hover:text-foreground">Registrieren</Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">Passwort vergessen?</Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
