"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "@/lib/auth/client"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein")
      return
    }
    if (!token) {
      setError("Ungültiger oder fehlender Reset-Token")
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await resetPassword({ newPassword: password, token })
    setLoading(false)
    if (error) {
      setError(error.message ?? "Zurücksetzen fehlgeschlagen")
      return
    }
    router.push("/login")
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Neues Passwort setzen</h1>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Neues Passwort
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2" autoComplete="new-password" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Passwort bestätigen
        <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2" autoComplete="new-password" />
      </label>
      <button type="submit" disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
        {loading ? "Speichern…" : "Passwort speichern"}
      </button>
      <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Zurück zum Login</Link>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
