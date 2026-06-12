import { AppSidebar } from '@/components/app-sidebar'
import { ChatView } from '@/components/chat-view'

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; m?: string }>
}) {
  const { id } = await params
  const { q, m } = await searchParams

  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex min-h-0 flex-1 flex-col">
        <ChatView chatId={id} prompt={q} initialModel={m} />
      </main>
    </div>
  )
}
