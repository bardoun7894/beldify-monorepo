---
name: Marketplace Frontend + AI Review (2026-06-19)
description: 36-agent code-grounded review of the Beldify buyer storefront + AI suite — 11-section report, 8 P0s, adversarially verified, 4 findings refuted
type: source
sources: [raw/marketplace-frontend-ai-review/2026-06-19-full-frontend-ai-review.md]
created: 2026-06-19
updated: 2026-06-19
---

# Marketplace Frontend + AI Review (2026-06-19)

## Summary
A code-grounded review of the Beldify buyer-facing Next.js storefront and its buyer AI surfaces, run as a 36-agent workflow: 8 parallel review slices (one per journey stage / AI surface / cross-cutting dimension) plus one adversarial verifier per Critical/High finding. It produced an 11-section report scoring Frontend quality 7, Buyer UX 6, Trust 4, Conversion readiness 5, Marketplace clarity 5, and AI experience quality 7 (1–10). No live UI was available, so render-level findings are marked ASSUMED; everything else is `file:line`-verified.

## Key points
- The storefront leaks at three layers: **narrowing** (category sort silently ignored, missing seller/rating/location filters on the category path, fabricated filter values), **add-to-cart** (grid quick-add and QuickView identifier/phantom-toast bugs), and **trust** (unconditional "Verified" badge, silent 500-MAD COD cap, bank transfer committed before the RIB is shown, a fake `alert()` "Live Chat" FAB).
- The buyer AI suite (NL search assist, review summaries, size advisor, virtual try-on, recommendations) is **real, mounted, and ethically built** — Arabic-labeled, grounded, fallback-safe, consent-respecting. Its weakness is reach/placement (buried behind tabs, absent from the global Navbar), not gimmickry.
- Adversarial verification **refuted 4 findings**: a real 500-MAD free-shipping threshold and a complete buyer returns flow both exist end-to-end — the prior KB notes claiming otherwise are stale.
- The category-sort root cause was re-attributed by a verifier from a frontend token mismatch to a **backend** bug: `CategoryController@getCategoryBySlug` never read the `sort` param.
- All 8 P0s were subsequently implemented and shipped as PRs (monorepo #7 FE, #8 FE P1 wave-1, backend #11).

## See also
- [[concepts/marketplace-frontend-ai-review]]
- [[concepts/beldify-buyer-ai-ux]]
- [[concepts/marketplace-completeness-roadmap]]
- [[concepts/beldify-dormant-features-activation]]
- [[entities/beldify]]
