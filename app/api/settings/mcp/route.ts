import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const FILE = path.join(process.cwd(), ".sin-webui", "mcp-connections.json")

export interface McpConnection {
  id: string
  name: string
  url: string
  transport: "http" | "sse" | "stdio"
  enabled: boolean
}

async function read(): Promise<McpConnection[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"))
  } catch {
    return []
  }
}

async function write(conns: McpConnection[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(conns, null, 2), "utf8")
}

export async function GET() {
  return NextResponse.json({ connections: await read() })
}

export async function POST(req: Request) {
  const { name, url, transport } = await req.json()
  if (!name || !url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 })
  }
  const conns = await read()
  const conn: McpConnection = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 64),
    url: String(url),
    transport: ["http", "sse", "stdio"].includes(transport) ? transport : "http",
    enabled: true,
  }
  conns.push(conn)
  await write(conns)
  return NextResponse.json({ connection: conn })
}

export async function PATCH(req: Request) {
  const { id, enabled } = await req.json()
  const conns = await read()
  const conn = conns.find((c) => c.id === id)
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 })
  conn.enabled = Boolean(enabled)
  await write(conns)
  return NextResponse.json({ connection: conn })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const conns = await read()
  const next = conns.filter((c) => c.id !== id)
  if (next.length === conns.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await write(next)
  return NextResponse.json({ ok: true })
}
