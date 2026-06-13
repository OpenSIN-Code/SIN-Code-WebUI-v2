/**
 * Purpose: Lightweight env check with no external dependencies.
 * Avoids importing lib/db.ts (which pulls in the pg native addon)
 * into modules that only need to know whether the database is configured.
 */
// SPDX-License-Identifier: MIT

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}