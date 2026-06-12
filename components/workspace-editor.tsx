'use client'
/**
 * Purpose: Create/edit dialog for custom workspaces — name, description,
 * system prompt, tool toggles, model and layout selection.
 */
import { X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ALL_TOOL_KEYS, type Workspace } from '@/lib/workspaces-shared'

const MODELS = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-5-mini',
  'google/gemini-3-flash',
]

const LAYOUTS = [
  { id: 'chat', label: 'Chat' },
  { id: 'writing', label: 'Writing (side-by-side editor)' },
  { id: 'data', label: 'Data (dataset panel)' },
] as const

export function WorkspaceEditor({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: Workspace | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(workspace?.name ?? '')
  const [description, setDescription] = useState(workspace?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(workspace?.systemPrompt ?? '')
  const [tools, setTools] = useState<Set<string>>(new Set(workspace?.enabledTools ?? []))
  const [model, setModel] = useState(workspace?.defaultModel ?? MODELS[0])
  const [layout, setLayout] = useState<string>(workspace?.layout ?? 'chat')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTool(key: string) {
    setTools((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function save() {
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workspace?.id,
          name,
          description,
          systemPrompt,
          enabledTools: Array.from(tools),
          defaultModel: model,
          layout,
        }),
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error ?? 'Save failed')
        return
      }
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={workspace ? `Edit ${workspace.name}` : 'New workspace'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[85svh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="text-[13.5px] font-medium text-foreground">
            {workspace ? `Edit ${workspace.name}` : 'New workspace'}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support"
              className="h-9 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One line shown on the card"
              className="h-9 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">System prompt</span>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={5}
              placeholder="Define the assistant's role and behavior for this workspace…"
              className="resize-y rounded-lg border border-border bg-transparent p-3 font-mono text-[12.5px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[12px] font-medium text-muted-foreground">Tools</legend>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TOOL_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleTool(key)}
                  aria-pressed={tools.has(key)}
                  className={cn(
                    'rounded-full border px-3 py-1 font-mono text-[11.5px] transition-colors',
                    tools.has(key)
                      ? 'border-brand/40 bg-brand/10 text-brand'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">Default model</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2 text-[12.5px] text-foreground focus:outline-none"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">Layout</span>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2 text-[12.5px] text-foreground focus:outline-none"
              >
                {LAYOUTS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p role="alert" className="text-[12.5px] text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-border px-4 text-[13px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!name.trim() || busy}
            className="h-9 rounded-lg bg-primary px-4 text-[13px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save workspace'}
          </button>
        </div>
      </div>
    </div>
  )
}
