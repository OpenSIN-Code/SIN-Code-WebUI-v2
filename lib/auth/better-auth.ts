/**
 * Purpose: Better Auth configuration using Kysely + @better-auth/kysely-adapter.
 * Requires DATABASE_URL + BETTER_AUTH_SECRET. When either is missing,
 * isBetterAuthEnabled() is false and the legacy token auth
 * (lib/auth.ts / lib/session.ts) remains the active system.
 * Lazy-initialized to avoid build-time database connection errors.
 * Docs: lib/auth/better-auth.doc.md
 */
import { betterAuth } from 'better-auth'
import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { getDb, getPool } from '@/lib/db'
import { isDbConfigured } from '@/lib/is-db-configured'

export function isBetterAuthEnabled(): boolean {
  return isDbConfigured() && Boolean(process.env.BETTER_AUTH_SECRET)
}

let _auth: any = null

export function getAuth() {
  if (_auth) return _auth
  if (!isBetterAuthEnabled()) return null
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL is required for Better Auth with PostgreSQL. Set it or disable auth.')
  }
  _auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    // Container serves on :3000 but is published on :3100. Trust both so
    // Better Auth doesn't reject requests on origin mismatch.
    trustedOrigins: [
      process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3100',
    ],
    database: {
      type: 'postgres',
      adapter: kyselyAdapter(getDb()),
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        console.log(`[auth] Password reset for ${user.email}: ${url}`)
      },
    },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'member', input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user: any) => {
            const { rows } = await getPool().query(
              `SELECT COUNT(*)::int AS n FROM "user"`
            )
            return { data: { ...user, role: rows[0].n === 0 ? 'owner' : 'member' } }
          },
        },
      },
    },
  })
  return _auth
}

export type AuthInstance = any
export type Session = any