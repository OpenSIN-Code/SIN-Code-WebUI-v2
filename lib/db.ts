/**
 * Purpose: Postgres pool singleton. Works with Neon (sslmode=require in
 * the connection string) and self-hosted Postgres alike.
 * Set DATABASE_URL to enable the Postgres store; without it, the
 * file-based store remains active (see lib/storage.ts).
 */
import { Pool } from 'pg'

declare global {
  var __sinPgPool: Pool | undefined
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!globalThis.__sinPgPool) {
    globalThis.__sinPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }
  return globalThis.__sinPgPool
}
