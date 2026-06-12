import { NextResponse } from "next/server"
import {
  listFiles,
  readFileContent,
  writeFileContent,
  deleteFile,
  type Scope,
} from "@/lib/settings/store"

type Kind = "memories" | "skills"

function parseParams(url: string): { kind: Kind; scope: Scope; name: string | null } {
  const { searchParams } = new URL(url)
  const kind = searchParams.get("kind") === "skills" ? "skills" : "memories"
  const scope = searchParams.get("scope") === "team" ? "team" : "user"
  const rawName = searchParams.get("name")
  const name =
    rawName && /^[\w][\w .-]*\.md$/.test(rawName) ? rawName : null
  return { kind, scope, name }
}

export async function GET(req: Request) {
  const { kind, scope, name } = parseParams(req.url)
  if (name) {
    const content = await readFileContent(kind, scope, name)
    if (content === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ name, content })
  }
  return NextResponse.json({ files: await listFiles(kind, scope) })
}

export async function PUT(req: Request) {
  const { kind, scope, name } = parseParams(req.url)
  if (!name) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
  }
  const { content } = await req.json()
  await writeFileContent(kind, scope, name, typeof content === "string" ? content : "")
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { kind, scope, name } = parseParams(req.url)
  if (!name) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
  }
  try {
    await deleteFile(kind, scope, name)
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
