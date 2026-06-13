// SPDX-License-Identifier: MIT

import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { guardRequest } from "@/lib/sin/guard"
import { getSession } from "@/lib/session"

let _base: string | null = null
// @turbopack-disable-next-line
function base(): string {
  if (!_base) _base = path.join(/*turbopackIgnore: true*/ process.cwd(), ".sin-webui")
  return _base
}

function mcpFile(userId: string): string {
  if (userId === "global") return path.join(base(), "mcp-connections.json")
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return path.join(base(), "users", safe, "mcp-connections.json")
}

export interface McpConnection {
  id: string
  name: string
  url: string
  transport: "http" | "sse" | "stdio"
  enabled: boolean
}

async function read(userId: string): Promise<McpConnection[]> {
  const file = mcpFile(userId)
  try {
    return JSON.parse(await fs.readFile(file, "utf8"))
  } catch {
    return []
  }
}

async function write(userId: string, conns: McpConnection[]) {
  const file = mcpFile(userId)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(conns, null, 2), "utf8")
}

export async function GET(req: Request) {
  const guard = await guardRequest(req, "settings", 60)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  return NextResponse.json({ connections: await read(userId) })
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const { name, url, transport } = await req.json()
  if (!name || !url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 })
  }
  const conns = await read(userId)
  const conn: McpConnection = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 64),
    url: String(url),
    transport: ["http", "sse", "stdio"].includes(transport) ? transport : "http",
    enabled: true,
  }
  conns.push(conn)
  await write(userId, conns)
  return NextResponse.json({ connection: conn })
}

export async function PATCH(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const { id, enabled } = await req.json()
  const conns = await read(userId)
  const conn = conns.find((c) => c.id === id)
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 })
  conn.enabled = Boolean(enabled)
  await write(userId, conns)
  return NextResponse.json({ connection: conn })
}

export async function DELETE(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const conns = await read(userId)
  const next = conns.filter((c) => c.id !== id)
  if (next.length === conns.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await write(userId, next)
  return NextResponse.json({ ok: true })
}
