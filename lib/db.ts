/**
 * Purpose: Postgres pool singleton + Kysely instance for better-auth.
 * Set DATABASE_URL to enable. pg Pool for direct queries (health checks);
 * Kysely + PostgresDialect for better-auth's kysely-adapter.
 * Docs: lib/db.doc.md
 */
// SPDX-License-Identifier: MIT

import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'

declare global {
  var __sinPgPool: Pool | undefined
  var __sinKysely: Kysely<any> | undefined
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

export function getDb(): Kysely<any> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!globalThis.__sinKysely) {
    globalThis.__sinKysely = new Kysely({
      dialect: new PostgresDialect({ pool: getPool() }),
    })
  }
  return globalThis.__sinKysely
}