/**
 * Purpose: Resolve the full session identity for a request.
 * Three cases:
 *  - root:      env SIN_UI_TOKEN — always admin, sees everything
 *  - user:      managed token bound to a user (multi-user mode)
 *  - anonymous: auth disabled (local dev) — treated as admin
 * Replaces lib/actor.ts; resolveActor() is kept as a thin wrapper
 * so audit logging call sites stay unchanged.
 */
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

async function presentedToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  return (
    cookieStore.get(AUTH_COOKIE)?.value ??
    headerStore.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null
  )
}

export async function getSession(): Promise<Session> {
  if (!isAuthConfigured()) {
    return { kind: 'anonymous', isAdmin: true, userId: null, actor: 'anonymous' }
  }
  const token = await presentedToken()
  if (!token) return null

  if (verifyToken(token)) {
    return { kind: 'root', isAdmin: true, userId: null, actor: 'root' }
  }

  if (isMultiUserEnabled()) {
    const hash = createHash('sha256').update(token).digest('hex')
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

  // Legacy unbound token (file store or pre-migration): valid but unscoped.
  const name = await findTokenName(token)
  if (name) {
    return { kind: 'token', isAdmin: false, userId: null, actor: `token:${name}` }
  }
  return null
}

/** Back-compat wrapper for audit call sites. */
export async function resolveActor(): Promise<string> {
  const session = await getSession()
  return session?.actor ?? 'unknown'
}
