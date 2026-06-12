"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  ExternalLink,
  RotateCw,
} from "lucide-react"

export function PreviewPanel({ src }: { src: string }) {
  const [path, setPath] = useState("/")
  const [mobile, setMobile] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fullUrl = src.replace(/\/$/, "") + path

  const flash = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1400)
  }, [])

  // Reload when the design history changes (undo/redo edits the source).
  useEffect(() => {
    function reload() {
      setReloadKey((k) => k + 1)
    }
    window.addEventListener("sin:design-history-changed", reload)
    return () => window.removeEventListener("sin:design-history-changed", reload)
  }, [])

  // Listen for undo/redo requests posted from the design-mode iframe agent (#60).
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const d = e.data
      if (!d || d.source !== "sin-design") return
      if (d.type !== "design-undo" && d.type !== "design-redo") return

      const action = d.type === "design-undo" ? "undo" : "redo"
      try {
        const res = await fetch("/api/workspace/design-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        const json = await res.json()
        if (json?.ok && json.entry) {
          flash(action === "undo" ? "Undid change" : "Redid change")
          window.dispatchEvent(new Event("sin:design-history-changed"))
        } else {
          flash(action === "undo" ? "Nothing to undo" : "Nothing to redo")
        }
      } catch {
        flash("Undo/redo failed")
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [flash])

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border bg-background px-2">
        <button
          type="button"
          aria-label="Back"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => iframeRef.current?.contentWindow?.history.back()}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Forward"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => iframeRef.current?.contentWindow?.history.forward()}
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setMobile((v) => !v)}
          aria-label={mobile ? "Desktop viewport" : "Mobile viewport"}
          aria-pressed={mobile}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {mobile ? (
            <Monitor className="size-3.5" strokeWidth={1.75} />
          ) : (
            <Smartphone className="size-3.5" strokeWidth={1.75} />
          )}
        </button>

        <form
          className="mx-1 flex h-7 flex-1 items-center rounded-md bg-secondary px-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            setReloadKey((k) => k + 1)
          }}
        >
          <input
            value={path}
            onChange={(e) => setPath(e.target.value.startsWith("/") ? e.target.value : `/${e.target.value}`)}
            aria-label="Preview path"
            className="w-full bg-transparent font-mono text-xs text-muted-foreground outline-none"
          />
        </form>

        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in new tab"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
        </a>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label="Reload preview"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCw className="size-3.5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-stretch justify-center overflow-hidden bg-background">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={fullUrl}
          title="App preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className={`h-full border-0 bg-background transition-all duration-300 ${
            mobile ? "w-[390px] border-x border-border" : "w-full"
          }`}
        />
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg"
          >
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  )
}
