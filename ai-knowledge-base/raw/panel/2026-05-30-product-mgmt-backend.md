---
source: panel
reviewers: [claude, codex, gemini]
codex_model: gpt-5.4
gemini_model: gemini (plan mode)
opencode_model: unavailable (model "minimax-m2.5-free" not found)
date: 2026-05-30
target: backend product-management subsystem (seller/admin product, stocks, variants, images, storefront API, unified manage page)
scope: review + prioritized punch list
note: 3-reviewer panel (OpenCode/D absent). Round 2 cross-review folded into synthesis via draft overlap — 3-way agreement on the top items = de-facto consensus.
---

## Decision rationale
Panel called on a load-bearing data-model fork: variant options are stored TWO ways (free-text `attributes` JSON vs the `variant_attribute_values` size/color/fabric pivots) and read inconsistently, which is why seller variants don't reach buyers. All three reviewers independently reached the SAME headline — make `attributes` JSON the single canonical source — so that's adopted. The one genuine fork (delete the pivots vs keep them as a derived read-model) is surfaced to USER DECIDES; fail-safe default is "stop writing the dual path, keep the tables (non-destructive)".

## Consensus (all 3 agree — act now)

1. **Single canonical variant-options source = `attributes` JSON** [signal ~14, A+B+C]. Seller/manage write JSON; legacy admin writes pivots; storefront read pivots-first (just bridged). Fix: route EVERY variant write (seller, admin, image-group) through ONE normalizer/service that writes `attributes`; backfill `attributes` from existing pivot rows; storefront reads JSON-first.

2. **`Stock::total_quantity` 300s cache returns stale `0`** [signal ~15, A+B+C]. Accessor caches when variants not eager-loaded; no write path invalidates it. Fix: drop the cache; use `withSum/loadSum('variants','quantity')`; base storefront `in_stock` on variant qty with `stocks.quantity` only as no-variant fallback. (Optionally a denormalized column maintained by a ProductVariant saved/deleted observer.)

3. **`description` vs `description_en` incoherence** [signal ~13, A+B+C]. `Seller\ProductController` writes `description`; schema/admin/storefront use `description_en` → EN text silently dropped. Fix: standardize on `description_en` (persist both language columns on every writer); backfill.

## Majority / strong (Codex-decisive correctness bugs — high confidence)

4. **Unified manage page: variant EDIT will 422** [B conf 5; A/C flagged general fragility]. The variant modal posts `attr_keys/attr_values` to `variants.update`, but that action REQUIRES `size_id/fabric_id/color_id` (`exists:variant_sizes…`) — and those lookups are empty. So editing a variant from the new page fails validation. (Create via `variants.store` works — it takes `attribute_keys/values`.) Fix: add a section-specific "manage" update endpoint/DTO that accepts the JSON attribute pairs (don't reuse the legacy lookup-ID `update` contract). **This is a bug in the page just shipped.**

5. **`variant_attribute_values` written two incompatible ways** [B conf 4]. `store()` does 3 separate `attach()` (partial rows); `update()` assumes one row with all 3 IDs. Resolved for free by going JSON-canonical (#1) — stop writing pivots.

6. **Admin variant `store()` double-encodes JSON** [B conf 4]. Manually `json_encode`s into a `json`-cast column; accessor decodes raw. Fix: assign arrays directly, never pre-encode (same trap already fixed on the seller path).

7. **Stock-list N+1** [A+B, signal ~8]. `image_url` called per row with no image eager-load; super-admin branch eager-loads `variants` the table doesn't use. Fix: eager-load `primaryImage`/`productImages`, drop unused `variants` load, use aggregate columns not accessor side-effects.

8. **Variant name/SKU uses `$stock->product_name` which doesn't exist** [B conf 4] → malformed names/SKUs from image-group + admin paths. Fix: one stock display-name helper used everywhere.

## Weighted minority / P2
- **Orphaned `ProductManagementController` JSON API methods** [A+B] reference `brand`/`dimensions`/`reviews`/`sku` columns not on `Stock` + mass-assign fields not in `$fillable` → 500 if routed. Freeze/remove those routes (keep only `manage()`).
- **`placeholder.jpg` is 0 bytes** [A+C] → broken images. Ship a real asset; centralize URL building in one ImageService helper with fallback.
- **`createGroupVariants` size×color matrix** can create hundreds of variants in one request → transaction timeout [A]. Queue it.

## Deploy-blocking (carried from known issues, panel confirms)
- **`product_variants.attributes` migration was absent in prod** → run `php artisan migrate` on staging+prod before any variant write path ships.

## Unresolved conflict — USER DECIDES
**Keep or drop the `variant_attribute_values` pivot + VariantSize/Color/Fabric lookup tables?**
- Gemini (C): DROP them entirely; merge the 4 fabric rows into JSON.
- Codex (B): keep them only as a DERIVED projection IF you need storefront faceting (filter-by-color/size).
- Claude (A): keep optional/denormalized; stop the dual write.
- **Fail-safe default (recommended):** stop WRITING the pivots, make JSON canonical, but DON'T drop the tables yet (dropping is irreversible; faceted filtering may be wanted later). Revisit dropping once you confirm the storefront never needs relational color/size facets.

## Final prioritized punch list (ranked by signal)
1. [P0] One variant-write normalizer/service → `attributes` JSON canonical; backfill from pivots; storefront reads JSON-first. (#1,#5,#6)
2. [P0] Kill `total_quantity` cache → `withSum`/observer; storefront in_stock off variant qty. (#2)
3. [P0] Run the `product_variants.attributes` migration on prod. (deploy-blocking)
4. [P0] Fix unified-page variant EDIT (new manage update endpoint accepting JSON attrs, not lookup IDs). (#4)
5. [P1] Standardize `description_en`; persist both languages; backfill. (#3)
6. [P1] Stock-list eager-load + drop unused variants load. (#7)
7. [P1] Stock display-name helper for variant name/SKU. (#8)
8. [P2] Remove orphaned JSON API methods; real placeholder asset; queue createGroupVariants. 

## Single most important change (unanimous)
Make `product_variants.attributes` the ONE writable source of variant options and force every seller/admin/storefront path through a single normalizer/service that reads & writes it — eliminating the split-brain model that is the root cause of variants not reaching buyers.
