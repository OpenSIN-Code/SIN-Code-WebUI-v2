# Design System — SIN-Code WebUI v2

> **Single source of truth** for the visual language, design tokens, and UI patterns of the SIN-Code WebUI v2.
>
> Philosophy: **v0-style minimalism** — clean surfaces, high-contrast typography, purposeful motion, and a neutral canvas that keeps the AI-generated content in focus.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Radius & Elevation](#radius--elevation)
6. [Component Catalog](#component-catalog)
7. [Patterns](#patterns)
8. [Dark Mode](#dark-mode)
9. [Motion](#motion)
10. [Accessibility](#accessibility)
11. [Adding New Components](#adding-new-components)

---

## Philosophy

The UI is designed to feel like a **native creative canvas**, not a traditional admin dashboard.

- **Neutral first**: The chrome stays in the background (muted grays, subtle borders) so chats, code, and design artifacts are the heroes.
- **High-contrast text**: Sharp, dark text on light surfaces; light text on dark surfaces. No low-contrast gray-on-gray body copy.
- **Purposeful rounding**: Medium radius (`0.5rem` base) on containers; small radius on buttons and inputs; large radius on hero cards.
- **Subtle borders**: 1px `border` tokens at low opacity separate regions without adding visual weight.
- **Motion as feedback**: Animations are fast (150–250 ms), ease-out, and only used to communicate state changes (hover, focus, loading, new content).
- **No ornamental noise**: Gradients, shadows, and decorative icons are used sparingly and only when they aid hierarchy or interaction.

---

## Design Tokens

All tokens live in CSS custom properties in `app/globals.css`. They are mapped to Tailwind utilities via the `@theme inline` block.

### Color Tokens

We use **semantic tokens** (background, foreground, primary, secondary, muted, accent, destructive, border, input, ring) in both light and dark modes.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `oklch(1 0 0)` white | `oklch(0.13 0 0)` near-black | App/page background |
| `--foreground` | `oklch(0.205 0 0)` | `oklch(0.97 0 0)` | Primary text & icons |
| `--card` | `oklch(0.985 0 0)` | `oklch(0.175 0 0)` | Elevated surface background |
| `--card-foreground` | `oklch(0.205 0 0)` | `oklch(0.97 0 0)` | Text on card surfaces |
| `--popover` | `oklch(1 0 0)` | `oklch(0.2 0 0)` | Floating overlays |
| `--popover-foreground` | `oklch(0.205 0 0)` | `oklch(0.97 0 0)` | Text on popovers |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.97 0 0)` | High-emphasis actions, brand surface |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.13 0 0)` | Text on primary surface |
| `--secondary` | `oklch(0.96 0 0)` | `oklch(0.235 0 0)` | Lower-emphasis surfaces |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.97 0 0)` | Text on secondary surface |
| `--muted` | `oklch(0.96 0 0)` | `oklch(0.225 0 0)` | Subtle backgrounds (hover, badges) |
| `--muted-foreground` | `oklch(0.5 0 0)` | `oklch(0.62 0 0)` | Placeholders, descriptions, secondary text |
| `--accent` | `oklch(0.94 0 0)` | `oklch(0.255 0 0)` | Hover/focus/active highlights |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.97 0 0)` | Text on accent surface |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.66 0.2 25)` | Errors, destructive actions |
| `--border` | `oklch(0 0 0 / 10%)` | `oklch(1 0 0 / 9%)` | Separators, card borders |
| `--input` | `oklch(0 0 0 / 14%)` | `oklch(1 0 0 / 12%)` | Form control borders |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.5 0 0)` | Focus rings |

### Brand & Chart

| Token | Light/Dark | Usage |
|-------|------------|-------|
| `--brand` | `oklch(0.68 0.19 35)` | Brand accent (orange/amber) for the SIN-Code identity |
| `--chart-1` … `--chart-5` | Sequential warm neutrals | Recharts / data visualizations |
| `--code-green` | `oklch(0.55 0.17 152)` (light) / `oklch(0.79 0.17 152)` (dark) | Syntax highlighting green |
| `--code-magenta` | `oklch(0.55 0.19 350)` (light) / `oklch(0.72 0.19 350)` (dark) | Syntax highlighting magenta |
| `--code-comment` | `oklch(0.55 0 0)` | Syntax comments |

### Radius Tokens

Base radius: `--radius: 0.5rem`

| Token | Formula | Usage |
|-------|---------|-------|
| `--radius-sm` | `0.6 × base` | Small chips, tags |
| `--radius-md` | `0.8 × base` | Buttons, inputs |
| `--radius-lg` | `base` | Cards, dialogs |
| `--radius-xl` | `1.4 × base` | Large panels, hero cards |
| `--radius-2xl` | `1.8 × base` | Floating containers |
| `--radius-3xl` | `2.2 × base` | Modals, sidebars |
| `--radius-4xl` | `2.6 × base` | Full-screen sheets |

---

## Typography

### Font Stack

```css
--font-heading: var(--font-inter), 'Inter Fallback', ui-sans-serif, system-ui, sans-serif;
--font-sans: var(--font-inter), 'Inter Fallback', ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-geist-mono), 'Geist Mono Fallback', ui-monospace, monospace;
```

- **Body & headings**: Inter (loaded via `next/font` in `app/layout.tsx`).
- **Code & tokens**: Geist Mono.
- **System fallback**: `ui-sans-serif` / `ui-monospace` for zero-FOIT rendering.

### Type Scale

Use Tailwind utilities. The default scale is compact to fit dense AI-tooling UIs.

| Context | Tailwind | Example |
|---------|----------|---------|
| Hero H1 | `text-3xl font-semibold` | Chat empty state title |
| Page title | `text-xl font-semibold` | Settings page headers |
| Section title | `text-base font-semibold` | Sidebar group labels |
| Body | `text-sm` | Chat messages, form labels |
| Caption | `text-xs text-muted-foreground` | Timestamps, hints, meta |
| Code | `text-sm font-mono` | Inline code, file contents |

### Line Height & Tracking

- Body text: `leading-normal` (1.5).
- Headings: `leading-tight` (1.25).
- Dense UI labels: `leading-none`.
- Avoid wide tracking; keep it natural (`tracking-normal`).

---

## Spacing & Layout

### Base Unit

Tailwind 4 default spacing scale. The UI is built on a **4 px grid**.

### Common Layout Values

| Pattern | Spacing | Example |
|---------|---------|---------|
| App padding | `px-3` / `py-2` | Header, sidebar rows |
| Card padding | `p-3` / `p-4` | Settings panels, empty states |
| Section gap | `gap-4` | Main content grids |
| Tight gap | `gap-1.5` | Header actions, button groups |
| Sidebar width | `w-[260px]` | `AppSidebar` |
| Header height | `h-11` | `ChatHeader` |
| Max content width | `max-w-3xl` | Chat message column |

### Responsive Strategy

- **Desktop-first**: The app is primarily a desktop creative tool.
- **Mobile degrades gracefully**: Sidebar collapses, chat becomes full-width, settings stack vertically.
- Use `md:` and `lg:` breakpoints sparingly; the layout is already compact.

---

## Radius & Elevation

### Elevation

We avoid heavy shadows. Elevation is communicated through **surface color shifts** and **borders**.

- Default surfaces: `bg-background` / `bg-card`.
- Floating surfaces: `bg-popover border shadow-sm`.
- Focus elevation: `ring-3 ring-ring/50` (no box-shadow spread).

### Shadow Usage

| Shadow | Usage |
|--------|-------|
| `shadow-sm` | Popovers, dropdowns, tooltips |
| `shadow-md` | Dialogs, command palette |
| `shadow-lg` | Toasts, notifications |
| No shadow | Cards, panels, lists (use border instead) |

---

## Component Catalog

All components live in `components/ui/` and are built on top of **shadcn/ui primitives** + **@base-ui/react** + **Tailwind CSS**. Prefer composition over configuration.

### Button

File: `components/ui/button.tsx`

```tsx
<Button>Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Danger</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Star /></Button>
```

- **Default**: filled primary surface, rounded-md, `h-8`.
- **Outline**: transparent with border; used for secondary actions.
- **Ghost**: transparent; used for icon buttons and toolbars.
- **Destructive**: subtle red surface; used for delete/remove.
- **Sizes**: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

### Input

File: `components/ui/input.tsx`

- Use `bg-background` with `border-input`.
- Height: `h-8` for compact forms, `h-9` for prominent inputs.
- Focus: `ring-ring/50`.
- Placeholder color: `text-muted-foreground`.

### Card

File: `components/ui/card.tsx`

- Background: `bg-card`.
- Border: `border-border`.
- Radius: `rounded-lg`.
- Padding: `p-3` or `p-4` depending on density.

### Dialog / Sheet / Popover

Files: `components/ui/dialog.tsx`, `components/ui/sheet.tsx`, `components/ui/popover.tsx`

- Overlay: `bg-black/50` (light) / `bg-black/70` (dark).
- Surface: `bg-popover text-popover-foreground border shadow-lg`.
- Radius: `rounded-lg` for popovers, `rounded-xl` for dialogs.

### Dropdown Menu

File: `components/ui/dropdown-menu.tsx`

- Trigger: usually a ghost button or icon button.
- Content: `bg-popover border shadow-sm`.
- Item hover: `bg-accent text-accent-foreground`.
- Separator: `border-border`.

### Sidebar

File: `components/app-sidebar.tsx`

- Background: `bg-sidebar`.
- Width: `w-[260px]`.
- Active item: `bg-sidebar-accent text-sidebar-accent-foreground`.
- Primary CTA: `bg-sidebar-primary text-sidebar-primary-foreground`.

### Chat Components

Files: `components/chat/*`

- Header: `h-11 border-b border-border/60 px-3`.
- Message bubble: `bg-muted` for AI, transparent for user.
- Code block: `bg-card border rounded-lg` with Shiki syntax highlighting.
- Loading shimmer: `animate-shimmer-text` (v0 style).

---

## Patterns

### Form Pattern

```tsx
<div className="space-y-3">
  <label className="text-sm font-medium">Label</label>
  <Input placeholder="Hint…" />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>
```

- Stack fields with `space-y-3`.
- Labels are `text-sm font-medium`.
- Helper text is `text-xs text-muted-foreground`.

### Empty State

```tsx
<div className="flex flex-col items-center justify-center gap-3 text-center">
  <Icon className="size-10 text-muted-foreground" />
  <h2 className="text-lg font-semibold">No items yet</h2>
  <p className="text-sm text-muted-foreground">Add your first item to get started.</p>
  <Button>Create item</Button>
</div>
```

### List / Row Pattern

```tsx
<div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
  <Icon className="size-4 text-muted-foreground" />
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">Title</p>
    <p className="text-xs text-muted-foreground">Subtitle</p>
  </div>
  <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
</div>
```

### Loading State

- Use skeletons for content-heavy pages.
- Use spinners for inline actions.
- Use the v0 shimmer text for AI streaming states.

---

## Dark Mode

Dark mode is handled by `next-themes` and toggled via a class on `<html>`.

- All semantic tokens are defined for both `:root` and `.dark`.
- **Never hardcode** light-mode hex values in components. Use the semantic tokens.
- Images and icons should use `currentColor` or token-aware fills where possible.
- Shiki code blocks use `.dark .shiki span { color: var(--shiki-dark) !important; }`.

---

## Motion

### Principles

- **Fast**: 150–250 ms for micro-interactions.
- **Ease-out**: `ease-out` or `cubic-bezier(0, 0, 0.2, 1)` for entering elements.
- **Purposeful**: every animation communicates a state change.
- **Reduced motion**: respect `prefers-reduced-motion` when possible.

### Key Animations

| Class | Animation | Usage |
|-------|-----------|-------|
| `animate-fade-up` | fade + translateY | New chat messages, empty states |
| `animate-shimmer-text` | gradient shimmer | AI streaming / loading hint |
| `streaming-cursor` | blinking cursor | Streaming text cursor |
| `animate-spin-slow` | slow rotation | Loading spinner |
| `animate-pulse-dot` | scale pulse | Typing indicator dots |
| `animate-accordion-down` | height + opacity | Accordion panels |

### Adding Animations

Add new `@keyframes` to `app/globals.css` and expose utility classes. Avoid one-off inline animations in components.

---

## Accessibility

- **Focus rings**: All interactive elements use the same `ring` token via `@layer base` (`outline-ring/50`).
- **Color contrast**: Body text (`foreground` on `background`) meets WCAG AA.
- **Icon buttons**: Always provide an `aria-label`.
- **Keyboard navigation**: Dropdowns, dialogs, and sidebars must be keyboard-navigable (handled by Radix primitives).
- **Reduced motion**: Future improvement — wrap entrance animations in `prefers-reduced-motion` queries.

---

## Adding New Components

1. **Check the catalog**: Can you compose existing primitives instead of creating a new component?
2. **Use the token layer**: Reference `--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`.
3. **Follow the file header**:
   ```tsx
   // Purpose: Short description of the component.
   // Docs: DESIGN.md
   // SPDX-License-Identifier: MIT
   ```
4. **Keep variants minimal**: Use `cva` for variant logic (see `button.tsx`).
5. **Verify**: Run `pnpm tsc --noEmit`, `pnpm lint`, and check the component in light + dark mode.
6. **Document**: Add a row to the Component Catalog above if the component is reusable across pages.

---

## See Also

- `app/globals.css` — token definitions and animations.
- `components/ui/` — reusable shadcn/ui + base-ui primitives.
- `components/chat/` — chat-specific v0 UI components.
- `components/workspace/` — design-mode and workspace components.
- `AGENTS.md` — project conventions for agents.

---

*Last updated: 2026-06-13 — aligned with PR #67 (v0-Design-Audit) and the current Tailwind 4 / CSS-variables setup.*
