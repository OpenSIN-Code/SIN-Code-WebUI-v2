import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const ROOT = process.env.SIN_WORKSPACE_DIR ?? process.cwd()

function safeResolve(rel: string): string {
  const resolved = path.resolve(ROOT, "." + path.sep + rel)
  if (!resolved.startsWith(ROOT)) throw new Error("Invalid path")
  return resolved
}

export async function POST(req: Request) {
  const { loc, oldClasses, newClasses } = await req.json()

  if (typeof oldClasses !== "string" || typeof newClasses !== "string") {
    return NextResponse.json({ error: "oldClasses and newClasses required" }, { status: 400 })
  }
  if (typeof loc !== "string" || !loc.includes(":")) {
    return NextResponse.json(
      { error: "loc required (file:line). Add data-sin-loc attributes to your dev build." },
      { status: 400 },
    )
  }

  const [file, lineStr] = loc.split(":")
  const lineNo = parseInt(lineStr, 10)

  let abs: string
  try {
    abs = safeResolve(file)
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  let content: string
  try {
    content = await fs.readFile(abs, "utf8")
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const lines = content.split("\n")
  const from = Math.max(0, lineNo - 3)
  const to = Math.min(lines.length, lineNo + 5)
  let patched = false

  for (let i = from; i < to; i++) {
    if (lines[i].includes(oldClasses)) {
      lines[i] = lines[i].replace(oldClasses, newClasses)
      patched = true
      break
    }
  }

  if (!patched) {
    return NextResponse.json(
      { error: "Could not locate the class string near the reported line." },
      { status: 409 },
    )
  }

  await fs.writeFile(abs, lines.join("\n"), "utf8")
  return NextResponse.json({ ok: true, file, line: lineNo })
}
