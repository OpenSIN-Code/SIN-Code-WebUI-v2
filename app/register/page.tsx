"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/auth/client"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signUp.email({ name, email, password })
    setLoading(false)
    if (error) {
      setError(error.message ?? "Registrierung fehlgeschlagen")
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-foreground">Konto erstellen</h1>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2" autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          E-Mail
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2" autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Passwort
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2" autoComplete="new-password" />
        </label>
        <button type="submit" disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
          {loading ? "Erstellen…" : "Registrieren"}
        </button>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Bereits ein Konto? Anmelden
        </Link>
      </form>
    </main>
  )
}
