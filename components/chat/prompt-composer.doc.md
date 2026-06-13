# `components/chat/prompt-composer.tsx`

v0-style prompt input with model picker and send/stop controls.

## What it does

Provides an auto-resizing textarea, a dropdown model picker, attachment button
placeholder, and send/stop button. Calls `onSend(text, model)` when the user
presses Enter or clicks send.

## Dependencies

- `lucide-react` icons.
- Used by `components/chat/chat-view.tsx`.

## Important values

- Default model list: Claude Opus 4.6, Claude Sonnet 4.5, GPT-5 Mini, Gemini 3
  Flash.
- Textarea grows up to 240 px.
- Enter sends; Shift+Enter inserts a newline.

## Caveats

The model picker uses a local hardcoded list. In the future it should read from
`lib/sin/models.ts` or the workspace default so it stays in sync with the
backend model tiers.
