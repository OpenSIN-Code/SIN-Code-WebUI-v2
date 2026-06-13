/**
 * Purpose: Resolve the full session identity for a request.
 * Four cases (in priority order):
 *  - root:      env SIN_UI_TOKEN — always admin, sees everything
 *  - better:    Better Auth session (multi-user, database-backed)
 *  - user:      managed token bound to a user (legacy multi-user mode)
 *  - anonymous: auth disabled (local dev) — treated as admin
 * Replaces lib/actor.ts; resolveActor() is kept as a thin wrapper
 * so audit logging call sites stay unchanged.
 */
// SPDX-License-Identifier: MIT

import { createHash } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { AUTH_COOKIE, isAuthConfigured, verifyToken } from '@/lib/auth'
import { findUserByTokenHash, isMultiUserEnabled, type User } from '@/lib/users'
import { findTokenName } from '@/lib/storage'

export type Session =
  | { kind: 'root'; isAdmin: true; userId: null; actor: 'root' }
  | { kind: 'anonymous'; isAdmin: true; userId: null; actor: 'anonymous' }
  | { kind: 'user'; isAdmin: boolean; userId: string; actor: string; user: User }
  | { kind: 'token'; isAdmin: false; userId: null; actor: string }
  | null

export async function presentedToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  return (
    cookieStore.get(AUTH_COOKIE)?.value ??
    headerStore.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null
  )
}

async function getBetterAuthSession(): Promise<Session | null> {
  const { isBetterAuthEnabled, getAuth } = await import('@/lib/auth/better-auth')
  if (!isBetterAuthEnabled()) return null
  try {
    const auth = getAuth()
    if (!auth) return null
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    const role = (session.user as { role?: string }).role ?? 'member'
    return {
      kind: 'user',
      isAdmin: role === 'owner' || role === 'admin',
      userId: session.user.id,
      actor: `user:${session.user.email}`,
      user: {
        id: session.user.id,
        name: session.user.name || session.user.email || session.user.id,
        role: (role as 'admin' | 'member') || 'member',
        createdAt: new Date().toISOString(),
      },
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session> {
  if (!isAuthConfigured()) {
    return { kind: 'anonymous', isAdmin: true, userId: null, actor: 'anonymous' }
  }
  const token = await presentedToken()

  // 1. Root token (env SIN_UI_TOKEN) — irrevocable admin
  if (token && verifyToken(token)) {
    return { kind: 'root', isAdmin: true, userId: null, actor: 'root' }
  }

  // 2. Better Auth session (modern database-backed auth)
  const betterSession = await getBetterAuthSession()
  if (betterSession) return betterSession

  // 3. Legacy managed token (multi-user mode)
  if (isMultiUserEnabled()) {
    const effectiveToken = token ?? ''
    const hash = createHash('sha256').update(effectiveToken).digest('hex')
    const user = await findUserByTokenHash(hash)
    if (user) {
      return {
        kind: 'user',
        isAdmin: user.role === 'admin',
        userId: user.id,
        actor: `user:${user.name}`,
        user,
      }
    }
  }

  // 4. Legacy unbound token (file store or pre-migration): valid but unscoped.
  if (token) {
    const name = await findTokenName(token)
    if (name) {
      return { kind: 'token', isAdmin: false, userId: null, actor: `token:${name}` }
    }
  }

  return null
}

/** Back-compat wrapper for audit call sites. */
export async function resolveActor(): Promise<string> {
  const session = await getSession()
  return session?.actor ?? 'unknown'
}
