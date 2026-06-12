import path from "node:path"

const DATA_ROOT = path.join(process.cwd(), ".sin-webui")

export function dataPath(...segments: string[]): string {
  const resolved = path.join(DATA_ROOT, ...segments)
  if (!resolved.startsWith(DATA_ROOT)) {
    throw new Error("Path escapes data directory")
  }
  return resolved
}
