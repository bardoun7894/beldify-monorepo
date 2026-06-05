---
source: gemini
model: gemini-2.5-pro
date: 2026-06-05
target: beldify-frontend/src/app/products/[id]/page.tsx (PDP info pane, lines 1370-1766)
scope: review (design)
---

## Prior art consulted
- /kb-query: Atlas Indigo + Saffron Amber palette per [[beldify-design-tokens]]; primary=indigo-700, accent=saffron amber, page bg amber-50, rounded-2xl cards, ring-1 ring-amber-200. i18n RTL-default per [[beldify-i18n-architecture]].
- NotebookLM: n/a (offline)

## Gemini output
1. **Seller card — huge empty whitespace.** `flex-1` stretches aimlessly when location/url missing; in RTL pushes avatar right, leaves gaping void left. Fix: `justify-between`, anchor with an Indigo "visit shop" CTA so the card always feels full.
2. **Description — English text in RTL page.** Forcing LTR text into RTL flow breaks reading; punctuation floats to wrong side. Fix: `dir="auto"` so browser detects language from first strong char + `text-start` for logical alignment.
3. **Visual hierarchy — uniform gap-5.** Destroys Gestalt grouping; price/title get same distance as cart/seller. Fix: group related elements with `space-y-*`, separate sections with larger margins + soft border-t.
4. **Rating row — "0.0 (0 reviews)" + empty stars.** Negative social proof; penalizes new products. Fix: conditional render — show "منتج جديد / New" Saffron-amber badge when reviews_count === 0 instead of empty stars.

## Claude synthesis
- Load-bearing: #1 (seller void), #2 (RTL description), #4 (empty rating noise) — all confirmed in screenshot; applied as surgical edits.
- #3 partially actioned: tightened grouping via divider + always-present seller subtitle rather than a full flex restructure (keep changes surgical).
- NOT a code issue: the product's main image is a stock photo of a woman in a shirt/sunglasses, not a caftan — a seed/data problem to fix in the catalog, flagged to user.
