"use client"

import { useState, useRef, useCallback } from "react"
import { Loader2, Rocket, Check, Copy, CircleAlert } from "lucide-react"

type DeployState =
  | { phase: "idle" }
  | { phase: "deploying"; id?: string }
  | { phase: "ready"; url: string }
  | { phase: "error"; message: string }

export function DeployStatus({ target = "preview" }: { target?: "production" | "preview" }) {
  const [state, setState] = useState<DeployState>({ phase: "idle" })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const publish = useCallback(async () => {
    setState({ phase: "deploying" })
    try {
      const res = await fetch("/api/workspace/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Deployment failed")

      setState({ phase: "deploying", id: data.id })
      pollRef.current = setInterval(async () => {
        const s = await fetch(`/api/workspace/deploy?id=${data.id}`).then((r) => r.json())
        if (s.status === "READY") {
          clearInterval(pollRef.current!)
          setState({ phase: "ready", url: s.url })
        } else if (s.status === "ERROR" || s.status === "CANCELED") {
          clearInterval(pollRef.current!)
          setState({ phase: "error", message: `Deployment ${s.status.toLowerCase()}` })
        }
      }, 3000)
    } catch (err) {
      setState({ phase: "error", message: (err as Error).message })
    }
  }, [target])

  if (state.phase === "ready") {
    return (
      <div className="flex items-center gap-2">
        <Check className="size-4 text-primary" />
        <a href={state.url} target="_blank" rel="noreferrer" className="text-sm underline">
          {state.url.replace("https://", "")}
        </a>
        <button
          type="button"
          aria-label="URL kopieren"
          onClick={() => navigator.clipboard.writeText(state.url)}
          className="rounded p-1 hover:bg-accent"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {state.phase === "error" && (
        <span className="flex items-center gap-1 text-sm text-destructive">
          <CircleAlert className="size-4" /> {state.message}
        </span>
      )}
      <button
        type="button"
        onClick={publish}
        disabled={state.phase === "deploying"}
        className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
      >
        {state.phase === "deploying" ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
        {state.phase === "deploying" ? "Deploying…" : "Publish"}
      </button>
    </div>
  )
}
