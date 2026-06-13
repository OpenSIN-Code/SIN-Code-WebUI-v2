# `components/chat/chat-header.tsx`

v0-style chat header with breadcrumb, favorites, and action menus.

## What it does

Renders the top bar of the chat view: Drafts breadcrumb, star/favorite button,
title dropdown (rename, favorite, delete), project options menu, and share
button.

## Dependencies

- `lucide-react` icons.
- `components/ui/dropdown-menu.tsx`.
- `components/icons.tsx`.
- Used by `components/chat/chat-view.tsx`.

## Important values

- Header height: 44 px (`h-11`).
- Menus are visual placeholders; most items are not yet wired to actions.

## Caveats

The dropdown menu items (Rename, Delete, Vercel Project, GitHub, etc.) are UI
stubs. Wiring them to real stores/routes is a separate follow-up task.
