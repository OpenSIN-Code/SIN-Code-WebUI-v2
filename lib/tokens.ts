/**
 * Purpose: Multi-token store for the self-hosted UI.
 * - Tokens are stored as SHA-256 hashes only (data/tokens.json).
 * - The plaintext is shown exactly once at creation time.
 * - The env SIN_UI_TOKEN keeps working as the irrevocable root token,
 *   so you can always bootstrap/recover token management.
 */
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

let _dataDir: string | null = null
function dataDir(): string {
  if (!_dataDir) _dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), '.sin-webui')
  return _dataDir
}

let _tokensFile: string | null = null
function tokensFile(): string {
  if (!_tokensFile) _tokensFile = path.join(dataDir(), 'tokens.json')
  return _tokensFile
}

export type TokenRecord = {
  id: string
  name: string
  hash: string
  createdAt: string
  lastUsedAt: string | null
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

async function readTokens(): Promise<TokenRecord[]> {
  try {
    return JSON.parse(await readFile(tokensFile(), 'utf8')) as TokenRecord[]
  } catch {
    return []
  }
}

async function writeTokens(tokens: TokenRecord[]): Promise<void> {
  await mkdir(dataDir(), { recursive: true })
  const tmp = `${tokensFile()}.tmp-${Date.now()}`
  await writeFile(tmp, JSON.stringify(tokens, null, 2), 'utf8')
  await rename(tmp, tokensFile())
}

export async function listTokens(): Promise<Omit<TokenRecord, 'hash'>[]> {
  return (await readTokens()).map(({ hash: _hash, ...rest }) => rest)
}

export async function createToken(
  name: string,
): Promise<{ id: string; token: string }> {
  const token = `sin_${randomBytes(24).toString('hex')}`
  const record: TokenRecord = {
    id: randomBytes(6).toString('hex'),
    name: name.trim().slice(0, 60),
    hash: hashToken(token),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }
  const tokens = await readTokens()
  await writeTokens([record, ...tokens])
  return { id: record.id, token }
}

export async function revokeToken(id: string): Promise<boolean> {
  const tokens = await readTokens()
  const next = tokens.filter((t) => t.id !== id)
  if (next.length === tokens.length) return false
  await writeTokens(next)
  return true
}

export async function verifyStoredToken(token: string): Promise<boolean> {
  const hash = hashToken(token)
  const tokens = await readTokens()
  const match = tokens.find((t) => t.hash === hash)
  if (!match) return false

  const now = Date.now()
  const last = match.lastUsedAt ? new Date(match.lastUsedAt).getTime() : 0
  if (now - last > 60_000) {
    match.lastUsedAt = new Date(now).toISOString()
    await writeTokens(tokens)
  }
  return true
}

export async function findTokenName(token: string): Promise<string | null> {
  const hash = hashToken(token)
  const tokens = await readTokens()
  return tokens.find((t) => t.hash === hash)?.name ?? null
}
