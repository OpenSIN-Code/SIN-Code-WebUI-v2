/**
 * Purpose: Workspace API.
 * GET /api/workspaces — built-ins + own custom workspaces
 * POST /api/workspaces {…} — create/update a custom workspace
 * DELETE /api/workspaces { id } — delete own custom workspace
 */
import { guardRequest } from '@/lib/sin/guard'
import { getSession } from '@/lib/session'
import {
  deleteCustomWorkspace,
  isValidWorkspaceId,
  listWorkspaces,
  upsertCustomWorkspace,
  workspaceIdFromName,
  type Workspace,
  type WorkspaceLayout,
} from '@/lib/workspaces'

export async function GET(req: Request) {
  const guard = await guardRequest(req, 'workspaces', 60)
  if (guard) return guard
  const session = await getSession()
  return Response.json({
    ok: true,
    data: await listWorkspaces(session?.userId ?? null),
  })
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, 'workspaces', 20)
  if (guard) return guard
  const session = await getSession()
  const body: Partial<Workspace> = await req.json()
  if (!body.name?.trim()) {
    return Response.json({ ok: false, error: 'name required' }, { status: 400 })
  }
  const id = body.id ?? workspaceIdFromName(body.name)
  if (!isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  const layouts: WorkspaceLayout[] = ['chat', 'writing', 'data']
  try {
    await upsertCustomWorkspace(
      {
        id,
        name: body.name,
        description: body.description ?? '',
        icon: body.icon ?? 'sparkles',
        systemPrompt: body.systemPrompt ?? '',
        enabledTools: Array.isArray(body.enabledTools)
          ? body.enabledTools
          : [],
        defaultModel: body.defaultModel ?? 'anthropic/claude-sonnet-4.5',
        layout: layouts.includes(body.layout as WorkspaceLayout)
          ? (body.layout as WorkspaceLayout)
          : 'chat',
        userId: session?.userId ?? null,
      },
      session?.userId ?? null,
    )
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 400 },
    )
  }
  return Response.json({ ok: true, data: { id } })
}

export async function DELETE(req: Request) {
  const guard = await guardRequest(req, 'workspaces', 20)
  if (guard) return guard
  const session = await getSession()
  const { id }: { id?: string } = await req.json()
  if (!id || !isValidWorkspaceId(id)) {
    return Response.json({ ok: false, error: 'invalid id' }, { status: 400 })
  }
  return Response.json({ ok: await deleteCustomWorkspace(id, session?.userId ?? null) })
}
