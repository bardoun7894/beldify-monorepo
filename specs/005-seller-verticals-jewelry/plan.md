# Implementation Plan: 005-seller-verticals-jewelry

**Spec**: [spec.md](./spec.md) · **Research**: [research.md](./research.md)
**Stack**: Laravel 10 / PHP 8.1+ (MySQL, sqlite for tests) · Next.js 15 / React 18 / Tailwind (Atlas design system, Arabic-RTL, MAD)
**Status**: ready for `/speckit.tasks` → orchestrator fan-out

## Settled architecture decisions

1. **Verticals via `store_types.capabilities`** (existing JSON column). Seed `jewelry`, `menswear`, `womenswear` alongside `regular`, `tailor`. `stores.store_type_id` is the per-seller hook. Capabilities drive conditional field rendering.
2. **Conditional fields, not a config engine.** Field sets are defined per vertical in code (a `VerticalConfig` registry: `App\Support\Verticals`). Two config shapes: `apparel` (measurements + fabric + style) and `jewelry` (material req + purity/grams/size/gemstone/engraving/finish, all optional).
3. **Ready-made config** stored in `stocks.customization_options` (live picker path) + `additional_attributes`. No new product columns.
4. **Made-to-order = new generalized `custom_orders` + `custom_order_progress`** tables, keyed by `store_id` + `vertical` + JSON `spec`. Lifecycle: `requested → quoted → deposit_paid → in_progress → ready → delivered → closed` (+ `cancelled`). Used by jewelry/menswear/womenswear. **Legacy `tailor` keeps `tailoring_orders`** (WS-C fixes it; migrating tailoring into `custom_orders` is a future non-goal).
5. **Fabric → catalog + usage pivot** (user decision). Reshape so `tailoring_fabrics` (or a renamed `fabrics`) is the seller catalog the model/controller already assume (`name/code/price_per_meter/stock_quantity/company_id`); add a `*_fabric_usage` pivot for order consumption. Apparel custom orders reference catalog fabrics via the pivot.
6. **Revenue**: extend `StoreRevenue.source_type` to include `'custom_order'`; add a `recordForCustomOrder()` helper mirroring `recordForOrder()`. Reconcile the existing `source_type` string-vs-`::class` inconsistency (Store.php uses `Order::class`; StoreRevenue writes `'order'`) — pick the short-string form and align reads.
7. **Jewelry category**: seed a top-level `Jewelry` category in the existing `categories` tree.

## Workstreams (independent → parallel)

### WS-A — Backend: verticals + jewelry + custom-order pipeline  (backend-engineer)
- Migrations: seed store_types (jewelry/menswear/womenswear) + capabilities; `custom_orders`; `custom_order_progress`; `StoreRevenue` source_type extension; Jewelry category seed.
- `App\Support\Verticals` registry (field schemas per vertical; pure PHP, unit-testable).
- Models: `CustomOrder`, `CustomOrderProgress` (status as **real column**, learn from tailoring bug #5). Relations to Store, Customer.
- `CustomOrderService`: request → quote → deposit → progress transitions → delivery; `StoreRevenue::recordForCustomOrder`.
- API: `/api/v1/custom-orders` (buyer submit, track), seller endpoints (quote, advance status), `/api/v1/verticals/{slug}/config` (field schema for the form). API Resources (no raw model leakage — learn from tailoring bug #9).
- Product create/update accepts vertical config into `customization_options`.

### WS-B — Frontend: seller + buyer UI  (frontend-engineer)
- Seller: vertical picker in store settings; vertical-aware product form (conditional fields driven by `/verticals/{slug}/config`); custom-order management (quote, advance status).
- Buyer: Jewelry category + PDP with jewelry fields + filters (material/gemstone); "Request custom piece" form (jewelry + apparel variants, only relevant fields); made-to-order tracking timeline.
- Atlas design system, Arabic-RTL, MAD currency. Routed via `beldify-ecommerce-ui` conventions.

### WS-C — Tailoring + fabric fixes (all 18 bugs, P0–P3)  (debugger → backend-engineer + frontend-engineer)
- **P0** (1–6): add/define `fabric()` per fabric decision; migrate `fabric_id`→pivot model; reshape `tailoring_fabrics` to catalog + add usage pivot; map order writes to real columns (`total_cost`/`service_cost`), persist measurements via relation; create the missing `tailoring_order_progress` table OR drop the computed accessor in favor of the real `status` column (pick one — recommend real column + keep a progress log table since the model exists); fix `TailoringMeasurement` keying.
- **P1** (7–11): `exists:tailor_services,id`; fetch real services in booking modal (no hardcoded ids); API Resource for `/tailors` (hide email); wire buyer tailors list/detail to existing `tailorService`, collapse duplicate routes; bind `MeasurementForm` save/add-to-cart handlers.
- **P2/P3** (12–18): reconcile `tailor_id` FK (employees vs tailor_profiles) — runtime check first; add/remove `TailoringMaterialUsage` table; consolidate `Tailor`/`TailorProfile` to one model; verify `working_hours` key scheme; remove dead `return`/null filter; resolve `service_price`; fix/remove `stockMovements()`.
- Each fix gets a failing test first (TDD).

### WS-D — QA  (qa-engineer)
- PHPUnit feature tests: custom-order lifecycle (status transitions, deposit, revenue recording), vertical capability gating, vertical config endpoint, fabric catalog+pivot.
- Vitest/RTL: vertical-aware product form (conditional fields), custom-request form validation (material required, rest optional), tracking timeline.
- Regression suite over the WS-C fixes (every P0/P1 gets a guard test).

## Dependencies / sequencing
- WS-A and WS-C share the fabric decision → align the fabric catalog migration once (WS-C owns the legacy reshape; WS-A consumes the catalog for apparel custom orders).
- WS-B depends on WS-A's `/verticals/{slug}/config` + custom-order endpoints (contract-first: define the API shapes up front so B can mock).
- WS-D runs continuously; final verification gate before merge.

## Risks
- Fabric reshape touches a live (broken) admin surface — guard with tests, migrate data carefully (the table likely has few/no real rows given it's dead-by-design).
- `source_type` string-vs-class inconsistency could break existing revenue reports if changed carelessly — add a test pinning current behavior before refactor.
- MySQL in prod, sqlite in tests — keep migrations driver-safe (follow existing `DB::getDriverName()` guards).
