/**
 * Purpose: User management API (admin only, requires Postgres).
 * GET    /api/users                  — list users
 * POST   /api/users { name, role? }  — create user + first token (shown once)
 * DELETE /api/users { id }           — delete user (cascades tokens + chats)
 */
import { getPool } from '@/lib/db'
import { clientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getSession } from '@/lib/session'
import { createToken } from '@/lib/storage'
import { createUser, deleteUser, isMultiUserEnabled, listUsers } from '@/lib/users'

async function assertAdmin(req: Request): Promise<Response | null> {
  const limit = rateLimit(`${clientIp(req)}:users`, 10, 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)
  if (!isMultiUserEnabled()) {
    return Response.json(
      { ok: false, error: 'Multi-user requires DATABASE_URL' },
      { status: 503 },
    )
  }
  const session = await getSession()
  if (!session?.isAdmin) {
    return Response.json(
      { ok: false, error: 'Admin access required' },
      { status: 403 },
    )
  }
  return null
}

export async function GET(req: Request) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  return Response.json({ ok: true, data: await listUsers() })
}

export async function POST(req: Request) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { name, role }: { name?: string; role?: 'admin' | 'member' } =
    await req.json()
  if (!name?.trim()) {
    return Response.json({ ok: false, error: 'name required' }, { status: 400 })
  }

  const user = await createUser(name, role === 'admin' ? 'admin' : 'member')
  // First login token for the new user, bound via user_id.
  const created = await createToken(`${user.name} (initial)`)
  await getPool().query(
    `UPDATE access_tokens SET user_id = $1 WHERE id = $2`,
    [user.id, created.id],
  )
  return Response.json({ ok: true, data: { user, token: created.token } })
}

export async function DELETE(req: Request) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id }: { id?: string } = await req.json()
  if (!id) {
    return Response.json({ ok: false, error: 'id required' }, { status: 400 })
  }
  return Response.json({ ok: await deleteUser(id) })
}
