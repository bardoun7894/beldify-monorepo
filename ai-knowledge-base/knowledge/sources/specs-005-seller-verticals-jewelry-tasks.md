---
name: specs/005-seller-verticals-jewelry/tasks.md
description: Auto-synced from specs/005-seller-verticals-jewelry/tasks.md
type: source
sync_origin: specs/005-seller-verticals-jewelry/tasks.md
sync_hash: cf4783a773ea8519
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/005-seller-verticals-jewelry/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks: 005-seller-verticals-jewelry

Role-tagged, dependency-ordered. `[P]` = parallelizable. Each code task is TDD (failing test first).

## Phase 0 — Contracts (blocks WS-B) — backend-engineer
- T001 Define API contracts up front (OpenAPI-ish md): `/api/v1/verticals/{slug}/config`, `/api/v1/custom-orders` (buyer submit + track), seller quote/advance endpoints. Output → `specs/005-seller-verticals-jewelry/contracts.md` so WS-B can mock.

## WS-A — Backend: verticals + jewelry + custom-order pipeline — backend-engineer
- [x] T010 Migration: seed `store_types` jewelry/menswear/womenswear + capabilities JSON. [P]
- [x] T011 Migration: `custom_orders` (store_id, customer_id, vertical, spec JSON, quote_amount, deposit_amount, deposit_paid bool, status enum, eta, delivery_date, timestamps, softDeletes). Status as **real column**.
- [x] T012 Migration: `custom_order_progress` (custom_order_id, status, note, created_by, timestamps).
- [x] T013 Migration: extend `store_revenues.source_type` to allow `'custom_order'`; add `custom_order_id` nullable.
- [x] T014 Migration + seeder: top-level `Jewelry` category.
- [x] T015 `App\Support\Verticals` registry + field schemas (apparel, jewelry). Pure PHP. Unit tests. [P]
- [x] T016 Models `CustomOrder`, `CustomOrderProgress` + relations (Store, Customer). status from real column.
- [x] T017 `CustomOrderService`: submit → quote → deposit_paid → in_progress → ready → delivered → closed/cancelled; guard illegal transitions.
- [x] T018 `StoreRevenue::recordForCustomOrder()` + reconcile source_type string-vs-class (pin current behavior with a test FIRST, then align).
- [x] T019 API: buyer submit + track custom order; seller quote + advance; `/verticals/{slug}/config`. API Resources only (no raw model).
- [x] T020 Product create/update writes vertical config → `stocks.customization_options`/`additional_attributes`.

## WS-B — Frontend: seller + buyer UI — frontend-engineer (depends on T001 contracts; T019 for live wiring)
- [x] T030 Seller: vertical picker in store settings (reads store_type). [P]
- [x] T031 Seller: vertical-aware product form — conditional fields from `/verticals/{slug}/config`.
- [x] T032 Seller: custom-order management (quote form, advance-status timeline).
- [x] T033 Buyer: Jewelry category page + filters (material/gemstone). [P]
- [x] T034 Buyer: jewelry PDP fields (material/purity/grams/size/gemstone/engraving/finish, optional-aware).
- [x] T035 Buyer: "Request custom piece" form (jewelry + apparel variants; material required, rest optional).
- [x] T036 Buyer: made-to-order tracking timeline. Atlas/RTL/MAD throughout.

## WS-C — Tailoring + fabric fixes (all 18) — debugger lead → backend + frontend
### P0 (backend-engineer)
- [x] T040 Reshape fabric to **catalog + usage pivot**: migrate `tailoring_fabrics` to catalog cols (name/code/price_per_meter/stock_quantity/company_id), add `tailoring_order_fabric_usage` pivot (order_id/fabric_id/quantity_used/unit_price). Define `CustomOrder`/`TailoringOrder` fabric usage relation. (bugs 1,2,3)
- [x] T041 Map `tailoring_orders` writes to real columns (`total_cost`/`service_cost`); persist measurements via relation (drop nonexistent `price`/`total_amount`/`measurements` writes). Fix reports. (bug 4)
- [x] T042 Status source of truth: use real `status` enum column; create `tailoring_order_progress` migration to back the existing model (keep progress log) OR drop accessor — implement real-column + progress-log. (bug 5)
- [x] T043 Fix `TailoringMeasurement` keying (add `order_id` or link by `customer_id`); fillable + create path. (bug 6)
### P1
- [x] T044 (backend) `exists:tailor_services,id`; resolve `service_price` from `tailor_services`. (bugs 7,17)
- [x] T045 (backend) API Resource for `/tailors` index+show; hide User email/PII. (bug 9)
- [x] T046 (frontend) Booking modal: fetch real `tailor_services`, send numeric ids. (bug 8)
- [x] T047 (frontend) Wire buyer tailors list + detail to `tailorService`; collapse duplicate detail routes. (bug 10)
- [x] T048 (frontend) Bind `MeasurementForm` save/add-to-cart handlers to endpoints. (bug 11)
### P2/P3 (backend-engineer)
- [x] T049 Runtime-check `tailor_id` FK (employees vs tailor_profiles); align FK + relations. (bug 12) — FK confirmed -> `employees`; profile orders() relations removed; review/service/commission relations re-keyed to `tailor_profile_id`.
- [x] T050 Consolidate `Tailor`/`TailorProfile` to one model; fix `measurements()` relation. (bug 14) — `TailorProfile extends Tailor`; broken `measurements()` removed.
- [x] T051 `TailoringMaterialUsage`: add migration or remove model. (bug 13) — removed (dead, zero refs).
- [x] T052 Verify `working_hours` key scheme (writer vs Carbon dayOfWeek reader); normalize. (bug 15) — NO writer exists; reader normalized to accept int dayOfWeek + day-name keys.
- [x] T053 Remove dead `return $measurements;` + `where('company_id', null)`; fix/remove `stockMovements()`. (bugs 16,18)

## WS-D — QA — qa-engineer (continuous; final gate)
- [x] T060 PHPUnit: custom-order lifecycle (transitions, deposit, revenue), vertical gating, config endpoint, fabric catalog+pivot. [P]
  - tests/Feature/SellerCustomOrderIndexTest.php — seller endpoint isolation + PII + pagination (10 tests)
  - tests/Feature/CustomOrderLifecycleIntegrationTest.php — full lifecycle + 9 illegal-transition data sets + 5 cancellation data sets + revenue-dormant finding (17 tests)
- [x] T061 Vitest/RTL: vertical-aware product form, custom-request validation, tracking timeline. [P] (72 frontend tests — already green)
- [x] T062 Regression guards: one test per WS-C P0/P1 bug (proves fix + prevents recurrence). (covered by WS-C suites — all passing)
- [x] T063 Final `verification-before-completion` gate: `php artisan test` + `npm run lint`/`vitest` green; evidence captured.
  - 005+WS-C suite: 112 tests / 574 assertions — all pass
  - Full `php artisan test` (phpunit): 731 tests; 95 failures + 149 errors are pre-existing unrelated failures (repositories, Blade Seller views, TailoringApiTest routes, ShopApiTest routes); 0 new failures from WS-D
  - Frontend lint: exit 0 (warnings only, no errors)
  - Frontend vitest (005 files): 72/72 pass
  - ESCALATION: StoreRevenue::recordRevenue() is undefined — called by OrderObserver:52 + TailoringOrderObserver:39 (both registered in AppServiceProvider:148-149). P0 severity — BadMethodCallException on any Order/TailoringOrder reaching paid state. Escalate to backend-engineer.
  - ESCALATION: StoreRevenue::recordForCustomOrder() is defined but never called during the custom-order lifecycle (no CustomOrderObserver, no call in CustomOrderService::advance()). Revenue is dormant for custom orders. Escalate to backend-engineer.

## Done criteria
- All 4 verticals selectable; conditional fields render per vertical.
- Jewelry ready-made + custom flows work end-to-end (buyer submit → seller quote → deposit → progress → delivery).
- All 18 tailoring/fabric bugs fixed with guard tests; admin tailoring pages no longer 500.
- Backend + frontend test suites green; reviewer sign-off.

## Phase 9 — Reviewer remediation (2026-06-02)

Reviewer verdict: CHANGES REQUESTED (targeted, not structural). Apply after WS-D lands (avoid backend git race).

### P1 (must fix — spec non-compliance)
- [x] R1 Wire `StoreRevenue::recordForCustomOrder()` into `CustomOrderService::advance()` at the `delivered` (or `closed`) transition — currently dead code, custom orders record ZERO revenue. Add lifecycle test asserting a `source_type='custom_order'` revenue row appears. (CustomOrderService.php:124–149; StoreRevenue.php:69–88)

### P2 (should fix)
- [x] R2 `advance()` → when target is `deposit_paid`, also set `deposit_paid=true` (boolean stays false; buyer timeline checkmark reads it). (CustomOrderService.php:108–115)
- [x] R3 `submit()` validate the target store's vertical matches the requested vertical (block jewelry order at a menswear store). (CustomOrderController.php:53–71)
- [x] R4 `quote` validation: add `deposit_amount` rule `lte:quote_amount`. (CustomOrderController.php:198)
- [x] R5 Align frontend `MOCK_APPAREL_CONFIG` keys/types/groups with backend `APPAREL_FIELDS` so USE_MOCK→false is safe. (verticalService.ts:49–63 ↔ Verticals.php:132–170)
- [x] R6 `isStoreOwner` N+1: `loadMissing('store')` before authz in show/quote/advance. (CustomOrderController.php:278–280)

### P3 / pre-existing (follow-up, separate from this feature)
- [x] R7 (P0 on main) `StoreRevenue::recordRevenue()` undefined but called in OrderObserver:52 + TailoringOrderObserver:39 → 500 on every order payment. Pre-existing breakage; define the method or fix observers.
- [x] R8 `StoreRevenue.$fillable` lists nonexistent columns (order_id/tailoring_order_id/commission_rate) — model↔schema drift, mass-assignment silently drops.
- [ ] R9 Flip `USE_MOCK=false` in verticalService.ts + customOrderService.ts before production launch.

### Discovered during R7 verification (out-of-scope follow-ups)
- [x] R10 RESOLVED (parallel commit 3fa9d77c added commissionable_type/_id) `Commission::create()` in OrderObserver:41 / TailoringOrderObserver fails `commissions.commissionable_type NOT NULL` — the paid-order path 500s for a SECOND reason after R7. Part of the orders/commission subsystem, NOT jewelry. Needs its own scoped fix.
- [ ] R11 (test infra) Sanctum-route test classes leak rate-limit state → flaky 429 under one-shot full-suite runs. Clear RateLimiter / disable throttle in base TestCase. (All 005 tests pass in isolation + in my combined fresh run.)

