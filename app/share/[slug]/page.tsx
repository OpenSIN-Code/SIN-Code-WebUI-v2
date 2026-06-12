/**
 * Purpose: Public read-only view of a shared chat. No auth required —
 * access control is the unguessable slug. Renders messages statically.
 */
import type { UIMessage } from 'ai'
import { notFound } from 'next/navigation'
import { Starburst } from '@/components/icons'
import { getShareBySlug } from '@/lib/shares'
import { listChats, loadMessages } from '@/lib/storage'

export const metadata = { title: 'Shared chat — SIN-Code' }

type AnyPart = {
  type: string
  text?: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

function ToolBlock({ part }: { part: AnyPart }) {
  const toolName = part.type.replace(/^tool-/, '')
  const failed = part.state === 'output-error'
  return (
    <details className="overflow-hidden rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-3 py-2 font-mono text-[11.5px] text-muted-foreground">
        {toolName}
        {failed ? ' — error' : ''}
      </summary>
      <div className="border-t border-border/50 p-3">
        {part.input != null && (
          <pre className="mb-2 max-h-40 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        )}
        <pre className="max-h-60 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {failed
            ? (part.errorText ?? 'Tool error')
            : JSON.stringify(part.output, null, 2)}
        </pre>
      </div>
    </details>
  )
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const share = await getShareBySlug(slug)
  if (!share) notFound()

  const [chats, messages] = await Promise.all([
    listChats(null),
    loadMessages(share.chatId),
  ])
  const meta = chats.find((c) => c.id === share.chatId)

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4">
          <Starburst className="size-5 text-brand" />
          <span className="truncate text-[13.5px] font-medium text-foreground">
            {meta?.label ?? 'Shared chat'}
          </span>
          <span className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
            Read-only
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        {(messages as UIMessage[]).map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            }
          >
            <div
              className={
                message.role === 'user'
                  ? 'max-w-[80%] rounded-2xl bg-accent px-4 py-2.5 text-[13.5px] leading-relaxed text-foreground'
                  : 'flex w-full flex-col gap-3'
              }
            >
              {(message.parts as AnyPart[]).map((part, i) =>
                part.type === 'text' && part.text?.trim() ? (
                  <p
                    // biome-ignore lint/suspicious/noArrayIndexKey: static render
                    key={i}
                    className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground"
                  >
                    {part.text}
                  </p>
                ) : part.type.startsWith('tool-') ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static render
                  <ToolBlock key={i} part={part} />
                ) : null,
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-[13px] text-muted-foreground">
            This chat is empty.
          </p>
        )}
      </div>
    </main>
  )
}
