# Beldify — E-commerce Completeness Gap Analysis (2026-06-03)

Source: ground-truth code audit (3 parallel Explore agents + direct inspection). Goal: what's missing to complete a *full* e-commerce platform.

## TL;DR
The core buying funnel (browse → PDP → cart → COD/offline checkout → order tracking) **works end-to-end today**. The "full e-commerce" gaps are: **no real online card/PayPal gateway** (mocked), a **runtime-crashing offline-payment upload**, a **404 search bar**, and **hardcoded shipping / mock coupons / no customer returns**.

## ✅ Complete & wired end-to-end
- Catalog: category PLP with price/color/size/fabric filters, sort, pagination — `ProductController` `.when()` chains.
- PDP: variant (color/size/fabric) selection, stock guards, image gallery, add-to-cart, reviews display — `products/[id]/page.tsx`.
- Homepage merchandising: real best-sellers / new-arrivals / mega-offers / by-category (mock fallback on error).
- Cart + coupon apply at checkout (pre-applied codes discount the total).
- Wishlist: persisted via backend `/api/wishlist`.
- Order creation: atomic, server-side subtotal/tax(15%)/shipping/discount, stock decrement with `lockForUpdate()` — `OrderService::createCheckoutOrder()`.
- Order history + status/tracking on storefront — `orders/page.tsx`, `orderService.ts`.
- COD checkout (Morocco, ≤500 MAD ceiling enforced server-side).
- Offline transfers (bank/Wafacash/CashPlus/Western Union/MoneyGram): order + proof model + admin verification workflow.
- Order confirmation email + seller `OrderPlacedNotification` (queued).
- Reviews: read/display + submit (creates `status=pending`); admin moderation controller exists.

## ❌ P0 — Blocks "full e-commerce" / breaks at runtime
1. **No real online payment gateway.** `Api/Mobile/PaymentController.php:148+` is 100% mock (`mockPaymentProcessing()`). Card + PayPal are UI-flagged "coming_soon". No Stripe/PayPal/CMI SDK in `composer.json`. → Integrate a real gateway. For Morocco card payments that's **CMI** (or Payzone / Maroc Telecommerce); PayPal/Stripe for diaspora.
2. **Offline payment-proof upload crashes.** `PaymentProofUpload.tsx:116` calls `orderService.uploadPaymentProof()` which **does not exist** in `orderService.ts`. The whole offline flow (otherwise "ready") throws at submit. → Implement the method (POST `/api/orders/{orderNumber}/payment-proof`, multipart).
3. **Search bar → 404.** `Navbar.tsx:142` pushes `/search?q=` but no `/search` route exists. Working search lives at `/products?q=`. → One-line redirect fix.

## ⚠️ P1 — Important for a credible launch
4. **Shipping cost hardcoded.** `checkout/page.tsx:40-42` hardcodes 30/70 MAD + free>500. `ShippingMethod` DB config + `calculateShippingCost()` exist but are never fetched; no storefront shipping-methods endpoint. → Wire checkout to DB rates.
5. **Coupons are mock.** `Api/Mobile/CouponController.php:42` returns hardcoded coupons ("replace with actual model query"); **no `Coupon` model/table exists**. Only pre-applied codes work. `Order` stores `coupon_code` string, no FK. → Add Coupon model + table + validation.
6. **No customer returns flow.** `returns/page.tsx` is informational only; `PurchaseReturn`/`SaleReturn` models are empty stubs; no buyer return-request API. 100% manual admin. → Build RMA request + status.
7. **Review reactions broken.** Like/dislike increment counters with no per-user dedup (`TODO` in `ReviewController.php:341`). Mock review fallback in prod is risky.
8. **MegaOffer / ProductOffer unused.** Models defined but not wired to PDP price display or checkout discounts.

## 🔧 P2 — Hardening
- Confirm a queue worker runs in prod (notifications are `ShouldQueue`; no `app/Jobs/`).
- Remove/guard mock fallbacks (reviews, coupons, home, mobile search) so prod never serves fake data.
- `Api/Mobile/SearchController.php` returns mock iPhone data and is unused by storefront — implement or delete.
- Payment webhook handling untested; PCI scope once a card gateway lands (never store raw PAN).
- Category route lacks pagination (only `/products` paginates).

## Recommended sequencing
- **Quick wins (hours):** #2 uploadPaymentProof, #3 search redirect.
- **Launch-blocking (days):** #1 payment gateway (CMI + PayPal), #4 shipping rates, #5 coupon model.
- **Fast-follow:** #6 returns, #7 review reactions, #8 offers wiring.
