# `components/chat/chat-view.tsx`

v0-style chat view shell.

## What it does

Renders the full chat UI: header, scrollable message area, empty-state hero, and
bottom prompt composer. It receives a normalized message list (`ChatMessage[]`)
and status from `ChatViewWrapper` and maps each part to `Message`,
`MarkdownMessage`, `ToolCall`, or `ThinkingIndicator`.

## Dependencies

- `components/chat/message.tsx`
- `components/chat/markdown-message.tsx`
- `components/chat/tool-call.tsx`
- `components/chat/prompt-composer.tsx`
- `components/chat/thinking-indicator.tsx`
- `components/chat/chat-header.tsx`
- `components/icons.tsx`
- `lib/utils.ts` for `cn()`.

## Important values

- Empty-state title: "What do you want to create?"
- User bubbles are right-aligned; assistant content is left-aligned.
- Auto-scrolls to the bottom on new messages / status changes.

## Caveats

`ChatView` is a pure display component; it does not know about `useChat` or the
AI SDK. All interaction is delegated via `onSend` and `onStop` props.
