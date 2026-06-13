// SPDX-License-Identifier: MIT

import { promises as fs } from "fs"
import path from "path"

let _base: string | null = null
function base(): string {
  if (!_base) _base = path.join(/*turbopackIgnore: true*/ process.cwd(), ".sin-webui")
  return _base
}

/** Per-user settings directory. 'global' keeps the legacy single-user path. */
function scopedDir(userId: string): string {
  if (userId === "global") return base()
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return path.join(base(), "users", safe)
}

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

export function safeResolve(userId: string, ...segments: string[]): string {
  const dir = scopedDir(userId)
  const resolved = path.resolve(dir, ...segments)
  if (!resolved.startsWith(dir + path.sep) && resolved !== dir) {
    throw new Error("Invalid path")
  }
  return resolved
}

export async function readPreferences(userId: string = "global"): Promise<Preferences> {
  try {
    const raw = await fs.readFile(safeResolve(userId, "preferences.json"), "utf8")
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export async function writePreferences(userId: string = "global", prefs: Preferences): Promise<void> {
  const dir = scopedDir(userId)
  await ensureDir(dir)
  await fs.writeFile(
    safeResolve(userId, "preferences.json"),
    JSON.stringify(prefs, null, 2),
    "utf8",
  )
}

export async function listFiles(userId: string = "global", kind: "memories" | "skills", scope: Scope) {
  const dir = safeResolve(userId, kind, scope)
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
  userId: string = "global",
  kind: "memories" | "skills",
  scope: Scope,
  name: string,
): Promise<string | null> {
  try {
    return await fs.readFile(safeResolve(userId, kind, scope, name), "utf8")
  } catch {
    return null
  }
}

export async function writeFileContent(
  userId: string = "global",
  kind: "memories" | "skills",
  scope: Scope,
  name: string,
  content: string,
): Promise<void> {
  const file = safeResolve(userId, kind, scope, name)
  await ensureDir(path.dirname(file))
  await fs.writeFile(file, content, "utf8")
}

export async function deleteFile(
  userId: string = "global",
  kind: "memories" | "skills",
  scope: Scope,
  name: string,
): Promise<void> {
  await fs.unlink(safeResolve(userId, kind, scope, name))
}
