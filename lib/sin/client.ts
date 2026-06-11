/**
 * Purpose: Typed wrapper around the `sin-code` Go binary (SIN-Code-Bundle v2.5.0).
 * Docs: https://github.com/OpenSIN-Code/SIN-Code-Bundle/tree/main/cmd/sin-code
 * Related issues: #1, #3
 *
 * Replaces the deprecated Python `sin` CLI with the active Go binary.
 * Uses `execFile` (no shell) + subcommand whitelist + regex-sanitized args
 * to defend against injection. Returns a structured `SinCodeResult` so the
 * UI can degrade gracefully when the binary is not installed.
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** All 32 sin-code subcommands (v2.5.0). Source of truth: cmd/sin-code/main.go */
const SIN_CODE_SUBCOMMANDS = [
  // Core MCP (13)
  'discover', 'execute', 'map', 'grasp', 'scout', 'harvest',
  'orchestrate', 'ibd', 'poc', 'sckg', 'adw', 'oracle', 'efm',
  // Read/Write/Edit/LSP (4)
  'read', 'write', 'edit', 'lsp',
  // Index/Memory/Todo (3)
  'index', 'memory', 'todo',
  // Meta/Utility (12)
  'notifications', 'config', 'security', 'sbom', 'tui', 'plugin',
  'self-update', 'serve',
  'orchestrator-run', 'orchestrator-plan', 'orchestrator-agents', 'webui',
] as const

export type SinCodeSubcommand = (typeof SIN_CODE_SUBCOMMANDS)[number]

export type SinCodeResult<T = unknown> =
  | { installed: true; ok: true; version: string; data: T }
  | { installed: true; ok: false; version: string; error: string; exitCode: number }
  | { installed: false; error: string; installCmd: string }

const INSTALL_CMD = 'go install github.com/OpenSIN-Code/SIN-Code-Bundle/cmd/sin-code@latest'

/** Allow only tokens that look like CLI flags/paths/identifiers.
 *  No spaces, no quotes, no shell metacharacters. */
const SAFE_ARG = /^[a-zA-Z0-9_./:=@~,+-]+$/

/**
 * Run a `sin-code <subcommand> --format json` and return parsed JSON.
 * Graceful: missing binary → `{ installed: false, installCmd }` (no throw).
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
      version: 'unknown',
      error: `Subcommand "${subcommand}" is not in the whitelist.`,
      exitCode: 2,
    }
  }

  const safeArgs = args.filter((a) => SAFE_ARG.test(a))

  try {
    const { stdout, stderr } = await execFileAsync(
      'sin-code',
      [subcommand, ...safeArgs, '--format', 'json'],
      {
        timeout: opts.timeoutMs ?? 30_000,
        maxBuffer: 8 * 1024 * 1024,
        cwd: opts.cwd,
      },
    )
    if (stderr && stderr.trim().length > 0) {
      // sin-code writes progress to stderr but still emits JSON on stdout;
      // we don't fail on stderr unless the JSON parse below fails.
      console.debug(`[sin-code ${subcommand}] stderr:`, stderr)
    }
    let data: T
    try {
      data = JSON.parse(stdout) as T
    } catch {
      // Some subcommands (e.g. `--help`) don't emit JSON; return raw text
      data = stdout as unknown as T
    }
    return { installed: true, ok: true, version: 'unknown', data }
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
        installCmd: INSTALL_CMD,
      }
    }
    return {
      installed: true,
      ok: false,
      version: 'unknown',
      error: e.stderr ?? e.message ?? String(err),
      exitCode: typeof e.code === 'number' ? e.code : 1,
    }
  }
}

/** Probe the binary: returns version + the 32 subcommand names. */
export async function getSinCodeStatus(): Promise<
  | { installed: true; version: string; subcommands: readonly string[] }
  | { installed: false; error: string; installCmd: string }
> {
  try {
    const { stdout } = await execFileAsync('sin-code', ['--version'], { timeout: 5_000 })
    const version = stdout.trim()
    return { installed: true, version, subcommands: SIN_CODE_SUBCOMMANDS }
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    if (e.code === 'ENOENT') {
      return {
        installed: false,
        error: 'sin-code not installed',
        installCmd: INSTALL_CMD,
      }
    }
    return { installed: false, error: e.message, installCmd: INSTALL_CMD }
  }
}
