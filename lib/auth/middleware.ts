import { headers } from "next/headers"
import { getAuth, isBetterAuthEnabled } from "./better-auth"

export type AuthContext = {
  userId: string
  email: string | null
  role: "owner" | "member"
  anonymous: boolean
}

const ANONYMOUS: AuthContext = {
  userId: "anonymous",
  email: null,
  role: "owner",
  anonymous: true,
}

export async function requireSession(): Promise<AuthContext> {
  if (!isBetterAuthEnabled()) return ANONYMOUS

  const auth = getAuth()
  if (!auth) {
    throw new Response(JSON.stringify({ error: "Auth not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return {
    userId: session.user.id,
    email: session.user.email,
    role: ((session.user as { role?: string }).role as "owner" | "member") ?? "member",
    anonymous: false,
  }
}

export function withAuth<T extends unknown[]>(
  handler: (ctx: AuthContext, ...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    try {
      const ctx = await requireSession()
      return await handler(ctx, ...args)
    } catch (err) {
      if (err instanceof Response) return err
      throw err
    }
  }
}
