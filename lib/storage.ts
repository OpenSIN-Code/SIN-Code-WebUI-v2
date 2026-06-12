/**
 * Purpose: Storage adapter switch. With DATABASE_URL set, all persistence
 * (chats, tokens, audit) goes to Postgres; otherwise the file-based
 * stores under data/ remain active. Consumers import from here only.
 */
import { isDbConfigured } from '@/lib/db'

import * as chatFile from '@/lib/chat-history'
import * as chatPg from '@/lib/storage/chat-history-pg'
import * as tokensFile from '@/lib/tokens'
import * as tokensPg from '@/lib/storage/tokens-pg'
import * as auditFile from '@/lib/audit'
import * as auditPg from '@/lib/storage/audit-pg'

const usePg = isDbConfigured()

// Chats — re-export validation + types from the file module (storage-agnostic)
export { isValidChatId, type ChatMeta } from '@/lib/chat-history'
export const listChats = usePg ? chatPg.listChats : chatFile.listChats
export const upsertChatMeta = usePg ? chatPg.upsertChatMeta : chatFile.upsertChatMeta
export const deleteChat = usePg ? chatPg.deleteChat : chatFile.deleteChat
export const loadMessages = usePg ? chatPg.loadMessages : chatFile.loadMessages
export const saveMessages = usePg ? chatPg.saveMessages : chatFile.saveMessages
export const ownsChat = usePg ? chatPg.ownsChat : chatFile.ownsChat

// Tokens
export type { TokenRecord } from '@/lib/tokens'
export const listTokens = usePg ? tokensPg.listTokens : tokensFile.listTokens
export const createToken = usePg ? tokensPg.createToken : tokensFile.createToken
export const revokeToken = usePg ? tokensPg.revokeToken : tokensFile.revokeToken
export const verifyStoredToken = usePg
  ? tokensPg.verifyStoredToken
  : tokensFile.verifyStoredToken
export const findTokenName = usePg
  ? tokensPg.findTokenName
  : tokensFile.findTokenName

// Audit — auditToCsv is pure, always from the file module
export { auditToCsv, type AuditEntry } from '@/lib/audit'
export const audit = usePg ? auditPg.audit : auditFile.audit
export const readAudit = usePg ? auditPg.readAudit : auditFile.readAudit
