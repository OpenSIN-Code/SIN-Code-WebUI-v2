/**
 * Unit tests for lib/sin/client.ts — the sin-code CLI wrapper.
 * Docs: client.test.doc.md
 *
 * Mocks child_process.execFile to avoid calling the real sin-code binary.
 * Also mocks node:util.promisify so it properly bridges to our vi.fn() mock.
 */
// SPDX-License-Identifier: MIT


import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SinCodeSubcommand } from './tools'

const mockExecFile = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
}))

vi.mock('node:util', () => ({
  promisify:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      new Promise((resolve, reject) => {
        const callback = (err: unknown, stdout: string, stderr: string) => {
          if (err) reject(err)
          else resolve({ stdout, stderr })
        }
        fn(...args, callback)
      }),
}))

import { runSinCodeCommand, getSinCodeStatus } from './client'

function wireMock(stdout: string, stderr = '') {
  mockExecFile.mockImplementation(
    (_file: string, _args: unknown, _opts: unknown, callback: (...a: unknown[]) => void) => {
      callback(null, stdout, stderr)
    },
  )
}

function wireMockError(err: unknown) {
  mockExecFile.mockImplementation(
    (_file: string, _args: unknown, _opts: unknown, callback: (...a: unknown[]) => void) => {
      callback(err, '', '')
    },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── runSinCodeCommand ─────────────────────────────────────────
describe('runSinCodeCommand', () => {
  it('returns parsed JSON on successful execFile', async () => {
    /** A valid subcommand with valid JSON output should yield { installed, ok, data }. */
    const fakeData = { installed: true, version: 'v2.5.0' }
    wireMock(JSON.stringify(fakeData))

    const result = await runSinCodeCommand('discover', ['--path', '.'])

    expect(result).toEqual({ installed: true, ok: true, data: fakeData })
  })

  it('returns raw string when stdout is not valid JSON', async () => {
    /** Some subcommands (e.g. help) emit plain text — client should return the raw string. */
    wireMock('usage: sin-code <subcommand>')

    const result = await runSinCodeCommand('discover')

    expect(result).toEqual({
      installed: true,
      ok: true,
      data: 'usage: sin-code <subcommand>',
    })
  })

  // ── Unsafe arguments ─────────────────────────────────────────
  it('filters out arguments containing shell metacharacters', async () => {
    /** SAFE_ARG regex rejects spaces, quotes, semicolons, etc. — only safe tokens pass. */
    wireMock('{"ok":true}')

    await runSinCodeCommand('discover', [
      'safe-arg',
      'has space',
      'rm -rf /',
      'normal_flag',
      '$(evil)',
    ])

    const calledArgs = mockExecFile.mock.calls[0]![1] as string[]
    expect(calledArgs).toEqual([
      'discover',
      'safe-arg',
      'normal_flag',
      '--format',
      'json',
    ])
  })

  // ── Non-zero exit code ──────────────────────────────────────
  it('returns error result (not throw) on non-zero exit code', async () => {
    /** Non-zero exit should produce { installed, ok: false, error, exitCode }. */
    wireMockError(
      Object.assign(new Error('Command failed'), {
        code: 1,
        stdout: '',
        stderr: 'something went wrong',
      }),
    )

    const result = await runSinCodeCommand('execute', ['--command', 'ls'])

    expect(result).toEqual({
      installed: true,
      ok: false,
      error: 'something went wrong',
      exitCode: 1,
    })
  })

  // ── ENOENT (binary missing) ─────────────────────────────────
  it('returns installed: false when sin-code binary is not found', async () => {
    /** ENOENT means the binary isn't installed — should degrade gracefully. */
    wireMockError(
      Object.assign(new Error('ENOENT'), {
        code: 'ENOENT',
        stdout: '',
        stderr: '',
      }),
    )

    const result = await runSinCodeCommand('discover')

    expect(result.installed).toBe(false)
    expect(result).toHaveProperty('installCmd')
  })

  // ── Unknown subcommand ──────────────────────────────────────
  it('rejects subcommands not in the whitelist', async () => {
    /** Subcommands outside SIN_CODE_SUBCOMMANDS are rejected before execFile runs. */
    const result = await runSinCodeCommand('totally-fake-subcommand' as SinCodeSubcommand)

    expect(result).toEqual({
      installed: true,
      ok: false,
      error: 'Subcommand "totally-fake-subcommand" is not in the whitelist.',
      exitCode: 2,
    })
    expect(mockExecFile).not.toHaveBeenCalled()
  })

  // ── String exit code ────────────────────────────────────────
  it('handles string exit codes gracefully', async () => {
    /** Some Node errors use string codes like "ERR_CHILD_PROCESS_STDIO_MAXBUFFER". */
    wireMockError(
      Object.assign(new Error('max buffer exceeded'), {
        code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
        stdout: '',
        stderr: '',
      }),
    )

    const result = await runSinCodeCommand('discover')

    expect(result).toEqual({
      installed: true,
      ok: false,
      error: 'max buffer exceeded',
      exitCode: 1,
    })
  })

  // ── Options ───────────────────────────────────────────────────
  it('passes cwd and timeout options to execFile', async () => {
    /** Custom cwd and timeout should be forwarded to the child process. */
    wireMock('{"ok":true}')

    await runSinCodeCommand('discover', ['--path', '.'], {
      cwd: '/tmp/project',
      timeoutMs: 1_000,
    })

    const opts = mockExecFile.mock.calls[0]![2] as Record<string, unknown>
    expect(opts.cwd).toBe('/tmp/project')
    expect(opts.timeout).toBe(1_000)
    expect(opts.maxBuffer).toBe(8 * 1024 * 1024)
  })

  // ── Environment override ──────────────────────────────────────
  it('uses SIN_CODE_BIN when set', async () => {
    /** $SIN_CODE_BIN allows CI or dev installs to override the binary path. */
    const originalBin = process.env.SIN_CODE_BIN
    process.env.SIN_CODE_BIN = '/custom/sin-code'
    wireMock('{"ok":true}')

    await runSinCodeCommand('discover')

    expect(mockExecFile.mock.calls[0]![0]).toBe('/custom/sin-code')
    process.env.SIN_CODE_BIN = originalBin
  })

  // ── Empty stdout ──────────────────────────────────────────────
  it('returns empty string as data when stdout is empty', async () => {
    /** Empty stdout should parse as an empty string, not throw. */
    wireMock('')

    const result = await runSinCodeCommand('discover')

    expect(result).toEqual({
      installed: true,
      ok: true,
      data: '',
    })
  })
})

// ── getSinCodeStatus ──────────────────────────────────────────
describe('getSinCodeStatus', () => {
  it('returns version and subcommand list on success', async () => {
    /** --version should return a parsed version string. */
    wireMock('sin-code version v2.5.0\n')

    const status = await getSinCodeStatus()

    expect(status.installed).toBe(true)
    if (status.installed) {
      expect(status).toHaveProperty('version')
      expect(status).toHaveProperty('subcommands')
      expect(Array.isArray(status.subcommands)).toBe(true)
    }
  })

  it('parses bare version strings', async () => {
    /** Some outputs are just "v2.5.0" without a prefix — last token is used. */
    wireMock('v2.5.0')

    const status = await getSinCodeStatus()

    expect(status.installed).toBe(true)
    if (status.installed) {
      expect(status.version).toBe('v2.5.0')
    }
  })

  it('returns installed: false on ENOENT', async () => {
    /** Missing binary should yield installed: false with an install command hint. */
    wireMockError(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const status = await getSinCodeStatus()

    expect(status.installed).toBe(false)
    expect(status).toHaveProperty('installCmd')
  })

  it('returns installed: false on non-ENOENT errors', async () => {
    /** Non-ENOENT errors (e.g. timeout) should also degrade gracefully. */
    wireMockError(Object.assign(new Error('killed'), { code: undefined }))

    const status = await getSinCodeStatus()

    expect(status.installed).toBe(false)
    if (!status.installed) {
      expect(status.error).toContain('killed')
    }
  })
})
