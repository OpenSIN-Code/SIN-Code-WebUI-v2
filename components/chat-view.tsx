'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Mic,
  SquareTerminal,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AgentPicker } from '@/components/agent-picker'
import { DashedSpinner, Starburst } from '@/components/icons'
import { ToolCallCard, type ToolPartLike } from '@/components/tool-call-card'
import { ChartMessage } from '@/components/chart-message'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type SinAgentId } from '@/lib/sin/agents'
import { SIN_MODELS, type SinModelId } from '@/lib/sin/models'

/* ────────────────────────── helpers ────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={handleCopy}
      className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            key={i}
            className="rounded-[3px] bg-muted px-[4px] py-[1px] font-mono text-[0.78em] text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function Markdown({ content }: { content: string }) {
  const segments = content.split(/(```[\s\S]*?(?:```|$))/g)
  return (
    <div className="flex flex-col gap-3">
      {segments.map((seg, i) => {
        if (seg.startsWith('```')) {
          const body = seg.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
          const lang = seg.match(/^```([^\n]*)/)?.[1]?.trim() || 'code'
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <SquareTerminal className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{lang}</span>
                </div>
                <CopyButton text={body} />
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.6]">
                <code>{body}</code>
              </pre>
            </div>
          )
        }
        if (!seg.trim()) return null
        return seg
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .map((para, j) => (
            <p
              key={`${i}-${j}`}
              className="text-pretty text-[14px] leading-relaxed text-foreground"
            >
              <InlineText text={para.trim()} />
            </p>
          ))
      })}
    </div>
  )
}

function getMessageText(message: UIMessage): string {
  return (
    message.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('') || ''
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <DashedSpinner className="size-4 animate-[spin_2s_linear_infinite] text-muted-foreground" />
      <span className="animate-text-shimmer text-[13px]">Thinking</span>
    </div>
  )
}

/* ────────────────────────── main view ────────────────────────── */

export function ChatView({
  chatId,
  prompt,
  initialModel,
}: {
  chatId: string
  prompt?: string
  initialModel?: string
}) {
  const [model, setModel] = useState<SinModelId>(
    (SIN_MODELS.some((m) => m.id === initialModel)
      ? (initialModel as SinModelId)
      : 'sin-code-pro'),
  )
  const [agent, setAgent] = useState<SinAgentId>('auto')

  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/chats/${chatId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setInitialMessages(Array.isArray(json.data) ? json.data : [])
      })
      .catch(() => {
        if (!cancelled) setInitialMessages([])
      })
    return () => {
      cancelled = true
    }
  }, [chatId])

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages ?? [],
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model, agent },
    }),
  })

  useEffect(() => {
    if (status !== 'ready' || messages.length === 0) return
    fetch(`/api/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    }).catch(() => {})
  }, [status, messages, chatId])

  const sentInitial = useRef(false)
  useEffect(() => {
    if (prompt && !sentInitial.current && messages.length === 0 && initialMessages !== null) {
      sentInitial.current = true
      sendMessage({ text: prompt })
    }
  }, [prompt, messages.length, sendMessage, initialMessages])

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const isThinking = status === 'submitted'

  if (initialMessages === null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <ThinkingIndicator />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[672px] flex-col gap-5 px-4 py-6">
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[18px] bg-secondary px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
                    {getMessageText(message)}
                  </div>
                </div>
              )
            }
            return (
              <div key={message.id} className="flex flex-col gap-3">
                {message.parts?.map((part, i) => {
  if (part.type === 'text') {
    return (
      <Markdown key={i} content={part.text} />
    )
  }
  if (part.type === 'tool-render_chart' && part.state === 'output-available') {
    return <ChartMessage key={i} spec={part.output as never} />
  }
  if (part.type === 'tool-web_search' && part.state === 'output-available') {
    const out = part.output as { summary?: string; sources?: string[]; error?: string }
    return (
      <div
        key={i}
        className="rounded-lg border border-border bg-card p-3"
      >
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {out.error ?? out.summary}
        </p>
        {out.sources && out.sources.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {out.sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-[11px] text-brand hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  if (
    part.type.startsWith('tool-') ||
    part.type === 'dynamic-tool'
  ) {
                    return (
                      <ToolCallCard key={i} part={part as ToolPartLike} />
                    )
                  }
                  return null
                })}
              </div>
            )
          })}

          {isThinking && <ThinkingIndicator />}

          {messages.length === 0 && !prompt && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Starburst className="size-8 text-brand" />
              <p className="text-[14px] text-muted-foreground">
                Start a conversation with the SIN-Code backend.
              </p>
            </div>
          )}
        </div>
      </div>

      <FollowUpBar
        disabled={status === 'streaming' || status === 'submitted'}
        model={model}
        onModelChange={setModel}
        agent={agent}
        onAgentChange={setAgent}
        onSend={(text) => sendMessage({ text })}
      />
    </div>
  )
}

/* ────────────────────────── follow-up bar ────────────────────────── */

function FollowUpBar({
  onSend,
  disabled,
  model,
  onModelChange,
  agent,
  onAgentChange,
}: {
  onSend: (text: string) => void
  disabled?: boolean
  model: SinModelId
  onModelChange: (m: SinModelId) => void
  agent: SinAgentId
  onAgentChange: (a: SinAgentId) => void
}) {
  const [value, setValue] = useState('')

  const hasText = value.trim().length > 0

  function handleSubmit() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <div className="shrink-0 px-4 pb-4">
      <div className="mx-auto flex w-full max-w-[672px] items-center gap-1 rounded-[14px] border border-border bg-card px-1.5 py-1.5 shadow-[0_2px_8px_0_oklch(0_0_0/10%)]">
        <button
          type="button"
          aria-label="Add attachment"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="size-[18px]">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 7v6M7 10h6" />
          </svg>
        </button>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          placeholder="Ask a follow-up..."
          className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <AgentPicker agent={agent} onAgentChange={onAgentChange} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Select model"
                className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg px-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              />
            }
          >
            <Starburst className="size-4 text-brand" />
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-60">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Model
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {SIN_MODELS.map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => onModelChange(m.id)}>
                  <Starburst className="size-4 text-brand" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px]">{m.label}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {m.description}
                    </span>
                  </span>
                  {model === m.id && <Check className="size-4 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasText ? (
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSubmit}
            disabled={disabled}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-80 disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Voice input"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-80"
          >
            <Mic className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
