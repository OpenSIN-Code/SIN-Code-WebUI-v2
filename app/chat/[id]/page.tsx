import { AppSidebar } from '@/components/app-sidebar'
import { ChatViewWrapper } from '@/components/chat/chat-view-wrapper'

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
        <ChatViewWrapper chatId={id} prompt={q} initialModel={m} />
      </main>
    </div>
  )
}
