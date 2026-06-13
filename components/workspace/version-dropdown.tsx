// SPDX-License-Identifier: MIT

"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Search } from "lucide-react"

export interface Version {
  id: string
  label: string
  createdAt: string
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s} seconds ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? "" : "s"} ago`
}

interface VersionDropdownProps {
  versions: Version[]
  activeVersionId: string | null
  onSelect: (id: string | null) => void
}

export function VersionDropdown({ versions, activeVersionId, onSelect }: VersionDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const filtered = useMemo(
    () =>
      versions.filter((v) =>
        v.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [versions, query],
  )

  const activeLabel = activeVersionId
    ? versions.find((v) => v.id === activeVersionId)?.label ?? "Latest"
    : "Latest"

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {activeLabel}
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search versions..."
              aria-label="Search versions"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div role="listbox" className="max-h-72 overflow-y-auto p-1">
            {filtered.length ? (
              filtered.map((v) => {
                const active = v.id === activeVersionId
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelect(v.id)
                      setOpen(false)
                    }}
                    className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <span className="text-[13px] font-medium">{v.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(v.createdAt)}
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                No versions found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
