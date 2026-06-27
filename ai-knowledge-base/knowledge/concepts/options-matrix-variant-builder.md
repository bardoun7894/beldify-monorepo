---
name: Options→Matrix Variant Builder (Beldify Seller)
description: "Seller product form UX where the seller declares options once (Color, Size) and the system auto-generates the full combination matrix at the same base price — the Shopify-style pattern"
type: concept
tags: [php, blade, migration, javascript, mysql, seller, product, refactor, i18n, color]
sources: [daily/2026-05-31.md]
created: "2026-05-31"
updated: "2026-05-31"
---
# Options→Matrix Variant Builder (Beldify Seller)

## Overview
The original Beldify seller variant form required sellers to manually add one row per combination — for 3 colors × 4 sizes that is 12 tedious rows, each repeating the same price. The options-matrix builder replaces this with a Shopify-style UX: the seller declares *options* once (Color: Red, Blue; Size: S, M, L), taps **Generate**, and the system auto-creates all 6 combinations sharing the base price. Regeneration merges (preserves edited stock), and the manual "Add variant" escape hatch still exists for non-matrix cases.

## Key Points
- **Same field contract**: generated rows use the exact same `variants[N][name|attr_keys[]|attr_values[]|price|quantity|sku|id|_delete]` field names as the manual add-variant button — zero backend change required
- **Price behavior**: `price=""` (blank) → `VariantWriteService` defaults to `$stock->current_sale_unit_price` → all generated variants share the base price without retyping
- **Merge-preserves-stock**: `runMatrixGeneration()` diffs existing rows by `buildComboKey` (sorted `key=val|...` pairs); existing combos are kept untouched (preserving edited `quantity` and the `File` object held by variant image inputs); only truly new combos are appended; removed combos are soft-deleted (`_delete=1`)
- **Edit-mode pre-population**: `readOptionsFromRows()` scans existing rows' attr inputs, unions values per key-name, and pre-populates the builder on `DOMContentLoaded`
- **Price-per-variant toggle**: defaults `checked=true` if any existing row has a non-blank price — prevents silent data loss on edit
- **Chip deduplication gap**: entering "Red" twice produces duplicate combos (known, non-blocking for normal use)

## Details

### Implementation
The builder is pure JavaScript in `public/js/seller-product-form.js` + markup in `resources/views/components/partials/product-form.blade.php`. It uses `createVariantRow(idx)` (the existing template-clone function) to emit rows, then calls `addAttrRow(row, key, val)` to inject attribute pairs — so the DOM structure is identical to manually added rows.

The cartesian product is computed client-side from the option chips declared in the builder. The chip UI uses a text input + "Add value" button + dismissible amber chip pills.

### Verified end-to-end (2026-05-31)
- Declared Color(Red, Blue) × Size(S, M, L) → 6 rows auto-generated with correct names ("Red / S", etc.) and `attrs` JSON
- Saved to DB: product #14, 6 variants each at base price 150 MAD, correct `{Size, Color}` attributes, `total_qty=29` summed
- Regeneration preserved edited `qty=9` on unchanged combos
- i18n keys added to en/ar/fr for all new labels (`messages.add_option`, `option_name`, `add_value`, `generate_variants`, etc.)

### Known gap: `current_purchase_unit_price` NOT NULL
The `VariantWriteService` refactor temporarily dropped `current_purchase_unit_price = 0` from `Seller\ProductController::store()`. Because the `stocks` table has this column as NOT NULL with no default, any real seller create failed with a strict MySQL error. Fixed by re-adding `'current_purchase_unit_price' => 0` to the store payload.

## Related Concepts
- [[concepts/variant-write-service]] — the backend service that persists generated variant rows
- [[concepts/seller-experience-specs-006]] — seller product experience spec that this feature addresses
- [[concepts/sqlite-migration-driver-guard]] — related migration compatibility issue discovered in same session

## Sources
- [[daily/2026-05-31.md]] — Options-matrix variant builder implemented (frontend-engineer agent); verified end-to-end with product #14; `current_purchase_unit_price` regression found and fixed

## See also
- [[sources/panel-2026-05-30-product-mgmt-backend]]
