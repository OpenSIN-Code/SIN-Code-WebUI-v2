"use client"

import { useRouter } from "next/navigation"
import { signOut, useSession } from "@/lib/auth/client"
import { LogOut, User } from "lucide-react"

export function UserMenu() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  if (isPending || !session?.user) return null

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <User className="size-4" />
        {session.user.name || session.user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Abmelden"
        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}
