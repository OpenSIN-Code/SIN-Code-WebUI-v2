"use client"

import { useState, useRef } from "react"
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
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fullUrl = src.replace(/\/$/, "") + path

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

      <div className="flex flex-1 items-stretch justify-center overflow-hidden bg-background">
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
      </div>
    </div>
  )
}
