"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronLeft,
  SlidersHorizontal,
  Building2,
  BookMarked,
  Sparkles,
  Cable,
  CreditCard,
  Users,
  Activity,
  KeyRound,
  Bot,
} from "lucide-react"

const NAV = [
  {
    group: "Account",
    items: [{ href: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal }],
  },
  {
    group: "Workspace",
    items: [
      { href: "/settings/general", label: "General", icon: Building2 },
      { href: "/settings/agent", label: "Agent & Models", icon: Bot },
      { href: "/settings/memories", label: "Memories", icon: BookMarked },
      { href: "/settings/skills", label: "Skills", icon: Sparkles },
      { href: "/settings/integrations", label: "Integrations", icon: Cable },
      { href: "/settings/billing", label: "Billing", icon: CreditCard },
      { href: "/settings/members", label: "Members", icon: Users },
      { href: "/settings/usage", label: "Usage & Activity", icon: Activity },
      { href: "/settings/api-keys", label: "API Keys", icon: KeyRound },
    ],
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border">
        <div className="flex items-center gap-2 px-4 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to home"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium">Settings</span>
        </div>
        <nav className="flex flex-col gap-6 px-3 py-2">
          {NAV.map((section) => (
            <div key={section.group} className="flex flex-col gap-1">
              <p className="px-2 text-xs font-medium text-muted-foreground">
                {section.group}
              </p>
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
