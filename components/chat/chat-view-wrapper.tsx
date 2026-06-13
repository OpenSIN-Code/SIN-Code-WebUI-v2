// SPDX-License-Identifier: MIT

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ChatView, type ChatMessage, type ChatPart } from '@/components/chat/chat-view'
import { useChatStore } from '@/components/chat-store'
import { SIN_MODELS } from '@/lib/sin/models'
import { useSoundNotification } from '@/hooks/use-sound-notification'

function convertMessages(messages: UIMessage[]): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: msg.parts?.map((part): ChatPart => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text }
      }

      // Handle tool parts: tool-<name>, dynamic-tool, or any other tool-like part
      const toolName = part.type.startsWith('tool-')
        ? part.type.replace('tool-', '')
        : part.type === 'dynamic-tool'
          ? 'dynamic'
          : part.type

      const partAny = part as any
      const state = partAny.state
      let toolState: 'running' | 'done' | 'error' = 'running'
      if (state === 'output-available') toolState = 'done'
      else if (state === 'output-error') toolState = 'error'

      const detail = partAny.input || partAny.output || partAny.errorText
        ? JSON.stringify(
            {
              input: partAny.input,
              output: partAny.output,
              error: partAny.errorText,
            },
            null,
            2,
          )
        : undefined

      return {
        type: 'tool',
        toolName,
        toolLabel: toolName,
        toolState,
        toolDetail: detail,
      }
    }) ?? [],
  }))
}

export function ChatViewWrapper({
  chatId,
  prompt,
  initialModel,
}: {
  chatId: string
  prompt?: string
  initialModel?: string
}) {
  const [model, setModel] = useState<string>(
    SIN_MODELS.some((m) => m.id === initialModel)
      ? initialModel!
      : 'sin-code-pro',
  )
  const [agent] = useState<string>('auto')
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null)
  const playNotification = useSoundNotification()
  const { recentChats } = useChatStore()
  const chat = recentChats.find((c) => c.id === chatId)
  const title = chat?.label || 'New chat'

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

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages ?? [],
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model, agent },
    }),
    onFinish: () => {
      playNotification()
    },
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
    if (
      prompt &&
      !sentInitial.current &&
      messages.length === 0 &&
      initialMessages !== null
    ) {
      sentInitial.current = true
      sendMessage({ text: prompt })
    }
  }, [prompt, messages.length, sendMessage, initialMessages])

  const chatMessages = convertMessages(messages)
  const chatStatus =
    status === 'ready' ? 'idle' : (status as 'submitted' | 'streaming')

  const handleSend = useCallback(
    (text: string, newModel: string) => {
      if (newModel !== model) {
        setModel(newModel)
      }
      sendMessage({ text }, { body: { model: newModel, agent } })
    },
    [sendMessage, model, agent],
  )

  const handleStop = useCallback(() => {
    stop?.()
  }, [stop])

  if (initialMessages === null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <div className="flex items-center gap-2 py-1">
          <span className="text-[13px] text-muted-foreground">Loading chat...</span>
        </div>
      </div>
    )
  }

  return (
    <ChatView
      messages={chatMessages}
      status={chatStatus}
      onSend={handleSend}
      onStop={handleStop}
      initialModel={model}
      title={title}
      chatId={chatId}
    />
  )
}
