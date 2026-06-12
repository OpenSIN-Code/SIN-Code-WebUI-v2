import { NextResponse } from "next/server"
import { listApiKeys, createApiKey, revokeApiKey } from "@/lib/settings/api-keys"

export async function GET() {
  return NextResponse.json({ keys: await listApiKeys() })
}

export async function POST(req: Request) {
  const { name } = await req.json()
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 })
  }
  const { plaintext, record } = await createApiKey(name.trim())
  return NextResponse.json({ plaintext, key: record })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const ok = await revokeApiKey(id)
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 })
}
