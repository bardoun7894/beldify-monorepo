# Research: multi-seller-orders

**Generated**: 2026-06-19
**Feature**: [spec.md](./spec.md)

<!-- Sections below are populated by /kb-spec <mode> before each Spec Kit phase. -->

## Prior art from KB

*Queried at 2026-06-19 · Mode: pre · Question: "Prior decisions and constraints for order creation, checkout, OrderService, OrderObserver commission and StoreRevenue creation, payment status flow, COD vs bank transfer, guest checkout, and how seller order views query store_id — anything that constrains splitting one multi-seller cart into per-seller orders under a shared group/parent."*

**The only clean implementation path introduces a parent order (or order group) record — one row per checkout session, N child orders per seller. Everything else (webhook, receipt upload, guest confirmation, COD gate) hinges off that anchor.**

| Constraint | Change required |
|---|---|
| `createCheckoutOrder` creates one order | Call N times inside one `DB::transaction()` (reuses validation; preserves atomicity) |
| `lockForUpdate()` atomicity | Preserved if all calls are in one transaction |
| `OrderObserver` / revenue / commission | **No change** — fires correctly per child order (double-registration P0 already fixed) |
| Seller order views (`store_id` filter) | **No change** — child orders have correct `store_id`, invisible to other sellers |
| COD cap applies to cart total | Product decision needed → **resolved: cart grand-total (Option A)** |
| Receipt upload is per `orderNumber` (`POST /api/orders/{orderNumber}/payment-proof`) | Need parent/group order model; one proof fans out to children |
| Webhook marks single `Order` paid (`PaymentWebhookController`) | Parent model propagates status (gateways currently deferred) |
| Guest `sessionStorage.beldify_last_order` single-order | FE must store group/array for guest confirmation |
| Quote endpoint (`POST /api/orders/quote`) returns one total | Needs per-seller breakdown for split checkout UI |

Corroborating concepts/sources already in the KB:
- `StoreRevenue` is the single source of truth for realized earnings; the payout ledger (`available = realized − paid − open`) **never mutates** `store_revenues`. [[memory: beldify-seller-payouts]]
- Commission system: store + platform morph to `Store::class`, affiliate to `User::class`; duplicate `OrderObserver` registration P0 fixed; `recordRevenue()` flat-fee double-count fixed. [[concepts/beldify-commission-system]]
- "No multi-seller order splitting is documented anywhere" — confirmed structural gap; orders reference a single `store_id`. [[concepts/marketplace-completeness-roadmap]]
- Guest checkout: server-computed totals via `/orders/quote` (client prices never trusted); COD ≤ 500 MAD else transfer + receipt upload. [[memory: beldify-guest-checkout]]

## Locked product decisions

1. **Per-seller shipping fee** — each sub-order computes its own `shipping_amount`; group sums them.
2. **One payment for the whole basket** — buyer pays once; COD ceiling checked on the **group total** (Option A); on payment all sub-orders flip to `paid`, each firing its own commission + revenue.
3. **Defer cross-seller coupons** — v1 coupon applies only within the issuing seller's sub-order.

## Architecture notes from KB

*Queried at 2026-06-19 · Mode: plan*

Conventions the `order_groups` table + `OrderService` split refactor MUST follow:

**Migrations**
- `dropForeign(['order_group_id'])` in `down()`; column-existence guards (`Schema::hasColumn`) before adding indexes; SQLite-parity-safe so in-memory test DB doesn't crash.
- `softDeletes()` on `order_groups` (mirror `orders` lifecycle); index `order_group_id` (it's on a concurrent-write hot path).

**Model + Observer**
- Observer registered in **AppServiceProvider only** — the 2026-06-10 P0 was a duplicate registration doubling commissions/revenue. [[concepts/beldify-commission-system]]
- Morph: `Store::class` for store/platform, `User::class` for affiliate — never bare strings.
- Add `order_group_id` to `Order::$fillable` explicitly (and `user_id` stays — was a flagged bug). [[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]
- `users` has no `name` column — any notification touching the user uses `$user->display_name`. [[concepts/laravel-user-display-name-accessor]]

**Service-layer transactions**
- **Instance injection, never static** — `app(OrderService::class)->…`; static `Service::method()` caused 118 white-screen 500s. [[concepts/laravel-static-service-anti-pattern]]
- **Caller owns the transaction**; `lockForUpdate()` stays on the **leaf** stock write, not the parent-group write. [[concepts/variant-write-service]] [[sources/ecommerce-gap-analysis-2026-06-03]]
- Server computes all totals (`/orders/quote`); FE never passes a client total. [[memory: beldify-guest-checkout]]

**Identifiers + API shape**
- Expose `group_number` (collision-safe, like `order_number`), not auto-increment `id`. [[sources/hooked-2026-06-09-opensouk-marketplace-loop]]
- `/api/v1/*`, envelope `{ data, message, pagination }`; content-locale via `LanguageService::contentLocale()` not hardcoded `$locale==='ar'`. [[concepts/i18n-7-locale-expansion]]
- Cache-served resources must not embed viewer-specific fields. [[concepts/open-souk-feature]]

**Next.js**
- `revalidate` + `useSWRInfinite` for order history; respect guest-token→auth merge path; **never gate toasts behind `isDebuggingEnabled()`** (systemic P0 that silenced checkout feedback); proxy field names must match Laravel `validate()` exactly (the `recipient_id`/`shop_id` 422 class of bug). [[sources/2026-06-10-frontend-completeness-audit]] [[concepts/buyer-seller-messaging-contract-fix]]

**Tests**
- `tests/Feature/`; `Hash::fake()` in `setUp()` (bcrypt factories OOM the suite); unique factory identifiers for `group_number`; **assert `Commission::count()` +1 per order, not 2** (double-observer guard). [[concepts/sqlite-migration-driver-guard]] [[concepts/beldify-commission-system]]
