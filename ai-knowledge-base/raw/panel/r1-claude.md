# Round 1 — Plan A (Claude)

Prioritized punch list. Format: `area` - severity - issue - fix.

## P0 — Data-model incoherence: variant options stored TWO ways
`ProductVariant` - P0 - Options live in BOTH `attributes` (JSON) AND relational pivots (`variant_attribute_values` → VariantSize/Color/Fabric). Seller writes JSON only; legacy admin variant form writes pivots (+requires size_id/color_id/fabric_id that point at near-empty lookups: 0 sizes, 0 colors); storefront historically read pivots (just bridged to also read JSON). Two sources of truth → variants silently don't reach buyers. - **Pick `attributes` JSON as canonical** for this marketplace (sellers can't manage lookup tables; lookups are empty). (a) storefront reads `attributes` first (bridge done), (b) write a backfill command populating `attributes` from existing pivots, (c) drop the `required` size_id/color_id/fabric_id rules in `ProductVariantController@update` (currently unusable — they require empty lookups), (d) keep pivots as optional denormalized cache or remove.

`product_variants.attributes` - P0 - Column was MISSING from all migrations despite the model casting it → admin variant creation silently broken in prod. Migration just added. - **Deploy-blocking: run `php artisan migrate` on staging+prod before any variant write path ships.**

`Stock::getTotalQuantityAttribute` - P0 - When variants not eager-loaded, accessor does `Cache::remember(key,300,...)`; a transient/early 0 pins 0 for 5 min (caused the listing showing 0). - Eager-load variants wherever total_quantity is read; OR drop the cache and use a `withSum('variants','quantity')`; AND add a ProductVariant saved/deleted observer that forgets `CACHE_KEY_TOTAL_QUANTITY.$stock_id`.

## P1
`Seller\ProductController@store/update` - P1 - Writes `$stock->description` (EN) but schema/admin use `description_en` → EN descriptions silently dropped. - Standardize on `description_en`.

`CategoryProductsController` + `stock_table` - P1 - Variant map reads `->colors->sizes->fabrics` per variant and `image_url` per row → N+1. - Eager-load `variants.colors/sizes/fabrics` (or just `attributes` if going JSON-canonical) and `productImages`/`withCount('variants')` in the list/API queries.

`placeholder.jpg` / `image_url` - P1 - 0-byte placeholder + Contabo URLs that 404 → blank image boxes everywhere. - Ship a real placeholder asset; centralize URL building in one ImageService helper with graceful fallback.

`StorageService::getUrl()` - P1 - Static call breaks on PHP 8.5 (instance method); some views fixed to `app(StorageService::class)->getUrl()`, others may not be. - Audit + fix all static call sites (or add a real static facade).

## P2
`ProductManagementController` - P2 - Orphaned JSON API methods (store/update/index/show) reference `brand`/`sku`/`dimensions`/`reviews` columns/relations that likely don't exist → would 500 if routed. Lives beside the new `manage()` Blade method. - Quarantine/remove the dead JSON methods.

Unified page (`manage`) composition - P2 - redirect_to normal-form-per-section is pragmatic & low-risk (no logic dup, legacy pages intact) but: full reload per save, no atomic "save all", redirect_to guard duplicated across 4 controllers, fragile if APP_URL misconfigured. - Keep for v1. Extract the redirect_to guard to a trait/middleware. Migrate to AJAX/Livewire only if it must feel app-like — don't prematurely.

`ProductImageController::createGroupVariants` - P2 - size×color matrix can create hundreds of variants + images in one request → transaction timeout. - Queue the variant-creation job; decouple from the upload response.

## Single most important change
Make `attributes` JSON the **one canonical** variant-options source across seller + admin + storefront, with a backfill from the legacy pivots. This kills the dual-source incoherence (the root cause of variants not reaching buyers) and unblocks every other variant fix.
