---
name: E-commerce completeness gap analysis (2026-06-03)
description: Ground-truth code audit of what was missing for a full e-commerce platform — funnel worked E2E; P0s were no real payment gateway, a crashing payment-proof upload, and a 404 search bar
type: source
sources: [raw/ecommerce-gap-analysis-2026-06-03.md]
created: 2026-06-10
updated: 2026-06-10
---

# E-commerce completeness gap analysis (2026-06-03)

## Summary
A ground-truth code audit (3 parallel Explore agents + direct inspection) of what was missing to complete a full e-commerce platform, dated 2026-06-03. The core buying funnel (browse → PDP → cart → COD/offline checkout → order tracking) worked end-to-end at audit time; the gaps were concentrated in payments, returns, shipping configuration, and a few runtime-crashing paths. It is the precursor to the broader 2026-06-10 completeness audit — several of its P0s were later fixed or scaffolded.

## Key points
- **Complete and wired E2E (at 2026-06-03)**: catalog PLP with filters/sort/pagination; PDP variant selection with stock guards; homepage merchandising from real data; cart + pre-applied coupon codes; wishlist persisted via `/api/wishlist`; atomic order creation with server-side totals and `lockForUpdate()` stock decrement (`OrderService::createCheckoutOrder()`); order history/tracking; COD (≤500 MAD ceiling server-side); offline transfers with proof model + admin verification; confirmation emails (queued); reviews read/submit with admin moderation.
- **P0 #1 — no real online payment gateway**: `Api/Mobile/PaymentController.php:148+` was 100% mock (`mockPaymentProcessing()`); card + PayPal UI-flagged "coming_soon"; no Stripe/PayPal/CMI SDK in composer.json. Recommendation: CMI (or Payzone / Maroc Telecommerce) for Morocco cards; PayPal/Stripe for diaspora.
- **P0 #2 — payment-proof upload crashed**: `PaymentProofUpload.tsx:116` called `orderService.uploadPaymentProof()` which did not exist in `orderService.ts` — the otherwise-ready offline flow threw at submit.
- **P0 #3 — search bar 404**: `Navbar.tsx:142` pushed `/search?q=` but no `/search` route existed; working search lived at `/products?q=`.
- **P1**: shipping cost hardcoded (30/70 MAD + free>500 in `checkout/page.tsx:40-42`; `ShippingMethod` DB config + `calculateShippingCost()` existed but were never fetched); coupons mock (`Api/Mobile/CouponController.php:42` hardcoded; no `Coupon` model/table existed; `Order` stored `coupon_code` string with no FK); no customer returns flow (`PurchaseReturn`/`SaleReturn` empty stubs); review reactions without per-user dedup; MegaOffer/ProductOffer models defined but unwired.
- **P2 hardening**: confirm a queue worker runs in prod; remove/guard mock fallbacks (reviews, coupons, home, mobile search); `Api/Mobile/SearchController.php` returned mock iPhone data; payment webhooks untested + PCI scope warning; category route lacked pagination.
- **Sequencing recommended**: quick wins in hours (uploadPaymentProof, search redirect); launch-blocking in days (gateway, shipping rates, coupon model); fast-follow (returns, review reactions, offers wiring).

## See also
- [[concepts/marketplace-completeness-roadmap]]
- [[concepts/multi-seller-ecommerce]]
- [[sources/2026-06-10-completeness-audit]]
