"use client"

import { Workspace } from "@/components/workspace/workspace"
import { ChatView } from "@/components/chat/chat-view"

export default function WorkspacePage() {
  return (
    <Workspace
      chat={<ChatView messages={[]} status="idle" onSend={() => {}} />}
      previewSrc="http://localhost:3001"
    />
  )
}
