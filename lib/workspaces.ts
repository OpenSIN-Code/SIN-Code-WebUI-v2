/**
 * Purpose: Workspace definitions and store.
 * A workspace reconfigures the chat: system prompt + allowed tools +
 * default model + layout. Built-in presets are code-defined; custom
 * workspaces are stored per user (Postgres or data/workspaces.json).
 */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPool, isDbConfigured } from '@/lib/db'

import {
  ALL_TOOL_KEYS,
  BUILT_IN_WORKSPACES,
  type Workspace,
  type WorkspaceLayout,
} from '@/lib/workspaces-shared'

export {
  ALL_TOOL_KEYS,
  BUILT_IN_WORKSPACES,
  type Workspace,
  type WorkspaceLayout,
}

// ── Custom workspace store ──────────────────────────────────────────────
const DATA_DIR = process.env.SIN_DATA_DIR || path.join(process.cwd(), 'data')
const WS_FILE = path.join(DATA_DIR, 'workspaces.json')
const SAFE_ID = /^[a-z0-9-]{1,40}$/

export function isValidWorkspaceId(id: string): boolean {
  return SAFE_ID.test(id)
}

async function readFileWorkspaces(): Promise<Workspace[]> {
  try {
    return JSON.parse(await readFile(WS_FILE, 'utf8')) as Workspace[]
  } catch {
    return []
  }
}

async function writeFileWorkspaces(list: Workspace[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${WS_FILE}.tmp-${Date.now()}`
  await writeFile(tmp, JSON.stringify(list, null, 2), 'utf8')
  await rename(tmp, WS_FILE)
}

function rowToWorkspace(r: Record<string, unknown>): Workspace {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    icon: r.icon as string,
    systemPrompt: r.system_prompt as string,
    enabledTools: (r.enabled_tools as string[]) ?? [],
    defaultModel: r.default_model as string,
    layout: r.layout as WorkspaceLayout,
    builtIn: false,
    userId: (r.user_id as string) ?? null,
  }
}

/** Built-ins + custom workspaces visible to this user */
export async function listWorkspaces(
  userId: string | null,
): Promise<Workspace[]> {
  let custom: Workspace[]
  if (isDbConfigured()) {
    const { rows } = await getPool().query(
      userId
        ? `SELECT * FROM workspaces WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at ASC`
        : `SELECT * FROM workspaces ORDER BY created_at ASC`,
      userId ? [userId] : [],
    )
    custom = rows.map(rowToWorkspace)
  } else {
    custom = await readFileWorkspaces()
  }
  return [...BUILT_IN_WORKSPACES, ...custom]
}

export async function getWorkspace(
  id: string,
  userId: string | null,
): Promise<Workspace | null> {
  const builtIn = BUILT_IN_WORKSPACES.find((w) => w.id === id)
  if (builtIn) return builtIn
  return (await listWorkspaces(userId)).find((w) => w.id === id) ?? null
}

export async function upsertCustomWorkspace(
  ws: Omit<Workspace, 'builtIn'>,
  userId: string | null,
): Promise<void> {
  if (BUILT_IN_WORKSPACES.some((b) => b.id === ws.id)) {
    throw new Error('Workspace id is reserved')
  }
  const sanitized: Workspace = {
    ...ws,
    name: ws.name.trim().slice(0, 60),
    description: ws.description.trim().slice(0, 160),
    systemPrompt: ws.systemPrompt.slice(0, 4000),
    enabledTools: ws.enabledTools.filter((t) =>
      (ALL_TOOL_KEYS as readonly string[]).includes(t),
    ),
    builtIn: false,
    userId,
  }
  if (isDbConfigured()) {
    await getPool().query(
      `INSERT INTO workspaces (id, name, description, icon, system_prompt, enabled_tools, default_model, layout, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         icon = EXCLUDED.icon,
         system_prompt = EXCLUDED.system_prompt,
         enabled_tools = EXCLUDED.enabled_tools,
         default_model = EXCLUDED.default_model,
         layout = EXCLUDED.layout`,
      [
        sanitized.id,
        sanitized.name,
        sanitized.description,
        sanitized.icon,
        sanitized.systemPrompt,
        sanitized.enabledTools,
        sanitized.defaultModel,
        sanitized.layout,
        userId,
      ],
    )
    return
  }
  const list = await readFileWorkspaces()
  const next = list.filter((w) => w.id !== sanitized.id)
  next.push(sanitized)
  await writeFileWorkspaces(next)
}

export async function deleteCustomWorkspace(
  id: string,
  userId: string | null,
): Promise<boolean> {
  if (BUILT_IN_WORKSPACES.some((b) => b.id === id)) return false
  if (isDbConfigured()) {
    const result = await getPool().query(
      userId
        ? `DELETE FROM workspaces WHERE id = $1 AND user_id = $2`
        : `DELETE FROM workspaces WHERE id = $1`,
      userId ? [id, userId] : [id],
    )
    return (result.rowCount ?? 0) > 0
  }
  const list = await readFileWorkspaces()
  const next = list.filter((w) => w.id !== id)
  if (next.length === list.length) return false
  await writeFileWorkspaces(next)
  return true
}

export function workspaceIdFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return `${base || 'workspace'}-${randomBytes(3).toString('hex')}`
}
