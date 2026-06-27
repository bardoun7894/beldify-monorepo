---
description: "Task list for multi-seller order splitting"
---

# Tasks: Multi-Seller Order Splitting

**Input**: Design documents from `specs/014-multi-seller-orders/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓
**Tests**: REQUIRED — this is money-correctness work; TDD is mandatory (failing tests first).

## Format: `[ID] [P?] [Role] [Story] Description`

- **[P]**: parallelizable (different files, no dependency)
- **[Role]**: BE (backend-engineer) · FE (frontend-engineer) · QA (qa-engineer)
- **[Story]**: US1 (split+attribution) · US2 (buyer-group/seller-slice views)

Paths: backend = `beldify-backend/`, frontend = `beldify-frontend/`.

---

## Phase 1: Setup

- [x] T001 [BE] Create branch `014-multi-seller-orders` off current head in **both** repos (monorepo + nested beldify-backend git repo — commit separately).

---

## Phase 2: Foundational (BLOCKS all stories)

- [x] T002 [BE] Migration `create_order_groups_table` in `beldify-backend/database/migrations/` — columns per plan.md Data Model (group_number unique, user_id/customer_id nullable, payment_method, payment_status, 5 money fields, shipping_info json, payment_proof_path nullable, metadata json, timestamps, softDeletes).
- [x] T003 [BE] Migration `add_order_group_id_to_orders_table` — nullable FK + index; reversible; SQLite-parity safe (mirror `2026_06_11_000001_product_variants_sqlite_parity` approach).
- [x] T004 [BE] `App\Models\OrderGroup` model — `orders()` hasMany, `user()`, `customer()`, `$fillable`, `$casts` (shipping_info/metadata json, money decimals), `softDeletes`, `generateGroupNumber()` (`GRP-Ymd-RAND`), `markPaid()` (txn: set group paid → set each child `payment_status=paid`).
- [x] T005 [BE] `Order::orderGroup()` belongsTo relation + add `order_group_id` to `Order::$fillable`.

**Checkpoint**: schema + models exist; `php artisan migrate` green on SQLite test DB. ✅

---

## Phase 3: User Story 1 — Split + correct money attribution (P1) 🎯 MVP

**Goal**: A multi-seller basket creates one group + N per-seller orders; on paid, each seller billed correctly.
**Independent Test**: see spec SC-001/002/003/004/005.

### Tests FIRST (must fail before impl)

- [x] T006 [P] [QA][US1] `tests/Feature/Orders/MultiSellerSplitTest.php` — split count, item attribution, no cross-store items (SC-001).
- [x] T007 [P] [QA][US1] `tests/Feature/Orders/GroupTotalsTest.php` — group total == Σ sub-orders, shipping sum (SC-003).
- [x] T008 [P] [QA][US1] `tests/Feature/Orders/MultiSellerCommissionTest.php` — per-seller commission + StoreRevenue at each store's own rate, differing rates don't cross (SC-002).
- [x] T009 [P] [QA][US1] `tests/Feature/Orders/SingleSellerRegressionTest.php` — money-identical to legacy single order (SC-004).
- [x] T010 [P] [QA][US1] `tests/Feature/Orders/CheckoutAtomicityTest.php` — stock failure → zero rows in order_groups/orders/order_items/order_history, no decrement (SC-005).
- [x] T011 [P] [QA][US1] `tests/Feature/Orders/CodGroupLimitTest.php` — COD rejected on group total > limit, before any insert.
- [x] T012 [P] [QA][US1] `tests/Feature/Orders/GuestMultiSellerCheckoutTest.php` — null customer_id splits correctly.
- [x] T013 [P] [QA][US1] `tests/Feature/Orders/SuspendedSellerInBasketTest.php` — whole basket rejected, names the item.

### Implementation

- [x] T014 [BE][US1] Refactor `OrderService::createCheckoutOrder()` (`app/Services/OrderService.php:100`): extract `createSellerOrder(array $lines, array $ctx): Order`; group resolved lines by `stock.store_id`; create `OrderGroup`; loop per store inside one `DB::transaction()`; keep `resolveCheckoutItem` locks. (depends on T004, T005)
- [x] T015 [BE][US1] Move `assertCodAllowed()` to evaluate the **group total** once; compute per-seller `computeShipping()`/tax; v1 discount applies only to issuing seller's slice. (part of T014's method)
- [x] T016 [BE][US1] Per-seller `OrderPlacedNotification` after commit (N sellers → N notifications); failure never rolls back (preserve existing try/catch pattern).
- [x] T017 [BE][US1] Confirm `OrderObserver` unchanged; add an assertion-style comment that `markPaid()` drives per-child `created/updated` → `createCommissions()`. (verification task, no logic change)

**Checkpoint**: T006–T013 all green. MVP money-correct. Deployable behind FE (old confirmation still reads first sub-order). ✅

---

## Phase 4: User Story 2 — Buyer group view / seller slice + payment surfaces (P2)

**Goal**: Buyer sees one grouped order with per-seller sub-orders; quote + payment-proof + confirmation handle groups.
**Independent Test**: spec US3 scenarios.

### Tests FIRST

- [x] T018 [P] [QA][US2] `tests/Feature/Orders/QuotePerSellerTest.php` — `/api/orders/quote` returns `sellers[]` breakdown + group totals + single `cod_allowed`.
- [x] T019 [P] [QA][US2] `tests/Feature/Orders/GroupPaymentProofTest.php` — one proof on group fans `paid` to all sub-orders on approval.
- [x] T020 [P] [QA][US2] FE Vitest: checkout renders per-seller shipment breakdown; confirmation enumerates sub-orders; order-history group card. (`beldify-frontend`, run via `npm run test`)

### Implementation — Backend

- [x] T021 [BE][US2] `OrderGroupResource` (buyer-facing) + update `OrderCheckoutController` to return the group (with `orders[]`, `group_number`); keep back-compat `order_number`.
- [x] T022 [BE][US2] Update quote endpoint/controller to compute + return per-seller breakdown (reuse `computeShipping`/tax/discount per slice).
- [x] T023 [BE][US2] Extend payment-proof route to accept `{groupNumber}`; attach proof to group; approval marks all sub-orders paid. Keep single-order path for back-compat.

### Implementation — Frontend

- [x] T024 [P] [FE][US2] Cart page: group line items by seller; per-seller subtotal + shipping (`beldify-frontend/src/app/cart/page.tsx`).
- [x] T025 [FE][US2] Checkout: consume new quote shape; render per-seller shipment summary; submit once; read `group_number` (`src/app/checkout/page.tsx`, `src/services/orderService.ts`).
- [x] T026 [FE][US2] Order confirmation: store group/array in `sessionStorage.beldify_last_order` (guest-safe); enumerate sub-orders (`src/app/order-confirmation/page.tsx`).
- [x] T027 [FE][US2] Buyer order history: fetch + render group cards with per-seller sub-order rows (independent status/tracking) (`src/app/orders/page.tsx`).

**Checkpoint**: US1 + US2 both pass; buyer + seller experiences coherent. ✅

---

## Phase 5: Polish & Verification

- [x] T028 [QA] Full suite: `cd beldify-backend && php artisan test` + `cd beldify-frontend && npm run test` — capture evidence (verification-before-completion).
- [ ] T029 [BE] Docs: `docs/architecture/orders.md` — order_groups vs orders (sub-order) model + payment propagation; update `docs/api/orders.md` quote/checkout/payment-proof shapes.
- [x] T030 [BE] Deploy notes in plan.md confirmed: `php artisan migrate` + container restart + config/route clear; no seeder, no backfill.
- [ ] T031 [Reviewer] `requesting-code-review` on the diff (money-correctness + backward-compat focus) before merge.

## Notes

- Money-correctness is the gate: never claim done without T006–T013 + T028 green with real output.
- Backward-compat (SC-004) is non-negotiable — single-seller baskets must not change a single MAD.
- Commit BE (nested repo) and monorepo separately.
- T029 (docs) and T031 (review) are the only remaining tasks — implementation + tests complete.
