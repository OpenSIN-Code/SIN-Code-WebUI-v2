'use client'

/**
 * Purpose: Agent-mode picker for the follow-up bar (v0-style dropdown).
 */
import { Bot, Check, ChevronDown } from 'lucide-react'
import { SIN_AGENTS, type SinAgentId } from '@/lib/sin/agents'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AgentPicker({
  agent,
  onAgentChange,
}: {
  agent: SinAgentId
  onAgentChange: (a: SinAgentId) => void
}) {
  const current = SIN_AGENTS.find((a) => a.id === agent) ?? SIN_AGENTS[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Select agent mode"
            className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-1.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
          />
        }
      >
        <Bot className="size-4" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Agent
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {SIN_AGENTS.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => onAgentChange(a.id)}>
              <Bot className="size-4 text-muted-foreground" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px]">{a.label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {a.description}
                </span>
              </span>
              {agent === a.id && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
