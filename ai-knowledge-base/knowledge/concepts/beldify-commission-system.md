---
name: Beldify Commission System (R10 closure)
description: "Two-model verdict — Commission is the authoritative live record written by OrderObserver, CommissionTransaction is the accounting/settlement model; R10 closed by fixing the reader, plus a P0 duplicate-observer registration that double-counted commissions"
type: concept
tags: [laravel, artisan, migration, event, model, deploy, seller, order, product, architecture]
sources: [raw/2026-06-10-admin-audit-sellers-jewelry-deploy.md]
created: "2026-06-10"
updated: "2026-06-10"
---
# Beldify Commission System (R10 closure)

The long-open R10 bug ("Commission.commissionable_type incoherence") was closed on 2026-06-10 with a verdict that reframed the problem: the WRITER was never wrong. `OrderObserver` always wrote canonical morph types — `App\Models\Store::class` for store and platform commissions, `App\Models\User::class` for affiliate commissions. The defect was in the READER: `CommissionController::summary` both assumed different morph values and read from the dead `commission_transactions` table instead of the live `commissions` table. Aligning the reader to the live table closed R10 with no data-fix migration. A flat-fee double-count was also corrected (`commission_amount` already includes the flat fee, so adding it again overstated revenue).

The same audit established the two-model architecture as deliberate rather than drift: **`Commission` is the authoritative live record** (created per order by the observer), while **`CommissionTransaction` is the accounting/settlement model** (batch/ledger oriented, manipulated via `CommissionBatchController` web CRUD). This supersedes the earlier framing that one of `CommissionService` vs `CommissionAccountingService` had to be deleted — they serve the two different models. The verdict is documented in the backend at `docs/architecture/commission-system.md`.

The most severe finding was operational, not architectural: **`OrderObserver` was registered twice** (in both `EventServiceProvider` and `AppServiceProvider`), so the observer fired twice per order event — double commissions and double revenue records. The duplicate registration was removed (AppServiceProvider is the sole site). Remaining settlement gap: no Artisan command exists for commission settlement — it is manual web CRUD only, an escalation candidate alongside flash-sale and coupon-expiry automation. The ACCT packet shipped with 48 tests / 170 assertions.

## See also
- [[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]
- [[concepts/multi-seller-ecommerce]]
- [[concepts/beldify-dormant-features-activation]] — where the commission path was previously listed as "needs product decision" (now resolved)
- [[entities/laravel]]
- [[entities/beldify]]
