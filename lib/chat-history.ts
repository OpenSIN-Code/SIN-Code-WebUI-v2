/**
 * Purpose: File-backed chat history store for the self-hosted deployment.
 * Layout: data/chats/index.json (metadata) + data/chats/<id>.json (messages).
 * Atomic writes via tmp-file rename. Zero external dependencies.
 * Migration path: swap implementations for SQLite/Neon later — the
 * exported function signatures are storage-agnostic.
 */
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { UIMessage } from 'ai'

const DATA_DIR = path.join(process.cwd(), 'data', 'chats')
const SAFE_ID = /^[a-z0-9-]{1,80}$/

export type ChatMeta = {
  id: string
  label: string
  favorite: boolean
  workspaceId?: string
  createdAt: string
  updatedAt: string
}

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

function indexPath() {
  return path.join(DATA_DIR, 'index.json')
}

function chatPath(id: string) {
  return path.join(DATA_DIR, `${id}.json`)
}

async function atomicWrite(filePath: string, content: string) {
  const tmp = `${filePath}.tmp-${Date.now()}`
  await writeFile(tmp, content, 'utf8')
  await rename(tmp, filePath)
}

export function isValidChatId(id: string): boolean {
  return SAFE_ID.test(id)
}

export async function listChats(): Promise<ChatMeta[]> {
  await ensureDir()
  try {
    const raw = await readFile(indexPath(), 'utf8')
    const parsed = JSON.parse(raw) as ChatMeta[]
    return parsed.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch {
    return []
  }
}

export async function upsertChatMeta(
  meta: Pick<ChatMeta, 'id' | 'label'> & Partial<ChatMeta>,
): Promise<void> {
  await ensureDir()
  const chats = await listChats()
  const now = new Date().toISOString()
  const existing = chats.find((c) => c.id === meta.id)
  const next: ChatMeta[] = existing
    ? chats.map((c) =>
        c.id === meta.id
          ? { ...c, ...meta, updatedAt: now }
          : c,
      )
    : [
        {
          id: meta.id,
          label: meta.label,
          favorite: meta.favorite ?? false,
          workspaceId: meta.workspaceId,
          createdAt: now,
          updatedAt: now,
        },
        ...chats,
      ]
  await atomicWrite(indexPath(), JSON.stringify(next, null, 2))
}

export async function deleteChat(id: string): Promise<void> {
  await ensureDir()
  const chats = await listChats()
  await atomicWrite(
    indexPath(),
    JSON.stringify(chats.filter((c) => c.id !== id), null, 2),
  )
  try {
    await unlink(chatPath(id))
  } catch {
    /* chat file may not exist yet */
  }
}

export async function loadMessages(id: string): Promise<UIMessage[]> {
  await ensureDir()
  try {
    const raw = await readFile(chatPath(id), 'utf8')
    return JSON.parse(raw) as UIMessage[]
  } catch {
    return []
  }
}

export async function saveMessages(id: string, messages: UIMessage[]): Promise<void> {
  await ensureDir()
  await atomicWrite(chatPath(id), JSON.stringify(messages))
}

export async function ownsChat(_id: string, _userId: string | null): Promise<boolean> {
  return true // file store is single-user, always allow
}

export async function pruneOrphans(): Promise<void> {
  await ensureDir()
  const chats = await listChats()
  const ids = new Set(chats.map((c) => c.id))
  const files = await readdir(DATA_DIR)
  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json') continue
    const id = file.replace(/\.json$/, '')
    if (!ids.has(id) && SAFE_ID.test(id)) {
      try {
        await unlink(path.join(DATA_DIR, file))
      } catch {
        /* ignore */
      }
    }
  }
}
