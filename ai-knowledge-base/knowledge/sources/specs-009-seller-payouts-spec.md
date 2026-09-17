---
name: specs/009-seller-payouts/spec.md
description: Auto-synced from specs/009-seller-payouts/spec.md
type: source
sync_origin: specs/009-seller-payouts/spec.md
sync_hash: 466750653c4c9204
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/009-seller-payouts/spec.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Feature 009 — Seller Payouts (manual transfer model)

**Status**: approved 2026-06-13 — user confirmed "the money will be transferred by me" (manual bank transfer).
**Branches**: `feat/seller-payouts` (monorepo + nested beldify-backend) — based on current `feat/ai-tryon*` HEAD (payouts code is independent of try-on; carries try-on commits — see merge note).
**Depends on**: commission system (R10 resolved 2026-06-10), `store_revenues` canonical earnings ledger, `store_profiles.bank_details`.

## Problem

Sellers earn revenue (tracked in `store_revenues`) but have no way to get paid. There is
no withdrawable-balance surface, no payout request flow, and no admin settlement console.
This builds a **manual** payout system: seller requests a withdrawal → admin reviews →
**the platform owner transfers the money by hand (bank transfer)** → marks it paid with a
reference → the seller's balance decrements. No payment gateway involved.

## MONEY-CORRECTNESS RULES (load-bearing — the engineer MUST honor these)

1. **Canonical earnings = `store_revenues`** (model `StoreRevenue`, written by `OrderObserver::recordRevenue` when an order is paid). The `amount` column = seller-net (sale − commission). DO NOT recompute from orders or Commission rows.
2. **VERIFY semantics before wiring** (read `StoreRevenue` model + `recordRevenue` + every caller of `markAsPaid` / writer of `status`): determine exactly what `status` (pending/paid/cancelled) means and whether `markAsPaid` is already called anywhere on customer payment. The available-balance query depends on the real meaning of "settled & not yet paid out". Write a one-paragraph finding in research.md before coding.
3. **Available balance formula (payout-owned, does NOT mutate store_revenues):**
   ```
   available = realized_earnings − total_paid_out − total_locked_in_open_requests
   ```
   - `realized_earnings` = SUM(`store_revenues.amount`) for revenue available to pay out (the filter confirmed in rule 2 — e.g. status not cancelled / order paid).
   - `total_paid_out` = SUM(`payout_requests.amount` WHERE status = 'paid').
   - `total_locked_in_open_requests` = SUM(`payout_requests.amount` WHERE status IN ('pending','approved')).
   Payouts must **never** double-count: an open or paid request reduces available. This makes over-withdrawal impossible without touching the earnings ledger.
4. **Atomicity**: creating a request and computing available must be race-safe (`DB::transaction` + row lock on the store's payout aggregate / `lockForUpdate` on open requests) so two concurrent requests can't each pass the balance check.
5. **Invariant test (required)**: across any sequence of requests/approvals/payments, `SUM(paid payouts) ≤ realized_earnings` always holds; a seller can never be paid more than they earned.

## Scope — v1

### Backend (one packet — money logic in one head)

- Migration `payout_requests`: id, store_id FK, requested_by (user) FK, `amount` (unsigned int, MAD), `status` enum(pending,approved,rejected,paid) default pending, `bank_details` json (SNAPSHOT of seller RIB at request time — immutable record of where money was sent), `reference` (admin's bank transfer ref, nullable), `reviewed_by` nullable FK users, `reviewed_at` nullable, `paid_at` nullable, `note`/`reject_reason` nullable, timestamps. Short index names (MySQL 64-char).
- `PayoutRequest` model + state machine (`approve`, `reject(reason)`, `markPaid(reference)`), guarded transitions (only pending→approved/rejected; approved→paid; no backward).
- `PayoutSetting` reuse existing key-value (CreditSetting/HeroSetting pattern) OR add keys: `payout.min_amount` (default 100 MAD), `payout.enabled` (default true).
- `app/Services/Payouts/PayoutService.php`: `availableFor(Store): int` (the formula, rule 3), `request(Store, user, amount): PayoutRequest` (atomic, rule 4: validates amount ≥ min, ≤ available, bank_details present, no existing open request — ONE open request per store at a time), `approve/reject/markPaid` delegating to model + notifications.
- Seller API (`auth:sanctum` + `role:store_owner`): `GET /api/seller/payouts` → `{available, min_amount, currency:"MAD", bank_details, requests:[{id,amount,status,reference,reject_reason,created_at,reviewed_at,paid_at}], has_open_request}`; `POST /api/seller/payouts` `{amount}` → 201 request OR 422 (below min / above available / no bank details / open request exists — distinct error codes); `PUT /api/seller/bank-details` `{account_holder, bank_name, rib}` → persists to `store_profiles.bank_details` (validate RIB format loosely — Moroccan RIB 24 digits).
- Admin (`/admin/payouts`, super-admin, admin v3 components — template off `CommissionPaymentController` + `/admin/credits`): queue (pending first) with store, seller, amount, snapshot bank_details (RIB shown for the manual transfer), available-at-request; **approve** (→ approved, locks funds), **reject** (requires reason, unlocks), **mark paid** (requires bank transfer reference → status paid, paid_at, sets the actual money-sent record; idempotent — double mark-paid is a no-op). Each transition notifies the seller (database channel, like 007/008). Permission `manage_payouts`.
- Seeder/settings: register `payout.min_amount`=100, `payout.enabled`=true (idempotent).
- TDD `tests/Feature/Payouts/`: available formula correctness (earnings − paid − locked), cannot request above available, cannot request below min, cannot request without bank details, ONE open request guard, concurrent-request race safety, approve/reject/mark-paid state machine + guards, mark-paid idempotent, non-seller 403 / non-admin 403, the rule-5 invariant across a mixed sequence, available recomputes correctly after a payout is marked paid (drops by the paid amount).

### Frontend (one packet, parallel against the contract)

- `src/services/sellerPayoutService.ts` — 3 endpoints typed.
- `/seller/payouts/page.tsx` (structural template = `/seller/credits`): withdrawable-balance card (available, min, currency), bank-details editor (account holder, bank name, RIB — required before requesting; inline validation), request-payout form (amount ≤ available & ≥ min, disabled with reason when no bank details / open request exists / payouts disabled), request history with status badges (pending amber / approved blue / rejected red+reason / paid green+reference+date).
- Seller nav item "Payouts" (DollarSign) + a "Request payout" link/CTA from the earnings page.
- 402-style empties + skeletons per existing patterns. i18n `payouts` namespace in ALL 7 locales (ar MSA, ma Darija, fr, en, es, nl, de). Atlas tokens (primary/secondary inverted → arbitrary form), RTL-aware.
- Component tests (mocked service): balance + history render, request validates vs available/min, bank-details-required gate, open-request gate.

## Out of scope (roadmap)

Automated/gateway payouts (would plug into the dormant payment foundation later), payout
scheduling, multi-currency, partial settlement of specific orders, tax/invoice generation,
payout fees.

## Merge note

Branch is based on `feat/ai-tryon*` HEAD, so it carries the try-on commits and the
to-be-reverted buyer-credit commit `6b303e41`. Resolve that revert (per 2026-06-12 log)
before/at merge; payouts itself is independent and unaffected.

