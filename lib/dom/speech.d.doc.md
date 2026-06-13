# `lib/dom/speech.d.ts`

## What
Minimal DOM-side type shims for the Web Speech API. `SpeechRecognition`, `webkitSpeechRecognition` and the related event/result types are not in `lib.dom.d.ts` yet — this file declares them so we can use them in any component without re-declaring the globals.

## Exports
- `SpeechRecognitionAlternativeLike` — `{ transcript: string }`
- `SpeechRecognitionResultLike` — array-like with `isFinal`
- `SpeechRecognitionResultListLike` — array-like of `SpeechRecognitionResultLike`
- `SpeechRecognitionEventLike` — `{ results: SpeechRecognitionResultListLike }`
- `SpeechRecognitionInstanceLike` — the recognizer API (`start`, `stop`, callbacks)
- `SpeechRecognitionCtor`, `SpeechRecognitionInstance` — convenience aliases

## Global augmentation
- `Window.SpeechRecognition` and `Window.webkitSpeechRecognition` are typed as `new () => SpeechRecognitionInstanceLike` (both optional).

## Usage
```ts
import {
  type SpeechRecognitionEventLike,
  type SpeechRecognitionInstance,
} from '@/lib/dom/speech'
```

## Related
- `components/prompt-box.tsx` — landing-page speech input
- `components/chat/prompt-composer.tsx` — chat-thread speech input
