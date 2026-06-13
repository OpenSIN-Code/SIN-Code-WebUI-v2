# `components/chat/chat-view-wrapper.tsx`

Chat container that wires the AI SDK 6 `useChat` hook to the backend.

## What it does

Fetches persisted messages for the given chat id, feeds them into `useChat`,
converts `UIMessage[]` parts to the `ChatMessage[]` shape expected by
`ChatView`, and persists the conversation back to `/api/chats/${id}` after each
turn. Also handles the initial prompt flow (e.g. from a template or shared link).

## Dependencies

- `ai` (`DefaultChatTransport`, `UIMessage`) and `@ai-sdk/react` (`useChat`).
- `components/chat/chat-view.tsx` for rendering.
- `components/chat-store.tsx` for the chat label/title.
- `lib/sin/models.ts` for model resolution.
- `hooks/use-sound-notification.ts` for turn-completion audio.

## Important values

- Transport endpoint: `/api/chat`.
- Body sent to the backend: `{ model, agent }`.
- Default model: `sin-code-pro`.

## Caveats

The component shows a loading state until initial messages are fetched. It is
a client component and must be rendered inside the chat store provider.
