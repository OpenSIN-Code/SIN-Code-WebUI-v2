"use client"

import useSWR from "swr"
import { useState } from "react"
import { Cable, Trash2, Plus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface McpConnection {
  id: string
  name: string
  url: string
  transport: string
  enabled: boolean
}

export function McpManager() {
  const { data, mutate } = useSWR<{ connections: McpConnection[] }>(
    "/api/settings/mcp",
    fetcher,
  )
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")

  async function add() {
    if (!name.trim() || !url.trim()) return
    await fetch("/api/settings/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, transport: "http" }),
    })
    setName("")
    setUrl("")
    setShowForm(false)
    await mutate()
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch("/api/settings/mcp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    })
    await mutate()
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this MCP connection?")) return
    await fetch(`/api/settings/mcp?id=${id}`, { method: "DELETE" })
    await mutate()
  }

  const conns = data?.connections ?? []

  return (
    <div className="mt-3">
      {conns.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          {conns.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Cable className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {c.url} · {c.transport}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.enabled}
                  aria-label={`Toggle ${c.name}`}
                  onClick={() => toggle(c.id, !c.enabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    c.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-background transition-transform ${
                      c.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`Remove ${c.name}`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name, e.g. linear"
            aria-label="MCP name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mcp.example.com/mcp"
            aria-label="MCP URL"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!name.trim() || !url.trim()}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Connect
            </button>
          </div>
        </div>
      ) : (
        <div
          className={
            conns.length
              ? "mt-3"
              : "mt-3 rounded-xl border border-dashed border-border px-6 py-12 text-center"
          }
        >
          {!conns.length && (
            <>
              <Cable className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No MCPs connected</p>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={`rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent ${
              conns.length ? "" : "mt-4"
            } inline-flex items-center gap-1.5`}
          >
            <Plus className="size-4" />
            Add MCP
          </button>
        </div>
      )}
    </div>
  )
}
