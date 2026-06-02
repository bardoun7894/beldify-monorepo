---
source: gemini
model: gemini-2.5 (CLI 0.40.1)
date: 2026-06-02
target: Beldify storefront Atlas redesign — stable surfaces (foundation + PDP/profile/wishlist/tailoring/community)
scope: review (design + design-system drift)
---

## Prior art consulted
- /kb-query: Atlas tokens + RTL conventions + known pitfalls — [[concepts/atlas-design-system]], [[concepts/atlas-frontend-migration]], [[concepts/tailwind-arbitrary-value-slash-pitfall]], [[concepts/css-rtl-override-physical-properties]]. Key: `bg-[hsl(var(--primary)/0.1)]` fails JIT; Tailwind `primary.*`=amber/`secondary.*`=indigo (inverted); indigo-500 `#6366f1` ≠ Atlas Indigo.
- NotebookLM: n/a (not queried this pass)

## Gemini output
`ProductCard.tsx:266` - P0 - Hardcoded hex `#252555` (legacy deep navy) violates DESIGN.md (indigo-700/indigo-950). Replace `bg-[#252555]` with `bg-indigo-950`.
`Navbar.tsx:226` - P0 - Cart/Message pills `bg-amber-500 text-white` fail WCAG AA (~2.15:1). Replace `text-white` with `text-amber-950`. (also 240, 282, 480, 492)
`MobileBottomNav.tsx:70` - P0 - Cart pill `bg-amber-500 text-white` fails AA. Replace with `text-amber-950`.
`ProductCard.tsx:237` - P1 - Banned numbered `secondary-*` scale (`text-secondary-600`, `bg-secondary-50/50`). Replace with literal `text-indigo-700` / `bg-indigo-50/50`.
`ProductCard.tsx:251,254` - P1 - Missing `.currency-mad` util on price spans (MAD must stay LTR in AR).
`TraditionalProductCard.tsx:246` - P1 - Missing `.currency-mad` util on price spans.
`products/[id]/page.tsx:501,506` - P1 - Missing `.currency-mad` util on price spans.
`wishlist/page.tsx:185` - P1 - Missing `.currency-mad` util on price spans.
`products/[id]/page.tsx:689` - P1 - Bespoke radial gradient legacy `#3b3b6d`; gemini suggested `#6366f1`. [REJECTED — see synthesis]
`ProductCard.tsx:243` - P2 - Physical `ml-1` in rating badge breaks RTL. Use `ms-1`.
`ShopCard.tsx:117` - P2 - Physical `ml-1` breaks RTL. Use `ms-1`.
`community/page.tsx:317` - P2 - Physical `ml-2` on list breaks RTL. Use `ms-2`.

## Claude synthesis
- **Load-bearing (apply):** the two P0 contrast fixes (amber-500 + white text → amber-950) and the legacy `#252555` hardcode → `indigo-950`; the `secondary-*` numbered-scale usage → literal indigo; the physical `ml-*` → `ms-*` RTL nits. All match KB prior art.
- **Verify-then-apply:** the `.currency-mad` findings depend on whether that utility exists in `globals.css`; if it does, applying is correct, else use an inline `dir`/`unicode-bidi` equivalent.
- **REJECTED (noise):** PDP:689 `#3b3b6d` → `#6366f1`. Contradicts [[concepts/atlas-frontend-migration]] — indigo-500 `#6366f1` is explicitly NOT Atlas Indigo and was corrected away. Correct fix is `indigo-950`, not indigo-500.
