# Tasks: 005-seller-verticals-jewelry

Role-tagged, dependency-ordered. `[P]` = parallelizable. Each code task is TDD (failing test first).

## Phase 0 — Contracts (blocks WS-B) — backend-engineer
- T001 Define API contracts up front (OpenAPI-ish md): `/api/v1/verticals/{slug}/config`, `/api/v1/custom-orders` (buyer submit + track), seller quote/advance endpoints. Output → `specs/005-seller-verticals-jewelry/contracts.md` so WS-B can mock.

## WS-A — Backend: verticals + jewelry + custom-order pipeline — backend-engineer
- T010 Migration: seed `store_types` jewelry/menswear/womenswear + capabilities JSON. [P]
- T011 Migration: `custom_orders` (store_id, customer_id, vertical, spec JSON, quote_amount, deposit_amount, deposit_paid bool, status enum, eta, delivery_date, timestamps, softDeletes). Status as **real column**.
- T012 Migration: `custom_order_progress` (custom_order_id, status, note, created_by, timestamps).
- T013 Migration: extend `store_revenues.source_type` to allow `'custom_order'`; add `custom_order_id` nullable.
- T014 Migration + seeder: top-level `Jewelry` category.
- T015 `App\Support\Verticals` registry + field schemas (apparel, jewelry). Pure PHP. Unit tests. [P]
- T016 Models `CustomOrder`, `CustomOrderProgress` + relations (Store, Customer). status from real column.
- T017 `CustomOrderService`: submit → quote → deposit_paid → in_progress → ready → delivered → closed/cancelled; guard illegal transitions.
- T018 `StoreRevenue::recordForCustomOrder()` + reconcile source_type string-vs-class (pin current behavior with a test FIRST, then align).
- T019 API: buyer submit + track custom order; seller quote + advance; `/verticals/{slug}/config`. API Resources only (no raw model).
- T020 Product create/update writes vertical config → `stocks.customization_options`/`additional_attributes`.

## WS-B — Frontend: seller + buyer UI — frontend-engineer (depends on T001 contracts; T019 for live wiring)
- T030 Seller: vertical picker in store settings (reads store_type). [P]
- T031 Seller: vertical-aware product form — conditional fields from `/verticals/{slug}/config`.
- T032 Seller: custom-order management (quote form, advance-status timeline).
- T033 Buyer: Jewelry category page + filters (material/gemstone). [P]
- T034 Buyer: jewelry PDP fields (material/purity/grams/size/gemstone/engraving/finish, optional-aware).
- T035 Buyer: "Request custom piece" form (jewelry + apparel variants; material required, rest optional).
- T036 Buyer: made-to-order tracking timeline. Atlas/RTL/MAD throughout.

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
- T060 PHPUnit: custom-order lifecycle (transitions, deposit, revenue), vertical gating, config endpoint, fabric catalog+pivot. [P]
- T061 Vitest/RTL: vertical-aware product form, custom-request validation, tracking timeline. [P]
- T062 Regression guards: one test per WS-C P0/P1 bug (proves fix + prevents recurrence).
- T063 Final `verification-before-completion` gate: `php artisan test` + `npm run lint`/`vitest` green; evidence captured.

## Done criteria
- All 4 verticals selectable; conditional fields render per vertical.
- Jewelry ready-made + custom flows work end-to-end (buyer submit → seller quote → deposit → progress → delivery).
- All 18 tailoring/fabric bugs fixed with guard tests; admin tailoring pages no longer 500.
- Backend + frontend test suites green; reviewer sign-off.
