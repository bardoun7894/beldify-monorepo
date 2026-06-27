---
name: "Marketplace Frontend + AI Review & P0 Backlog"
description: "The 2026-06-19 multi-agent storefront+AI review, its 8 P0 findings, and the shipped fixes (PRs monorepo #7/#8, backend #11)"
type: concept
tags: [fetch, seller, buyer, shop, payment, order, product, category, shipping, whatsapp]
sources: [sources/marketplace-frontend-ai-review-2026-06-19]
created: "2026-06-19"
updated: "2026-06-19"
---
# Marketplace Frontend + AI Review & P0 Backlog

A whole-storefront buyer-experience and AI-product review of Beldify, distinct from the conversion-only [[concepts/marketplace-completeness-roadmap]] in that it adds a dedicated AI-product-reviewer lens and adversarial verification of every high-severity finding. The review was run as a deterministic workflow — eight parallel review slices feeding one adversarial verifier per Critical/High finding — which both sharpened severities and refuted four plausible-but-wrong claims before they reached the report.

## The eight P0s and how each was fixed
1. **Grid quick-add submitted `product.id` as `stock_id`** — frontend resolves a real `stock_id` (now also returned by the backend list payload) and routes to the PDP when unresolvable.
2. **COD silently capped at 500 MAD** — a non-blocking amber notice plus a toast on the auto-switch to bank transfer.
3. **Bank transfer committed before the RIB/amount is shown** — the exact MAD amount and an "RIB appears after you place the order" notice now render before the place-order button (live RIB pre-fetch deferred; `getPaymentInstructions` is order-scoped).
4. **"Verified" badge rendered for every seller** — gated on a real `shop.is_verified` flag (added to the product API), in Atlas amber.
5. **PDP "Add to bag" login-walled while "Buy now" was guest** — the guest redirect was removed so both CTAs honor the `X-Guest-Token` guest path.
6. **Product cards showed no seller identity** — a seller-identity row (name + gated verified badge + rating) backed by new `store_*` payload fields.
7. **Category-page sort did nothing** — backend `CategoryController@getCategoryBySlug` now reads `sort` and applies the same ordering as the catalog (the verifier corrected this from a presumed frontend token mismatch).
8. **Fake "Live Chat" + dead phone FAB; FAQ over-promised payment/returns** — the support FAB now uses the real WhatsApp/tel/mailto channels and the FAQ/returns copy was aligned to reality.

## Delivery
P0s shipped across three PRs — monorepo #7 (frontend, 8/8) and #8 (P1 wave-1, stacked), backend #11 (sort + payload enrichment) — each verified with targeted tests, i18n parity, lint, and typecheck rather than a full-suite run, per the [[concepts/beldify-dormant-features-activation]] discipline of evidence-before-claim. A P1 wave-1 of seven further fixes (QuickView phantom add, coming-soon gateway gating, AI-review-summary placement, try-on disclaimer, shipping-copy localization, pluralization, tap-target sizing) followed.

## See also
- [[sources/marketplace-frontend-ai-review-2026-06-19]]
- [[concepts/beldify-buyer-ai-ux]]
- [[concepts/marketplace-completeness-roadmap]]
- [[entities/beldify]]
