# `components/chat/message.tsx`

Individual chat bubble with copy/retry actions.

## What it does

Renders a user or assistant message. User messages appear as right-aligned
bubbles; assistant messages show a streaming cursor, copy button, and optional
retry button.

## Dependencies

- `lucide-react` icons.
- Used by `components/chat/chat-view.tsx`.

## Important values

- Copy button appears on hover for assistant messages.
- `isStreaming` adds a `streaming-cursor` CSS class.

## Caveats

`Message` accepts `children` so the parent can compose `MarkdownMessage` or
`ToolCall` elements inside it. The `rawText` prop is used for clipboard copy.
