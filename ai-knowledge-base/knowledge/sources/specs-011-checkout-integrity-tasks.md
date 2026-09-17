---
name: specs/011-checkout-integrity/tasks.md
description: Auto-synced from specs/011-checkout-integrity/tasks.md
type: source
sync_origin: specs/011-checkout-integrity/tasks.md
sync_hash: 2fbcbb5a557be0ef
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/011-checkout-integrity/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks — Spec 011 Checkout Integrity

Dependency-ordered, role-tagged. Isolated worktrees; TDD; zero new failures; merge via update-ref; deploy + smoke.

## Wave 1 — P0 + quick P2 (ship fast)

- [x] **T1 [backend]** Implement `OrderCheckoutController::quote()` (D1). Reuse `OrderService` total logic (subtotal, `computeShipping`, tax, discount, `cod_allowed`/`cod_max`, currency) without persisting an order. Input validation → 422 on bad input. Ref: route `api.php:487`, `OrderService.php:101-176,233-326`.
- [x] **T2 [qa]** Tests: `/orders/quote` valid body → 200 with correct totals + cod fields; empty/malformed body → 422 (not 500); shipping reflects selected method; COD eligibility flips at the 500 MAD threshold. **Blocks closing.**
- [x] **T3 [backend]** Tax default → `0.0` (D3): change both `config('cart.tax_rate', 0.15)` defaults to `0.0`; test asserts tax=0 with no env override. Ref: `OrderService.php:81,124`.

## Wave 2 — P1 multi-seller (needs decision first)

- [x] **T4 [decision]** CHOSEN: A (split per-seller orders), 2026-06-14. Choose **A) split per-seller orders** or **B) block mixed-seller checkout**. Recommend A. Record in spec.md.
- [x] **T5 [backend]** Implement the chosen path (D2). If A: group `items` by `store_id`, create an order per store with correct per-store subtotal/shipping/commission/stock decrement + notifications; link them under one buyer payment grouping. If B: validate single-store at checkout → 422 with a clear message. Ref: `OrderService.php:111-176`. [depends T4]
- [x] **T6 [frontend]** If A: order-confirmation shows the per-seller grouping; if B: cart UI groups by seller + per-seller checkout CTA + clear messaging. i18n ×5, RTL-safe. [depends T5]
- [x] **T7 [qa]** 2-seller cart e2e: correct per-seller stock decrement, commission, notifications (path A); or clean block (path B). Single-seller path unchanged. [depends T5/T6]

## Out of scope
- Card gateway activation (Stripe/CMI) — dormant.
- Shipping zones / carriers.

## Definition of done
Per wave: merged to main via update-ref, deployed, `/orders/quote` + a real multi-seller cart smoke-verified live; session log + KB updated.

