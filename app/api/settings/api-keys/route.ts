import { NextResponse } from "next/server"
import { listApiKeys, createApiKey, revokeApiKey } from "@/lib/settings/api-keys"
import { guardRequest } from "@/lib/sin/guard"
import { getSession } from "@/lib/session"

export async function GET(req: Request) {
  const guard = await guardRequest(req, "settings", 60)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  return NextResponse.json({ keys: await listApiKeys(userId) })
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const { name } = await req.json()
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 })
  }
  const { plaintext, record } = await createApiKey(userId, name.trim())
  return NextResponse.json({ plaintext, key: record })
}

export async function DELETE(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const ok = await revokeApiKey(userId, id)
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 })
}
