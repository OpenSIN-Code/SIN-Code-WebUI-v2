# `components/chat/prompt-composer.tsx`

## What
v0-style prompt composer for an active chat thread. Lets the user type, pick a model, trigger voice input, and either send or stop generation.

## Imports
- `lucide-react` → icons (`Plus`, `ArrowUp`, `Square`, `Mic`, `ChevronDown`, `Check`)
- `react` → state + refs
- `lib/dom/speech` → `SpeechRecognitionCtor`, `SpeechRecognitionEventLike`, `SpeechRecognitionInstance`

## State
- `text` → textarea content
- `model` → selected gateway model id (from local `MODELS` list)
- `pickerOpen` → model picker visibility
- `isListening` → speech recognition status

## Key functions
- `send()` → fires `onSend(text, model)` and clears the textarea
- `startListening()` → kicks off `SpeechRecognition`, appends final transcripts
- `stopListening()` → stops the current recognition

## UI
- Textarea grows up to 240 px on multi-line input
- Mic button appears only when textarea is empty and not streaming
- Mic turns red when actively listening
- Send button disabled when textarea is empty
- Stop button replaces Send while streaming

## Related
- `lib/dom/speech.d.ts` → shared SpeechRecognition type shims
- `lib/sin/models.ts` → production model catalog (different from this file's local `MODELS`)
- `components/prompt-box.tsx` → landing-page variant
