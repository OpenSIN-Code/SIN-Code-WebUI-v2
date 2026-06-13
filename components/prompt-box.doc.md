# `components/prompt-box.tsx`

## What
The v0-style prompt input on the landing page. Lets the user type a prompt, pick a SIN model, select a project, and fire off a chat. Also provides one-click suggestion chips and an LLM-powered prompt enhancer (Sparkles icon).

## Imports
- `lucide-react` → icons
- `next/navigation` → `useRouter` for redirect to `/chat/[id]`
- `react` → state + refs
- `components/chat-store` → `useChatStore` to persist the new chat entry
- `components/icons` → `Starburst` brand icon
- `components/ui/dropdown-menu` → model + project pickers
- `lib/sin/models` → `SIN_MODELS` + `SinModelId`

## State
- `value` → textarea content
- `model` → selected SIN model id
- `isEnhancing` → loading state while `/api/enhance` is running

## Key functions
- `handleSubmit()` → creates a slug from the prompt, stores the chat, and navigates to `/chat/[id]?q=...&m=...`
- `fillSuggestion(text)` → prefills the textarea from a suggestion chip
- `enhance()` → POSTs the current prompt to `/api/enhance` and replaces the textarea with the rewritten version

## Known UI buttons
- Attachment (Paperclip) → currently visual only; no file picker wired yet
- Project selector → hardcoded placeholder options (`No Project`, `SIN-Code-Bundle`)
- Voice input (Mic) → visual only; no speech recognition wired yet
- Refresh suggestions → visual only; randomization not implemented yet

## Related
- `app/api/enhance/route.ts` → LLM prompt enhancement
- `components/chat/prompt-composer.tsx` → chat-thread prompt input (no enhance button)
- `lib/sin/models.ts` → model picker data
- `components/chat-store.tsx` → chat persistence
