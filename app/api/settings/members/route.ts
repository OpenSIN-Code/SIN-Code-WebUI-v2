/**
 * Purpose: Member management backed by the Better Auth "user" table.
 * GET lists all users (admin only), PATCH changes a role, DELETE removes
 * a user. Invitations happen via the public /register page.
 */
import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { isBetterAuthEnabled } from "@/lib/auth/better-auth"
import { guardRequest } from "@/lib/sin/run"
import { getSession } from "@/lib/session"

async function requireAdmin(req: Request): Promise<Response | null> {
  const guard = await guardRequest(req, "members", 30)
  if (guard) return guard
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  if (!isBetterAuthEnabled()) {
    return NextResponse.json({ members: [], multiUser: false })
  }
  const { rows } = await getPool().query(
    `SELECT "id", "name", "email", "role", "createdAt"
     FROM "user" ORDER BY "createdAt" ASC LIMIT 500`,
  )
  return NextResponse.json({
    multiUser: true,
    members: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      createdAt: r.createdAt,
    })),
  })
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const { id, role } = (await req.json()) as { id?: string; role?: string }
  if (!id || (role !== "owner" && role !== "member")) {
    return NextResponse.json({ error: "id and role (owner|member) required" }, { status: 400 })
  }
  if (role === "member") {
    const { rows } = await getPool().query(
      `SELECT COUNT(*)::int AS owners FROM "user" WHERE "role" = 'owner' AND "id" <> $1`,
      [id],
    )
    if (rows[0].owners === 0) {
      return NextResponse.json({ error: "Cannot demote the last owner" }, { status: 409 })
    }
  }
  await getPool().query(`UPDATE "user" SET "role" = $2, "updatedAt" = NOW() WHERE "id" = $1`, [id, role])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const session = await getSession()
  if (session?.userId === id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 409 })
  }
  const { rows } = await getPool().query(
    `SELECT COUNT(*)::int AS owners FROM "user" WHERE "role" = 'owner' AND "id" <> $1`,
    [id],
  )
  const { rows: target } = await getPool().query(`SELECT "role" FROM "user" WHERE "id" = $1`, [id])
  if (target[0]?.role === "owner" && rows[0].owners === 0) {
    return NextResponse.json({ error: "Cannot delete the last owner" }, { status: 409 })
  }
  await getPool().query(`DELETE FROM "user" WHERE "id" = $1`, [id])
  return NextResponse.json({ ok: true })
}
