import { AppSidebar } from '@/components/app-sidebar'
import { ChatHeader } from '@/components/chat-header'
import { ChatView } from '@/components/chat-view'

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { id } = await params
  const { q } = await searchParams
  const title = id
    .split('-')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')

  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader title={title} chatId={id} />
        <ChatView prompt={id === 'repo-review' ? undefined : q} />
      </main>
    </div>
  )
}
