"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import type { Preferences } from "@/lib/settings/store"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-background transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

function Row({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border px-5 py-4 last:border-b-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export default function PreferencesPage() {
  const { data, mutate } = useSWR<Preferences>("/api/settings/preferences", fetcher)
  const [instructions, setInstructions] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setInstructions(data.customInstructions)
  }, [data])

  if (!data) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>
  }

  async function update(patch: Partial<Preferences>) {
    await mutate(
      async () => {
        const res = await fetch("/api/settings/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
        return res.json()
      },
      { optimisticData: { ...data!, ...patch }, revalidate: false },
    )
  }

  async function saveInstructions() {
    setSaving(true)
    await update({ customInstructions: instructions })
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage how the SIN-Code WebUI behaves for your account.
      </p>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">General</h2>
      <div className="mt-3 rounded-xl border border-border bg-card">
        <Row
          title="Suggestions"
          description="Get relevant in-chat suggestions to refine your project."
        >
          <Toggle
            checked={data.suggestions}
            onChange={(v) => update({ suggestions: v })}
            label="Suggestions"
          />
        </Row>
        <Row
          title="Sound Notifications"
          description="Play a sound when the agent finishes and the window is not focused."
        >
          <Toggle
            checked={data.soundNotifications}
            onChange={(v) => update({ soundNotifications: v })}
            label="Sound notifications"
          />
        </Row>
        <Row title="Chat Position" description="Choose which side of the screen the chat is on.">
          <select
            value={data.chatPosition}
            onChange={(e) => update({ chatPosition: e.target.value as "left" | "right" })}
            aria-label="Chat position"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </Row>
        <div className="px-5 py-4">
          <p className="text-sm font-medium">Custom Instructions</p>
          <p className="text-sm text-muted-foreground">
            Custom rules or preferences sent to the agent in all chats.
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value.slice(0, 2000))}
            placeholder="These instructions get sent to the agent in all chats across all projects."
            rows={5}
            className="mt-3 w-full resize-y rounded-md border border-border bg-background p-3 text-sm leading-relaxed placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {instructions.length} / 2000
            </span>
            <button
              type="button"
              onClick={saveInstructions}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">
        Interface and Theme
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-card">
        <Row title="Theme" description="Choose your preferred color scheme.">
          <select
            value={data.theme}
            onChange={(e) => update({ theme: e.target.value as Preferences["theme"] })}
            aria-label="Theme"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>
        <Row title="Language" description="The display language of the interface.">
          <select
            value={data.language}
            onChange={(e) => update({ language: e.target.value })}
            aria-label="Language"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </Row>
      </div>
    </div>
  )
}
