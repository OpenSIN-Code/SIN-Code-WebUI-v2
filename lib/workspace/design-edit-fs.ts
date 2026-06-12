/**
 * Purpose: All dynamic fs/path access for the design-edit route lives here.
 * Loaded via `await import()` from the route handler so Turbopack's NFT
 * tracer never sees process.cwd()/path.resolve() at the route boundary (#59).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pushEntry } from '@/lib/workspace/design-history'

function root(): string {
  return process.env.SIN_WORKSPACE_DIR ?? process.cwd()
}

function safeResolve(rel: string): string {
  const base = root()
  const resolved = path.resolve(base, '.' + path.sep + rel)
  if (!resolved.startsWith(base)) throw new Error('Invalid path')
  return resolved
}

export type ApplyResult =
  | { ok: true; file: string; line: number }
  | { ok: false; status: number; error: string }

export async function applyClassEdit(
  loc: string,
  oldClasses: string,
  newClasses: string,
): Promise<ApplyResult> {
  const [file, lineStr] = loc.split(':')
  const lineNo = parseInt(lineStr, 10)

  let abs: string
  try {
    abs = safeResolve(file)
  } catch {
    return { ok: false, status: 400, error: 'Invalid path' }
  }

  let content: string
  try {
    content = await fs.readFile(abs, 'utf8')
  } catch {
    return { ok: false, status: 404, error: 'File not found' }
  }

  const lines = content.split('\n')
  const from = Math.max(0, lineNo - 3)
  const to = Math.min(lines.length, lineNo + 5)
  let patched = false

  for (let i = from; i < to; i++) {
    if (lines[i].includes(oldClasses)) {
      lines[i] = lines[i].replace(oldClasses, newClasses)
      patched = true
      break
    }
  }

  if (!patched) {
    return {
      ok: false,
      status: 409,
      error: 'Could not locate the class string near the reported line.',
    }
  }

  await fs.writeFile(abs, lines.join('\n'), 'utf8')
  await pushEntry({
    file,
    line: lineNo,
    oldValue: oldClasses,
    newValue: newClasses,
    description: `Changed class to '${newClasses.slice(0, 60)}'`,
  })

  return { ok: true, file, line: lineNo }
}
