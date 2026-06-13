// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: Notifications bell for the sidebar — unread badge + dropdown
 * list backed by sin_notifications_list / mark-read.
 */
import { Bell, Check } from 'lucide-react'
import { useSinNotifications } from '@/lib/sin/use-sin'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type NotificationItem = {
  id?: string | number
  message?: string
  title?: string
  read?: boolean
  created_at?: string
  [key: string]: unknown
}

export function NotificationsBell({ collapsed }: { collapsed?: boolean }) {
  const { data, mutate } = useSinNotifications()

  const items: NotificationItem[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.notifications)
      ? data.data.notifications
      : []
  const unread = items.filter((n) => !n.read).length
  const notInstalled = data && data.ok === false

  async function markRead(id: string) {
    await fetch('/api/sin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
            }
            className={cn(
              'relative flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-0',
            )}
          />
        }
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <Bell className="size-[14px] opacity-80" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-brand font-mono text-[8px] font-bold text-white"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        {!collapsed && <span>Notifications</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notInstalled ? (
            <DropdownMenuItem disabled>
              Backend not installed
            </DropdownMenuItem>
          ) : items.length === 0 ? (
            <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
          ) : (
            items.slice(0, 10).map((n, i) => (
              <DropdownMenuItem
                key={String(n.id ?? i)}
                onClick={() => markRead(String(n.id ?? i))}
                className="items-start"
              >
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    n.read ? 'bg-border' : 'bg-brand',
                  )}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px]">
                    {String(n.title ?? n.message ?? JSON.stringify(n))}
                  </span>
                  {n.created_at ? (
                    <span className="text-xs text-muted-foreground">
                      {String(n.created_at)}
                    </span>
                  ) : null}
                </span>
                {!n.read && <Check className="size-3.5 shrink-0 opacity-50" />}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
