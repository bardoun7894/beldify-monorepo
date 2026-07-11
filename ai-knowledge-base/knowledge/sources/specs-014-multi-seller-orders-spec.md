---
name: specs/014-multi-seller-orders/spec.md
description: Auto-synced from specs/014-multi-seller-orders/spec.md
type: source
sync_origin: specs/014-multi-seller-orders/spec.md
sync_hash: 51b3b1d28357625f
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/014-multi-seller-orders/spec.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Feature Specification: Multi-Seller Order Splitting

**Feature Branch**: `014-multi-seller-orders`
**Created**: 2026-06-19
**Status**: Draft
**Input**: User description: "Check the full multi-seller marketplace; the one real structural gap is that a basket spanning multiple sellers becomes a single order owned by the first item's seller. Split a multi-seller basket into one order per seller under a shared buyer-facing group, with correct commission/revenue/payout attribution. Decisions: per-seller shipping fee; one payment for the whole basket (COD limit on basket total); defer cross-seller coupons (single-seller scope in v1)."

## Context & Problem

Beldify is a multi-seller marketplace, but checkout does **not** split a basket by seller. `OrderService::createCheckoutOrder()` (`app/Services/OrderService.php:111-156`) reads `$data['items'][0]['stock_id']`, takes that first item's `store_id`, and creates **one** `orders` row owning **every** line — even lines belonging to other sellers.

Consequence:
- Sellers other than the first never see their sold items (`SellerOrderApiController` / seller views query `Order::where('store_id', …)`).
- Commission, `StoreRevenue`, and payouts mis-attribute: `OrderObserver::createCommissions()` (`app/Observers/OrderObserver.php`) bills the whole `subtotal` to the first seller's `commission_rate` and records all revenue against the first store.
- Per-seller fulfillment is impossible (one `status`, one `shipped_at` for items from N sellers).

**Key architectural fact that scopes this work:** the system *already* treats `order = single store` end-to-end. `orders.store_id` is a hard FK; commission, revenue, fulfillment (`shipped_at`/`delivered_at`), seller order views, and the payout ledger all operate **per single-store order**. A per-seller order is therefore already a perfectly-formed unit. This feature does **not** rewrite that model — it introduces a buyer-facing **order group** (parent) and makes checkout create **one order per seller** under it, instead of dumping everything into the first seller's order. Existing per-order consumers keep working unchanged.

## Locked Decisions (from product owner)

| Decision | Choice | Implication |
|---|---|---|
| Shipping | **Per-seller shipping fee** | Each sub-order computes its own `shipping_amount` (its own line count + subtotal). Group total sums them. Buyer sees a per-seller breakdown. |
| Payment | **One payment for the whole basket** | Buyer pays once. COD ≤ `cart.cod_max_amount` is checked against the **basket total**, once. On payment, **all** sub-orders flip to `paid` together, so each fires its own `OrderObserver` commission + revenue. |
| Coupons | **Defer cross-seller coupons (v1)** | A coupon applies only within the single seller's sub-order that issued it. No basket-wide / platform-funded coupon math in v1. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-seller basket splits into correct per-seller orders (Priority: P1)

A buyer adds a caftan from Seller A and a bag from Seller B to one basket and checks out once. The system creates one buyer-facing order group and two seller orders (one per seller), each carrying only that seller's items, its own subtotal, and its own shipping fee. The buyer pays a single basket total.

**Why this priority**: This is the defining multi-vendor capability and the source of the money-attribution bug. Without it, every other money calculation downstream is wrong for multi-seller baskets.

**Independent Test**: POST the checkout endpoint with items from two stores; assert exactly one `order_group` row and two `orders` rows are created, each `orders.store_id` distinct, each holding only its own `order_items`, and `SUM(orders.total_amount) == order_group.total_amount`.

**Acceptance Scenarios**:

1. **Given** a basket with 2 items from Store A and 1 item from Store B, **When** the buyer submits checkout, **Then** one `order_group` and two `orders` are created, A's order has 2 items, B's order has 1 item, and no order contains another store's items.
2. **Given** the same basket, **When** orders are created, **Then** each order's `shipping_amount` is computed from only that store's lines, and `order_group.shipping_amount == A.shipping_amount + B.shipping_amount`.
3. **Given** a single-seller basket (all items one store), **When** checkout runs, **Then** exactly one `order_group` wrapping exactly one `orders` row is created — behavior is otherwise identical to today (backward compatible).
4. **Given** any item fails the stock check mid-checkout, **When** the transaction runs, **Then** the **entire** basket rolls back — no partial group, no partial orders, no stock decremented.

---

### User Story 2 - Each seller is paid correctly for only their items (Priority: P1)

When the basket is paid, each seller's commission, store revenue, and payout-eligible balance reflect exactly their own items at their own commission rate — never another seller's amounts.

**Why this priority**: Money correctness. The whole point of splitting is that `OrderObserver` then fires once per sub-order against the right store, producing correct `Commission` + `StoreRevenue` rows.

**Independent Test**: Mark the order group paid; assert each store has a `Commission` (type `store`) and `StoreRevenue` row whose amount equals its own sub-order subtotal × its own `commission_rate`, and that no store has rows for another store's amount.

**Acceptance Scenarios**:

1. **Given** a paid 2-seller group, **When** payment is recorded, **Then** each sub-order independently transitions to `payment_status = paid` and each fires `createCommissions()` exactly once against its own store.
2. **Given** Store A has `commission_rate` 10% and Store B 15%, **When** the group is paid, **Then** A's commission = A.subtotal × 10% and B's commission = B.subtotal × 15% — rates never cross.
3. **Given** a seller opens their payout page after the group is paid, **When** available balance is computed, **Then** it includes only that seller's realized `StoreRevenue` (consistent with the existing `available = realized − paid − open` rule; the payout ledger still never mutates `store_revenues`).

---

### User Story 3 - Buyer sees one grouped order; sellers see their slice (Priority: P2)

The buyer's order history shows the basket as a single grouped order with per-seller sub-orders, each with its own status and tracking. Each seller dashboard shows only its own sub-order, exactly as today.

**Why this priority**: Required for a coherent post-purchase experience (one basket, multiple shipments) but the money correctness (P1) can ship and be verified via API before the buyer UI aggregation lands.

**Independent Test**: As a buyer, fetch order history and confirm the multi-seller purchase renders as one group with two sub-order cards (per-seller status). As each seller, confirm only that seller's sub-order is visible.

**Acceptance Scenarios**:

1. **Given** a paid 2-seller group, **When** the buyer views order history, **Then** they see one group entry with two sub-orders, each showing its own status, items, shipping fee, and tracking.
2. **Given** Seller A marks its sub-order `shipped` while Seller B's is still `pending`, **When** the buyer views the group, **Then** A's sub-order shows `shipped` (with tracking) and B's shows `pending` independently.
3. **Given** Seller B logs into the seller dashboard, **When** they open orders, **Then** they see only sub-order B and never sub-order A or the buyer-facing group total.

---

### Edge Cases

- **Out-of-stock mid-checkout** → entire basket transaction rolls back atomically (no partial split). Existing per-line `lockForUpdate` + stock check is preserved.
- **COD over limit on basket total** → the basket total (sum across sellers) is checked against `cart.cod_max_amount`; if exceeded, checkout is rejected with the existing COD message before any order is created. COD remains Morocco-only.
- **Offline transfer (bank/WU/etc.)** → one payment proof is uploaded for the whole **group**; on admin approval, all sub-orders flip to `paid`.
- **Guest checkout (`X-Guest-Token`, `customer_id` null)** → splitting behaves identically; the group is owned by the guest, sub-orders carry null `customer_id`.
- **Suspended seller in basket** → that seller's line is rejected at validation (cannot create an order for a suspended store); buyer is told which item is unavailable. [NEEDS CLARIFICATION: reject whole basket vs. drop the suspended seller's line and continue?]
- **Single-seller basket** → group of one; must be byte-for-byte equivalent in money terms to today's single order.
- **Per-seller free-shipping threshold** → each sub-order evaluates `ShippingMethod`/flat-config thresholds against its **own** subtotal, not the basket total.
- **Coupon present on a multi-seller basket (v1)** → the coupon discounts only the sub-order of the seller it belongs to; other sub-orders are undiscounted. A platform-wide code is out of scope for v1.
- **Notifications** → each seller receives its own `OrderPlacedNotification` for its own sub-order (N notifications for N sellers), not one notification for the whole basket.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Checkout MUST group the validated basket lines by each line's resolved `stock.store_id` and create exactly one `orders` row per distinct store.
- **FR-002**: Checkout MUST create exactly one `order_group` (buyer-facing parent) per checkout, and link every created `orders` row to it via `order_group_id`.
- **FR-003**: Each per-seller `orders` row MUST contain only that seller's `order_items`; no order may reference a stock belonging to a different store.
- **FR-004**: Each per-seller order MUST compute its own `subtotal`, `tax_amount`, `shipping_amount`, and `discount_amount` from only its own lines (per-seller shipping).
- **FR-005**: The `order_group` MUST store the buyer-facing aggregates: `subtotal`, `shipping_amount`, `tax_amount`, `discount_amount`, `total_amount`, each equal to the sum across its sub-orders.
- **FR-006**: The system MUST enforce the COD ceiling and Morocco-only rule against the **group** `total_amount` exactly once per checkout, before any order is persisted.
- **FR-007**: The entire split (group + all sub-orders + all items + all stock decrements + all history rows) MUST execute in a single database transaction; any failure MUST roll back the whole basket.
- **FR-008**: Payment MUST be modeled once at the group level. When the group becomes paid, every sub-order MUST transition to `payment_status = paid`, each independently triggering its existing commission + `StoreRevenue` creation.
- **FR-009**: Commission and `StoreRevenue` for each sub-order MUST use that sub-order's own store and that store's own `commission_rate` — no cross-seller bleed.
- **FR-010**: Each seller MUST be able to view, and update the status of, only their own sub-order; the buyer-facing group total MUST NOT be exposed to sellers.
- **FR-011**: The buyer MUST be able to view a multi-seller purchase as a single group with per-seller sub-orders, each showing its own status and tracking independently.
- **FR-012**: A single-seller basket MUST remain backward compatible: same money outcome as today, wrapped in a group of one, with all existing per-order consumers (seller views, commission, revenue, payout, fulfillment) unchanged.
- **FR-013**: Each seller MUST receive their own new-order notification for their own sub-order.
- **FR-014**: Stock MUST be decremented per line under lock, identical to today, regardless of which sub-order the line lands in.
- **FR-015**: For offline-transfer methods, one payment proof MUST attach to the group; group approval MUST mark all sub-orders paid.
- **FR-016**: v1 coupons MUST apply only within the sub-order of the issuing seller; no basket-wide coupon is supported in v1.
- **FR-017**: The checkout quote (`POST /api/orders/quote`) MUST return a per-seller breakdown (each seller's subtotal, shipping, tax, discount) plus the group totals and a single `cod_allowed` flag evaluated on the group total, so the checkout UI can show an itemized per-shipment summary.
- **FR-018**: The order-confirmation flow (including guest, which today reads a single order from `sessionStorage.beldify_last_order`) MUST carry the group reference so the confirmation page can enumerate all sub-orders of the basket, not just one.

## Integration Touch Points (grounded in current code)

The only clean path introduces the **OrderGroup** anchor; every payment/confirmation surface hangs off it.

| Surface | File / endpoint today | Change |
|---|---|---|
| Split logic | `OrderService::createCheckoutOrder()` `app/Services/OrderService.php:100` | Group lines by `stock.store_id`; create the group, then one order per store inside one `DB::transaction()`. Extract per-seller order creation; move COD assertion + total to group level. |
| Stock atomicity | `resolveCheckoutItem()` `lockForUpdate` `:203` | Unchanged — keep all per-line locks inside the single outer transaction. |
| Commission/revenue | `OrderObserver::createCommissions()` | **No change** — fires correctly per sub-order on `paid`. |
| Seller order views | `Order::where('store_id', …)` (seller API/Blade) | **No change** — sub-orders carry correct `store_id`. |
| COD gate | `assertCodAllowed()` `:259` | Evaluate once on group total (Option A — matches locked decision). |
| Quote | `POST /api/orders/quote` | Return per-seller breakdown + group totals (FR-017). |
| Offline payment proof | `POST /api/orders/{orderNumber}/payment-proof` | Attach one proof to the **group**; approval fans `paid` to all sub-orders (FR-015). |
| Online payment (future) | `PaymentWebhookController` `POST /api/payments/webhook/{gateway}` | Gateway payment ties to the group; mark-paid propagates down. Deferred (gateways off). |
| Guest confirmation | `sessionStorage.beldify_last_order` (FE) | Store group ref / array (FR-018). |
| Buyer order history (FE) | buyer `/orders` list | Aggregate sub-orders by group. |

### Key Entities

- **OrderGroup** *(new)*: The buyer-facing parent for one checkout. Owns the single payment (method, status, proof), the single shipping address/`shipping_info`, the basket-level aggregate money fields, and a unique `group_number`. Has many `orders`. Owned by a user (or guest token). Does **not** carry per-seller items or per-seller status.
- **Order** *(existing, semantics preserved)*: Now a **per-seller sub-order**. Gains a nullable `order_group_id` FK. Still single-store (`store_id`), still the unit for status, fulfillment, commission, revenue, and payout. Everything that queries `orders` today continues to work.
- **OrderItem** *(unchanged)*: Belongs to exactly one `orders` row, whose `store_id` matches the item's `stock.store_id`.
- **Commission / StoreRevenue** *(unchanged)*: Created per sub-order by `OrderObserver` on `paid`. Correct by construction once orders are split.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any basket with items from N distinct sellers, checkout produces exactly 1 `order_group` and exactly N `orders`, with each item attributed to the order whose `store_id` matches its `stock.store_id` (100% of cases, verified by test).
- **SC-002**: For any paid multi-seller group, `SUM(per-seller Commission.amount)` and `SUM(StoreRevenue.amount)` equal the sum of each seller's own `subtotal × own commission_rate` — zero cross-seller mis-attribution (0 incidents in test matrix).
- **SC-003**: `order_group.total_amount == SUM(orders.total_amount)` and `order_group.shipping_amount == SUM(orders.shipping_amount)` for 100% of created groups.
- **SC-004**: A single-seller basket yields the identical buyer-paid total and identical commission/revenue rows as the pre-feature behavior (regression test passes).
- **SC-005**: A failed stock check on any line leaves zero new rows in `order_groups`, `orders`, `order_items`, `order_history`, and zero stock decrements (atomicity verified).
- **SC-006**: Each seller's payout-available balance reflects only their own realized revenue after a multi-seller group is paid (consistent with the existing payout ledger rule).

