---
name: docs/MARKETPLACE_GAP_ANALYSIS.md
description: Auto-synced from docs/MARKETPLACE_GAP_ANALYSIS.md
type: source
sync_origin: docs/MARKETPLACE_GAP_ANALYSIS.md
sync_hash: 6cf3c27212c14ed5
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from docs/MARKETPLACE_GAP_ANALYSIS.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Beldify Marketplace — Full Gap Analysis (Backend + Frontend)

_Generated 2026-06-02. Covers catalog, PDP, cart, checkout, calculations, orders & tracking,
seller flows, payments, admin, ops. Read alongside `UX_IMPROVEMENTS.md`._

## Verdict
Backend ≈ 80% of a real marketplace, frontend ≈ 60%, **payments real = 0% (COD only now)**.
Not launchable until the 🔴 blockers below are closed. Closest path to launch = COD + the
server-side total recompute fix + seller order-status unblock.

---

## 🔴 BLOCKERS (must fix before taking real money / sellers)

### 1. Server TRUSTS client-supplied prices & totals — price-tampering hole
The checkout I wired stores money values verbatim from the browser. An attacker can checkout
for any price.
- `app/Services/OrderService.php:67-71` — subtotal/tax/shipping/discount/total stored as `$data[...] ?? 0`
- `app/Services/OrderService.php:107` — `unit_price` taken from client, only falls back to stock price if absent
- `app/Services/CommissionService.php:50` — commission computed on the (untrusted) `$order->total`
- Coupon: `coupon_code` stored without re-validating expiry/usage or that `discount_amount` matches
**Fix:** in `createCheckoutOrder`, recompute every money field server-side from `Stock`/`ProductVariant`
prices + active coupon + tax rule + shipping rule; ignore client totals (or 422 on mismatch).

### 2. Payments are mocked (COD is the only real path)
- `app/Http/Controllers/Api/Mobile/PaymentController.php` — `"Mock payment processing"`, no SDK
- No `stripe-php` / CMI / Payzone in `composer.json`; webhook has no signature verification
**Decision taken:** launch COD-only; integrate CMI/Payzone in Phase 1.5.

### 3. Seller cannot update order status (route bug)
- `SellerOrderController.php:107-138` has a full `update()` (validates, broadcasts `OrderStatusChanged`)
- `routes/seller.php:24-26` restricts to `.only(['index','show'])` → seller is read-only, **can't mark shipped**
**Fix:** add `update` to the resource (or an explicit `PATCH seller/orders/{id}/status`), guard with policy.

### 4. No order-status notifications & order history not logged
- `OrderStatusChanged` event broadcasts but **no listener** sends email/FCM — customer never told it shipped
- `OrderHistory` only gets the initial "Order placed" row (`OrderService.php:83-87`); transitions never logged
- `tracking_number` / `estimated_delivery` columns exist but are **never populated** by any controller
- Frontend timeline (`orders/[orderNumber]/page.tsx:32-48`) is a **hardcoded 4-step fake**, not real data
**Fix:** listener on status change → write `OrderHistory` + queued email/FCM; capture tracking on "shipped".

### 5. Guest COD order tracking missing
- Guests can place COD orders but there's **no public lookup** (order number + email) to track them
- `customer_id` stays null for guests (`Order.php`), so even login won't surface their order
**Fix:** `GET /api/track-order?number=&email=` public endpoint + a `/track` page.

### 6. Queue not actually used
- prod env sets `QUEUE_CONNECTION=redis` but there is **no `app/Jobs/`**, notifications run sync
**Fix:** make notifications `ShouldQueue` (OrderConfirmation already is), move FCM/image-resize to Jobs,
run `php artisan queue:work redis`.

### 7. Transactional emails incomplete
- Only `OrderConfirmation` (built this session, dispatched from `/api/orders/checkout`) + cart-recovery exist
- `password-reset.blade.php` view exists but **no Notification class** wires it
- No "order shipped/delivered" email
**Fix:** ResetPassword notification (ShouldQueue) + status-change emails.

---

## 🟡 HIGH

| Area | Gap | Evidence |
|------|-----|----------|
| Tax/VAT | Hard-coded 15% in cart, 20%/country guess on frontend, **not recomputed at order**; no address-based VAT | `Cart::recalculateTotals` / `OrderService:68` |
| Shipping | Free-threshold (500 MAD) only on frontend; backend stores client `shipping_amount` unchecked | `checkout/page.tsx:40-42`, `OrderService:69` |
| Seller onboarding (frontend) | `/seller/register` linked from 6 pages but **page doesn't exist** | footer, home, sellers, shops, faqs, about |
| Product moderation | Seller products go live instantly (`is_active=true`), no draft/approval queue | `Seller/ProductController@store` |
| Returns/refunds | Mobile API has cancel/return; **Next.js has no cancel/return UI**; no admin approval workflow | `Mobile/OrderController:211,312` |
| Coupon engine | Only `CartRecoveryCoupon`; no general promo model; mobile coupon flow incomplete | — |
| Dual store models | `StoreProfile` (legacy) + `StoreDetails` (new) overlap — pick one, migrate | — |
| Inventory race | Stock decremented without reservation/lock window between cart and order | `OrderService:119` |

---

## 🟢 MEDIUM (polish / scale)

- **Product list has no pagination** — returns ALL matches (`ProductController::index`); frontend no "load more".
- **Variant-level discounts unsupported** — discounts are product-level only.
- **Related-products discount % hardcoded to 21** — `ProductController:1305` (bug).
- **Stock semantic mismatch** — backend `status='in_stock'` vs frontend boolean `in_stock` (converted, but fragile).
- **No SEO on PDP** — no dynamic metadata, no `Product` JSON-LD; no sitemap/robots.txt anywhere.
- **No image zoom / size guide** on PDP.
- **Error tracking** — Slack logs only, no Sentry. `MockReviewService` still seeds fake reviews.
- Multi-currency model exists but no conversion; no SMS; est. <40% test coverage.

---

## ✅ Solid — already wired, don't rebuild
Catalog + variants (size/color/fabric) + multi-image (color-grouped) + filtering/sorting/search (server-side),
PDP variant selection + price/discount + reviews + related products, cart + coupon UI, **COD checkout
(wired this session)**, order list + detail pages, commissions/affiliate tracking, wishlist, community +
real-time messaging, **tailoring (~95%, the differentiator)**, RBAC + Sanctum (stateful/web guard), i18n/RTL
Arabic, admin panel (48 Blade controllers), CI/CD (10 workflows), Docker + S3/Contabo storage.

---

## What was changed this session (branch `006-phase1-launch-readiness`)
Backend (`beldify-backend` submodule):
- `OrderService::createCheckoutOrder` + `normalizePaymentMethod` (COD) + `OrderCheckoutController@checkout` (`POST /api/orders/checkout`) — creates COD order, returns `{id, order_number}`, dispatches queued `OrderConfirmation`.
- `OrderConfirmation` notification (ShouldQueue) + `emails/order-confirmation.blade.php` + `emails/password-reset.blade.php` (view only).
- `OrderController@store` fixed to delegate to `createCheckoutOrder` (was calling a non-existent method → 500).
- `tests/Feature/CodOrderCreationTest.php`.

Frontend (`beldify-frontend`):
- `orderService.createOrder` → posts to `/api/orders/checkout`, always sends `stock_id` (falls back to `product_id`).
- Checkout already redirects to `/order-confirmation?orderId=`.

### Still TODO from Phase 1 (not yet done)
Server-side total recompute (#1), seller status route unblock (#3), status-change listener + history + tracking (#4),
guest tracking (#5), `app/Jobs` + queue (#6), ResetPassword notification (#7), `/seller/register` page, `/seller/enter` SSO.

---

# Addendum (2026-06-02) — Categories, Reviews, Accounting deep-dive

## Categories & Subcategories — mostly complete, 3 real gaps
- **Model/tree:** ✅ self-referential `Category.parent_id` (Men/Women/Children → 14 subcats seeded). 7 API methods all implemented. Admin CRUD works.
- 🔴 **Parent categories show NO products** — `CategoryController@getCategoryBySlug` returns only stocks directly on that category; parents (parent_id=0) don't aggregate children's products → category landing pages look empty.
- 🔴 **Field-name mismatch** — backend returns `category_name_en/ar`; frontend `types/category.ts` expects `name_en/ar`. Fragile mapping.
- 🟡 Duplicate routes `/category/[slug]` and `/categories/[slug]` (identical). Inconsistent image URL in `getSubcategoriesByGender` (`asset()` vs storage helper). No self-ref FK on `parent_id`. No dedicated admin subcategory UI.

## Reviews — looks done but is MOSTLY MOCK + a schema bug
- 🔴 **Frontend reviews are 100% mock** — `ReviewsSection`/`ReviewForm` read from `mockReviewService` + `mockReviewsData` (only product '1' has data). Listing/submit never hit the real API. Only `ReviewCard.reactToReview` calls the real endpoint.
- 🔴 **Backend `MockReviewService` leaks into production** — `Api/Frontend/ReviewController@getProductReviews` falls back to FAKE reviews (`source: 'mock'`) when stock missing/DB error; frontend doesn't hide it.
- 🔴 **Schema mismatch on `is_approved`** — the live `reviews` table (migration 2024_11_26_000008) has `status` + `is_verified`, NOT `is_approved`. But `Product::getAverageRating/reviewsCount` (Product.php:84-94) query `->where('is_approved', true)` → empty/erroring ratings. Two conflicting reviews migrations exist (000002 has is_approved, 000008 has status). Must consolidate to one column.
- 🔴 **No approval/moderation** — new reviews hardcoded `status='pending'`, display filters `approved`, no admin queue/endpoint → submitted reviews never appear.
- 🔴 **Mobile `Api/Mobile/ReviewController` fully stubbed** (hardcoded arrays, no-op store/update/delete).
- 🟡 `is_verified_purchase` never computed from orders (frontend assumes true, backend false). No edit/delete review endpoints. Reactions lack per-user idempotency table.

## Accounting — ~50%, solid double-entry core, reports stubbed
- ✅ **Real double-entry engine**: `Transaction` (debit/credit) + AccountHead/Control/SubControl + ChartOfAccount; wired for purchase invoices, customer invoices, sales/purchase returns, stock adjustments, commissions (`CommissionAccountingService`). config/accounting.php fully configured.
- 🔴 **Reports stubbed (501)**: General Ledger, Account Ledger, Trial Balance all `AccountingController` TODO.
- 🔴 **Vouchers broken**: all `storeJournal/Payment/ReceiptVoucher` are TODO; views miss `$accounts` (crash); no `Voucher` model/migration.
- 🔴 **E-commerce orders create NO accounting entries** — paid orders never hit the ledger (only supplier/customer invoices do). Revenue/COGS not booked for storefront sales.
- 🟡 Balance Sheet view bug (`$account->name_en` should be `account_sub_control_name_en`). Income Statement hardcodes account codes. No Excel/PDF export. `CommissionAccountingService` defined but not auto-called on commission create.

