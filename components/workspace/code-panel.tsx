// SPDX-License-Identifier: MIT

"use client"

import useSWR from "swr"
import { useState } from "react"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  FilePlus2,
  FolderPlus,
  RotateCw,
  Search,
  Files,
} from "lucide-react"
import { HighlightedCode } from "@/components/workspace/highlighted-code"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface TreeNode {
  name: string
  path: string
  type: "file" | "dir"
  children?: TreeNode[]
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="flex size-6 items-center justify-center rounded-md bg-secondary font-sans text-xs text-muted-foreground">
      {children}
    </kbd>
  )
}

function TreeItem({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode
  depth: number
  selected: string | null
  onSelect: (path: string) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const isDir = node.type === "dir"
  const active = selected === node.path

  return (
    <div>
      <button
        type="button"
        onClick={() => (isDir ? setOpen((v) => !v) : onSelect(node.path))}
        aria-expanded={isDir ? open : undefined}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex h-7 w-full items-center gap-1.5 rounded-md pr-2 text-[13px] transition-colors ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        }`}
      >
        {isDir ? (
          <>
            <ChevronRight
              className={`size-3.5 shrink-0 transition-transform duration-150 ${
                open ? "rotate-90" : ""
              }`}
            />
            {open ? (
              <FolderOpen className="size-3.5 shrink-0" strokeWidth={1.75} />
            ) : (
              <Folder className="size-3.5 shrink-0" strokeWidth={1.75} />
            )}
          </>
        ) : (
          <File className="ml-[18px] size-3.5 shrink-0" strokeWidth={1.75} />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && open && node.children && (
        <div className="animate-accordion-down">
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CodePanel() {
  const { data: tree, mutate } = useSWR<{ nodes: TreeNode[] }>(
    "/api/workspace/files",
    fetcher,
  )
  const [selected, setSelected] = useState<string | null>(null)
  const { data: file } = useSWR<{ content: string }>(
    selected ? `/api/workspace/files?path=${encodeURIComponent(selected)}` : null,
    fetcher,
  )

  return (
    <div className="flex h-full">
      <div className="flex w-60 shrink-0 flex-col border-r border-border">
        <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-2">
          <button type="button" aria-label="All files" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <Files className="size-3.5" strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Search files" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <Search className="size-3.5" strokeWidth={1.75} />
          </button>
          <div className="flex-1" />
          <button type="button" aria-label="New file" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <FilePlus2 className="size-3.5" strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="New folder" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <FolderPlus className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            aria-label="Refresh files"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RotateCw className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {tree?.nodes?.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              selected={selected}
              onSelect={setSelected}
            />
          )) ?? (
            <p className="px-2 py-4 text-xs text-muted-foreground">Loading files…</p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {selected && file ? (
          <>
            <div className="flex h-9 shrink-0 items-center border-b border-border px-3">
              <span className="font-mono text-xs text-muted-foreground">{selected}</span>
            </div>
            <HighlightedCode code={file.content} path={selected} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-3">
              <span className="font-mono text-lg font-semibold tracking-tight text-muted-foreground">
                SIN
              </span>
              <p className="text-[13px] text-muted-foreground">
                Select a file to view its contents
              </p>
            </div>
            <div className="flex w-72 flex-col gap-2.5">
              {[
                { label: "Go to File", keys: ["⌘", "P"] },
                { label: "Find in Files", keys: ["⇧", "⌘", "F"] },
                { label: "Command Palette", keys: ["⇧", "⌘", "P"] },
                { label: "Terminal", keys: ["⌃", "`"] },
              ].map(({ label, keys }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">{label}</span>
                  <span className="flex gap-1">
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
