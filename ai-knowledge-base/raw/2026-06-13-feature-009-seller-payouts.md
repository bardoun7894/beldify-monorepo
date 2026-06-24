# Feature 009 — Seller payouts (manual transfer), built 2026-06-13, unmerged

Branch `feat/seller-payouts` both repos. Spec/research: `specs/009-seller-payouts/`. SHIP-READY, not deployed (awaiting user). User decision: "the money will be transferred by me" → manual bank-transfer model, no gateway.

## Shipped
- **BE 0a0b1dfd (Opus):** `payout_requests` + `payout_settings` migrations, `PayoutRequest` model (state machine pending→approved|rejected, approved→paid; mark-paid idempotent), `PayoutService` (availableFor, request atomic+lockForUpdate+one-open-request guard, approve/reject/markPaid + seller notifications), `SellerPayoutController` (GET/POST /api/seller/payouts, PUT /api/seller/bank-details), admin `PayoutController` + Blade `/admin/payouts` (permission:manage_payouts), `PayoutSeeder` (min_amount=100, enabled).
- **FE 41e149d + 28dabca:** `/seller/payouts` page (balance card, RIB editor, request form, status history), 3 form-removing gates, Payouts nav + earnings CTA, `payouts` i18n ×7 locales, error-code type incl. 'disabled'.

## Money model (the important part)
- Canonical earnings = `store_revenues` (recordRevenue on order-paid, status='pending'; amount=seller-net). `status='paid'` is a LEGACY admin marker (StoreRevenueController), NOT customer-payment settlement, not auto-called.
- `available = max(0, realized − paidOut − locked)`; realized = SUM(store_revenues.amount WHERE status != 'cancelled'); paidOut = SUM(payouts status=paid); locked = SUM(payouts status in pending,approved).
- Payouts NEVER mutate store_revenues → disbursement single-sourced in payout ledger → no double-decrement, no over-withdrawal. Use ONLY /admin/payouts going forward.
- Bank details: existing `store_profiles.bank_details` JSON ({account_holder, bank_name, rib}); RIB validated loose (16–34 digits per test fixture).

## QA
All 5 money-correctness rules satisfied; double-decrement verdict = correct/single-sourced; 8 routes resolve; 60 BE tests green (28 payouts + credits incl. financial-doc-exposure fix moving receipts to private `local` disk); FE 2480 green, lint/tsc/build clean.

## Gotchas captured
- QA's "1 blocker" was a FALSE ALARM: `sync-local.sh` does NOT copy `tests/`, so the container ran a stale pre-security-fix credits test. `docker cp` the real test in → 60 green. (Added to [[beldify-local-sync-named-volume]].)
- Branch carries try-on commits + to-be-reverted buyer_credit 6b303e41; main has moved to AI suite (mono 853f963 / BE 93f606d4) — rebase/reconcile before merge.
- Deploy = 2 additive migrations + PayoutSeeder --force + ensure `manage_payouts` permission exists for admin role.
