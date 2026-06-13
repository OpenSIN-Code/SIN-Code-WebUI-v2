// SPDX-License-Identifier: MIT

import { Terminal, KeySquare } from "lucide-react"
import { McpManager } from "@/components/settings/mcp-manager"

function IntegrationCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold">Integrations</h1>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">Backend</h2>
      <div className="mt-3 flex flex-col gap-3">
        <IntegrationCard
          icon={<Terminal className="size-5" />}
          title="sin-code CLI"
          description="The Go backend providing 32 subcommands and 44 MCP tools."
          action={
            <a
              href="https://github.com/OpenSIN-Code/SIN-Code-Bundle"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              View Repo
            </a>
          }
        />
        <IntegrationCard
          icon={<KeySquare className="size-5" />}
          title="Environment Variables"
          description="SIN_CODE_BIN, SIN_CHAT_MODEL, AI_GATEWAY_API_KEY and more."
          action={
            <a
              href="https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2#configuration"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              View Docs
            </a>
          }
        />
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">
        MCP Connections
      </h2>
      <McpManager />
    </div>
  )
}
