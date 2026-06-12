import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { guardRequest } from "@/lib/sin/run"
import { getSession } from "@/lib/session"

let _base: string | null = null
// @turbopack-disable-next-line
function base(): string {
  if (!_base) _base = path.join(/*turbopackIgnore: true*/ process.cwd(), ".sin-webui")
  return _base
}

function workspaceFile(userId: string): string {
  if (userId === "global") return path.join(base(), "workspace.json")
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return path.join(base(), "users", safe, "workspace.json")
}

interface Workspace {
  name: string
  defaultModel: string
  defaultCwd: string
}

const DEFAULTS: Workspace = {
  name: "SIN-Code Workspace",
  defaultModel: "anthropic/claude-opus-4.6",
  defaultCwd: "",
}

async function read(userId: string): Promise<Workspace> {
  const file = workspaceFile(userId)
  try {
    return { ...DEFAULTS, ...JSON.parse(await fs.readFile(file, "utf8")) }
  } catch {
    return DEFAULTS
  }
}

export async function GET(req: Request) {
  const guard = await guardRequest(req, "settings", 60)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  return NextResponse.json(await read(userId))
}

export async function PUT(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const body = await req.json()
  const next: Workspace = {
    name: typeof body.name === "string" ? body.name.slice(0, 64) : DEFAULTS.name,
    defaultModel:
      typeof body.defaultModel === "string" ? body.defaultModel : DEFAULTS.defaultModel,
    defaultCwd: typeof body.defaultCwd === "string" ? body.defaultCwd : "",
  }
  const file = workspaceFile(userId)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(next, null, 2), "utf8")
  return NextResponse.json(next)
}
