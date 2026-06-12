/**
 * Purpose: Token auth for the self-hosted UI.
 * Two tiers: the env SIN_UI_TOKEN (root, irrevocable) and managed
 * tokens from lib/tokens.ts (hashed, revocable). Constant-time
 * comparison for the root token.
 */
import { timingSafeEqual } from 'node:crypto'
import { verifyStoredToken } from '@/lib/storage'

export const AUTH_COOKIE = 'sin_session'

export function isAuthConfigured(): boolean {
  return Boolean(process.env.SIN_UI_TOKEN)
}

export function verifyToken(token: string | undefined | null): boolean {
  const expected = process.env.SIN_UI_TOKEN
  if (!expected || !token) return false
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function verifyAnyToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false
  if (verifyToken(token)) return true
  return verifyStoredToken(token)
}
