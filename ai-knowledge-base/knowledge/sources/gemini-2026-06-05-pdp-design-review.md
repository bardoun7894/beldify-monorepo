---
name: Gemini review — PDP info pane design (2026-06-05)
description: Gemini 2.5 Pro design review of the PDP info pane (products/[id]/page.tsx lines 1370-1766) with Claude synthesis — seller-card void, RTL description direction, spacing hierarchy, empty-rating noise
type: source
sources: [raw/gemini/2026-06-05-pdp-design-review.md]
created: 2026-06-10
updated: 2026-06-10
---

# Gemini review — PDP info pane design (2026-06-05)

## Summary
A Gemini CLI (gemini-2.5-pro) design review of the Beldify PDP info pane (`beldify-frontend/src/app/products/[id]/page.tsx`, lines 1370–1766), grounded in KB prior art on the Atlas Indigo + Saffron Amber palette and RTL-default i18n. Four findings; Claude's synthesis applied three as surgical edits, partially actioned the fourth, and flagged one data (not code) problem.

## Key points
- **#1 Seller card — huge empty whitespace**: `flex-1` stretches aimlessly when location/url are missing; in RTL it pushes the avatar right leaving a gaping void left. Fix: `justify-between` and anchor with an Indigo "visit shop" CTA so the card always feels full. Applied.
- **#2 Description — English text in an RTL page**: forcing LTR text into RTL flow breaks reading; punctuation floats to the wrong side. Fix: `dir="auto"` so the browser detects language from the first strong character, plus `text-start` for logical alignment. Applied.
- **#3 Visual hierarchy — uniform `gap-5`**: destroys Gestalt grouping; price/title get the same distance as cart/seller. Recommended `space-y-*` grouping with larger section margins + soft `border-t`. Partially actioned: tightened grouping via a divider + always-present seller subtitle rather than a full flex restructure (changes kept surgical).
- **#4 Rating row — "0.0 (0 reviews)" + empty stars**: negative social proof penalizing new products. Fix: conditional render — show a "منتج جديد / New" Saffron-amber badge when `reviews_count === 0` instead of empty stars. Applied.
- **Data flag (not a code issue)**: the reviewed product's main image was a stock photo of a woman in a shirt/sunglasses, not a caftan — a seed/catalog data problem, flagged to the user.

## See also
- [[concepts/atlas-design-system]]
- [[concepts/atlas-frontend-migration]]
