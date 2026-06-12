"use client"

import useSWR from "swr"
import { useState } from "react"
import { KeyRound, Trash2, Copy, Check } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

export default function ApiKeysPage() {
  const { data, mutate } = useSWR<{ keys: ApiKey[] }>("/api/settings/api-keys", fetcher)
  const [name, setName] = useState("")
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  async function create() {
    if (!name.trim()) return
    setCreating(true)
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    setNewKey(json.plaintext)
    setName("")
    setCreating(false)
    await mutate()
  }

  async function revoke(id: string) {
    if (!window.confirm("Revoke this key? Apps using it will stop working.")) return
    await fetch(`/api/settings/api-keys?id=${id}`, { method: "DELETE" })
    await mutate()
  }

  async function copy() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create keys to access the SIN-Code API programmatically.
      </p>

      <div className="mt-8 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Key name, e.g. ci-pipeline"
          aria-label="API key name"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={create}
          disabled={creating || !name.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Key"}
        </button>
      </div>

      {newKey && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Copy your key now — it won&apos;t be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-accent px-3 py-2 font-mono text-sm">
              {newKey}
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy key"
              className="rounded-md border border-border p-2 hover:bg-accent"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border bg-card">
        {data?.keys?.length ? (
          data.keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {k.prefix}…{" · "}created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt
                      ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                      : " · never used"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => revoke(k.id)}
                aria-label={`Revoke ${k.name}`}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No API keys yet.
          </p>
        )}
      </div>
    </div>
  )
}
