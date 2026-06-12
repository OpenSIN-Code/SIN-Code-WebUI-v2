import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

let _root: string | null = null
// @turbopack-disable-next-line
function root(): string {
  if (!_root) _root = process.env.SIN_WORKSPACE_DIR ?? (/*turbopackIgnore: true*/ process.cwd())
  return _root
}

const IGNORE = new Set(["node_modules", ".git", ".next", ".sin-webui", "dist"])
const MAX_FILE_SIZE = 512 * 1024

interface TreeNode {
  name: string
  path: string
  type: "file" | "dir"
  children?: TreeNode[]
}

function safeResolve(rel: string): string {
  const resolved = /*turbopackIgnore: true*/ path.resolve(root(), "." + path.sep + rel)
  if (!resolved.startsWith(root())) throw new Error("Invalid path")
  return resolved
}

async function buildTree(dir: string, relBase = ""): Promise<TreeNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nodes: TreeNode[] = []
  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: "dir",
        children: await buildTree(/*turbopackIgnore: true*/ path.join(dir, entry.name), relPath),
      })
    } else {
      nodes.push({ name: entry.name, path: relPath, type: "file" })
    }
  }
  return nodes.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1,
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filePath = searchParams.get("path")

  if (filePath) {
    try {
      const abs = safeResolve(filePath)
      const stat = await fs.stat(abs)
      if (stat.size > MAX_FILE_SIZE) {
        return NextResponse.json({ content: "// File too large to display" })
      }
      const content = await fs.readFile(abs, "utf8")
      return NextResponse.json({ content })
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }

  return NextResponse.json({ nodes: await buildTree(root()) })
}
