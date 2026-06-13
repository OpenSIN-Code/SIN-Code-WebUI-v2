# `components/chat/markdown-message.tsx`

Markdown renderer for assistant message text.

## What it does

Parses assistant text with `react-markdown` and `remark-gfm`, applying Tailwind
styles to paragraphs, headings, lists, links, blockquotes, tables, and inline /
fenced code. Fenced code is delegated to `CodeBlock`.

## Dependencies

- `react-markdown` and `remark-gfm`.
- `components/chat/code-block.tsx`.
- Used by `components/chat/chat-view.tsx`.

## Important values

- Code blocks are detected by `language-` class or multiline content.
- Tables are wrapped in a scrollable container.

## Caveats

Custom component mapping is inline and intentionally minimal. If the project
grows richer markdown needs (footnotes, Mermaid, etc.), consider extracting the
components map into a shared config.
