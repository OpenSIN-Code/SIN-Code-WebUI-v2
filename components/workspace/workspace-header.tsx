// SPDX-License-Identifier: MIT

"use client"

import {
  ChevronsLeft,
  Eye,
  PenTool,
  Code2,
  Database,
  MoreHorizontal,
  Upload,
  Rocket,
  Images,
  Undo2,
} from "lucide-react"
import { VersionDropdown, type Version } from "@/components/workspace/version-dropdown"
import { DeployStatus } from "@/components/workspace/deploy-status"

export type WorkspaceTab = "preview" | "design" | "code" | "database" | "deploys" | "screenshots"

const TABS: { id: WorkspaceTab; icon: typeof Eye; label: string }[] = [
  { id: "preview", icon: Eye, label: "Preview" },
  { id: "design", icon: PenTool, label: "Design" },
  { id: "code", icon: Code2, label: "Code" },
  { id: "database", icon: Database, label: "Database" },
  { id: "deploys", icon: Rocket, label: "Deploys" },
  { id: "screenshots", icon: Images, label: "Screenshots" },
]

interface WorkspaceHeaderProps {
  tab: WorkspaceTab
  onTabChange: (tab: WorkspaceTab) => void
  versions: Version[]
  activeVersionId: string | null
  onVersionSelect: (id: string | null) => void
  onToggleChat: () => void
  chatCollapsed: boolean
}

export function WorkspaceHeader({
  tab,
  onTabChange,
  versions,
  activeVersionId,
  onVersionSelect,
  onToggleChat,
  chatCollapsed,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleChat}
          aria-label={chatCollapsed ? "Expand chat" : "Collapse chat"}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronsLeft
            className={`size-4 transition-transform duration-200 ${
              chatCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-0.5 rounded-full bg-secondary p-0.5">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-label={label}
              aria-pressed={tab === id}
              className={`flex size-7 items-center justify-center rounded-full transition-colors ${
                tab === id
                  ? "bg-accent text-foreground ring-1 ring-ring"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
            </button>
          ))}
          {tab === "design" ? (
            <span
              title="Undo: ⌘Z / Ctrl+Z · Redo: ⌘⇧Z / Ctrl+Shift+Z"
              className="ml-1 flex items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground"
            >
              <Undo2 className="size-3.5" strokeWidth={1.75} />
              <span className="font-mono">⌘Z / ⌘⇧Z</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <VersionDropdown
          versions={versions}
          activeVersionId={activeVersionId}
          onSelect={onVersionSelect}
        />
        <button
          type="button"
          aria-label="More options"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Export"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Upload className="size-4" />
        </button>
        <DeployStatus target="preview" />
      </div>
    </header>
  )
}
