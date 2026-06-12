/**
 * Purpose: Storage adapter switch. With DATABASE_URL set, all persistence
 * (chats, tokens, audit) goes to Postgres; otherwise the file-based
 * stores under data/ remain active. Consumers import from here only.
 *
 * NOTE: pg-heavy imports are lazy-loaded inside functions to prevent
 * Turbopack's NFT tracer from pulling native bindings into the server chunk.
 * See Issue #53.
 */
import { isDbConfigured } from '@/lib/is-db-configured'

/*turbopackIgnore: true*/ import * as chatFile from '@/lib/chat-history'
/*turbopackIgnore: true*/ import * as tokensFile from '@/lib/tokens'
/*turbopackIgnore: true*/ import * as auditFile from '@/lib/audit'

// Chats — re-export validation + types from the file module (storage-agnostic)
export { isValidChatId, type ChatMeta } from '@/lib/chat-history'

export async function listChats(userId?: string | null) {
  if (isDbConfigured()) {
    const chatPg = await import('@/lib/storage/chat-history-pg')
    return chatPg.listChats(userId)
  }
  return chatFile.listChats(userId)
}

export async function upsertChatMeta(
  meta: Parameters<typeof chatFile.upsertChatMeta>[0],
  userId?: string | null,
) {
  if (isDbConfigured()) {
    const chatPg = await import('@/lib/storage/chat-history-pg')
    return chatPg.upsertChatMeta(meta, userId)
  }
  return chatFile.upsertChatMeta(meta)
}

export async function deleteChat(id: string, userId?: string | null) {
  if (isDbConfigured()) {
    const chatPg = await import('@/lib/storage/chat-history-pg')
    return chatPg.deleteChat(id, userId)
  }
  return chatFile.deleteChat(id)
}

export async function loadMessages(id: string) {
  if (isDbConfigured()) {
    const chatPg = await import('@/lib/storage/chat-history-pg')
    return chatPg.loadMessages(id)
  }
  return chatFile.loadMessages(id)
}

export async function saveMessages(
  id: string,
  messages: Parameters<typeof chatFile.saveMessages>[1],
  userId?: string | null,
) {
  if (isDbConfigured()) {
    const chatPg = await import('@/lib/storage/chat-history-pg')
    return chatPg.saveMessages(id, messages, userId)
  }
  return chatFile.saveMessages(id, messages)
}

export async function ownsChat(id: string, userId: string | null) {
  if (isDbConfigured()) {
    const chatPg = await import('@/lib/storage/chat-history-pg')
    return chatPg.ownsChat(id, userId)
  }
  return chatFile.ownsChat(id, userId)
}

// Tokens
export type { TokenRecord } from '@/lib/tokens'

export async function listTokens() {
  if (isDbConfigured()) {
    const tokensPg = await import('@/lib/storage/tokens-pg')
    return tokensPg.listTokens()
  }
  return tokensFile.listTokens()
}

export async function createToken(...args: Parameters<typeof tokensFile.createToken>) {
  if (isDbConfigured()) {
    const tokensPg = await import('@/lib/storage/tokens-pg')
    return tokensPg.createToken(...args)
  }
  return tokensFile.createToken(...args)
}

export async function revokeToken(...args: Parameters<typeof tokensFile.revokeToken>) {
  if (isDbConfigured()) {
    const tokensPg = await import('@/lib/storage/tokens-pg')
    return tokensPg.revokeToken(...args)
  }
  return tokensFile.revokeToken(...args)
}

export async function verifyStoredToken(...args: Parameters<typeof tokensFile.verifyStoredToken>) {
  if (isDbConfigured()) {
    const tokensPg = await import('@/lib/storage/tokens-pg')
    return tokensPg.verifyStoredToken(...args)
  }
  return tokensFile.verifyStoredToken(...args)
}

export async function findTokenName(...args: Parameters<typeof tokensFile.findTokenName>) {
  if (isDbConfigured()) {
    const tokensPg = await import('@/lib/storage/tokens-pg')
    return tokensPg.findTokenName(...args)
  }
  return tokensFile.findTokenName(...args)
}

// Audit — auditToCsv is pure, always from the file module
export { auditToCsv, type AuditEntry } from '@/lib/audit'
export { readAudit } from '@/lib/audit'

export async function audit(...args: Parameters<typeof auditFile.audit>) {
  if (isDbConfigured()) {
    const auditPg = await import('@/lib/storage/audit-pg')
    return auditPg.audit(...args)
  }
  return auditFile.audit(...args)
}