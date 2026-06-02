---
name: VariantWriteService (Beldify)
description: Canonical single-normalizer for all variant writes in Beldify — admin, seller, and manage controllers all route through one service, ending split-brain variant persistence
type: concept
sources: [daily/2026-05-31.md]
created: 2026-05-31
updated: 2026-05-31
---

# VariantWriteService (Beldify)

## Overview
The Beldify backend had a split-brain variant-write problem: the seller `ProductController` wrote variant attributes as a JSON column (`attributes`), the legacy admin `ProductVariantController` wrote to size/color/fabric pivot tables, and the new unified `ProductManagementController` had its own path. The `VariantWriteService` is a canonical single normalizer that routes all three paths through one service method, ensuring JSON `attributes` is canonical while maintaining backward compatibility with pivot tables when legacy lookup IDs are present.

## Key Points
- **Single method signature**: `upsert(Stock $stock, array $data): ProductVariant` — used by admin, seller, and manage controllers
- **Accepts**: `id?` (update if present), `name?`, `sku?` (auto-generates if blank), `price?` (defaults to `$stock->current_sale_unit_price`), `quantity?`, `attribute_keys[]` + `attribute_values[]` (parallel pairs), `size_id`/`color_id`/`fabric_id` (legacy pivot back-compat)
- **JSON canonical**: writes `attributes` as a PHP array (cast handles encoding); avoids the double-encode trap where `json_encode()` was called on an already-string value
- **Pivot back-compat**: writes pivot rows when lookup IDs are present so existing pivot-based storefront faceting still works
- **Caller owns transactions**: the service doesn't wrap its own transaction — callers handle rollback scope

## Details

### Why it was needed
The variant edit path in the new unified admin `ProductManagementController` was broken before this service: it posted `attr_keys[]`/`attr_values[]` but the update action required `size_id`/`color_id`/`fabric_id` (lookup IDs). New seller create/edit also needed a consistent path. Three separate code paths meant three different attribute shapes in the database.

### The double-encode trap (fixed)
The original admin `ProductVariantController::store()` called `json_encode($attributesArray)` before assigning to `$variant->attributes`. Because the model declares `attributes` as a JSON cast, Eloquent encodes it again on save — producing a double-encoded string that renders as a JSON string literal instead of an object. The service assigns the PHP array directly and lets the cast handle encoding.

### Missing migration (deploy-blocking issue discovered)
The `ProductVariant.attributes` column was declared as a JSON cast in the model but **no migration ever created the column**. This meant admin variant creation had been silently broken in production. The migration `2026_05_30_001553_add_attributes_to_product_variants_table.php` was created during this session. Running `php artisan migrate` on staging/production was flagged as deploy-blocking.

### `createGroupVariants` left untouched
The `Admin\ProductImageController::createGroupVariants` method uses a `VariantSize × VariantColor` matrix with bulk `variant_images` insert. Routing it through `upsert()` would require changing its iteration logic and the image-attachment step. The panel verdict was to leave it and queue it as P2.

## Related Concepts
- [[concepts/seller-experience-specs-006]] — seller product experience specs that motivated the refactor
- [[concepts/admin-atlas-migration]] — admin migration context where the variant write split was discovered
- [[concepts/laravel-optional-typehint-pitfall]] — related PHP type pitfall in the same codebase

## Sources
- [[daily/2026-05-31.md]] — VariantWriteService extracted; double-encode bug fixed; `ProductVariantPunchListTest` (6 passing); all three controllers wired; missing `attributes` column migration created
