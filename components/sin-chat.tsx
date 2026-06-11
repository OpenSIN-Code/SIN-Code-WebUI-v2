'use client'

/**
 * Purpose: Chat UI for the SIN coding assistant.
 * Talks to /api/chat (streamText + sin-code MCP tools) and renders
 * text parts as well as sin_* tool invocations with live state badges.
 */

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Loader2, Square, Wrench } from 'lucide-react'
import { useRef, useState } from 'react'

type ToolPartLike = {
  type: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

function ToolCallCard({ part }: { part: ToolPartLike }) {
  const toolName = part.type.replace(/^tool-/, '')
  const running =
    part.state === 'input-streaming' || part.state === 'input-available'
  const failed = part.state === 'output-error'

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[12px]">
      {running ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <Wrench className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className="font-mono text-foreground">{toolName}</span>
      <span
        className={
          failed
            ? 'ml-auto font-mono text-destructive'
            : 'ml-auto font-mono text-muted-foreground'
        }
      >
        {failed ? 'error' : running ? 'running' : 'done'}
      </span>
    </div>
  )
}

export function SinChat() {
  const [input, setInput] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const busy = status === 'streaming' || status === 'submitted'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput('')
  }

  return (
    <div className="flex w-full max-w-[672px] flex-1 flex-col">
      {messages.length > 0 && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6" role="log" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-[14px] leading-relaxed text-primary-foreground'
                  : 'flex max-w-full flex-col gap-2'
              }
            >
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <p
                      key={i}
                      className={
                        message.role === 'user'
                          ? ''
                          : 'whitespace-pre-wrap text-[14px] leading-relaxed text-foreground'
                      }
                    >
                      {part.text}
                    </p>
                  )
                }
                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  return <ToolCallCard key={i} part={part as ToolPartLike} />
                }
                return null
              })}
            </div>
          ))}
          {status === 'submitted' && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Thinking…
            </div>
          )}
          {status === 'error' && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              <span className="flex-1 leading-relaxed">
                {error?.message || 'Something went wrong while generating a response.'}
              </span>
              <button
                type="button"
                onClick={() => regenerate()}
                className="shrink-0 rounded-md border border-destructive/30 px-2 py-0.5 font-mono text-[11px] hover:bg-destructive/10"
              >
                retry
              </button>
            </div>
          )}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="sticky bottom-6 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
      >
        <label htmlFor="sin-chat-input" className="sr-only">
          Message the SIN assistant
        </label>
        <textarea
          id="sin-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
          placeholder="Ask SIN about your codebase…"
          rows={2}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            aria-label="Stop generating"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <Square className="size-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        )}
      </form>
    </div>
  )
}
