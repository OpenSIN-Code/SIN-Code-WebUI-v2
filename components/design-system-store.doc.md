# `components/design-system-store.tsx`

Client-side React context for user-created design systems.

## What it does

Manages a list of named design systems, each with a `primaryColor`. The list is
hydrated from `localStorage` on mount and persisted back on every change. New
design systems are assigned a deterministic fallback color from `PALETTE` so the
UI always has a visible swatch.

## Dependencies

- `components/design-systems-list.tsx` renders the stored list.
- `components/design-systems/page.tsx` is the settings page entry point.
- `app/globals.css` defines the OKLCH color space the palette is aligned with.

## Important values

- `STORAGE_KEY = 'sin-code:design-systems'`
- `PALETTE`: v0-aligned OKLCH fallback colors (green, blue, amber, red, teal).
- Each new entry id is `name-slug-date` to avoid collisions.

## Caveats

- Colors are stored as strings and rendered inline (`style={{ backgroundColor }}`).
- This is a client-only store; no server persistence.
