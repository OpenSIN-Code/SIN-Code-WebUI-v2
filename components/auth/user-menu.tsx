"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useSWRConfig } from "swr"
import Link from "next/link"
import {
  BookOpen,
  ChevronDown,
  CircleUser,
  CreditCard,
  Gift,
  LogIn,
  LogOut,
  MessageCircleQuestion,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  Sun,
  Users,
} from "lucide-react"
import { useSession } from "@/lib/auth/client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FOOTER_LINKS = [
  { href: "/settings/preferences", label: "Profile", Icon: CircleUser },
  { href: "/settings", label: "Account Settings", Icon: SettingsIcon },
  { href: "/settings/billing", label: "Pricing", Icon: CreditCard, external: true },
  {
    href: "https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2#readme",
    label: "Documentation",
    Icon: BookOpen,
    external: true,
  },
  {
    href: "https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/issues",
    label: "Feedback",
    Icon: MessageCircleQuestion,
    external: true,
  },
  {
    href: "https://github.com/orgs/OpenSIN-Code/discussions",
    label: "Community Forum",
    Icon: Users,
    external: true,
  },
  { href: "/settings/preferences?tab=referral", label: "Refer a Friend", Icon: Gift },
]

export function UserMenu() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { theme, setTheme } = useTheme()
  const { mutate } = useSWRConfig()

  // Persist theme to the preferences store so ThemePreferenceSync doesn't
  // revert the choice on the next revalidation.
  function selectTheme(value: "system" | "light" | "dark") {
    setTheme(value)
    mutate(
      "/api/settings/preferences",
      async (current: unknown) => {
        const res = await fetch("/api/settings/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: value }),
        })
        if (res.ok) return res.json()
        return current
      },
      {
        optimisticData: (current: Record<string, unknown> | undefined) => ({
          ...(current ?? {}),
          theme: value,
        }),
        revalidate: false,
      },
    )
  }

  // Show trigger even while pending / unauthenticated — the v0-style dropdown
  // is always present at the sidebar footer.
  const user = session?.user as
    | { name?: string | null; email?: string | null }
    | undefined
  const isLoggedIn = Boolean(user?.name || user?.email)
  const displayName = isLoggedIn
    ? user!.name || user!.email || "User"
    : "Sign in"
  const initial = isLoggedIn
    ? (user!.name || user!.email || "U").charAt(0).toUpperCase()
    : "?"
  const email = user?.email || ""

  async function handleSignOut() {
    const { signOut } = await import("@/lib/auth/client")
    await signOut()
    router.push("/login")
    router.refresh()
  }

  function handleSignIn() {
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={isLoggedIn ? "User menu" : "Sign in"}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent",
              isPending && "opacity-60",
            )}
          />
        }
      >
        {isPending ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[9px] font-bold text-muted-foreground">
            …
          </span>
        ) : isLoggedIn ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
            {initial}
          </span>
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-sidebar-border text-muted-foreground">
            <CircleUser className="size-3.5" />
          </span>
        )}
        <span className="truncate font-medium">{displayName}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-60">
        {isLoggedIn ? (
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <span className="truncate text-[13px] font-semibold text-foreground">
              {displayName}
            </span>
            {email ? (
              <span className="truncate text-[12px] text-muted-foreground">{email}</span>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <span className="truncate text-[13px] font-semibold text-foreground">
              Not signed in
            </span>
            <span className="truncate text-[12px] text-muted-foreground">
              Sign in to save your chats
            </span>
          </div>
        )}
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {FOOTER_LINKS.map(({ href, label, Icon, external }) => (
            <DropdownMenuItem
              key={label}
              render={
                external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Icon className="size-4" />
                    {label}
                  </a>
                ) : (
                  <Link href={href} className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {label}
                  </Link>
                )
              }
            />
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Preferences
        </div>

        {/* Theme switch — System / Light / Dark */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[13px] text-foreground">Theme</span>
          <div
            role="radiogroup"
            aria-label="Theme"
            className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
          >
            {(
              [
                { value: "system", Icon: Monitor, label: "System theme" },
                { value: "light", Icon: Sun, label: "Light theme" },
                { value: "dark", Icon: Moon, label: "Dark theme" },
              ] as const
            ).map(({ value, Icon, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                aria-label={label}
                onClick={() => selectTheme(value)}
                className={cn(
                  "flex size-[22px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
                  theme === value && "bg-background text-foreground shadow-sm",
                )}
              >
                <Icon className="size-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Language — stub (no i18n yet) */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[13px] text-foreground">Language</span>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[12px] text-foreground hover:bg-accent"
          >
            English <ChevronDown className="size-3" />
          </Link>
        </div>

        {/* Chat Position — stub */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[13px] text-foreground">Chat Position</span>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[12px] text-foreground hover:bg-accent"
          >
            Left <ChevronDown className="size-3" />
          </Link>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {isLoggedIn ? (
            <DropdownMenuItem
              render={
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              }
            />
          ) : (
            <DropdownMenuItem
              render={
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="flex w-full items-center gap-2"
                >
                  <LogIn className="size-4" />
                  Sign In
                </button>
              }
            />
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
