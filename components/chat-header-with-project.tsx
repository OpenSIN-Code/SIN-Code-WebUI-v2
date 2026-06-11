/**
 * Purpose: Client wrapper for <ChatHeader> that resolves the active project
 * for the current chat from the project store. Server components can't
 * consume client stores, so this thin bridge lives between
 * app/chat/[id]/page.tsx (server) and ChatHeader (client).
 * Related issues: #30
 */
'use client'

import { ChatHeader } from '@/components/chat-header'
import { useProjectStore } from '@/components/project-store'

export function ChatHeaderWithProject({
  chatId,
  title,
}: {
  chatId: string
  title: string
}) {
  const { projects } = useProjectStore()
  const activeProject =
    projects.find((p) => p.chatIds.includes(chatId)) ?? null

  return (
    <ChatHeader
      title={title}
      chatId={chatId}
      activeProject={activeProject ? { id: activeProject.id, name: activeProject.name } : null}
    />
  )
}
