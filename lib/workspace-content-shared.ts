/**
 * Purpose: Client-safe types for workspace content (bookmarks, sources,
 * files, linked projects). Isomorphic — no Node-only imports.
 *
 * A workspace becomes a container: alongside its chat preset config it
 * holds a knowledge base of bookmarks (URL widgets), sources (docs /
 * YouTube / web pages), uploaded files (Supabase Storage), and links to
 * existing projects.
 */

export type WorkspaceBookmark = {
  id: string
  workspaceId: string
  title: string
  url: string
  description: string
  createdAt: string
}

export type SourceKind = 'webpage' | 'youtube' | 'doc'

export type WorkspaceSource = {
  id: string
  workspaceId: string
  kind: SourceKind
  title: string
  url: string
  note: string
  createdAt: string
}

export type WorkspaceFile = {
  id: string
  workspaceId: string
  name: string
  /** Path inside the Supabase Storage bucket. */
  path: string
  mimeType: string
  size: number
  createdAt: string
}

export type WorkspaceProjectLink = {
  id: string
  workspaceId: string
  projectId: string
  name: string
  createdAt: string
}

export type WorkspaceContent = {
  bookmarks: WorkspaceBookmark[]
  sources: WorkspaceSource[]
  files: WorkspaceFile[]
  projects: WorkspaceProjectLink[]
}

export const EMPTY_WORKSPACE_CONTENT: WorkspaceContent = {
  bookmarks: [],
  sources: [],
  files: [],
  projects: [],
}

export const SOURCE_KINDS: readonly SourceKind[] = ['webpage', 'youtube', 'doc']

/** Best-effort classification of a URL into a source kind. */
export function detectSourceKind(url: string): SourceKind {
  const u = url.toLowerCase()
  if (/youtube\.com|youtu\.be/.test(u)) return 'youtube'
  if (/\.(pdf|md|txt|docx?|csv)(\?|$)/.test(u)) return 'doc'
  return 'webpage'
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
