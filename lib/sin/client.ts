/**
 * Purpose: Typed wrapper around the `sin-code` Go binary (SIN-Code-Bundle v2.5.0).
 * Docs: client.doc.md
 * Related issues: #1, #3
 *
 * Replaces the deprecated Python `sin` CLI with the active Go binary.
 * Uses `execFile` (no shell) + subcommand whitelist + per-token regex
 * sanitization to defend against injection. Returns a structured
 * `SinCodeResult` so the UI degrades gracefully when the binary is missing.
 */
// SPDX-License-Identifier: MIT


import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  SIN_CODE_INSTALL_CMD,
  SIN_CODE_SUBCOMMANDS,
  type SinCodeSubcommand,
} from './tools'

const execFileAsync = promisify(execFile)

/** Resolve the binary path; $SIN_CODE_BIN allows CI/override. */
function sinCodeBin(): string {
  return process.env.SIN_CODE_BIN ?? 'sin-code'
}

export type SinCodeResult<T = unknown> =
  | { installed: true; ok: true; data: T }
  | { installed: true; ok: false; error: string; exitCode: number }
  | { installed: false; error: string; installCmd: string }

export type SinCodeStatus =
  | { installed: true; version: string; subcommands: readonly string[] }
  | { installed: false; error: string; installCmd: string }

/** Allow only flag/path/identifier-like tokens. No spaces, quotes, or shell metacharacters. */
const SAFE_ARG = /^[a-zA-Z0-9_./:=@~,+-]+$/

/**
 * Run `sin-code <subcommand> ... --format json` and return parsed JSON.
 * Graceful: missing binary → `{ installed: false, installCmd }` (never throws).
 * Safe: execFile (no shell) + whitelisted subcommand + per-token regex.
 */
export async function runSinCodeCommand<T = unknown>(
  subcommand: SinCodeSubcommand,
  args: readonly string[] = [],
  opts: { cwd?: string; timeoutMs?: number } = {},
): Promise<SinCodeResult<T>> {
  if (!SIN_CODE_SUBCOMMANDS.includes(subcommand)) {
    return {
      installed: true,
      ok: false,
      error: `Subcommand "${subcommand}" is not in the whitelist.`,
      exitCode: 2,
    }
  }

  const safeArgs = args.filter((a) => SAFE_ARG.test(a))

  try {
    const { stdout } = await execFileAsync(
      sinCodeBin(),
      [subcommand, ...safeArgs, '--format', 'json'],
      {
        timeout: opts.timeoutMs ?? 30_000,
        maxBuffer: 8 * 1024 * 1024,
        cwd: opts.cwd,
      },
    )
    let data: T
    try {
      data = JSON.parse(stdout) as T
    } catch {
      // Some subcommands (e.g. help output) don't emit JSON; return raw text.
      data = stdout as unknown as T
    }
    return { installed: true, ok: true, data }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      stdout?: string
      stderr?: string
      code?: string | number
    }
    if (e.code === 'ENOENT') {
      return {
        installed: false,
        error: 'sin-code binary not found on PATH',
        installCmd: SIN_CODE_INSTALL_CMD,
      }
    }
    return {
      installed: true,
      ok: false,
      error: e.stderr?.trim() || e.message || String(err),
      exitCode: typeof e.code === 'number' ? e.code : 1,
    }
  }
}

/** Probe the binary: returns version + the 32 subcommand names. */
export async function getSinCodeStatus(): Promise<SinCodeStatus> {
  try {
    const { stdout } = await execFileAsync(sinCodeBin(), ['--version'], {
      timeout: 5_000,
    })
    // Output like "sin-code version v2.5.0" or bare "v2.5.0" — keep the tail token.
    const version = stdout.trim().split(/\s+/).pop() ?? stdout.trim()
    return { installed: true, version, subcommands: SIN_CODE_SUBCOMMANDS }
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    return {
      installed: false,
      error: e.code === 'ENOENT' ? 'sin-code not installed' : e.message,
      installCmd: SIN_CODE_INSTALL_CMD,
    }
  }
}
