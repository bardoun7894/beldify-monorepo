---
name: specs/005-seller-verticals-jewelry/research.md
description: Auto-synced from specs/005-seller-verticals-jewelry/research.md
type: source
sync_origin: specs/005-seller-verticals-jewelry/research.md
sync_hash: c5fed4863835a273
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/005-seller-verticals-jewelry/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research: 005-seller-verticals-jewelry

**Generated**: 2026-06-02
**Feature**: [spec.md](./spec.md)

<!-- Sections populated by /kb-spec before each Spec Kit phase. -->

## Prior art from KB

*Queried 2026-06-02 · Mode: pre · "Prior decisions/conventions/gotchas about custom/made-to-order products, tailoring pipeline, seller store types/verticals, product configuration"*

### Custom / made-to-order products
- `Product` extends `Stock` — same `stocks` table. Anything querying "products" hits `stocks`.
- Custom flags on `stocks`: `is_custom` (bool, `scopeCustomizable()`), `customization_options` (array JSON — **shown to buyer as picker values**, i.e. a live path), `additional_attributes` (array JSON, freeform), `processing_time` (string), `tailor_id` (FK).
- **No dedicated `made_to_order` order type today** — custom products currently flow through the regular `Order` model; the only signal is `is_custom=true` + attached measurements. (This is what we are formalizing with a standalone custom-order table.)

### Tailoring pipeline gotchas (load-bearing for §8 fixes)
1. `TailoringOrder.status` is **computed** via `getStatusAttribute()` from the latest `TailoringOrderProgress` row — there is **no `status` column**. Raw `WHERE status=...` queries silently fail.
2. `tailoring_order_materials` pivot has a conditional `WHERE stocks.type='Raw Material'` — inserting a normal product SKU violates the constraint.
3. Service options are JSON (`TailorService.options`/`.requirements`), interpreted at runtime by `calculatePrice()`. No `tailor_service_options` table.
4. Measurement history is **append-only** (`measurement_history` logs old/new/reason). Never mutate.
5. **`TailoringFabric` ≠ `VariantFabric`** — KB describes `TailoringFabric` as raw-material inventory (`price_per_meter`, `stock_quantity`); but the live migration `2024_03_20_000001_create_tailoring_fabrics_table` defines `order_id`/`stock_id`/`quantity_used`/`unit_price`. **Schema↔model drift — flagged for the fabric audit.**

### Store types / verticals
- `StoreType` on `store_types` with `capabilities` JSON. Seeded today: `regular` `[products,orders,reviews]`, `tailor` `[products,orders,reviews,tailoring,measurements]`.
- `stores.store_type_id` FK (nullable) is the per-seller vertical hook. `stores.business_type` (string) also exists.

## Architecture notes from KB
*(pending /kb-spec plan)*

## Task patterns from KB
*(pending /kb-spec tasks)*

