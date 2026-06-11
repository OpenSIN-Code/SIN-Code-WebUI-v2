import type { Metadata } from 'next'
import { ChatsList } from '@/components/chats-list'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Chats - SIN-Code WebUI v2',
}

export default function ChatsPage() {
  return (
    <PageShell title="Chats">
      <ChatsList />
    </PageShell>
  )
}
