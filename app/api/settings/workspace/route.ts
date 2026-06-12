import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const FILE = path.join(process.cwd(), ".sin-webui", "workspace.json")

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

async function read(): Promise<Workspace> {
  try {
    return { ...DEFAULTS, ...JSON.parse(await fs.readFile(FILE, "utf8")) }
  } catch {
    return DEFAULTS
  }
}

export async function GET() {
  return NextResponse.json(await read())
}

export async function PUT(req: Request) {
  const body = await req.json()
  const next: Workspace = {
    name: typeof body.name === "string" ? body.name.slice(0, 64) : DEFAULTS.name,
    defaultModel:
      typeof body.defaultModel === "string" ? body.defaultModel : DEFAULTS.defaultModel,
    defaultCwd: typeof body.defaultCwd === "string" ? body.defaultCwd : "",
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8")
  return NextResponse.json(next)
}
