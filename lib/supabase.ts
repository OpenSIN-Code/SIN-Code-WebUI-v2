/**
 * Purpose: Supabase client for the SELF-HOSTED (open-source) instance.
 * Not Supabase Cloud — points at your own deployment via env vars.
 *
 * Server-side uses the service-role key (full access, bypasses RLS) and
 * must never be imported into client components. Storage uploads for
 * workspace files go through getSupabaseAdmin().storage.
 *
 * Required env (set later):
 *   SUPABASE_URL                  e.g. https://supabase.your-domain
 *   SUPABASE_SERVICE_ROLE_KEY     service_role JWT (server only)
 * Optional public (client) env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
// SPDX-License-Identifier: MIT

import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare global {
  var __sinSupabaseAdmin: SupabaseClient | undefined
}

/** Bucket that holds workspace file uploads. */
export const WORKSPACE_BUCKET = 'workspace-files'

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

/**
 * Service-role client. Throws if unconfigured — callers should guard with
 * isSupabaseConfigured() and degrade gracefully.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)',
    )
  }
  if (!globalThis.__sinSupabaseAdmin) {
    globalThis.__sinSupabaseAdmin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return globalThis.__sinSupabaseAdmin
}

/**
 * Ensure the workspace bucket exists. Safe to call repeatedly; ignores the
 * "already exists" error. Returns false if Supabase is unconfigured.
 */
export async function ensureWorkspaceBucket(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const admin = getSupabaseAdmin()
  const { data } = await admin.storage.getBucket(WORKSPACE_BUCKET)
  if (data) return true
  const { error } = await admin.storage.createBucket(WORKSPACE_BUCKET, {
    public: false,
  })
  // Race / already-exists is fine.
  if (error && !/exist/i.test(error.message)) {
    throw error
  }
  return true
}
