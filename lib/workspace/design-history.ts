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

const MAX_ENTRIES = 100

let _dir: string | null = null
// @turbopack-disable-next-line
function dir(): string {
  if (!_dir) _dir = path.join(/* turbopackIgnore: true */ process.cwd(), '.sin-webui')
  return _dir
}

let _historyFile: string | null = null
// @turbopack-disable-next-line
function historyFile(): string {
  if (!_historyFile) _historyFile = /*turbopackIgnore: true*/ path.join(dir(), 'design-history.jsonl')
  return _historyFile
}

let _redoFile: string | null = null
// @turbopack-disable-next-line
function redoFile(): string {
  if (!_redoFile) _redoFile = /*turbopackIgnore: true*/ path.join(dir(), 'design-redo.jsonl')
  return _redoFile
}

let _root: string | null = null
// @turbopack-disable-next-line
function root(): string {
  if (!_root) _root = process.env.SIN_WORKSPACE_DIR ?? /* turbopackIgnore: true */ process.cwd()
  return _root
}

async function readStack(file: string): Promise<DesignHistoryEntry[]> {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return raw.split('\n').filter(Boolean).map((l) => JSON.parse(l) as DesignHistoryEntry)
  } catch {
    return []
  }
}

async function writeStack(file: string, entries: DesignHistoryEntry[]): Promise<void> {
  await fs.mkdir(dir(), { recursive: true })
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
  const [undo, redo] = await Promise.all([readStack(historyFile()), readStack(redoFile())])
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
  const undoStack = await readStack(historyFile())
  undoStack.push(full)
  await writeStack(historyFile(), undoStack)
  await writeStack(redoFile(), [])
  return full
}

/** Re-applies a value near the recorded line (same strategy as design-edit). */
async function applyToFile(entry: DesignHistoryEntry, from: string, to: string): Promise<void> {
  const resolved = /*turbopackIgnore: true*/ path.resolve(root(), '.' + path.sep + entry.file)
  if (!resolved.startsWith(root())) throw new Error('Invalid path')
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
  const stack = await readStack(historyFile())
  const last = stack.pop()
  if (!last) return null
  await applyToFile(last, last.newValue, last.oldValue)
  await writeStack(historyFile(), stack)
  const redoStack = await readStack(redoFile())
  redoStack.push(last)
  await writeStack(redoFile(), redoStack)
  return last
}

export async function redo(): Promise<DesignHistoryEntry | null> {
  const redoStack = await readStack(redoFile())
  const last = redoStack.pop()
  if (!last) return null
  await applyToFile(last, last.oldValue, last.newValue)
  await writeStack(redoFile(), redoStack)
  const undoStack = await readStack(historyFile())
  undoStack.push(last)
  await writeStack(historyFile(), undoStack)
  return last
}

export async function clearHistory(): Promise<void> {
  await writeStack(historyFile(), [])
  await writeStack(redoFile(), [])
}
