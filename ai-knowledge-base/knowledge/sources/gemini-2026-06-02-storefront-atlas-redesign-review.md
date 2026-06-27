---
name: Gemini review — storefront Atlas redesign (stable surfaces)
description: Design-system drift review of storefront PDP/profile/wishlist/tailoring/community with Claude synthesis
type: source
tags: [migration, tailwind, css, atlas, design-system, rtl]
sources: [raw/gemini/2026-06-02-storefront-atlas-redesign-review.md]
created: "2026-06-03"
updated: "2026-06-03"
---
# Gemini review — storefront Atlas redesign (stable surfaces)

## Summary
A Gemini CLI design-system-drift review of the Beldify storefront's stable surfaces, with a Claude synthesis pass that accepted the load-bearing fixes and rejected one noise finding. All accepted findings match KB Atlas prior art.

## Key points
- **P0 WCAG AA contrast**: `bg-amber-500 text-white` (~2.15:1) fails AA — replace `text-white` with `text-amber-950` (Navbar pills 226/240/282/480/492, MobileBottomNav 70).
- **P0 legacy hardcode**: `ProductCard.tsx:266` `bg-[#252555]` → `bg-indigo-950` (DESIGN.md violation).
- **P1 banned numbered `secondary-*` scale** → literal `text-indigo-700`/`bg-indigo-50`.
- **P1 `.currency-mad` util missing** on price spans (MAD must stay LTR in AR): ProductCard, TraditionalProductCard, PDP, wishlist.
- **P2 physical margins** `ml-*` break RTL → logical `ms-*`.
- **REJECTED (noise)**: PDP:689 `#3b3b6d` → `#6366f1`. indigo-500 `#6366f1` is explicitly NOT Atlas Indigo; correct fix is `indigo-950`.

## See also
- [[concepts/atlas-design-system]]
- [[concepts/atlas-frontend-migration]]
- [[concepts/css-rtl-override-physical-properties]]
- [[concepts/tailwind-arbitrary-value-slash-pitfall]]
