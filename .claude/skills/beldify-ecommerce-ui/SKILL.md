---
name: beldify-ecommerce-ui
description: Apply Beldify's Atlas e-commerce UI + logic to any page or component. Use on any request to redesign, build, restyle, or wire up storefront/seller/admin/cart/checkout/PDP screens. Grounds every change in the Stitch reference design (Arabic/RTL, MAD) and ALWAYS routes work through the orchestrator → frontend-engineer (UI) and backend-engineer (logic). Triggers: "redesign the UI", "apply the e-commerce UI", "restyle this page", "build the X screen", "make it match the design".
---

# beldify-ecommerce-ui

The single entry point for changing any Beldify e-commerce surface. It enforces two
things on **every** change:

1. **Design fidelity** — every screen matches the Stitch reference + Atlas tokens below.
2. **Role discipline** — UI and logic are never hand-edited solo. The orchestrator fans
   out work to `frontend-engineer` (UI) and `backend-engineer` (logic). This is mandatory,
   not optional — see [Execution model](#execution-model).

## Source of truth (read these FIRST, every time)

| What | Path |
|---|---|
| Stitch visual reference (screenshot) | `stitch_beldify_arabic_seller_dashboard/screen.png` |
| Stitch generated markup | `stitch_beldify_arabic_seller_dashboard/code.html` |
| Stitch design tokens (Material 3) | `stitch_beldify_arabic_seller_dashboard/DESIGN.md` |
| Project design system | `DESIGN.md` (Atlas Indigo + Saffron Amber) |
| Seller shell + v3 components | `beldify-backend/resources/views/layouts/seller_shell.blade.php`, `beldify-backend/resources/views/components/v3/` |

Open `screen.png` with the Read tool before any UI change so the look is in context.

## Design tokens (Atlas — Beldify)

Use these exact values. Do not invent colors or introduce purple gradients.

```
Primary (brand)        #252555   (deep indigo)   → nav, headers, primary actions
Primary container      #3b3b6d                   → hover, dark surfaces
On-primary-container    #a8a7e1                  → text on indigo
Secondary / accent     #fea619   (saffron amber) → badges, CTAs, positive deltas
On-secondary           #855300                   → amber text
Surface / background   #fbf9f4   (parchment)     → page background
Card surface           #ffffff
On-surface (ink)       #1b1c19
On-surface-variant     #47464f   (muted)
Outline                #777680
Error                  #ba1a1a
```

Layout rules:
- **RTL Arabic first.** `dir="rtl"`, logo on the right, nav reads right-to-left.
- Font: **IBM Plex Sans Arabic** (headings + body). Fallback `Cairo`, `Rubik`.
- Currency: **Moroccan Dirham** — render as `MAD 4,250` / `4,250 درهم`.
- Cards: `rounded-2xl` (16px), soft shadows, generous whitespace.
- Trend deltas: green ↑ / red ↓ ; status pills color-coded (amber=pending, indigo=shipped, green=completed, red=cancelled).
- Use logical CSS only (`padding-inline`, `inset-inline-*`) — never hardcoded `left`/`right`.

## Responsive deliverables (BOTH are mandatory)

Every screen ships **two** deliverables — a Stitch reference and ported code — for
**mobile AND desktop**. Never ship one without the other.

### Mobile (≤ 640px) — primary, design mobile-first
- Single-column flow; KPI/stat cards in a **2-up grid**; product grids **2-up**.
- **Fixed bottom tab bar**, iOS safe-area aware (`env(safe-area-inset-bottom)`),
  RTL tab order, active tab indigo with amber count badges.
  - Seller: الرئيسية · الطلبات · المنتجات · السوق المفتوح · الرسائل
  - Storefront: الرئيسية · الفئات · السلة · الحساب
- Horizontal-scroll rows for categories / sellers / ateliers (snap, no wrap).
- Sticky compact header (logo + search/cart); large tap targets (≥ 44px); FAB where it fits.

### Desktop (≥ 1024px) — make it genuinely better, not a stretched phone
- **12-column grid, 24px gutters, 64px+ outer margins** — editorial "magazine" feel.
- **Asymmetric hero**: image bleeds to one edge, text centered on the opposite side.
- Top **pill nav** (not bottom bar); sticky header with mega-category dropdown + search.
- Denser data: product grids **3–4 up**; tables instead of stacked cards; multi-column footer.
- Hover states: card lift + soft indigo shadow, quick-add on product cards, image zoom.
- Use the width — two-column editorial blocks (Special Offers, Journal, Tailoring CTA)
  side by side rather than stacked. Generous whitespace, large Playfair headings.
- Subtle, purposeful motion only (fade/slide on scroll, 150–250ms) — never janky.

Both breakpoints share the same Atlas tokens, RTL rules, and components — only the
**layout** changes. Verify each independently (screenshot mobile width AND desktop width).

## Stack reality

- **Seller/Admin UI = Laravel Blade** (`beldify-backend/resources/views/...`) using the
  **v3 component library** (`x-v3.section-card`, `x-v3.kpi-tile`, `x-v3.badge`, `x-v3.btn`,
  `x-v3.empty-row`). Reuse these — do not write raw markup when a v3 component exists.
- **Storefront UI = Next.js** (`beldify-frontend/`), App Router + Tailwind, React Query/SWR.
- **Logic/API = Laravel** controllers + services under `/api/v1`, Sanctum auth.
- Stitch output is a **visual reference only** — port it into Blade/React + Atlas tokens.
  Never drop the raw Stitch HTML (Tailwind CDN, inline styles) into the codebase.

## Execution model (MANDATORY on every change)

Never edit UI or logic files directly from the main session. For each invocation:

1. **Log it** — `/kb-spec log "<change>"` before any work.
2. **Query prior art** — `/kb-query` (and NotebookLM if configured) so the change reuses
   existing patterns (`[[seller-shell-layout]]`, `[[beldify-admin-v3-component-library]]`,
   `[[atlas-design-system]]`, `[[atlas-frontend-migration]]`).
3. **Spawn the orchestrator** via the Agent tool (`subagent_type="orchestrator"`). Hand it:
   - the target screen/route,
   - the Atlas tokens + Stitch reference paths above,
   - the split below.
4. The orchestrator fans out **in parallel**:
   - `frontend-engineer` → all UI (Blade views / v3 components / Next.js + Tailwind, RTL, a11y).
     This agent runs the **`impeccable`** skill for the design/quality pass — visual
     hierarchy, spacing, typography, color, motion, empty/error states — before handing back.
     (Inside kb-dev the Phase-5 chain `frontend-design → polish → audit` is equivalent.)
   - `backend-engineer` → all logic (controllers, services, API contracts, data the view needs).
   - `qa-engineer` → tests before "done" (Vitest/PHPUnit), plus RTL + i18n key checks.
5. **Design review** — run **`gemini`** as the design critic on the changed screen
   (screenshot + code together): does it match `screen.png` + Atlas tokens, RTL correct,
   mobile AND desktop both right? Feed gemini's findings back to `frontend-engineer`
   and loop until clean. `reviewer` checks API-contract + token compliance in parallel.
6. **Verify** — `verification-before-completion`: real test run + screenshots at BOTH
   mobile and desktop widths of the changed route (`http://localhost:7895/ar/...`).
   Evidence before claiming done.
7. **Capture** — `/kb-spec log done` + `/kb-ingest`.

### Toolchain (fixed)
| Stage | Tool |
|---|---|
| Implement UI | `frontend-engineer` agent |
| UI quality pass | `impeccable` skill (run by frontend-engineer) |
| Design critique | `gemini` (screenshot + code review, loop back to frontend) |
| Logic / data | `backend-engineer` agent |
| Tests | `qa-engineer` agent |
| Contract/token review | `reviewer` agent |
| Verify | `verification-before-completion` + mobile & desktop screenshots |

Trivial single-file token/copy fixes may skip fan-out but still log via `/kb-spec`.

### Why both roles, always
E-commerce screens are UI + logic coupled: a KPI card needs both the tile (frontend) and
the aggregation (backend); a status pill needs the enum mapping (backend) and the color
token (frontend). Editing one side alone produces drift. The orchestrator keeps them in sync.

## Per-surface checklist

When redesigning a surface, the frontend-engineer must cover:

- [ ] Matches `screen.png` layout and Atlas tokens (no off-palette colors).
- [ ] RTL correct: mirrored layout, logical properties, Arabic copy via `__('messages.*')` (Blade) or i18n keys (Next.js).
- [ ] All money in MAD/درهم; numbers localized.
- [ ] Reuses v3 components (Blade) or shared components (Next.js) — no duplicated markup.
- [ ] Empty / loading / error states present.
- [ ] Mobile: 2-up KPI grid + bottom tab bar; desktop: pill nav.
- [ ] a11y: focus rings, aria-labels on icon buttons, contrast ≥ AA.

And the backend-engineer must cover:

- [ ] Every value the view renders is supplied by the controller/service (no placeholder data left in markup).
- [ ] API responses under `/api/v1`, shapes documented in `docs/api/`.
- [ ] Status enums ↔ pill tints mapped in one place.

## Done means

Tests green (shown), the changed route screenshotted in `ar` locale, KB updated. Anything
less is "in progress", reported as such.
