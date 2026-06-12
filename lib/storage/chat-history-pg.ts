/**
 * Purpose: Postgres implementation of the chat history store.
 * Same exported signatures as the file-based lib/chat-history.ts.
 */
import type { UIMessage } from 'ai'
import { getPool } from '@/lib/db'
import type { ChatMeta } from '@/lib/chat-history'

export async function listChats(userId?: string | null): Promise<ChatMeta[]> {
  const { rows } = await getPool().query(
    userId
      ? `SELECT id, label, favorite, workspace_id, created_at, updated_at
         FROM chats WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 500`
      : `SELECT id, label, favorite, workspace_id, created_at, updated_at
         FROM chats ORDER BY updated_at DESC LIMIT 500`,
    userId ? [userId] : [],
  )
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    favorite: r.favorite,
    workspaceId: r.workspace_id,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }))
}

export async function upsertChatMeta(
  meta: Pick<ChatMeta, 'id' | 'label'> & Partial<ChatMeta>,
  userId?: string | null,
): Promise<void> {
  await getPool().query(
    `INSERT INTO chats (id, label, favorite, workspace_id, user_id)
     VALUES ($1, $2, COALESCE($3, FALSE), $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       label = EXCLUDED.label,
       favorite = COALESCE($3, chats.favorite),
       workspace_id = COALESCE($4, chats.workspace_id),
       updated_at = NOW()`,
    [meta.id, meta.label, meta.favorite ?? null, meta.workspaceId ?? null, userId ?? null],
  )
}

export async function deleteChat(id: string, userId?: string | null): Promise<void> {
  await getPool().query(
    userId
      ? `DELETE FROM chats WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`
      : `DELETE FROM chats WHERE id = $1`,
    userId ? [id, userId] : [id],
  )
}

export async function loadMessages(id: string): Promise<UIMessage[]> {
  const { rows } = await getPool().query(
    `SELECT messages FROM chat_messages WHERE chat_id = $1`,
    [id],
  )
  return rows[0]?.messages ?? []
}

export async function saveMessages(
  id: string,
  messages: UIMessage[],
  userId?: string | null,
): Promise<void> {
  const pool = getPool()
  // Ensure the parent chat row exists (FK), then upsert messages.
  await pool.query(
    `INSERT INTO chats (id, label, user_id) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
    [id, id, userId ?? null],
  )
  await pool.query(
    `INSERT INTO chat_messages (chat_id, messages)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (chat_id) DO UPDATE SET
       messages = EXCLUDED.messages, updated_at = NOW()`,
    [id, JSON.stringify(messages)],
  )
}

/** Ownership check: may this user touch this chat? */
export async function ownsChat(
  id: string,
  userId: string | null,
): Promise<boolean> {
  if (userId === null) return true // root/admin
  const { rows } = await getPool().query(
    `SELECT 1 FROM chats WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [id, userId],
  )
  return rows.length > 0
}
