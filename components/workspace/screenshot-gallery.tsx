// SPDX-License-Identifier: MIT

"use client"

import useSWR from "swr"
import { useEffect } from "react"
import { Copy, Download, Trash2 } from "lucide-react"

type Meta = { id: string; filename: string; createdAt: string; size: number }
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ScreenshotGallery() {
  const { data: shots, mutate } = useSWR<Meta[]>("/api/workspace/screenshot", fetcher)

  useEffect(() => {
    function onSaved() {
      mutate()
    }
    window.addEventListener("sin:screenshot-saved", onSaved)
    return () => window.removeEventListener("sin:screenshot-saved", onSaved)
  }, [mutate])

  async function copyToClipboard(filename: string) {
    const res = await fetch(`/api/workspace/screenshot/${filename}`)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
  }

  async function remove(id: string) {
    await fetch("/api/workspace/screenshot", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  if (!shots?.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Noch keine Screenshots. ⌘+Drag im Preview, um einen Bereich aufzunehmen.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {shots.map((s) => (
        <figure key={s.id} className="group relative overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/workspace/screenshot/${s.filename}`}
            alt={`Screenshot vom ${new Date(s.createdAt).toLocaleString()}`}
            className="aspect-video w-full object-cover"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" aria-label="In Zwischenablage kopieren" onClick={() => copyToClipboard(s.filename)} className="rounded p-1 hover:bg-accent">
              <Copy className="size-3.5" />
            </button>
            <a href={`/api/workspace/screenshot/${s.filename}`} download aria-label="Herunterladen" className="rounded p-1 hover:bg-accent">
              <Download className="size-3.5" />
            </a>
            <button type="button" aria-label="Löschen" onClick={() => remove(s.id)} className="rounded p-1 text-destructive hover:bg-accent">
              <Trash2 className="size-3.5" />
            </button>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
