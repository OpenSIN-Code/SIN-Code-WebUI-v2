'use client'

import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleDollarSign,
  CirclePlus,
  CircleUser,
  Coins,
  Gift,
  GitBranch,
  LayoutTemplate,
  LogOut,
  MessageCircleQuestion,
  Monitor,
  Moon,
  MoreHorizontal,
  PanelLeft,
  Settings,
  Sun,
  Users,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DashedSpinner,
  NavIconChats,
  NavIconDesignSystems,
  NavIconHome,
  NavIconProjects,
  NavIconSearch,
  NavIconTemplates,
} from '@/components/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { useChatStore, type ChatEntry } from '@/components/chat-store'
import { useProjectStore } from '@/components/project-store'
import { ProjectsSection } from '@/components/projects-section'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Search', Icon: NavIconSearch, href: '/search' },
  { label: 'Home', Icon: NavIconHome, href: '/' },
  { label: 'Projects', Icon: NavIconProjects, href: '/projects' },
  { label: 'Chats', Icon: NavIconChats, href: '/chats' },
  { label: 'Design Systems', Icon: NavIconDesignSystems, href: '/design-systems' },
  { label: 'Templates', Icon: NavIconTemplates, href: '/templates' },
]

/**
 * Single chat row used in both the Favorites and Recent Chats sections.
 * Owns its own chat-options dropdown (Share, Move to Project submenu,
 * Add/Remove Favorite, Rename, Delete) and the Share / New Project
 * actions that need access to the project store.
 */
function SidebarChatRow({
  chat,
  active,
  onRename,
  onDelete,
  onToggleFavorite,
}: {
  chat: ChatEntry
  active: boolean
  onRename: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const { projects, addProject, moveChatToProject } = useProjectStore()

  async function handleShare() {
    const url = `${window.location.origin}/chat/${chat.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy the link:', url)
    }
  }

  function handleMoveToNewProject() {
    const name = window.prompt('New project name')
    if (!name?.trim()) return
    addProject(name.trim())
    // addProject prepends; on the next render the new project exists with
    // a generated id, so find it by its name-derived id-prefix.
    setTimeout(() => {
      const idPrefix = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const target = projects.find((p) => p.id.startsWith(idPrefix))
      if (target) moveChatToProject(chat.id, target.id)
    }, 0)
  }

  return (
    <div
      className={cn(
        'group/chat flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {chat.favorite ? (
          <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
        ) : (
          <DashedSpinner className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{chat.label}</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Chat options"
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:text-foreground group-hover/chat:opacity-100 data-[popup-open]:opacity-100"
            />
          }
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to Project</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {projects.length === 0 ? (
                  <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
                ) : (
                  projects.map((project) => {
                    const inThis = project.chatIds.includes(chat.id)
                    return (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => moveChatToProject(chat.id, project.id)}
                      >
                        <span className="truncate">{project.name}</span>
                        {inThis && (
                          <Check className="ml-auto size-3.5 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    )
                  })
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMoveToNewProject}>
                  <CirclePlus className="size-4" />
                  New Project
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={onToggleFavorite}>
              {chat.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { recentChats, removeChat, renameChat, toggleFavorite } = useChatStore()
  const { theme, setTheme } = useTheme()
  const [favoritesOpen, setFavoritesOpen] = useState(true)
  const isChatActive = pathname.startsWith('/chat')

  const favoriteChats = recentChats.filter((c) => c.favorite)

  function handleDelete(id: string) {
    removeChat(id)
    if (pathname === `/chat/${id}`) router.push('/')
  }

  function handleRename(id: string, currentLabel: string) {
    const next = window.prompt('Rename chat', currentLabel)
    if (next?.trim()) renameChat(id, next.trim())
  }

  return (
    <aside className="flex h-svh w-[212px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">

      {/* ── Team header ─────────────────────────────── */}
      <div className="flex h-11 items-center gap-1 px-2 border-b border-sidebar-border/60">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[oklch(0.55_0.17_152)] text-[9px] font-bold text-white">
            S
          </span>
          <span className="truncate text-[12.5px] font-medium">sin-code&apos;s projects</span>
          <ChevronsUpDown className="ml-auto size-3 shrink-0 text-muted-foreground/60" />
        </button>
        <button
          type="button"
          aria-label="Toggle sidebar"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <PanelLeft className="size-3.5" />
        </button>
      </div>

      {/* ── New Chat split button ────────────────────── */}
      <div className="px-2 py-1.5">
        <div className="flex h-7 items-stretch overflow-hidden rounded-md border border-sidebar-border bg-transparent">
          <Link
            href="/"
            className="flex flex-1 items-center justify-center text-[12.5px] font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          >
            New Chat
          </Link>
          <div className="w-px bg-sidebar-border" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="New chat options"
                  className="flex w-7 items-center justify-center text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                />
              }
            >
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <CirclePlus className="size-4" />
                  Blank Chat
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <GitBranch className="size-4" />
                  Import from GitHub
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LayoutTemplate className="size-4" />
                  Start from Template
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex flex-col gap-px px-2 py-0.5">
        {navItems.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/' && !isChatActive
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                active && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
              )}
            >
              <item.Icon className="size-[14px] shrink-0 opacity-80" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Favorites ───────────────────────────────── */}
      <div className="px-2 pt-2.5">
        <div className="px-1">
          <button
            type="button"
            aria-expanded={favoritesOpen}
            onClick={() => setFavoritesOpen((v) => !v)}
            className="flex h-6 w-full items-center justify-between text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground"
          >
            Favorites
            {favoritesOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
        </div>
        {favoritesOpen && (
          <div className="flex flex-col pt-0.5">
            {favoriteChats.length === 0 ? (
              <p className="px-2 py-1 text-[11.5px] text-muted-foreground/60">
                No favorites yet.
              </p>
            ) : (
              favoriteChats.map((chat) => (
                <SidebarChatRow
                  key={chat.id}
                  chat={chat}
                  active={pathname === `/chat/${chat.id}`}
                  onRename={() => handleRename(chat.id, chat.label)}
                  onDelete={() => handleDelete(chat.id)}
                  onToggleFavorite={() => toggleFavorite(chat.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Projects ─────────────────────────────────── */}
      <ProjectsSection />

      {/* ── Recent Chats ────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col px-2 pt-1.5">
        <div className="px-1 pb-0.5">
          <button
            type="button"
            className="flex h-6 w-full items-center justify-between text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground"
          >
            Recent Chats
            <ChevronDown className="size-3" />
          </button>
        </div>

        <div className="flex flex-col overflow-y-auto pt-0.5">
          {recentChats.length === 0 ? (
            <div className="mx-1 mt-2 rounded-lg border border-dashed border-sidebar-border px-3 py-4 text-center text-[11.5px] text-muted-foreground">
              No chats yet.
            </div>
          ) : (
            recentChats.map((chat) => (
              <SidebarChatRow
                key={chat.id}
                chat={chat}
                active={pathname === `/chat/${chat.id}`}
                onRename={() => handleRename(chat.id, chat.label)}
                onDelete={() => handleDelete(chat.id)}
                onToggleFavorite={() => toggleFavorite(chat.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── User footer ─────────────────────────────── */}
      <div className="flex items-center gap-1 border-t border-sidebar-border px-2 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent"
              />
            }
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
              SC
            </span>
            <span className="truncate font-medium">sin-code</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" side="top" className="w-60">
            {/* User info */}
            <div className="flex flex-col gap-0.5 px-3 py-2">
              <span className="text-[13px] font-semibold text-foreground">sin-code</span>
              <span className="text-[12px] text-muted-foreground">hello@sin-code.dev</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUser className="size-4" />Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4" />Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CircleDollarSign className="size-4" />Pricing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BookOpen className="size-4" />Documentation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="size-4" />Community Forum
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageCircleQuestion className="size-4" />Feedback
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Gift className="size-4" />Refer a Friend
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Coins className="size-4" />Credits
                <span className="ml-auto text-[12px] text-muted-foreground">2.89</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* Preferences */}
            <div className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Preferences
            </div>
            {/* Theme */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[13px] text-foreground">Theme</span>
              <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5">
                {(
                  [
                    { value: 'system', Icon: Monitor, label: 'System theme' },
                    { value: 'light', Icon: Sun, label: 'Light theme' },
                    { value: 'dark', Icon: Moon, label: 'Dark theme' },
                  ] as const
                ).map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={label}
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex size-[22px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
                      theme === value && 'bg-background text-foreground shadow-sm',
                    )}
                  >
                    <Icon className="size-3" />
                  </button>
                ))}
              </div>
            </div>
            {/* Language */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[13px] text-foreground">Language</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[12px] text-foreground hover:bg-accent"
              >
                English <ChevronDown className="size-3" />
              </button>
            </div>
            {/* Chat Position */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[13px] text-foreground">Chat Position</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[12px] text-foreground hover:bg-accent"
              >
                Left <ChevronDown className="size-3" />
              </button>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <LogOut className="size-4" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Credits badge */}
        <span className="flex h-6 shrink-0 items-center rounded border border-sidebar-border px-2 text-[11.5px] font-medium text-sidebar-foreground">
          $10
        </span>
      </div>
    </aside>
  )
}
