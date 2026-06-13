# `components/chat/thinking-indicator.tsx`

Loading indicators for the submitted state.

## What it does

Exports `ThinkingIndicator` (a shimmer text label) and `LoadingDots` (three
pulsing dots). Used while the assistant is processing but before the first
token arrives.

## Dependencies

- Used by `components/chat/chat-view.tsx`.

## Important values

- Default label: "Thinking…".
- `LoadingDots` has 3 dots with staggered animation delays.

## Caveats

The phrase list (`PHRASES`) is currently unused; only the first phrase is
shown. A future enhancement could rotate phrases randomly.
