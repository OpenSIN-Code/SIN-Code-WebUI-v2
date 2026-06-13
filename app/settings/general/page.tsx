// SPDX-License-Identifier: MIT

"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Workspace {
  name: string
  defaultModel: string
  defaultCwd: string
}

const MODELS = [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-5-mini",
  "google/gemini-3-flash",
]

function Field({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border px-5 py-4 last:border-b-0">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function GeneralPage() {
  const { data, mutate } = useSWR<Workspace>("/api/settings/workspace", fetcher)
  const [form, setForm] = useState<Workspace | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data && !form) setForm(data)
  }, [data, form])

  if (!form) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(data)

  async function save() {
    setSaving(true)
    await mutate(
      async () => {
        const res = await fetch("/api/settings/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        return res.json()
      },
      { optimisticData: form!, revalidate: false },
    )
    setSaving(false)
  }

  const inputClass =
    "w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold">General</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Workspace-wide defaults for the SIN-Code agent.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card">
        <Field label="Workspace Name" description="Displayed in the sidebar and page titles.">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-label="Workspace name"
            className={inputClass}
          />
        </Field>
        <Field
          label="Default Model"
          description="Used for new chats unless overridden per chat."
        >
          <select
            value={form.defaultModel}
            onChange={(e) => setForm({ ...form, defaultModel: e.target.value })}
            aria-label="Default model"
            className={inputClass}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {!MODELS.includes(form.defaultModel) && (
              <option value={form.defaultModel}>{form.defaultModel}</option>
            )}
          </select>
        </Field>
        <Field
          label="Default Working Directory"
          description="The cwd passed to the sin-code CLI for new sessions. Leave empty for the server default."
        >
          <input
            value={form.defaultCwd}
            onChange={(e) => setForm({ ...form, defaultCwd: e.target.value })}
            placeholder="/home/user/projects"
            aria-label="Default working directory"
            className={`${inputClass} font-mono`}
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}
