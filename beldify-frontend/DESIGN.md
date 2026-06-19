# Beldify — Atlas Design System

> **Source of truth:** the runtime CSS custom properties in
> [`src/app/globals.css`](./src/app/globals.css). This document is the
> human-readable narrative; `globals.css` (and `tailwind.config.js`) are what
> actually ships. When the two disagree, **`globals.css` wins** — update this
> file to match, never the other way around.

Beldify is a Moroccan traditional-fashion marketplace. The visual language is
**Atlas**: a calm, near-white canvas carrying a deep-indigo brand with a single
saffron-amber accent. Refined, editorial, trustworthy — never loud.

---

## Canonical palette

| Role | Name | Hex | `globals.css` token | Usage budget |
|------|------|-----|---------------------|--------------|
| **Brand** | Deep Indigo (Atlas Indigo) | **`#252555`** | `--primary: 240 39% 24%` | ~30% — primary CTAs, headers, active nav, links |
| **Accent** | Saffron Amber | **`#fea619`** | `--secondary: 37 99% 55%` | **~10% only** — add-to-cart, badges, highlights |
| Canvas | Neutral near-white | `#FCFCFC` | `--background: 0 0% 99%` | ~60% — page background |
| Ink | Atlas Ink | `#1b1c19` | `--foreground: 80 6% 10%` | body text |
| Surface | White | `#FFFFFF` | `--card: 0 0% 100%` | cards, sheets, modals |

Follow the **60 / 30 / 10** rule: neutral canvas dominates, indigo structures,
amber accents sparingly. Amber must never sit behind a full page or as a card
hairline — it is a spotlight, not a wash.

### Status / semantic tints (light, on-palette)

| Meaning | Tint | Badge variant |
|---------|------|---------------|
| success / delivered / paid | emerald | `success` |
| info / shipped / approved | **indigo** (never blue) | `info` |
| warning / pending | amber | `warn` |
| error / cancelled / rejected | rose (Tetouani Garnet) | `error` |
| neutral / refunded | slate | `neutral` |

Off-palette `blue-*` is banned. Shipped/approved states that historically used
blue now map to the indigo `info` variant via `components/ui/badge.tsx`.

---

## ⚠️ Inverted Tailwind tokens — DO NOT global-rename

`tailwind.config.js` deliberately **inverts** the static numbered color scales
relative to Atlas semantics:

- `primary.*`   → **amber** (e.g. `bg-primary-500` = amber)
- `secondary.*` → **indigo** (e.g. `bg-secondary-700` = indigo)

This is load-bearing: `components/ui/button.tsx`, the PWA install banners, and
other consumers expect those scales. **Renaming them would silently break those
components.** A global find-replace of `primary`/`secondary` is forbidden.

To apply the Atlas brand colors in new work, use one of:

- The semantic CSS-var utilities: `bg-[hsl(var(--primary))]` (indigo) /
  `text-[hsl(var(--secondary))]` (amber) — these read the canonical tokens.
- The alpha-aware Atlas keys: `bg-atlas-primary`, `text-atlas-secondary`
  (support opacity modifiers, e.g. `bg-atlas-primary/10`).
- For everyday work, the literal Tailwind scales `indigo-700` / `amber-500`
  match `#252555` / `#fea619` closely and are what the seller dashboard uses.

Never reach for `primary-*` / `secondary-*` expecting Atlas semantics.

---

## Typography

- **Headings:** Playfair Display, via the `font-heading` Tailwind utility
  (`--font-heading` in `globals.css`). Use `className="font-heading"` — do not
  hand-roll inline `style={{ fontFamily: '"Playfair Display"…' }}` objects.
- **Body / UI:** the sans stack (`--font-sans`).
- **Arabic / RTL:** the `--font-arabic` stack; the app runs in `ar` and `ma`
  (Darija) so always use **logical** properties.

### RTL is a first-class requirement

Use logical utilities everywhere: `text-start` / `text-end` (never
`text-left` / `text-right`), `ms-*` / `me-*`, `ps-*` / `pe-*`, and
`rtl:rotate-180` on directional icons. Numeric columns get `tabular-nums` and
MAD prices use the `.currency-mad` helper (forces LTR digit grouping inside RTL
text).

---

## Radius, shadow, motion

- **Radius:** `--radius: 1rem` (16px) for cards/hero/modals; buttons & inputs
  use `calc(var(--radius) - 4px)` = 12px.
- **Shadow:** indigo-tinted `shadow-atlas-sm|md|lg|xl` (large blur, low offset).
- **Motion:** subtle, 150–200ms transitions; respect `prefers-reduced-motion`.

---

## Shared UI primitives (`src/components/ui/`)

Reach for these before hand-rolling structure:

- `button.tsx` — Atlas button (indigo default, amber `accent`).
- `input.tsx`, `textarea.tsx`, `select.tsx`, `label.tsx` — form controls.
- `card.tsx` — `Card` + `CardHeader`/`CardBody`/`CardFooter` Atlas surface.
- `badge.tsx` — `Badge` with the five semantic variants above.
- `dialog.tsx` — dependency-free `Dialog` (modal + edge-anchored `sheet`):
  portal + focus-trap + Escape + scroll-lock + backdrop click-to-close.
- `table.tsx` — `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/
  `TableCell`; `overflow-x-auto`, logical `text-start`, `numeric` prop for
  right-aligned `tabular-nums` columns.

---

## Theme scope

The **seller dashboard (`/seller/*`) is light-only** — dark mode is an explicit
non-goal there. Do not add `dark:` variants or render the `ThemeToggle` under
`/seller/*`; use the light Atlas tokens above.
