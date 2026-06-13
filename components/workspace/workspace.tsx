// SPDX-License-Identifier: MIT

"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  WorkspaceHeader,
  type WorkspaceTab,
} from "@/components/workspace/workspace-header"
import { PreviewPanel } from "@/components/workspace/preview-panel"
import { CodePanel } from "@/components/workspace/code-panel"
import { DatabasePanel } from "@/components/workspace/database-panel"
import { DesignPanel } from "@/components/workspace/design-panel"
import { DeployHistory } from "@/components/workspace/deploy-history"
import { ScreenshotGallery } from "@/components/workspace/screenshot-gallery"
import type { Version } from "@/components/workspace/version-dropdown"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface WorkspaceProps {
  chat: React.ReactNode
  previewSrc: string
}

export function Workspace({ chat, previewSrc }: WorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("preview")
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)

  const { data } = useSWR<{ versions: Version[] }>("/api/workspace/versions", fetcher)

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div
        className={`shrink-0 overflow-hidden border-r border-border transition-all duration-300 ease-in-out ${
          chatCollapsed ? "w-0 border-r-0" : "w-[340px] md:w-[400px]"
        }`}
      >
        <div className="h-full w-[340px] md:w-[400px]">{chat}</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          tab={tab}
          onTabChange={setTab}
          versions={data?.versions ?? []}
          activeVersionId={activeVersionId}
          onVersionSelect={setActiveVersionId}
          onToggleChat={() => setChatCollapsed((v) => !v)}
          chatCollapsed={chatCollapsed}
        />
        <div className="min-h-0 flex-1">
          {tab === "preview" && <PreviewPanel src={previewSrc} />}
          {tab === "code" && <CodePanel />}
          {tab === "database" && <DatabasePanel />}
          {tab === "design" && <DesignPanel src={previewSrc} />}
          {tab === "deploys" && <DeployHistory />}
          {tab === "screenshots" && <ScreenshotGallery />}
        </div>
      </div>
    </div>
  )
}
