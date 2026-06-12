/**
 * Purpose: Command-pattern history for Design Mode class edits.
 * Two bounded JSONL stacks in .sin-webui/: undo (design-history.jsonl)
 * and redo (design-redo.jsonl). Undo applies oldValue, redo newValue.
 */
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'

export type DesignHistoryEntry = {
  id: string
  timestamp: string
  type: 'class-change'
  file: string
  line: number
  oldValue: string
  newValue: string
  description: string
}

const DIR = path.join(process.cwd(), '.sin-webui')
const HISTORY_FILE = path.join(DIR, 'design-history.jsonl')
const REDO_FILE = path.join(DIR, 'design-redo.jsonl')
const MAX_ENTRIES = 100

const ROOT = process.env.SIN_WORKSPACE_DIR ?? process.cwd()

async function readStack(file: string): Promise<DesignHistoryEntry[]> {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return raw.split('\n').filter(Boolean).map((l) => JSON.parse(l) as DesignHistoryEntry)
  } catch {
    return []
  }
}

async function writeStack(file: string, entries: DesignHistoryEntry[]): Promise<void> {
  await fs.mkdir(DIR, { recursive: true })
  const bounded = entries.slice(-MAX_ENTRIES)
  await fs.writeFile(
    file,
    bounded.map((e) => JSON.stringify(e)).join('\n') + (bounded.length ? '\n' : ''),
    'utf8',
  )
}

export async function getHistory(): Promise<{
  undo: DesignHistoryEntry[]
  redo: DesignHistoryEntry[]
}> {
  const [undo, redo] = await Promise.all([readStack(HISTORY_FILE), readStack(REDO_FILE)])
  return { undo, redo }
}

/** Called after a successful Apply. Clears the redo stack. */
export async function pushEntry(
  entry: Omit<DesignHistoryEntry, 'id' | 'timestamp' | 'type'>,
): Promise<DesignHistoryEntry> {
  const full: DesignHistoryEntry = {
    ...entry,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'class-change',
  }
  const undoStack = await readStack(HISTORY_FILE)
  undoStack.push(full)
  await writeStack(HISTORY_FILE, undoStack)
  await writeStack(REDO_FILE, [])
  return full
}

/** Re-applies a value near the recorded line (same strategy as design-edit). */
async function applyToFile(entry: DesignHistoryEntry, from: string, to: string): Promise<void> {
  const resolved = path.resolve(ROOT, '.' + path.sep + entry.file)
  if (!resolved.startsWith(ROOT)) throw new Error('Invalid path')
  const content = await fs.readFile(resolved, 'utf8')
  const lines = content.split('\n')
  const start = Math.max(0, entry.line - 3)
  const end = Math.min(lines.length, entry.line + 5)
  for (let i = start; i < end; i++) {
    if (lines[i].includes(from)) {
      lines[i] = lines[i].replace(from, to)
      await fs.writeFile(resolved, lines.join('\n'), 'utf8')
      return
    }
  }
  throw new Error(`Could not locate "${from}" near ${entry.file}:${entry.line}`)
}

export async function undo(): Promise<DesignHistoryEntry | null> {
  const stack = await readStack(HISTORY_FILE)
  const last = stack.pop()
  if (!last) return null
  await applyToFile(last, last.newValue, last.oldValue)
  await writeStack(HISTORY_FILE, stack)
  const redoStack = await readStack(REDO_FILE)
  redoStack.push(last)
  await writeStack(REDO_FILE, redoStack)
  return last
}

export async function redo(): Promise<DesignHistoryEntry | null> {
  const redoStack = await readStack(REDO_FILE)
  const last = redoStack.pop()
  if (!last) return null
  await applyToFile(last, last.oldValue, last.newValue)
  await writeStack(REDO_FILE, redoStack)
  const undoStack = await readStack(HISTORY_FILE)
  undoStack.push(last)
  await writeStack(HISTORY_FILE, undoStack)
  return last
}

export async function clearHistory(): Promise<void> {
  await writeStack(HISTORY_FILE, [])
  await writeStack(REDO_FILE, [])
}
