---
name: specs/011-checkout-integrity/spec.md
description: Auto-synced from specs/011-checkout-integrity/spec.md
type: source
sync_origin: specs/011-checkout-integrity/spec.md
sync_hash: 611d22dadbdd5401
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/011-checkout-integrity/spec.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Spec 011 — Checkout Integrity

**Status:** draft
**Created:** 2026-06-14
**Owner:** TBD
**Source:** Gap audit 2026-06-14 (checkout/cart), maintainer-verified

## Problem

The checkout path has correctness defects that affect money and multi-seller fairness. Two are confirmed by code + live probe; one is a latent code-default risk.

## Confirmed defects

### D1 — `/orders/quote` returns 500 (P0, confirmed)
- Route `POST /api/orders/quote → OrderCheckoutController::quote` (`routes/api.php:487`) references a method that **does not exist** — `OrderCheckoutController` has only `__construct` + `checkout`. Live probe returns **500**.
- Frontend buy-now checkout calls `orderService.getCheckoutQuote()` on load and on country change (`checkout/page.tsx`) → 500 → totals stale/undefined, COD-eligibility unknown.

### D2 — Multi-seller cart → single order against the first seller (P1, confirmed)
- `OrderService.php:111-112`: `$firstStock = Stock::findOrFail($data['items'][0]['stock_id']); $storeId = $firstStock->store_id;`. The whole order is created against the **first item's store**.
- A cart with items from 2+ sellers → one order billed to seller A, stock decremented from seller A, commission to seller A — for products that belong to seller B. Wrong revenue, wrong inventory.

### D3 — Tax rate default 15% vs tax=0 policy (P2, latent)
- `OrderService.php:81,124`: `config('cart.tax_rate', 0.15)`. **Prod is mitigated** — `CART_TAX_RATE=0` confirmed live. But any environment without the override silently charges 15% tax. Code default contradicts policy.

## Goals
1. Restore a working server-authoritative quote for guest/buy-now checkout.
2. Make multi-seller carts behave correctly (split into per-seller orders, or block with a clear message — decision needed).
3. Remove the latent 15% tax default.

## Functional Requirements

### FR1 — Implement `OrderCheckoutController::quote()` (D1)
Server-authoritative totals using the same logic as `OrderService::createCheckoutOrder()` (subtotal, shipping via `computeShipping`, tax, discount, COD eligibility `cod_allowed`/`cod_max`, currency) WITHOUT creating an order. Validate input; return 422 on bad input (not 500). Add a smoke test that a malformed body → 422 and a valid body → totals.

### FR2 — Multi-seller cart handling (D2) — **decision required**
Pick one (recommend A for a multi-seller marketplace):
- **(A) Split into one order per seller** at checkout — each gets correct stock decrement + commission; present as a single buyer payment grouping. Larger change.
- **(B) Block mixed-seller checkout** with a clear "checkout one seller at a time" message + group cart by seller in the UI. Smaller, ships faster, worse UX.
Whichever: stock + commission + notifications must be correct per seller.

### FR3 — Fix tax default (D3)
Change the code default to `0.0` (policy), keep env override. Add a test asserting tax=0 with no env set.

## Non-Goals
- Online card payment gateway (Stripe/CMI) — dormant, separate track.
- Shipping-zones / carrier integration.

## Success Criteria
- `/orders/quote` returns correct totals (200) for valid input, 422 for invalid, never 500.
- A 2-seller cart produces correct per-seller order(s)/stock/commission, or is cleanly blocked.
- Fresh env (no CART_TAX_RATE) yields tax=0.
- No new test failures; lint+build clean; deployed + smoke-verified.

## Risks
- D2 split touches order creation, commission, and notifications — highest blast radius; needs thorough tests and the A/B decision before build.
- Heavy concurrent repo activity → isolated worktrees + `update-ref` merges.

