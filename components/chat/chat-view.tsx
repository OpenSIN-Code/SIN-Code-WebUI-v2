"use client"

import { useRef, useEffect } from "react"
import { Message } from "@/components/chat/message"
import { ThinkingIndicator, LoadingDots } from "@/components/chat/thinking-indicator"
import { ToolCall } from "@/components/chat/tool-call"
import { PromptComposer } from "@/components/chat/prompt-composer"
import { MarkdownMessage } from "@/components/chat/markdown-message"

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
}

export function ChatView({ messages, status, onSend, onStop, initialModel }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, status])

  const isStreaming = status === "streaming"
  const lastMessage = messages[messages.length - 1]

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-32">
              <h1 className="text-2xl font-semibold text-balance">
                What do you want to create?
              </h1>
              <p className="text-sm text-muted-foreground">
                Ask the SIN-Code agent to build, fix, or explain anything.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const streamingThis =
              isStreaming && msg.id === lastMessage?.id && msg.role === "assistant"
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
