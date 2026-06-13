# `components/chat/code-block.tsx`

Fenced code block with copy button and language label.

## What it does

Renders a code block with a header showing the language or filename and a copy
button. Uses `navigator.clipboard` for copying.

## Dependencies

- `lucide-react` icons.
- Used by `components/chat/markdown-message.tsx`.

## Important values

- Copy button toggles to a checkmark for 2 seconds after a successful copy.

## Caveats

Syntax highlighting is not yet implemented; the code is rendered as plain
monospace text. The language label is shown for information only.
