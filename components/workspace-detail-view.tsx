// SPDX-License-Identifier: MIT

'use client'
/**
 * Purpose: Workspace detail page. A workspace is a container with a chat
 * preset plus a knowledge base: linked projects, uploaded files (Supabase
 * Storage), bookmarks (URL widgets) and sources (web / YouTube / docs).
 * Tabs: Overview · Projects · Files · Bookmarks · Sources.
 */
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Code2,
  Download,
  FileText,
  Folder,
  Globe,
  Link2,
  Loader2,
  MessageCircle,
  NotebookPen,
  PenLine,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import useSWR from 'swr'
import { AppSidebar } from '@/components/app-sidebar'
import { useChatStore } from '@/components/chat-store'
import { useProjectStore } from '@/components/project-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  detectSourceKind,
  isHttpUrl,
  type SourceKind,
  type WorkspaceContent,
} from '@/lib/workspace-content-shared'
import type { Workspace } from '@/lib/workspaces-shared'

const ICONS: Record<string, typeof Code2> = {
  code: Code2,
  'message-circle': MessageCircle,
  globe: Globe,
  'bar-chart': BarChart3,
  notebook: NotebookPen,
  'pen-line': PenLine,
  sparkles: Sparkles,
}

const SOURCE_ICONS: Record<SourceKind, typeof Globe> = {
  webpage: Globe,
  youtube: Video,
  doc: FileText,
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function WorkspaceDetailView({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const { addChat } = useChatStore()
  const { projects } = useProjectStore()

  const { data: wsData } = useSWR('/api/workspaces', fetcher)
  const workspaces: Workspace[] = Array.isArray(wsData?.data) ? wsData.data : []
  const workspace = workspaces.find((w) => w.id === workspaceId)

  const { data: contentData, mutate } = useSWR<{
    data: WorkspaceContent
    storageReady: boolean
  }>(`/api/workspaces/${workspaceId}/content`, fetcher)
  const content = contentData?.data
  const storageReady = contentData?.storageReady ?? false

  async function startChat() {
    if (!workspace) return
    const id = `chat-${Date.now().toString(36)}`
    await addChat({ id, label: `New ${workspace.name} chat`, workspaceId: workspace.id })
    router.push(
      `/chat/${id}?ws=${workspace.id}&m=${encodeURIComponent(workspace.defaultModel)}`,
    )
  }

  const Icon = workspace ? (ICONS[workspace.icon] ?? Sparkles) : Sparkles

  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border/40 px-6">
          <Link
            href="/workspaces"
            aria-label="Back to workspaces"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Icon className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-medium text-foreground">
            {workspace?.name ?? 'Workspace'}
          </h1>
          <button
            type="button"
            onClick={startChat}
            disabled={!workspace}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="size-3.5" />
            Start chat
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-5xl">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">
                  <Folder /> Projects
                </TabsTrigger>
                <TabsTrigger value="files">
                  <FileText /> Files
                </TabsTrigger>
                <TabsTrigger value="bookmarks">
                  <Bookmark /> Bookmarks
                </TabsTrigger>
                <TabsTrigger value="sources">
                  <Globe /> Sources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab workspace={workspace} content={content} />
              </TabsContent>
              <TabsContent value="projects">
                <ProjectsTab
                  workspaceId={workspaceId}
                  content={content}
                  projects={projects}
                  onChange={mutate}
                />
              </TabsContent>
              <TabsContent value="files">
                <FilesTab
                  workspaceId={workspaceId}
                  content={content}
                  storageReady={storageReady}
                  onChange={mutate}
                />
              </TabsContent>
              <TabsContent value="bookmarks">
                <BookmarksTab
                  workspaceId={workspaceId}
                  content={content}
                  onChange={mutate}
                />
              </TabsContent>
              <TabsContent value="sources">
                <SourcesTab
                  workspaceId={workspaceId}
                  content={content}
                  onChange={mutate}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Shared bits ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[13px] font-medium text-foreground">
        {title}
        {typeof count === 'number' && (
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">
            {count}
          </span>
        )}
      </h2>
      {children}
    </div>
  )
}

function EmptyHint({ icon: Icon, text }: { icon: typeof Globe; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
      <Icon className="size-6 text-muted-foreground" />
      <p className="text-[12.5px] text-muted-foreground">{text}</p>
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────
function OverviewTab({
  workspace,
  content,
}: {
  workspace?: Workspace
  content?: WorkspaceContent
}) {
  const stats = [
    { label: 'Projects', value: content?.projects.length ?? 0, icon: Folder },
    { label: 'Files', value: content?.files.length ?? 0, icon: FileText },
    { label: 'Bookmarks', value: content?.bookmarks.length ?? 0, icon: Bookmark },
    { label: 'Sources', value: content?.sources.length ?? 0, icon: Globe },
  ]
  return (
    <div className="flex flex-col gap-6">
      {workspace?.description && (
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          {workspace.description}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
          >
            <s.icon className="size-4 text-muted-foreground" />
            <span className="mt-1 text-xl font-semibold text-foreground">
              {s.value}
            </span>
            <span className="text-[12px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      {workspace && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-[12.5px] font-medium text-foreground">Configuration</h3>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Model</dt>
              <dd className="font-mono text-foreground">
                {workspace.defaultModel.split('/')[1] ?? workspace.defaultModel}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tools</dt>
              <dd className="font-mono text-foreground">
                {workspace.enabledTools.length === 0
                  ? 'none'
                  : `${workspace.enabledTools.length} enabled`}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Layout</dt>
              <dd className="font-mono text-foreground">{workspace.layout}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-mono text-foreground">
                {workspace.builtIn ? 'built-in' : 'custom'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

// ── Projects ─────────────────────────────────────────────────────────────
function ProjectsTab({
  workspaceId,
  content,
  projects,
  onChange,
}: {
  workspaceId: string
  content?: WorkspaceContent
  projects: { id: string; name: string }[]
  onChange: () => void
}) {
  const [selected, setSelected] = useState('')
  const linked = content?.projects ?? []
  const available = projects.filter(
    (p) => !linked.some((l) => l.projectId === p.id),
  )

  async function link() {
    const project = projects.find((p) => p.id === selected)
    if (!project) return
    await fetch(`/api/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, name: project.name }),
    })
    setSelected('')
    onChange()
  }

  async function unlink(linkId: string) {
    await fetch(`/api/workspaces/${workspaceId}/projects`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId }),
    })
    onChange()
  }

  return (
    <div>
      <SectionHeader title="Linked projects" count={linked.length}>
        <div className="flex items-center gap-2">
          <Select value={selected} onValueChange={(v) => setSelected(v ?? '')}>
            <SelectTrigger size="sm" className="w-48" aria-label="Select project">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {available.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No projects available
                </SelectItem>
              ) : (
                available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={link}
            disabled={!selected}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Link2 className="size-3.5" /> Link
          </button>
        </div>
      </SectionHeader>
      {linked.length === 0 ? (
        <EmptyHint icon={Folder} text="No projects linked to this workspace yet." />
      ) : (
        <ul className="flex flex-col gap-2">
          {linked.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <Folder className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate text-[13px] text-foreground">
                {l.name}
              </span>
              <button
                type="button"
                onClick={() => unlink(l.id)}
                aria-label={`Unlink ${l.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Files ────────────────────────────────────────────────────────────────
function FilesTab({
  workspaceId,
  content,
  storageReady,
  onChange,
}: {
  workspaceId: string
  content?: WorkspaceContent
  storageReady: boolean
  onChange: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const files = content?.files ?? []

  async function upload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`/api/workspaces/${workspaceId}/files`, {
          method: 'POST',
          body: form,
        })
        const json = await res.json()
        if (!json.ok) {
          setError(json.error ?? 'Upload failed')
          break
        }
      }
      onChange()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(fileId: string) {
    await fetch(`/api/workspaces/${workspaceId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    })
    onChange()
  }

  return (
    <div>
      <SectionHeader title="Files" count={files.length}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!storageReady || uploading}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </SectionHeader>

      {!storageReady && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-[12.5px] text-muted-foreground">
          File storage is not connected yet. Set your self-hosted Supabase
          credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) to enable
          uploads.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <EmptyHint icon={FileText} text="No files uploaded to this workspace yet." />
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] text-foreground">
                  {f.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatBytes(f.size)} · {f.mimeType}
                </span>
              </div>
              <a
                href={`/api/workspaces/${workspaceId}/files/${f.id}/download`}
                aria-label={`Download ${f.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="size-3.5" />
              </a>
              <button
                type="button"
                onClick={() => remove(f.id)}
                aria-label={`Delete ${f.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Bookmarks ──────────────────────────────────────────────────────────────
function BookmarksTab({
  workspaceId,
  content,
  onChange,
}: {
  workspaceId: string
  content?: WorkspaceContent
  onChange: () => void
}) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const bookmarks = content?.bookmarks ?? []

  async function add() {
    if (!isHttpUrl(url)) return
    setBusy(true)
    try {
      await fetch(`/api/workspaces/${workspaceId}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      })
      setUrl('')
      setTitle('')
      onChange()
    } finally {
      setBusy(false)
    }
  }

  async function remove(bookmarkId: string) {
    await fetch(`/api/workspaces/${workspaceId}/bookmarks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarkId }),
    })
    onChange()
  }

  return (
    <div>
      <SectionHeader title="Bookmarks" count={bookmarks.length} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 sm:w-48"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="button"
          onClick={add}
          disabled={!isHttpUrl(url) || busy}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      {bookmarks.length === 0 ? (
        <EmptyHint icon={Bookmark} text="No bookmarks yet. Add a URL to pin it here." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Bookmark className="size-4 text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[13px] font-medium text-foreground hover:underline"
                >
                  {b.title}
                </a>
                <span className="truncate text-[11.5px] text-muted-foreground">
                  {b.url}
                </span>
                {b.description && (
                  <p className="mt-1 text-pretty text-[12px] text-muted-foreground">
                    {b.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(b.id)}
                aria-label={`Delete ${b.title}`}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sources ────────────────────────────────────────────────────────────────
function SourcesTab({
  workspaceId,
  content,
  onChange,
}: {
  workspaceId: string
  content?: WorkspaceContent
  onChange: () => void
}) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const sources = content?.sources ?? []
  const kind = url ? detectSourceKind(url) : 'webpage'

  async function add() {
    if (!isHttpUrl(url)) return
    setBusy(true)
    try {
      await fetch(`/api/workspaces/${workspaceId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, note, kind }),
      })
      setUrl('')
      setTitle('')
      setNote('')
      onChange()
    } finally {
      setBusy(false)
    }
  }

  async function remove(sourceId: string) {
    await fetch(`/api/workspaces/${workspaceId}/sources`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId }),
    })
    onChange()
  }

  return (
    <div>
      <SectionHeader title="Sources" count={sources.length} />
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 sm:w-48"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs… / YouTube / web page"
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional) — why this source matters"
          rows={2}
          className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">
            {url ? `detected: ${kind}` : 'paste a URL to add a source'}
          </span>
          <button
            type="button"
            onClick={add}
            disabled={!isHttpUrl(url) || busy}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="size-3.5" /> Add source
          </button>
        </div>
      </div>
      {sources.length === 0 ? (
        <EmptyHint
          icon={Globe}
          text="No sources yet. Add docs, web pages or YouTube links."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((s) => {
            const SrcIcon = SOURCE_ICONS[s.kind]
            return (
              <li
                key={s.id}
                className="group flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <SrcIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[13px] font-medium text-foreground hover:underline"
                  >
                    {s.title}
                  </a>
                  <span className="truncate text-[11.5px] text-muted-foreground">
                    {s.url}
                  </span>
                  {s.note && (
                    <p className="mt-1 text-pretty text-[12px] text-muted-foreground">
                      {s.note}
                    </p>
                  )}
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                  {s.kind}
                </span>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label={`Delete ${s.title}`}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
