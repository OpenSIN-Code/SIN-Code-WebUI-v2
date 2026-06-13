/**
 * Purpose: Real fs implementation of the Design Mode history stacks.
 * Loaded via `await import('./design-history-fs')` from
 * lib/workspace/design-history.ts so the NFT tracer never sees fs/path/cwd
 * at the public surface (#59 / #60).
 * Docs: design-history-fs.doc.md
 */
// SPDX-License-Identifier: MIT

import path from 'node:path'
import { promises as fs } from 'node:fs'

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

function dir(): string {
  return path.join(process.cwd(), '.sin-webui')
}

function historyFile(): string {
  return path.join(dir(), 'design-history.jsonl')
}

function redoFile(): string {
  return path.join(dir(), 'design-redo.jsonl')
}

function root(): string {
  return process.env.SIN_WORKSPACE_DIR ?? process.cwd()
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

export async function pushEntry(full: DesignHistoryEntry): Promise<DesignHistoryEntry> {
  const undoStack = await readStack(historyFile())
  undoStack.push(full)
  await writeStack(historyFile(), undoStack)
  await writeStack(redoFile(), [])
  return full
}

async function applyToFile(entry: DesignHistoryEntry, from: string, to: string): Promise<void> {
  const resolved = path.resolve(root(), '.' + path.sep + entry.file)
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
