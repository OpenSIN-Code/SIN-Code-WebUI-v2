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

## Functional toolbar buttons
- **Attachment (Paperclip)** → opens a hidden file input, shows selected file chips, prepends `[Attached: names]` to the prompt on submit. Max 5 files / 5 MB each.
- **Project selector** → wired to `components/project-store.tsx`; shows real projects from localStorage plus a `No Project` option. Selected project id is passed as `p=` in the chat URL.
- **Voice input (Mic)** → uses the browser's `SpeechRecognition` / `webkitSpeechRecognition` API. Records while the button is red; appends final transcripts to the textarea. Falls back to an alert if the browser lacks support.
- **Enhance (Sparkles)** → POSTs the prompt to `/api/enhance` and replaces the textarea with the LLM rewrite.
- **Refresh suggestions** → shuffles a larger suggestion pool and rotates the 4 displayed chips.
- **Send (ArrowUp)** → creates a chat slug, persists the chat, and navigates to `/chat/[id]?q=...&m=...&p=...`.

## Related
- `app/api/enhance/route.ts` → LLM prompt enhancement
- `components/chat/prompt-composer.tsx` → chat-thread prompt input (no enhance button)
- `lib/sin/models.ts` → model picker data
- `components/chat-store.tsx` → chat persistence
- `components/project-store.tsx` → project dropdown data
