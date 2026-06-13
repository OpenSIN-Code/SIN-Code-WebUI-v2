# `app/api/chats/route.ts`

Chat metadata list and creation endpoint.

## What it does

- `GET` — returns the list of chat metadata entries for the current actor.
- `POST` — creates or updates a chat label, favorite flag, and workspace id.

## Dependencies

- `lib/storage.ts` for `listChats`, `upsertChatMeta`, and `isValidChatId`.
- `lib/sin/guard.ts` for auth + rate limiting.
- `lib/session.ts` for the user session.

## Important values

- Labels are truncated to 120 characters.
- Chat ids must satisfy `isValidChatId()`.

## Caveats

This endpoint only stores metadata; the message history is persisted by the chat
route (`PUT /api/chats/[id]`).
