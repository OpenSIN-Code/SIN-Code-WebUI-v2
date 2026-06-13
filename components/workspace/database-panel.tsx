// SPDX-License-Identifier: MIT

"use client"

import { Database } from "lucide-react"

export function DatabasePanel({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
        <Database className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-base font-semibold">No Database Connected</h2>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground text-pretty">
          Connect a database like Neon or Supabase to view, search and manage your
          data, all in the WebUI
        </p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Connect Database
      </button>
    </div>
  )
}
