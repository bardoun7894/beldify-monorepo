# Research: seller-payouts

**Generated**: 2026-06-13
**Feature**: [spec.md](./spec.md)

## Prior art from KB (verified 2026-06-13: kb-query + Explore sweep)

### Commission split-brain — RESOLVED (do not re-open)
- R10 closed 2026-06-10 ([[concepts/beldify-commission-system]], `docs/architecture/commission-system.md`). Two-model split is deliberate: `Commission` (live, written by `OrderObserver` with canonical morphs) + `CommissionTransaction` (accounting ledger via `CommissionBatchController`). Root cause was the READER querying the dead `commission_transactions`; fixed by pointing it at live `commissions`. Duplicate `OrderObserver` registration (EventServiceProvider + AppServiceProvider) was removing → double revenue; the AppServiceProvider one was deleted.

### Canonical earnings ledger
- `store_revenues` table (`StoreRevenue` model): `store_id`, `amount` (seller-net), `commission_amount`, `source_type` (order|tailoring_order|custom_order), `source_id`, `earned_at`, `status` (pending|paid|cancelled). Written by `OrderObserver`/`TailoringOrderObserver` → `StoreRevenue::recordRevenue()` when order paid. `markAsPaid()` sets `paid_at`.
- **OPEN VERIFICATION (rule 2 of spec)**: must confirm what `status='paid'` means here (seller settled vs customer-paid) and whether `markAsPaid` is called today. Earnings ledger semantics drive the available-balance filter. Write finding here before coding.
- `SellerEarningsController` (`app/Http/Controllers/API/Seller/SellerEarningsController.php`): gross = SUM(orders.total_amount); commission = SUM(StoreRevenue.commission_amount on earned_at); net = gross − commission. Display only — no payout surface.

### Bank details — already exists
- `store_profiles.bank_details` JSON column (migration `2024_11_26_000004_add_fields_to_store_profiles.php`, `StoreProfile` model cast to array). Use it; no new column needed. Define a clean shape {account_holder, bank_name, rib}.

### Templates to copy
- Admin console structure: `app/Http/Controllers/Admin/CommissionPaymentController.php` (manual payment recording: validate → DB::transaction → mark paid → redirect) + `/admin/credits` `CreditController` (queue + approve/reject/grant, admin v3 components, database-channel notifications, super-admin permission).
- Seller page structure: `/seller/credits/page.tsx` (balance card + bank-details display + request form + status-badged history) is the near-exact template for `/seller/payouts`.
- Money-service patterns: `BuyerCreditService`/`CreditService` (atomic `DB::transaction` + `lockForUpdate`, idempotency via reference) — reuse the discipline for PayoutService.

### Constraints carried forward
- [[beldify-nested-backend-git-repo]] — branch/commit both repos separately.
- [[parallel-agents-shared-tree-stash-hazard]] — NEVER stash; stage explicit paths only; tree has concurrent-session noise (BannerSeeder/StockSeeder/tailwind.css/setup_commissions.php/test-disk artifacts) — DO NOT stage those.
- [[beldify-tryon-wallet-collision]] — branch carries to-be-reverted buyer_credit `6b303e41`; payouts independent; resolve at merge.
- [[beldify-i18n-architecture]] — app is now 7 locales (ar, ma, fr, en, es, nl, de).
- [[beldify-seller-role-model]] — `store_owner` canonical seller role.
- Frontend vitest dual-config hazard ([[beldify-vitest-dual-config-hazard]]) — use `npm run test`, never bare vitest from root.

## StoreRevenue semantics finding (rule 2 — verified 2026-06-13 before coding)

Read `app/Models/StoreRevenue.php` + `recordRevenue()` + every `markAsPaid()` caller and every `status` writer across `app/`. Findings: `store_revenues` rows are created by `StoreRevenue::recordRevenue()` (Order/TailoringOrder observers) and `recordForCustomOrder()`, **always with `status='pending'`** at creation. `amount` = seller-net (sale − commission). The three statuses mean: `pending` = earned, awaiting settlement; `cancelled` = order reversed/refunded, revenue void; `paid` = an **already-existing admin "mark revenue paid" marker** toggled MANUALLY via `StoreRevenueController::updateStatus` (admin web action `markAsPaid()` → sets `status=paid, paid_at`). Crucially, `markAsPaid()` is **NOT** called on customer payment — customer payment only triggers `recordRevenue()` which writes `pending`. So `status='paid'` here is a legacy/parallel "this revenue line has been settled" flag, **independent of and predating** the new payout system. Per the orchestrator instruction, the payout system does NOT overload or mutate `store_revenues` at all; settlement lives entirely in the `payout_requests` ledger via rule 3's formula.

**realized_earnings filter chosen:** `SUM(store_revenues.amount) WHERE status != 'cancelled'` (i.e. `status IN ('pending','paid')`). Rationale: cancelled = revenue voided (must be excluded); both `pending` and `paid` represent real earned money the seller is owed. Excluding `paid` would be wrong because that legacy flag is set independently of the payout ledger and would silently shrink available balance even though no payout occurred. Over-withdrawal is impossible because the formula subtracts `total_paid_out` (payout_requests.status=paid) and `total_locked_in_open_requests` (pending+approved) — the payout ledger is the single source of truth for what has been disbursed. Invariant `SUM(paid payouts) ≤ realized_earnings` is enforced by the request-time check `amount ≤ availableFor` under row lock.
