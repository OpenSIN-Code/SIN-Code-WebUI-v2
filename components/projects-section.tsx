/**
 * Purpose: Sidebar section that lists all projects. Each project is
 * collapsible and, when open, shows the chats that belong to it
 * (rendered as plain rows - no dropdown per row, to keep the
 * sidebar scannable).
 * Related issues: #31, #40
 */
'use client'

import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useChatStore } from '@/components/chat-store'
import { useProjectStore } from '@/components/project-store'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export function ProjectsSection({ collapsed = false }: { collapsed?: boolean }) {
  const { projects } = useProjectStore()
  const { recentChats } = useChatStore()
  const pathname = usePathname()
  const [open, setOpen] = useState(true)

  if (projects.length === 0) return null

  if (collapsed) {
    return (
      <div className="px-2 pt-2">
        <div className="flex flex-col pt-0.5">
          {projects.map((project) => (
            <Tooltip key={project.id}>
              <TooltipTrigger render={<div className="flex h-7 items-center justify-center rounded-md px-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />}>
                <LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{project.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 pt-2">
      <div className="px-1">
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex h-6 w-full items-center justify-between text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground">
          Projects{open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
      </div>
      {open && (<div className="flex flex-col pt-0.5">{projects.map((project) => { const chats = project.chatIds.map((id) => recentChats.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => c !== undefined); return (<ProjectGroup key={project.id} projectId={project.id} projectName={project.name} chats={chats} pathname={pathname} />) })}</div>)}
    </div>
  )
}

function ProjectGroup({ projectId, projectName, chats, pathname }: { projectId: string; projectName: string; chats: { id: string; label: string }[]; pathname: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="flex flex-col">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="group flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        {expanded ? <ChevronDown className="size-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
        <LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{projectName}</span>
        <span className="shrink-0 text-[10.5px] text-muted-foreground/60">{chats.length}</span>
      </button>
      {expanded && (<div className="ml-3 flex flex-col border-l border-sidebar-border/40 pl-1.5">{chats.length === 0 ? (<p className="px-2 py-1 text-[11.5px] text-muted-foreground/60">No chats in this project yet.</p>) : (chats.map((chat) => (<Link key={chat.id} href={`/chat/${chat.id}`} className={cn('flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', pathname === `/chat/${chat.id}` && 'bg-sidebar-accent text-sidebar-accent-foreground')}><span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" /><span className="truncate">{chat.label}</span></Link>)))}</div>)}
    </div>
  )
}
