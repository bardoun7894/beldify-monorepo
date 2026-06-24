---
name: Panel review — product-management backend
description: 3-reviewer panel on the variant split-brain, stale stock cache, description drift, and variant-edit 422
type: source
sources: [raw/panel/2026-05-30-product-mgmt-backend.md]
created: 2026-06-03
updated: 2026-06-03
---

# Panel review — product-management backend

## Summary
A 3-reviewer panel (Claude+Codex+Gemini; OpenCode absent) on the backend product-management subsystem. Unanimous headline: variant options are stored two ways and read inconsistently, which is why seller variants never reach buyers.

## Key points
- **Variant split-brain (consensus)**: free-text `attributes` JSON vs `variant_attribute_values` size/color/fabric pivots, read inconsistently. Make `attributes` JSON the single canonical source; route every write through one normalizer; backfill from pivots; storefront reads JSON-first.
- **`Stock::total_quantity` stale-`0` cache**: 300s cache, no write-path invalidation → use `withSum`/`loadSum` (or observer-maintained column); base `in_stock` on variant qty.
- **`description` vs `description_en`**: `Seller\ProductController` writes `description`; schema/storefront use `description_en` → EN text silently dropped. Standardize on `description_en`.
- **Unified manage page: variant EDIT 422s** — modal posts `attr_keys/attr_values` but `variants.update` requires `size_id/fabric_id/color_id`. Needs a manage-specific JSON-attr update endpoint.
- **Admin variant `store()` double-encodes JSON**; stock-list N+1; variant name/SKU uses nonexistent `$stock->product_name`.
- **Deploy-blocking**: `product_variants.attributes` migration was absent in prod.
- **USER DECIDES**: keep or drop the pivot/lookup tables. Fail-safe default: stop writing pivots, keep tables (non-destructive).

## See also
- [[concepts/variant-write-service]]
- [[concepts/options-matrix-variant-builder]]
- [[concepts/multi-seller-ecommerce]]
