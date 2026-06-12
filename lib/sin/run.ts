/**
 * Purpose: Generic, safe runner for whitelisted sin-code subcommands.
 * Used by /api/sin/{agents,todos,memory,notifications,orchestrator}.
 * Security: execFile (no shell), subcommand whitelist, per-token sanitization.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { cookies, headers } from 'next/headers'
import { AUTH_COOKIE, isAuthConfigured, verifyAnyToken } from '@/lib/auth'
import { resolveActor } from '@/lib/session'
import { audit } from '@/lib/storage'
import { clientIp, rateLimit, rateLimitResponse, type RateLimitResult } from '@/lib/rate-limit'
import {
  SIN_CODE_INSTALL_CMD,
  SIN_CODE_SUBCOMMANDS,
  type SinCodeSubcommand,
} from '@/lib/sin/tools'

const execFileAsync = promisify(execFile)

const BIN = process.env.SIN_CODE_BIN || 'sin-code'
const TIMEOUT_MS = 30_000
const MAX_BUFFER = 8 * 1024 * 1024

/** Allow only safe arg tokens: flags, paths, ids, plain words. */
const SAFE_TOKEN = /^[\w@./:=,\- ]{1,512}$/

export type SinRunResult =
  | { ok: true; data: unknown; raw: string }
  | { ok: false; error: string; installCmd?: string }

/**
 * Second auth layer: verify the session inside the runner itself, so even
 * a misconfigured proxy matcher cannot expose sin-code execution.
 */
export async function assertAuthed(): Promise<boolean> {
  if (!isAuthConfigured()) return true
  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieToken = cookieStore.get(AUTH_COOKIE)?.value
  const headerToken = headerStore
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
  return (await verifyAnyToken(cookieToken)) || (await verifyAnyToken(headerToken))
}

/**
 * Combined guard for route handlers: auth + rate limit in one call.
 */
export async function guardRequest(
  req: Request,
  group: string,
  limit = 30,
  windowMs = 60_000,
): Promise<Response | null> {
  if (!(await assertAuthed())) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const result: RateLimitResult = rateLimit(
    `${clientIp(req)}:${group}`,
    limit,
    windowMs,
  )
  if (!result.allowed) return rateLimitResponse(result)
  return null
}

export async function runSin(
  subcommand: SinCodeSubcommand,
  args: string[] = [],
): Promise<SinRunResult> {
  if (!(await assertAuthed())) {
    return { ok: false, error: 'Unauthorized' }
  }
  if (!SIN_CODE_SUBCOMMANDS.includes(subcommand)) {
    return { ok: false, error: `Unknown subcommand: ${subcommand}` }
  }
  for (const token of args) {
    if (!SAFE_TOKEN.test(token)) {
      return { ok: false, error: 'Rejected unsafe argument token' }
    }
  }

  const actor = await resolveActor()
  const started = Date.now()

  try {
    const { stdout } = await execFileAsync(
      BIN,
      [subcommand, ...args, '--format', 'json'],
      { timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER },
    )
    const raw = stdout.trim()

    void audit({
      actor,
      action: subcommand,
      args: args.join(' ').slice(0, 200),
      ok: true,
      durationMs: Date.now() - started,
    })

    try {
      return { ok: true, data: JSON.parse(raw), raw }
    } catch {
      return { ok: true, data: { text: raw }, raw }
    }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string }
    const error =
      e.code === 'ENOENT'
        ? 'sin-code binary not installed'
        : e.stderr?.trim() || e.message || 'sin-code failed'

    void audit({
      actor,
      action: subcommand,
      args: args.join(' ').slice(0, 200),
      ok: false,
      durationMs: Date.now() - started,
      error: error.slice(0, 300),
    })

    if (e.code === 'ENOENT') {
      return { ok: false, error, installCmd: SIN_CODE_INSTALL_CMD }
    }
    return { ok: false, error }
  }
}

/** Helper for route handlers: uniform JSON response. */
export function sinJson(result: SinRunResult) {
  if (!result.ok) {
    return Response.json(result, { status: result.installCmd ? 503 : 500 })
  }
  return Response.json({ ok: true, data: result.data })
}
