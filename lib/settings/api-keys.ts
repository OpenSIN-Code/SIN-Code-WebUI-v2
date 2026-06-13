// SPDX-License-Identifier: MIT

import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

let _base: string | null = null
function base(): string {
  if (!_base) _base = path.join(/*turbopackIgnore: true*/ process.cwd(), ".sin-webui")
  return _base
}

function scopedDir(userId: string): string {
  if (userId === "global") return base()
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return path.join(base(), "users", safe)
}

function keysFile(userId: string): string {
  return path.join(scopedDir(userId), "api-keys.json")
}

export interface ApiKeyRecord {
  id: string
  name: string
  prefix: string
  hash: string
  createdAt: string
  lastUsedAt: string | null
}

async function readKeys(userId: string): Promise<ApiKeyRecord[]> {
  try {
    return JSON.parse(await fs.readFile(keysFile(userId), "utf8"))
  } catch {
    return []
  }
}

async function writeKeys(userId: string, keys: ApiKeyRecord[]): Promise<void> {
  const dir = scopedDir(userId)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(keysFile(userId), JSON.stringify(keys, null, 2), "utf8")
}

export async function listApiKeys(userId: string = "global"): Promise<Omit<ApiKeyRecord, "hash">[]> {
  return (await readKeys(userId)).map(({ hash: _hash, ...rest }) => rest)
}

export async function createApiKey(userId: string = "global", name: string) {
  const raw = `sin_${crypto.randomBytes(24).toString("hex")}`
  const record: ApiKeyRecord = {
    id: crypto.randomUUID(),
    name: name.slice(0, 64),
    prefix: raw.slice(0, 10),
    hash: crypto.createHash("sha256").update(raw).digest("hex"),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }
  const keys = await readKeys(userId)
  keys.push(record)
  await writeKeys(userId, keys)
  return { plaintext: raw, record: { ...record, hash: undefined } }
}

export async function revokeApiKey(userId: string = "global", id: string): Promise<boolean> {
  const keys = await readKeys(userId)
  const next = keys.filter((k) => k.id !== id)
  if (next.length === keys.length) return false
  await writeKeys(userId, next)
  return true
}

export async function verifyApiKey(raw: string): Promise<boolean> {
  const hash = crypto.createHash("sha256").update(raw).digest("hex")
  // Try global first, then all user dirs
  const keys = await readKeys("global")
  const match = keys.find((k) => k.hash === hash)
  if (!match) return false
  match.lastUsedAt = new Date().toISOString()
  await writeKeys("global", keys)
  return true
}
