// SPDX-License-Identifier: MIT

"use client"

import { useRef, useEffect, useState } from "react"
import { Check, Copy, SquareTerminal } from "lucide-react"
import { Message } from "@/components/chat/message"
import { ThinkingIndicator, LoadingDots } from "@/components/chat/thinking-indicator"
import { ToolCall } from "@/components/chat/tool-call"
import { PromptComposer } from "@/components/chat/prompt-composer"
import { MarkdownMessage } from "@/components/chat/markdown-message"
import { ChatHeader } from "@/components/chat/chat-header"
import { DashedSpinner, Starburst } from "@/components/icons"
import { cn } from "@/lib/utils"

export interface ChatPart {
  type: "text" | "tool"
  text?: string
  toolName?: string
  toolLabel?: string
  toolState?: "running" | "done" | "error"
  toolDetail?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  parts: ChatPart[]
}

interface ChatViewProps {
  messages: ChatMessage[]
  status: "idle" | "submitted" | "streaming"
  onSend: (text: string, model: string) => void
  onStop?: () => void
  initialModel?: string
  title?: string
  chatId?: string
}

/* v0-style code block with copy button (preserved from initial commit) */
function CopyCodeBlock({ body, lang = "code" }: { body: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard not available */
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <SquareTerminal className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{lang}</span>
        </div>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy code"}
          onClick={handleCopy}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.6]">
        <code>{body}</code>
      </pre>
    </div>
  )
}

/* v0-style tool badge (preserved from initial commit) */
function ToolBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
      <DashedSpinner className="size-3.5 animate-[spin_2s_linear_infinite] text-muted-foreground" />
      <span className="font-mono text-[12px] text-muted-foreground">{name}</span>
    </div>
  )
}

export function ChatView({
  messages,
  status,
  onSend,
  onStop,
  initialModel,
  title = "New chat",
  chatId,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, status])

  const isStreaming = status === "streaming"
  const lastMessage = messages[messages.length - 1]
  const hasMessages = messages.length > 0

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader title={title} chatId={chatId} />
      <div className="flex-1 overflow-y-auto">
        <div className={cn("mx-auto flex flex-col px-4 py-6", hasMessages ? "max-w-3xl" : "w-full")}>
          {!hasMessages && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
              <Starburst className="size-10 text-brand" />
              <h1 className="text-balance text-2xl font-semibold">
                What do you want to create?
              </h1>
              <p className="max-w-md text-balance text-center text-sm text-muted-foreground">
                Ask the SIN-Code agent to build, fix, or explain anything.
                Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> to send.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const streamingThis =
              isStreaming && msg.id === lastMessage?.id && msg.role === "assistant"
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[18px] bg-secondary px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
                    {msg.parts
                      .filter((p) => p.type === "text")
                      .map((p) => p.text)
                      .join("")}
                  </div>
                </div>
              )
            }
            return (
              <Message
                key={msg.id}
                role={msg.role}
                isStreaming={streamingThis}
                rawText={msg.parts
                  .filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("\n")}
              >
                {msg.parts.map((part, i) =>
                  part.type === "tool" ? (
                    <ToolCall
                      key={i}
                      toolName={part.toolName ?? "tool"}
                      label={part.toolLabel ?? part.toolName ?? "Running tool"}
                      state={part.toolState ?? "done"}
                      detail={part.toolDetail}
                    />
                  ) : (
                    <MarkdownMessage key={i} content={part.text ?? ""} />
                  ),
                )}
              </Message>
            )
          })}

          {status === "submitted" && (
            <>
              <ThinkingIndicator />
              <LoadingDots />
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <PromptComposer onSend={onSend} onStop={onStop} isStreaming={isStreaming} initialModel={initialModel} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            SIN-Code can make mistakes. Verify important output.
          </p>
        </div>
      </div>
    </div>
  )
}
