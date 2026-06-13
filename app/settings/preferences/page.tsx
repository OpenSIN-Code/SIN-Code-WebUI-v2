// SPDX-License-Identifier: MIT

"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import type { Preferences } from "@/lib/settings/store"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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
          <Switch
            checked={data.suggestions}
            onCheckedChange={(v) => update({ suggestions: v })}
            aria-label="Suggestions"
          />
        </Row>
        <Row
          title="Sound Notifications"
          description="Play a sound when the agent finishes and the window is not focused."
        >
          <Switch
            checked={data.soundNotifications}
            onCheckedChange={(v) => update({ soundNotifications: v })}
            aria-label="Sound notifications"
          />
        </Row>
        <Row title="Chat Position" description="Choose which side of the screen the chat is on.">
          <Select
            value={data.chatPosition}
            onValueChange={(v) => update({ chatPosition: v as "left" | "right" })}
            items={{ left: "Left", right: "Right" }}
          >
            <SelectTrigger size="sm" className="w-32" aria-label="Chat position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
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
          <Select
            value={data.theme}
            onValueChange={(v) => update({ theme: v as Preferences["theme"] })}
            items={{ system: "System", light: "Light", dark: "Dark" }}
          >
            <SelectTrigger size="sm" className="w-32" aria-label="Theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row title="Language" description="The display language of the interface.">
          <Select
            value={data.language}
            onValueChange={(v) => update({ language: v ?? "en" })}
            items={{ en: "English", de: "Deutsch" }}
          >
            <SelectTrigger size="sm" className="w-32" aria-label="Language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </div>
    </div>
  )
}
