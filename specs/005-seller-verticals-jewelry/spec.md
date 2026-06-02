# Feature Spec: Seller Verticals + Jewelry Made-to-Order

**Feature ID**: 005-seller-verticals-jewelry
**Status**: DRAFT — awaiting user sign-off
**Created**: 2026-06-02
**Owner**: Beldify marketplace

---

## 1. Summary

Today Beldify has two effective seller shapes hard-wired into the code: a *regular store* (sells ready-made products) and a *tailor store* (made-to-order apparel via the tailoring pipeline — measurements, fabric, accessories, progress, deposit). We are generalizing this into **explicit seller verticals**, and adding **Moroccan jewelry** as a first-class vertical with its own made-to-order configuration that shares the existing custom-order lifecycle but uses **jewelry fields, not sewing measurements**.

Each seller declares their vertical. The product form and the made-to-order request form then show **only the fields relevant to that vertical** (conditional fields — not a generic config engine).

## 2. Goals

- A seller picks a **vertical** (Jewelry / Men's Clothing / Women's Clothing / Tailoring). Their dashboard, product form, and custom-request form adapt to it.
- **Jewelry vertical**: sell ready-made jewelry AND accept custom made-to-order pieces, configured with jewelry-specific, mostly-optional fields.
- All four verticals can run a **made-to-order** flow (request → quote/deposit → progress stages → delivery), reusing one shared lifecycle.
- **Buyer experience is simple**; seller and admin experience is professional and clean.
- Fix existing defects in the **tailoring + fabric** flow (scoped by a separate discovery audit — see §8).

## 3. Non-Goals (explicit)

- **No generic, admin-editable config engine.** Vertical fields are defined in code per vertical. (User decision, 2026-06-02.)
- **No new artisan/jeweler role.** Jewelry is fulfilled by existing seller/store accounts (`store_id`), never by the tailoring `Employee`/`tailor_id` actor model.
- **No rewrite of the tailoring subsystem.** Tailoring keeps its existing tables (`tailoring_orders`, `tailoring_measurements`, …). The new generalized custom-order layer sits beside it; migrating tailoring into it is a future, separate effort.
- No changes to payment provider integration beyond reusing existing deposit/order plumbing.

## 4. Vertical Model

Verticals are anchored on the **existing** `store_types` table, which already carries a `capabilities` JSON column. We extend the seeded set:

| Vertical | slug | capabilities (JSON) | Custom config shape |
|---|---|---|---|
| Regular Store | `regular` | `[products, orders, reviews]` | none (ready-made only) |
| Tailor Store | `tailor` | `[products, orders, reviews, tailoring, measurements, fabric]` | **apparel** (existing) |
| Men's Clothing | `menswear` | `[products, orders, reviews, made_to_order, measurements, fabric]` | **apparel** |
| Women's Clothing | `womenswear` | `[products, orders, reviews, made_to_order, measurements, fabric]` | **apparel** |
| Jewelry | `jewelry` | `[products, orders, reviews, made_to_order, jewelry_config]` | **jewelry** |

**Two custom config shapes only** (key simplification surfaced during scoping):
- **Apparel shape** = measurements + fabric + style. Tailoring, Men's, and Women's clothing all use this; it reuses the existing tailoring structures.
- **Jewelry shape** = the jewelry fields below.

A store's `store_type_id` → its vertical → drives `capabilities` → drives which fields/flows render.

## 5. Jewelry Configuration Fields

All fields **optional except material** (per user: "gemstone optional", "some have no size, maybe grams"):

| Field | Type | Required | Notes |
|---|---|---|---|
| `material` | select | **yes** | gold, silver, copper, brass, mixed |
| `purity` | select | no | 24k/21k/18k/14k (gold), 925/800 (silver), n/a |
| `weight_grams` | decimal | no | total weight in grams |
| `size` | text/select | no | ring size or chain/bracelet length (cm); blank for pieces with no size |
| `gemstone` | group (optional) | no | `{ type, count, carat }` — type in {none, diamond, emerald, ruby, sapphire, pearl, semi-precious, other} |
| `engraving` | text | no | custom engraving text |
| `finish` | select | no | polished, matte, gold-plated, enamel/meena, antique |

Storage:
- **Ready-made jewelry product** → values live in the existing dormant `stocks.customization_options` / `stocks.additional_attributes` JSON columns (verified unused by tailoring). *(Open verification: confirm these columns are read on a live path, not just declared — §9.)*
- **Custom made-to-order request** → values live as a JSON `spec` on the custom-order record (analog of `tailoring_measurements.order_id`).

## 6. Made-to-Order Lifecycle (shared)

Reuse the tailoring lifecycle **shape**, fulfilled by `store_id`:

`request submitted → seller quote (price + deposit + ETA) → buyer accepts + pays deposit → in progress (stages) → ready → delivered → closed`

Architecture decision (load-bearing): a **standalone custom-order table keyed by `store_id` + `vertical` + JSON `spec`**, NOT extending the `orders` table (which has no deposit/progress/fitting columns). This matches existing precedent (`tailoring_orders` exists for exactly this reason) and keeps the regular `orders` table clean. Revenue is recorded via the existing `store_revenues` path — extend its `revenue_type` / `source_type` enums to include the custom-order source. *(Final table name + whether jewelry custom orders reuse a generalized `custom_orders` table or get `jewelry_orders` to be settled in plan.md after reading `OrderService`/`store_revenues` writer.)*

## 7. User Stories

- **US1 — Seller picks vertical**: As a seller, when I set up or edit my store I choose my vertical, and my product/management screens show only what's relevant.
- **US2 — Sell ready-made jewelry**: As a jewelry seller, I list a ready-made piece with jewelry fields (material required, rest optional) and it appears under the Jewelry category.
- **US3 — Custom jewelry request**: As a buyer, I request a custom piece, fill a simple jewelry form (only relevant fields), and submit. The seller quotes; I pay a deposit; I track progress to delivery.
- **US4 — Jewelry category browse**: As a buyer, I browse a Jewelry category and filter by material/gemstone.
- **US5 — Apparel made-to-order parity**: Men's/Women's clothing sellers get the same made-to-order flow tailoring has (measurements + fabric).
- **US6 — Tailoring/fabric fixes**: Existing tailoring and fabric flows work end-to-end (defects from §8 audit resolved).

## 8. Tailoring + Fabric Fixes (audit complete — awaiting scope approval)

Discovery audit (2026-06-02) confirmed **18 bugs against `file:line`**. The flow spans Admin/seller Blade (`TailoringController` / `TailoringOrderController` / `TailoringFabricController`, routed live at `routes/web.php:293–333`) and Buyer Next.js (`Api\TailorController` via `routes/api/tailor.php`). **Both surfaces are live, so these are real, reachable defects.**

### P0 — broken / data-loss / guaranteed 500
1. `TailoringOrder::fabric()` relation undefined but eager-loaded + dereferenced → `RelationNotFoundException` on every admin order list/show/edit/delete (`TailoringOrder.php:25-82`; `TailoringOrderController.php:24,122,192`).
2. `fabric_id` column never migrated onto `tailoring_orders`, yet validated + written (`TailoringFabric.php:47-50`; `TailoringOrderController.php:70,86`).
3. `tailoring_fabrics` table self-contradictory: migration defines an order line-item (`order_id/stock_id/quantity_used/unit_price`) but model+controller assume a catalog (`name/code/price_per_meter/stock_quantity/company_id`). Admin fabric UI dead-by-design via a `Schema::hasColumn` guard. **Fabric is orphaned.** (`create_tailoring_fabrics_table.php:16-23`; `TailoringFabric.php:14-34`; `TailoringFabricController.php:35`)
4. `tailoring_orders` writes nonexistent columns `price`/`total_amount`/`measurements` (real cols are `total_cost`/`service_cost`) → 500 on every admin order create; reports sum nonexistent `price` (`TailoringController.php:77,102`; `TailoringOrderController.php:87,90`).
5. `getStatusAttribute()` reads nonexistent `tailoring_order_progress` table, conflicting with the real `status` enum column → 500 on any status read (`TailoringOrder.php:74-77`).
6. `TailoringMeasurement` relation + create path broken: `measurement()` keys on `order_id` which doesn't exist (table keys on `customer_id`); create writes unfillable `order_id/measurements` (`TailoringOrder.php:35-38`; `TailoringController.php:83-86`).

### P1 — feature broken
7. Buyer booking always 500s — validates `exists:services,id` but no `services` table (only `tailor_services`) (`TailorController.php:122,153`).
8. Frontend sends hardcoded string service ids (`'custom-suit'`) → `parseInt`→NaN → 422 (`tailoring/[id]/page.tsx:75,140-152`).
9. Unauthenticated `/tailors` index leaks full User model incl. email (`routes/api/tailor.php:7`; `TailorController.php:20,48`).
10. Buyer tailors listing + detail are 100% hardcoded mock data despite a working API+service existing; duplicate detail routes (`tailors/page.tsx:8-50`; `tailors/[id]/page.tsx:46-130`).
11. `MeasurementForm` submit handlers are no-ops — "save"/"add to cart" do nothing (`measurements/page.tsx:63`; `MeasurementForm.tsx:128-134`).

### P2 / P3 — integrity, dead code, cleanup
12. `tailor_id` FK points to `employees` but `Tailor`/`TailorProfile` treat it as a `tailor_profiles` FK — one side returns wrong/empty (SUSPECTED, runtime check).
13. `TailoringMaterialUsage` model has no backing table (latent 500 / dead).
14. `Tailor.php` + `TailorProfile.php` are duplicate models on `tailor_profiles`, drifting; `TailorProfile::measurements()` relation broken.
15. `getTimeSlots` indexes `working_hours` by Carbon `dayOfWeek` 0–6 — key scheme unverified (SUSPECTED).
16. Dead `return $measurements;` before view + `where('company_id', null)` filter (`TailoringController.php:113-119`).
17. `createBooking` hardcodes `service_price => 0`, never resolved (`TailorController.php:157`).
18. `TailoringFabricController::updateStock` calls undefined `stockMovements()` relation (`:218`).

**Headline:** the fabric sub-flow is orphaned + self-contradictory, the only live buyer write (booking) 500s, and buyer tailor pages are mock data. This is a real fix-up workstream (WS-C), independent of jewelry — must not block A/B.

**Scope decision needed from user**: which tiers to fix now (recommend at minimum all **P0 + P1**, since P0s mean admin tailoring pages currently 500).

## 9. Open Items / Verifications

1. Confirm `stocks.customization_options` / `additional_attributes` are read on a live code path (frontend PDP / API resource), not dormant declarations.
2. Settle custom-order table strategy (generalized `custom_orders` vs `jewelry_orders`) after reading `OrderService` + the `store_revenues` writer.
3. Append the approved tailoring/fabric bug list from the audit.
4. Confirm Jewelry category placement in the existing `categories` tree.

## 10. Workstreams (for orchestrator fan-out, post-sign-off)

- **WS-A Backend / vertical + jewelry config** (backend-engineer): store_types seeding, capabilities, jewelry config fields, custom-order table + lifecycle, API endpoints, revenue wiring.
- **WS-B Frontend / seller + buyer UI** (frontend-engineer): vertical-aware product form, jewelry custom-request form, jewelry category/PDP, made-to-order tracking UI. Atlas design system, Arabic/RTL, MAD.
- **WS-C Tailoring/fabric fixes** (debugger + the relevant specialist): independent — must not block A/B.
- **WS-D QA** (qa-engineer): PHPUnit feature tests for custom-order lifecycle + vertical gating; Vitest for forms.

These three feature workstreams (A, B, C) are independent enough to parallelize; C is fully decoupled.

---

*Next: `/speckit.plan` after user sign-off on §6 table strategy and §8 bug list.*
