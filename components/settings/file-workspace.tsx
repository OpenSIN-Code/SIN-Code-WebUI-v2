// SPDX-License-Identifier: MIT

"use client"

import useSWR from "swr"
import { useState, useEffect, useCallback } from "react"
import { FilePlus2, Trash2, FileText } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface FileWorkspaceProps {
  kind: "memories" | "skills"
  title: string
  defaultFileName: string
  emptyLabel: string
  createLabel: string
}

export function FileWorkspace({
  kind,
  title,
  defaultFileName,
  emptyLabel,
  createLabel,
}: FileWorkspaceProps) {
  const [scope, setScope] = useState<"user" | "team">("user")
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const listKey = `/api/settings/files?kind=${kind}&scope=${scope}`
  const { data: list, mutate: mutateList } = useSWR<{ files: string[] }>(listKey, fetcher)
  const fileKey = selected
    ? `${listKey}&name=${encodeURIComponent(selected)}`
    : null
  const { data: file } = useSWR<{ content: string }>(fileKey, fetcher)

  useEffect(() => {
    if (file) {
      setContent(file.content)
      setDirty(false)
    }
  }, [file])

  useEffect(() => {
    setSelected(null)
  }, [scope])

  const createFile = useCallback(
    async (name?: string) => {
      const fileName =
        name ??
        window.prompt("File name (must end with .md):", defaultFileName)
      if (!fileName || !fileName.endsWith(".md")) return
      await fetch(
        `/api/settings/files?kind=${kind}&scope=${scope}&name=${encodeURIComponent(fileName)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `# ${fileName.replace(/\.md$/, "")}\n` }),
        },
      )
      await mutateList()
      setSelected(fileName)
    },
    [kind, scope, defaultFileName, mutateList],
  )

  async function save() {
    if (!selected) return
    setSaving(true)
    await fetch(
      `/api/settings/files?kind=${kind}&scope=${scope}&name=${encodeURIComponent(selected)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      },
    )
    setDirty(false)
    setSaving(false)
  }

  async function remove(name: string) {
    if (!window.confirm(`Delete ${name}?`)) return
    await fetch(
      `/api/settings/files?kind=${kind}&scope=${scope}&name=${encodeURIComponent(name)}`,
      { method: "DELETE" },
    )
    if (selected === name) setSelected(null)
    await mutateList()
  }

  return (
    <div className="flex h-full min-h-dvh">
      <div className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium">{title}</span>
          <button
            type="button"
            onClick={() => createFile()}
            aria-label={createLabel}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <FilePlus2 className="size-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-border px-3 py-2">
          {(["user", "team"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`rounded-md px-3 py-1 text-sm capitalize ${
                scope === s
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {list?.files?.length ? (
            list.files.map((name) => (
              <div
                key={name}
                className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                  selected === name
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(name)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(name)}
                  aria-label={`Delete ${name}`}
                  className="rounded p-0.5 opacity-0 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
              <button
                type="button"
                onClick={() => createFile(defaultFileName)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                {createLabel}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-sm font-medium">{selected}</span>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || saving}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : dirty ? "Save" : "Saved"}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setDirty(true)
              }}
              aria-label={`Edit ${selected}`}
              className="flex-1 resize-none bg-background p-5 font-mono text-sm leading-relaxed outline-none"
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">Select a file to edit</p>
            <span className="text-xs text-muted-foreground">or</span>
            <button
              type="button"
              onClick={() => createFile(defaultFileName)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              {createLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
