import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), ".sin-webui")

export type Scope = "user" | "team"

export interface Preferences {
  suggestions: boolean
  soundNotifications: boolean
  chatPosition: "left" | "right"
  customInstructions: string
  theme: "system" | "light" | "dark"
  language: string
}

export const DEFAULT_PREFERENCES: Preferences = {
  suggestions: true,
  soundNotifications: true,
  chatPosition: "left",
  customInstructions: "",
  theme: "system",
  language: "en",
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export function safeResolve(...segments: string[]): string {
  const resolved = path.resolve(DATA_DIR, ...segments)
  if (!resolved.startsWith(DATA_DIR + path.sep) && resolved !== DATA_DIR) {
    throw new Error("Invalid path")
  }
  return resolved
}

export async function readPreferences(): Promise<Preferences> {
  try {
    const raw = await fs.readFile(safeResolve("preferences.json"), "utf8")
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export async function writePreferences(prefs: Preferences): Promise<void> {
  await ensureDir(DATA_DIR)
  await fs.writeFile(
    safeResolve("preferences.json"),
    JSON.stringify(prefs, null, 2),
    "utf8",
  )
}

export async function listFiles(kind: "memories" | "skills", scope: Scope) {
  const dir = safeResolve(kind, scope)
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
}

export async function readFileContent(
  kind: "memories" | "skills",
  scope: Scope,
  name: string,
): Promise<string | null> {
  try {
    return await fs.readFile(safeResolve(kind, scope, name), "utf8")
  } catch {
    return null
  }
}

export async function writeFileContent(
  kind: "memories" | "skills",
  scope: Scope,
  name: string,
  content: string,
): Promise<void> {
  const file = safeResolve(kind, scope, name)
  await ensureDir(path.dirname(file))
  await fs.writeFile(file, content, "utf8")
}

export async function deleteFile(
  kind: "memories" | "skills",
  scope: Scope,
  name: string,
): Promise<void> {
  await fs.unlink(safeResolve(kind, scope, name))
}
