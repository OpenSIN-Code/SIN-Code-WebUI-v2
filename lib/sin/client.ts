import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export type SinCommandResult = {
  ok: boolean
  stdout: string
  stderr: string
  /** True when the `sin` binary is not installed on this machine */
  sinMissing: boolean
}

/**
 * Run a `sin` CLI command (SIN-Code-Bundle backend).
 * Follows the bundle's graceful-degradation contract: if the binary
 * is missing we return a structured fallback instead of crashing.
 *
 * Allowed commands are whitelisted — never pass user input directly.
 */
const ALLOWED_COMMANDS = [
  'status',
  'debt',
  'preflight',
  'codocs check',
  'codocs list',
] as const

export type AllowedSinCommand = (typeof ALLOWED_COMMANDS)[number]

export async function runSinCommand(
  command: AllowedSinCommand,
  args: string[] = [],
): Promise<SinCommandResult> {
  if (!ALLOWED_COMMANDS.includes(command)) {
    return {
      ok: false,
      stdout: '',
      stderr: `Command "${command}" is not in the allowed list.`,
      sinMissing: false,
    }
  }

  // Sanitize args: only allow safe path-like/flag-like tokens
  const safeArgs = args.filter((a) => /^[\w@/.~-]+$/.test(a))

  try {
    const { stdout, stderr } = await execAsync(
      `sin ${command} ${safeArgs.join(' ')}`.trim(),
      { timeout: 30_000, maxBuffer: 1024 * 1024 },
    )
    return { ok: true, stdout, stderr, sinMissing: false }
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string
      stderr?: string
    }
    const sinMissing =
      err.code === 'ENOENT' ||
      /not found|command not found/i.test(err.stderr ?? err.message ?? '')
    return {
      ok: false,
      stdout: err.stdout ?? '',
      stderr: sinMissing
        ? 'The `sin` CLI is not installed on this server. Install it via: git clone https://github.com/OpenSIN-Code/SIN-Code-Bundle && bash install.sh'
        : (err.stderr ?? String(error)),
      sinMissing,
    }
  }
}
