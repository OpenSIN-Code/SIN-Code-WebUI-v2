'use client'

import { ArrowUp, Check, Mic, Paperclip, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useChatStore } from '@/components/chat-store'
import { Starburst } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SIN_MODELS, type SinModelId } from '@/lib/sin/models'

const SUGGESTIONS = [
  'Map this repo architecture',
  'Find architectural debt',
  'Plan a refactor with the orchestrator',
  'What changed since last session?',
]

export function PromptBox() {
  const router = useRouter()
  const { addChat } = useChatStore()
  const [value, setValue] = useState('')
  const [model, setModel] = useState<SinModelId>('sin-code-pro')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentModel = SIN_MODELS.find((m) => m.id === model) ?? SIN_MODELS[0]

  function handleSubmit() {
    const prompt = value.trim()
    if (!prompt) return
    const slug =
      prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join('-') || 'new-chat'
    const words = prompt.split(/\s+/)
    const label = words.slice(0, 5).join(' ') + (words.length > 5 ? '…' : '')
    addChat({ id: slug, label })
    router.push(`/chat/${slug}?q=${encodeURIComponent(prompt)}&m=${model}`)
  }

  function fillSuggestion(text: string) {
    setValue(text)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex w-full max-w-[540px] flex-col gap-2.5">
      {/* Prompt card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_4px_0_oklch(0_0_0/15%)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="What do you want to build?"
          rows={4}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 px-2 pb-2">
          {/* Attachment */}
          <button
            type="button"
            aria-label="Add attachment"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Paperclip className="size-4" />
          </button>

          {/* Model picker */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-foreground hover:bg-accent"
                />
              }
            >
              <Starburst className="size-4 text-brand" />
              <span>{currentModel.label}</span>
              <svg viewBox="0 0 16 16" className="size-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6 8 10 12 6" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuGroup>
                {SIN_MODELS.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setModel(m.id)}>
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

          <div className="flex-1" />

          {/* Project selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
                />
              }
            >
              Project
              <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6 8 10 12 6" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem>No Project</DropdownMenuItem>
                <DropdownMenuItem>SIN-Code-Bundle</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Enhance */}
          <button
            type="button"
            aria-label="Enhance prompt"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Sparkles className="size-4" />
          </button>

          {/* Send / Mic — round black button like v0 */}
          {value.trim() ? (
            <button
              type="button"
              aria-label="Send message"
              onClick={handleSubmit}
              className="flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
            >
              <ArrowUp className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Voice input"
              className="flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
            >
              <Mic className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => fillSuggestion(s)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {s}
          </button>
        ))}
        {/* Refresh */}
        <button
          type="button"
          aria-label="Refresh suggestions"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 4 1.72" />
            <path d="M13.5 2v2.22H11.3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
