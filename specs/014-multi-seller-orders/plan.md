# Implementation Plan: Multi-Seller Order Splitting

**Branch**: `014-multi-seller-orders` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-multi-seller-orders/spec.md`

## Summary

Introduce an **`order_groups`** parent (one row per checkout) and make `OrderService::createCheckoutOrder()` split the basket by `stock.store_id`, creating **one `orders` row per seller** under the group inside a single `DB::transaction()`. The existing per-order machinery (`OrderObserver` → `Commission` + `StoreRevenue`, seller `store_id` views, fulfillment columns, payout ledger) is reused unchanged — it is already single-store-correct. New work is concentrated in: one migration, one new model, a refactor of one service method, the quote/payment-proof endpoints, and buyer-facing aggregation in the FE.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 10), TypeScript 5.x (Next.js 15 App Router)
**Primary Dependencies**: Eloquent, Sanctum, existing `OrderService`/`OrderObserver`/`StoreRevenue`/`Commission`; FE axios service layer + CartContext
**Storage**: MySQL (prod) / SQLite (test parity). New table `order_groups`; additive column `orders.order_group_id`
**Testing**: PHPUnit Feature tests (`php artisan test`) for BE; Vitest for FE (`npm run test` from `beldify-frontend` — never bare vitest, see [[memory: beldify-vitest-dual-config-hazard]])
**Target Platform**: Web (Docker dev `docker-compose.dev.yml`, hot reload)
**Project Type**: Web (Laravel backend + Next.js frontend monorepo)
**Performance Goals**: Checkout split adds O(sellers) order inserts inside one transaction — negligible (<5 sellers/basket typical)
**Constraints**: Strict atomicity (whole basket rolls back on any failure); zero regression for single-seller baskets; payout ledger must never mutate `store_revenues`
**Scale/Scope**: 1 migration, 1 model, ~1 service refactor, 2 endpoints, ~4 FE surfaces, full money-attribution test matrix

## Constitution Check

*GATE: money-correctness + backward-compat are the load-bearing gates.*

- ✅ **Single source of truth preserved** — `StoreRevenue` remains authoritative; payout ledger untouched.
- ✅ **No new write path for commission/revenue** — `OrderObserver` is reused verbatim; we only create more (correctly-scoped) `Order` rows.
- ✅ **Atomicity** — all inserts + stock decrements in one outer `DB::transaction()`.
- ✅ **Additive migration** — `orders.order_group_id` nullable; existing orders unaffected; backfill not required.
- ✅ **TDD** — failing money-attribution + atomicity tests written before the refactor.
- ⚠️ **Backward-compat gate** — single-seller basket must produce byte-identical money outcome; covered by SC-004 regression test.

## Data Model

### New table: `order_groups`
```
id                bigint pk
group_number      string unique         # GRP-YYYYMMDD-XXXXXX
user_id           bigint nullable fk     # null for guest
customer_id       bigint nullable fk
payment_method    string                 # normalized (cod, bank_transfer, …) — single basket payment
payment_status    string default pending # pending | awaiting_payment | paid
subtotal          decimal(10,2)          # Σ sub-orders
tax_amount        decimal(10,2)
shipping_amount   decimal(10,2)          # Σ per-seller shipping
discount_amount   decimal(10,2)
total_amount      decimal(10,2)          # buyer-paid basket total (COD-checked)
shipping_info     json                   # one shipping address for the basket
payment_proof_path string nullable       # one proof for offline transfer (fans out on approval)
metadata          json nullable
timestamps + softDeletes
```

### Altered table: `orders` (additive)
```
order_group_id    bigint nullable fk → order_groups  (index)
```
Every other `orders` column keeps its current meaning. `store_id`, status, fulfillment, commission/revenue all stay per sub-order.

**Naming/convention notes (match existing):** `group_number` mirrors `OrderService::generateOrderNumber()` style (`ORD-Ymd-RAND` → `GRP-Ymd-RAND`); `softDeletes` like `orders`; `shipping_info` JSON mirrors `orders.shipping_info`.

## Refactor Approach — `OrderService`

Extract today's single-order body into `createSellerOrder(array $lines, array $ctx)` and orchestrate the group around it:

```
createCheckoutOrder(data, user):
  DB::transaction:
    resolved = data.items map resolveCheckoutItem   # keeps lockForUpdate + stock check
    byStore  = group resolved by stock.store_id      # NEW
    groupSubtotal = Σ resolved.subtotal
    groupShipping = Σ computeShipping(store lines, store subtotal, methodId)  # per seller
    groupTax      = Σ per-seller tax
    groupDiscount = resolveDiscount applied to issuing seller's slice only (v1)
    groupTotal    = groupSubtotal + groupTax + groupShipping − groupDiscount
    assertCodAllowed(method, groupTotal, country)    # ONCE on basket total (Option A)
    group = OrderGroup::create({ group_number, payment_method, payment_status, …group totals…, shipping_info })
    foreach (storeId, lines) in byStore:
       order = createSellerOrder(lines, { group_id, payment_method, payment_status, store-level shipping/tax })
       # creates Order(store_id, order_group_id), items, OrderHistory, decrements stock
    return group->load('orders.items')
  after commit: notify EACH seller (OrderPlacedNotification per sub-order)
```

Payment propagation: a `OrderGroup::markPaid()` sets group `payment_status=paid` then, in a transaction, sets each child `orders.payment_status=paid` — each child's existing `OrderObserver::updated()` fires `createCommissions()` against its own store. **No observer change.**

## API Contract Changes

| Endpoint | Change |
|---|---|
| `POST /api/orders/quote` | Response gains `sellers: [{ store_id, store_name, subtotal, shipping_amount, tax_amount, discount_amount, items[] }]` plus existing top-level group totals + single `cod_allowed` (group total). Backward compatible: keep flat totals. |
| `POST /api/orders/checkout` (`OrderCheckoutController`) | Returns the `OrderGroup` (with `orders[]`) instead of a single `Order`. Add `group_number`. Keep a back-compat `order_number` = first sub-order for old clients during transition. |
| `POST /api/orders/{groupNumber}/payment-proof` | Accept a group number; attach one proof to the group. (Keep per-order path working for single-seller back-compat.) |
| Seller order endpoints | **Unchanged.** |

New `OrderGroupResource` for buyer-facing serialization; sellers continue to use the existing `Order` resources.

## Frontend Changes

- **CartContext / cart page** — group line items by `seller` (helper already stubbed); show per-seller subtotal + shipping.
- **Checkout page** — call the new quote shape; render per-seller shipment breakdown; submit once; read back `group_number`.
- **Order confirmation** — store the **group** (or sub-order array) in `sessionStorage.beldify_last_order` (guest-safe, FR-018); enumerate sub-orders.
- **Buyer order history (`/orders`)** — fetch groups; render one card per group with per-seller sub-order rows (independent status/tracking).
- **Seller dashboard** — no change.

## Test Strategy (TDD — write first)

**Backend (PHPUnit Feature):**
1. `multi_seller_basket_splits_into_one_order_per_seller` (SC-001)
2. `group_total_equals_sum_of_suborder_totals` + shipping sum (SC-003)
3. `paid_group_creates_correct_per_seller_commission_and_revenue` with differing `commission_rate` (SC-002)
4. `single_seller_basket_is_money_identical_to_legacy` (SC-004 regression)
5. `stock_failure_rolls_back_entire_basket` — zero rows in all 4 tables, no decrement (SC-005)
6. `cod_over_limit_on_group_total_is_rejected` before any insert
7. `guest_multi_seller_checkout` (null customer_id) splits correctly
8. `suspended_seller_in_basket_rejects_whole_basket` (named item)
9. `each_seller_receives_own_order_placed_notification`

**Frontend (Vitest):** quote→per-seller breakdown render; cart grouping; confirmation enumerates sub-orders; order-history group card.

## Migration & Deploy

- 1 migration creating `order_groups` + 1 adding `orders.order_group_id` (or combined). Additive, reversible. SQLite-parity guard for tests.
- No backfill needed (historical orders simply have null `order_group_id`).
- Deploy = `php artisan migrate` + container restart for opcache ([[memory: beldify-seller-register-api]]). No seeder.
- Clear config/route cache after deploy.

## Rollout / Backward Compatibility

- Single-seller path is the dominant existing case → must be regression-locked (SC-004).
- Old FE clients still get a usable `order_number` (first sub-order) during the transition window.
- Online-gateway webhook (`PaymentWebhookController`) is **out of scope** (gateways deferred [[memory: beldify-payment-gateway-state]]); when activated, the gateway payment ties to the group and propagates `paid` down — noted for the future feature.

## Complexity Tracking

| Decision | Why | Rejected alternative |
|---|---|---|
| New `order_groups` parent | Single payment + one proof + buyer aggregation need one anchor row | "Just a shared `order_group_id` string" — nowhere to hold group payment/proof/totals |
| Reuse `Order` as sub-order | Entire system is already single-store-correct | Parent/child where children are a new type — would force rewriting every per-order consumer |
| Call per-seller creation N× in one txn | Preserves `lockForUpdate` atomicity + existing validation | Batch insert refactor — higher risk to the atomicity contract |
