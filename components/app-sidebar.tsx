// SPDX-License-Identifier: MIT

'use client'

import {
  Bot, Brain, Check, ChevronDown, ChevronRight, ChevronsUpDown,
  CirclePlus, FileCode, FileText, GitBranch,
  LayoutGrid, LayoutTemplate, ListTodo,
  MoreHorizontal, PanelLeft, PanelLeftClose, Settings2, Share2, Star,
} from 'lucide-react'
import { UserMenu } from "@/components/auth/user-menu"
import { DashedSpinner, NavIconChats, NavIconHome, NavIconProjects, NavIconSearch } from '@/components/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useChatStore, type ChatEntry } from '@/components/chat-store'
import { useProjectStore } from '@/components/project-store'
import { ProjectsSection } from '@/components/projects-section'
import { SinVersionBadge } from '@/components/sin-version-badge'
import { NotificationsBell } from '@/components/notifications-bell'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useSidebarStore } from '@/components/sidebar-store'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Search', Icon: NavIconSearch, href: '/search' },
  { label: 'Home', Icon: NavIconHome, href: '/' },
  { label: 'Projects', Icon: NavIconProjects, href: '/projects' },
  { label: 'Chats', Icon: NavIconChats, href: '/chats' },
  { label: 'Agents', Icon: Bot, href: '/agents' },
  { label: 'Tasks', Icon: ListTodo, href: '/tasks' },
  { label: 'Memory', Icon: Brain, href: '/memory' },
  { label: 'Files', Icon: FileCode, href: '/files' },
  { label: 'Workspaces', Icon: LayoutGrid, href: '/workspaces' },
  { label: 'Settings', Icon: Settings2, href: '/settings' },
]

function CollapsedTooltip({ collapsed, label, children }: { collapsed: boolean; label: string; children: React.ReactNode }) {
if (!collapsed) return <>{children}</>
return (
<Tooltip>
<TooltipTrigger render={<span className="flex min-w-0 flex-1" />}>
{children}
</TooltipTrigger>
<TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
</Tooltip>
)
}

function SidebarChatRow({ chat, active, collapsed, onRename, onDelete, onToggleFavorite }: { chat: ChatEntry; active: boolean; collapsed: boolean; onRename: () => void; onDelete: () => void; onToggleFavorite: () => void }) {
const { projects, addProject, moveChatToProject } = useProjectStore()
const [shared, setShared] = useState<boolean | null>(null)

async function handleShare() {
if (shared) {
await fetch(`/api/chats/${chat.id}/share`, { method: 'DELETE' })
setShared(false)
return
}
const res = await fetch(`/api/chats/${chat.id}/share`, { method: 'POST' })
const json = await res.json()
if (json.ok && json.data?.slug) {
await navigator.clipboard.writeText(
`${window.location.origin}/share/${json.data.slug}`,
)
setShared(true)
}
}

async function loadShareState(open: boolean) {
if (!open || shared !== null) return
const res = await fetch(`/api/chats/${chat.id}/share`)
const json = await res.json()
setShared(Boolean(json.data?.slug))
}

async function handleExport(format: 'md' | 'json') {
const res = await fetch(`/api/chats/${chat.id}/export?format=${format}`)
if (!res.ok) return
const blob = await res.blob()
const objectUrl = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = objectUrl
a.download = `${chat.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${format}`
document.body.appendChild(a)
a.click()
a.remove()
URL.revokeObjectURL(objectUrl)
}

function handleMoveToNewProject() {
const name = window.prompt('New project name')
if (!name?.trim()) return
addProject(name.trim())
setTimeout(() => { const idPrefix = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'); const target = projects.find((p) => p.id.startsWith(idPrefix)); if (target) moveChatToProject(chat.id, target.id) }, 0)
}

const chatIcon = chat.favorite ? <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" /> : <DashedSpinner className="size-3.5 shrink-0 text-muted-foreground" />

return (
<CollapsedTooltip collapsed={collapsed} label={chat.label}>
<div className={cn('group/chat flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', active && 'bg-sidebar-accent text-sidebar-accent-foreground', collapsed && 'justify-center px-0')}>
<Link href={`/chat/${chat.id}`} className={cn('flex min-w-0 flex-1 items-center gap-2', collapsed && 'justify-center')}>
{chatIcon}
{!collapsed && <span className="truncate">{chat.label}</span>}
</Link>
{!collapsed && (
<DropdownMenu onOpenChange={loadShareState}>
<DropdownMenuTrigger render={<button type="button" aria-label="Chat options" className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:text-foreground group-hover/chat:opacity-100 data-[popup-open]:opacity-100" />}>
<MoreHorizontal className="size-3.5" />
</DropdownMenuTrigger>
<DropdownMenuContent align="start" side="right" className="w-44">
<DropdownMenuGroup>
<DropdownMenuItem onClick={handleShare}><Share2 className="size-4" />{shared ? 'Unshare' : 'Share (copy link)'}</DropdownMenuItem>
<DropdownMenuSub>
  <DropdownMenuSubTrigger>
    <FileText className="size-4" />
    Export
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem onClick={() => handleExport('md')}>As Markdown</DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleExport('json')}>As JSON</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>
<DropdownMenuSub>
<DropdownMenuSubTrigger>Move to Project</DropdownMenuSubTrigger>
<DropdownMenuSubContent className="w-48">
{projects.length === 0 ? (<DropdownMenuItem disabled>No projects yet</DropdownMenuItem>) : (projects.map((project) => { const inThis = project.chatIds.includes(chat.id); return (<DropdownMenuItem key={project.id} onClick={() => moveChatToProject(chat.id, project.id)}><span className="truncate">{project.name}</span>{inThis && <Check className="ml-auto size-3.5 shrink-0" />}</DropdownMenuItem>) }))}
<DropdownMenuSeparator />
<DropdownMenuItem onClick={handleMoveToNewProject}><CirclePlus className="size-4" />New Project</DropdownMenuItem>
</DropdownMenuSubContent>
</DropdownMenuSub>
<DropdownMenuItem onClick={onToggleFavorite}>{chat.favorite ? 'Remove from Favorites' : 'Add to Favorites'}</DropdownMenuItem>
<DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
<DropdownMenuItem variant="destructive" onClick={onDelete}>Delete</DropdownMenuItem>
</DropdownMenuGroup>
</DropdownMenuContent>
</DropdownMenu>
)}
</div>
</CollapsedTooltip>
)
}

export function AppSidebar() {
const pathname = usePathname()
const router = useRouter()
const { recentChats, removeChat, renameChat, toggleFavorite } = useChatStore()
  const { collapsed, toggleCollapsed } = useSidebarStore()
const [favoritesOpen, setFavoritesOpen] = useState(true)
const [wsFilter, setWsFilter] = useState<string>('all')
const isChatActive = pathname.startsWith('/chat')
const favoriteChats = recentChats.filter((c) => c.favorite)

const usedWorkspaces = useMemo(
() => Array.from(new Set(recentChats.map((c) => c.workspaceId ?? 'code'))),
[recentChats],
)
const filteredChats = wsFilter === 'all'
? recentChats
: recentChats.filter((c) => (c.workspaceId ?? 'code') === wsFilter)

function handleDelete(id: string) { removeChat(id); if (pathname === `/chat/${id}`) router.push('/') }
function handleRename(id: string, currentLabel: string) { const next = window.prompt('Rename chat', currentLabel); if (next?.trim()) renameChat(id, next.trim()) }

return (
<aside className={cn('flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200', collapsed ? 'w-14' : 'w-[212px]')}>
<div className="flex h-11 items-center gap-1 px-2 border-b border-sidebar-border/60">
<CollapsedTooltip collapsed={collapsed} label="sin-code's projects">
<button type="button" className={cn('flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent', collapsed && 'justify-center px-0')}>
<span className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[oklch(0.55_0.17_152)] text-[9px] font-bold text-white">S</span>
{!collapsed && (<><span className="truncate text-[12.5px] font-medium">sin-code&apos;s projects</span><ChevronsUpDown className="ml-auto size-3 shrink-0 text-muted-foreground/60" /></>)}
</button>
</CollapsedTooltip>
<button type="button" aria-label="Toggle sidebar" onClick={toggleCollapsed} className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
{collapsed ? <PanelLeftClose className="size-3.5" /> : <PanelLeft className="size-3.5" />}
</button>
</div>

{!collapsed && (<div className="px-2 py-1.5"><div className="flex h-7 items-stretch overflow-hidden rounded-md border border-sidebar-border bg-transparent"><Link href="/" className="flex flex-1 items-center justify-center text-[12.5px] font-medium text-sidebar-foreground hover:bg-sidebar-accent">New Chat</Link><div className="w-px bg-sidebar-border" /><DropdownMenu><DropdownMenuTrigger render={<button type="button" aria-label="New chat options" className="flex w-7 items-center justify-center text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" />}><ChevronDown className="size-3" /></DropdownMenuTrigger><DropdownMenuContent align="start" sideOffset={6} className="w-52"><DropdownMenuGroup><DropdownMenuItem><CirclePlus className="size-4" />Blank Chat</DropdownMenuItem><DropdownMenuItem><GitBranch className="size-4" />Import from GitHub</DropdownMenuItem><DropdownMenuItem><LayoutTemplate className="size-4" />Start from Template</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div></div>)}

<nav className="flex flex-col gap-px px-2 py-0.5">
{navItems.map((item) => { const active = item.href === '/' ? pathname === '/' && !isChatActive : pathname.startsWith(item.href); return (
<CollapsedTooltip key={item.label} collapsed={collapsed} label={item.label}>
<Link href={item.href} className={cn('flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', active && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium', collapsed && 'justify-center px-0')}>
<item.Icon className="size-[14px] shrink-0 opacity-80" />
{!collapsed && item.label}
</Link>
</CollapsedTooltip>
)})}
</nav>

<div className="px-2">
<NotificationsBell collapsed={collapsed} />
</div>

{!collapsed && (<div className="px-2 pt-2.5"><div className="px-1"><button type="button" aria-expanded={favoritesOpen} onClick={() => setFavoritesOpen((v) => !v)} className="flex h-6 w-full items-center justify-between text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground">Favorites{favoritesOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}</button></div>{favoritesOpen && (<div className="flex flex-col pt-0.5">{favoriteChats.length === 0 ? (<p className="px-2 py-1 text-[11.5px] text-muted-foreground/60">No favorites yet.</p>) : (favoriteChats.map((chat) => (<SidebarChatRow key={chat.id} chat={chat} active={pathname === `/chat/${chat.id}`} collapsed={collapsed} onRename={() => handleRename(chat.id, chat.label)} onDelete={() => handleDelete(chat.id)} onToggleFavorite={() => toggleFavorite(chat.id)} />)))}</div>)}</div>)}

{!collapsed && usedWorkspaces.length > 1 && (
<div className="flex flex-wrap gap-1 px-2 pb-2">
{['all', ...usedWorkspaces].map((ws) => (
<button key={ws} type="button" onClick={() => setWsFilter(ws)} aria-pressed={wsFilter === ws} className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors', wsFilter === ws ? 'border-brand/40 bg-brand/10 text-brand' : 'border-border text-muted-foreground hover:text-foreground')}>
{ws}
</button>
))}
</div>
)}

<ProjectsSection collapsed={collapsed} />

{!collapsed && (<div className="flex min-h-0 flex-1 flex-col px-2 pt-1.5"><div className="px-1 pb-0.5"><button type="button" className="flex h-6 w-full items-center justify-between text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground">Recent Chats<ChevronDown className="size-3" /></button></div><div className="flex flex-col overflow-y-auto pt-0.5">{filteredChats.length === 0 ? (<div className="mx-1 mt-2 rounded-lg border border-dashed border-sidebar-border px-3 py-4 text-center text-[11.5px] text-muted-foreground">No chats yet.</div>) : (filteredChats.map((chat) => (<SidebarChatRow key={chat.id} chat={chat} active={pathname === `/chat/${chat.id}`} collapsed={collapsed} onRename={() => handleRename(chat.id, chat.label)} onDelete={() => handleDelete(chat.id)} onToggleFavorite={() => toggleFavorite(chat.id)} />)))}</div></div>)}

<SinVersionBadge collapsed={collapsed} />

<div className="flex items-center gap-1 border-t border-sidebar-border px-2 py-1.5">
<UserMenu />
{!collapsed && <span className="flex h-6 shrink-0 items-center rounded border border-sidebar-border px-2 text-[11.5px] font-medium text-sidebar-foreground">$10</span>}
</div>
</aside>
)
}
