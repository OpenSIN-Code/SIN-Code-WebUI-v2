import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { pushEntry } from "@/lib/workspace/design-history"

let _root: string | null = null
// @turbopack-disable-next-line
function root(): string {
  if (!_root) _root = /*turbopackIgnore: true*/ (process.env.SIN_WORKSPACE_DIR ?? process.cwd())
  return _root
}

function safeResolve(rel: string): string {
  const resolved = /*turbopackIgnore: true*/ path.resolve(root(), "." + path.sep + rel)
  if (!resolved.startsWith(root())) throw new Error("Invalid path")
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
    content = await /*turbopackIgnore: true*/ fs.readFile(abs, "utf8")
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

  await /*turbopackIgnore: true*/ fs.writeFile(abs, lines.join("\n"), "utf8")
  const relativeFilePath = file
  const tagName = "div" // or get from the request context
  await pushEntry({
    file: relativeFilePath,
    line: lineNo,
    oldValue: oldClasses,
    newValue: newClasses,
    description: `Changed ${tagName} class to '${newClasses.slice(0, 60)}'`,
  })
  return NextResponse.json({ ok: true, file, line: lineNo })
}
