/**
 * Purpose: Server-side store for workspace content (bookmarks, sources,
 * files, project links). Mirrors lib/workspaces.ts: Postgres when
 * DATABASE_URL is set, otherwise a JSON file under .sin-webui/.
 *
 * File uploads themselves live in Supabase Storage (lib/supabase.ts);
 * this store only persists their metadata so listing is fast and works
 * even when Supabase is briefly unavailable.
 */
// SPDX-License-Identifier: MIT

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { getPool, isDbConfigured } from '@/lib/db'
import {
  EMPTY_WORKSPACE_CONTENT,
  type SourceKind,
  type WorkspaceBookmark,
  type WorkspaceContent,
  type WorkspaceFile,
  type WorkspaceProjectLink,
  type WorkspaceSource,
} from '@/lib/workspace-content-shared'

export * from '@/lib/workspace-content-shared'

// ── File fallback ───────────────────────────────────────────────────────
let _file: string | null = null
function contentFile(): string {
  if (!_file) {
    _file = path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      '.sin-webui',
      'workspace-content.json',
    )
  }
  return _file
}

type ContentMap = Record<string, WorkspaceContent>

async function readAll(): Promise<ContentMap> {
  try {
    return JSON.parse(await readFile(contentFile(), 'utf8')) as ContentMap
  } catch {
    return {}
  }
}

async function writeAll(map: ContentMap): Promise<void> {
  const dir = path.dirname(contentFile())
  await mkdir(dir, { recursive: true })
  const tmp = `${contentFile()}.tmp-${Date.now()}`
  await writeFile(tmp, JSON.stringify(map, null, 2), 'utf8')
  await rename(tmp, contentFile())
}

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString('hex')}`
}

// ── Postgres table (created lazily) ──────────────────────────────────────
let _tableReady = false
async function ensureTable(): Promise<void> {
  if (_tableReady) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS workspace_content (
      workspace_id TEXT PRIMARY KEY,
      content      JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  _tableReady = true
}

// ── Core read / write ────────────────────────────────────────────────────
export async function getWorkspaceContent(
  workspaceId: string,
): Promise<WorkspaceContent> {
  if (isDbConfigured()) {
    await ensureTable()
    const { rows } = await getPool().query(
      `SELECT content FROM workspace_content WHERE workspace_id = $1`,
      [workspaceId],
    )
    const c = (rows[0]?.content as Partial<WorkspaceContent>) ?? {}
    return { ...EMPTY_WORKSPACE_CONTENT, ...c }
  }
  const map = await readAll()
  return { ...EMPTY_WORKSPACE_CONTENT, ...(map[workspaceId] ?? {}) }
}

async function setWorkspaceContent(
  workspaceId: string,
  content: WorkspaceContent,
): Promise<void> {
  if (isDbConfigured()) {
    await ensureTable()
    await getPool().query(
      `INSERT INTO workspace_content (workspace_id, content, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (workspace_id) DO UPDATE SET
         content = EXCLUDED.content, updated_at = now()`,
      [workspaceId, JSON.stringify(content)],
    )
    return
  }
  const map = await readAll()
  map[workspaceId] = content
  await writeAll(map)
}

// ── Bookmarks ─────────────────────────────────────────────────────────────
export async function addBookmark(
  workspaceId: string,
  input: { title: string; url: string; description?: string },
): Promise<WorkspaceBookmark> {
  const content = await getWorkspaceContent(workspaceId)
  const bookmark: WorkspaceBookmark = {
    id: newId('bm'),
    workspaceId,
    title: input.title.trim().slice(0, 120),
    url: input.url.trim().slice(0, 2000),
    description: (input.description ?? '').trim().slice(0, 300),
    createdAt: new Date().toISOString(),
  }
  content.bookmarks = [bookmark, ...content.bookmarks]
  await setWorkspaceContent(workspaceId, content)
  return bookmark
}

export async function removeBookmark(
  workspaceId: string,
  id: string,
): Promise<void> {
  const content = await getWorkspaceContent(workspaceId)
  content.bookmarks = content.bookmarks.filter((b) => b.id !== id)
  await setWorkspaceContent(workspaceId, content)
}

// ── Sources ─────────────────────────────────────────────────────────────
export async function addSource(
  workspaceId: string,
  input: { kind: SourceKind; title: string; url: string; note?: string },
): Promise<WorkspaceSource> {
  const content = await getWorkspaceContent(workspaceId)
  const source: WorkspaceSource = {
    id: newId('src'),
    workspaceId,
    kind: input.kind,
    title: input.title.trim().slice(0, 160),
    url: input.url.trim().slice(0, 2000),
    note: (input.note ?? '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  }
  content.sources = [source, ...content.sources]
  await setWorkspaceContent(workspaceId, content)
  return source
}

export async function removeSource(
  workspaceId: string,
  id: string,
): Promise<void> {
  const content = await getWorkspaceContent(workspaceId)
  content.sources = content.sources.filter((s) => s.id !== id)
  await setWorkspaceContent(workspaceId, content)
}

// ── Files (metadata only; bytes live in Supabase Storage) ─────────────────
export async function addFileRecord(
  workspaceId: string,
  input: { name: string; path: string; mimeType: string; size: number },
): Promise<WorkspaceFile> {
  const content = await getWorkspaceContent(workspaceId)
  const file: WorkspaceFile = {
    id: newId('file'),
    workspaceId,
    name: input.name.slice(0, 200),
    path: input.path,
    mimeType: input.mimeType || 'application/octet-stream',
    size: input.size,
    createdAt: new Date().toISOString(),
  }
  content.files = [file, ...content.files]
  await setWorkspaceContent(workspaceId, content)
  return file
}

export async function getFileRecord(
  workspaceId: string,
  id: string,
): Promise<WorkspaceFile | null> {
  const content = await getWorkspaceContent(workspaceId)
  return content.files.find((f) => f.id === id) ?? null
}

export async function removeFileRecord(
  workspaceId: string,
  id: string,
): Promise<WorkspaceFile | null> {
  const content = await getWorkspaceContent(workspaceId)
  const file = content.files.find((f) => f.id === id) ?? null
  content.files = content.files.filter((f) => f.id !== id)
  await setWorkspaceContent(workspaceId, content)
  return file
}

// ── Project links ─────────────────────────────────────────────────────────
export async function addProjectLink(
  workspaceId: string,
  input: { projectId: string; name: string },
): Promise<WorkspaceProjectLink> {
  const content = await getWorkspaceContent(workspaceId)
  const existing = content.projects.find((p) => p.projectId === input.projectId)
  if (existing) return existing
  const link: WorkspaceProjectLink = {
    id: newId('proj'),
    workspaceId,
    projectId: input.projectId,
    name: input.name.slice(0, 120),
    createdAt: new Date().toISOString(),
  }
  content.projects = [link, ...content.projects]
  await setWorkspaceContent(workspaceId, content)
  return link
}

export async function removeProjectLink(
  workspaceId: string,
  id: string,
): Promise<void> {
  const content = await getWorkspaceContent(workspaceId)
  content.projects = content.projects.filter((p) => p.id !== id)
  await setWorkspaceContent(workspaceId, content)
}
