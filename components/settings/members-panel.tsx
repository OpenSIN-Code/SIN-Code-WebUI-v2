"use client"

import useSWR from "swr"
import { useState } from "react"
import { Trash2, ShieldCheck, Shield, Loader2 } from "lucide-react"

type Member = {
  id: string
  name: string
  email: string
  role: "owner" | "member"
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function MembersPanel() {
  const { data, mutate, isLoading } = useSWR<{ members: Member[]; multiUser: boolean }>(
    "/api/settings/members",
    fetcher,
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function changeRole(id: string, role: "owner" | "member") {
    setBusyId(id)
    setError(null)
    const res = await fetch("/api/settings/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    })
    if (!res.ok) setError((await res.json()).error ?? "Rollenwechsel fehlgeschlagen")
    setBusyId(null)
    mutate()
  }

  async function removeMember(id: string) {
    if (!confirm("Diesen Benutzer wirklich entfernen?")) return
    setBusyId(id)
    setError(null)
    const res = await fetch(`/api/settings/members?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    if (!res.ok) setError((await res.json()).error ?? "Entfernen fehlgeschlagen")
    setBusyId(null)
    mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Lade Mitglieder…
      </div>
    )
  }

  if (data && !data.multiUser) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Multi-User-Modus ist nicht aktiv. Setze BETTER_AUTH_SECRET und DATABASE_URL,
        um die Benutzerverwaltung zu aktivieren.
      </p>
    )
  }

  return (
    <section aria-label="Mitgliederverwaltung" className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Mitglieder</h2>
        <span className="text-xs text-muted-foreground">
          Neue Mitglieder registrieren sich unter /register
        </span>
      </header>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {data?.members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-foreground">{m.name || m.email}</span>
              <span className="truncate text-xs text-muted-foreground">
                {m.email} · seit {new Date(m.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => changeRole(m.id, m.role === "owner" ? "member" : "owner")}
                disabled={busyId === m.id}
                aria-label={m.role === "owner" ? "Zu Member herabstufen" : "Zu Owner befördern"}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {m.role === "owner" ? <ShieldCheck className="size-3.5" /> : <Shield className="size-3.5" />}
                {m.role}
              </button>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                disabled={busyId === m.id}
                aria-label={`${m.email} entfernen`}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-50"
              >
                {busyId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
