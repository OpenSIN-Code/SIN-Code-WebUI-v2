import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const FILE = path.join(process.cwd(), ".sin-webui", "members.json")

interface Member {
  id: string
  email: string
  role: "owner" | "member"
  status: "active" | "invited"
  invitedAt: string
}

async function read(): Promise<Member[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"))
  } catch {
    return []
  }
}

async function write(members: Member[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(members, null, 2), "utf8")
}

export async function GET() {
  return NextResponse.json({ members: await read() })
}

export async function POST(req: Request) {
  const { email } = await req.json()
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  const members = await read()
  if (members.some((m) => m.email === email.toLowerCase())) {
    return NextResponse.json({ error: "Already invited" }, { status: 409 })
  }
  const member: Member = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    role: members.length === 0 ? "owner" : "member",
    status: "invited",
    invitedAt: new Date().toISOString(),
  }
  members.push(member)
  await write(members)
  return NextResponse.json({ member })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const members = await read()
  const next = members.filter((m) => m.id !== id || m.role === "owner")
  if (next.length === members.length) {
    return NextResponse.json({ error: "Not found or owner" }, { status: 404 })
  }
  await write(next)
  return NextResponse.json({ ok: true })
}
