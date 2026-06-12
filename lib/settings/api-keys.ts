import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const DATA_DIR = path.join(process.cwd(), ".sin-webui")
const KEYS_FILE = path.join(DATA_DIR, "api-keys.json")

export interface ApiKeyRecord {
  id: string
  name: string
  prefix: string
  hash: string
  createdAt: string
  lastUsedAt: string | null
}

async function readKeys(): Promise<ApiKeyRecord[]> {
  try {
    return JSON.parse(await fs.readFile(KEYS_FILE, "utf8"))
  } catch {
    return []
  }
}

async function writeKeys(keys: ApiKeyRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2), "utf8")
}

export async function listApiKeys(): Promise<Omit<ApiKeyRecord, "hash">[]> {
  return (await readKeys()).map(({ hash: _hash, ...rest }) => rest)
}

export async function createApiKey(name: string) {
  const raw = `sin_${crypto.randomBytes(24).toString("hex")}`
  const record: ApiKeyRecord = {
    id: crypto.randomUUID(),
    name: name.slice(0, 64),
    prefix: raw.slice(0, 10),
    hash: crypto.createHash("sha256").update(raw).digest("hex"),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }
  const keys = await readKeys()
  keys.push(record)
  await writeKeys(keys)
  return { plaintext: raw, record: { ...record, hash: undefined } }
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const keys = await readKeys()
  const next = keys.filter((k) => k.id !== id)
  if (next.length === keys.length) return false
  await writeKeys(next)
  return true
}

export async function verifyApiKey(raw: string): Promise<boolean> {
  const hash = crypto.createHash("sha256").update(raw).digest("hex")
  const keys = await readKeys()
  const match = keys.find((k) => k.hash === hash)
  if (!match) return false
  match.lastUsedAt = new Date().toISOString()
  await writeKeys(keys)
  return true
}
