"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import {
  User,
  Settings,
  CreditCard,
  BookOpen,
  MessageSquare,
  LogOut,
  ExternalLink,
} from "lucide-react"

const LINKS = [
  { href: "/settings/preferences", label: "Profile", icon: User },
  { href: "/settings", label: "Account Settings", icon: Settings },
  { href: "/settings/billing", label: "Pricing", icon: CreditCard, external: true },
  {
    href: "https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2#readme",
    label: "Documentation",
    icon: BookOpen,
    external: true,
  },
  {
    href: "https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/issues",
    label: "Feedback",
    icon: MessageSquare,
    external: true,
  },
]

export function AccountMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-left">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          {LINKS.map(({ href, label, icon: Icon, external }) => (
            <Link
              key={label}
              href={href}
              role="menuitem"
              target={external ? "_blank" : undefined}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {label}
              </span>
              {external && <ExternalLink className="size-3.5" />}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
