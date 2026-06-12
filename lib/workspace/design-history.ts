/**
 * Purpose: Public API for the Design Mode command-pattern history.
 * The actual fs/path/cwd work lives in lib/workspace/design-history-fs.ts
 * (loaded via `await import()`) so the NFT tracer never sees node:fs at
 * the public surface (#59 / #60).
 */
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

let _impl: typeof import('./design-history-fs') | null = null

async function impl(): Promise<typeof import('./design-history-fs')> {
  if (!_impl) _impl = await import('./design-history-fs')
  return _impl
}

export async function getHistory(): Promise<{
  undo: DesignHistoryEntry[]
  redo: DesignHistoryEntry[]
}> {
  return (await impl()).getHistory()
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
  return (await impl()).pushEntry(full)
}

export async function undo(): Promise<DesignHistoryEntry | null> {
  return (await impl()).undo()
}

export async function redo(): Promise<DesignHistoryEntry | null> {
  return (await impl()).redo()
}

export async function clearHistory(): Promise<void> {
  return (await impl()).clearHistory()
}
