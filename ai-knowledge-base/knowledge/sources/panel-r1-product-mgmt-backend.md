---
name: Panel round-1 drafts — product-management backend (Claude/Codex/Gemini/OpenCode)
description: The four independent round-1 reviewer drafts behind the 2026-05-30 product-management panel — convergent verdict on JSON-canonical variant attributes; OpenCode draft failed to run
type: source
tags: [php, artisan, queue, model, state, deploy, seller, product, architecture, cache]
sources:
  - raw/panel/r1-claude.md
  - raw/panel/r1-codex.txt
  - raw/panel/r1-gemini.txt
  - raw/panel/r1-opencode.txt
created: "2026-06-10"
updated: "2026-06-10"
---
# Panel round-1 drafts — product-management backend (Claude/Codex/Gemini/OpenCode)

## Summary
The raw round-1 (independent-draft) outputs of the 2026-05-30 panel run on the Beldify backend product-management subsystem, preserved as four files and combined here into one source page. Three reviewers produced punch lists that independently converged on the same single most important change — make `product_variants.attributes` JSON the canonical variant-options source, routed through one normalizer; the OpenCode draft never ran. The synthesized verdict from this run is recorded separately in [[sources/panel-2026-05-30-product-mgmt-backend]].

## Key points
- **Claude draft (r1-claude.md)**: P0s — variant options stored TWO ways (`attributes` JSON vs `variant_attribute_values` pivots pointing at near-empty lookups: 0 sizes, 0 colors); `product_variants.attributes` column missing from all migrations (deploy-blocking — `php artisan migrate` on staging+prod); `Stock::getTotalQuantityAttribute` pins a transient 0 for 5 minutes via `Cache::remember`. P1s — `description` vs `description_en` drift in `Seller\ProductController`; N+1 in variant maps; 0-byte placeholder.jpg; `StorageService::getUrl()` static-call breakage. P2s — orphaned JSON API methods in `ProductManagementController`; `createGroupVariants` matrix can time out a transaction (queue it). Verdict: pick `attributes` JSON as canonical, backfill from pivots.
- **Codex draft (r1-codex.txt, ~10k-line read-only CLI transcript, gpt-5.4, reasoning xhigh)**: P0s — variant attributes have no canonical source (seller/manage write JSON, image flow writes pivots, storefront reads pivots first); `variant_attribute_values` written two incompatible ways (three partial `attach()` calls vs update assuming one row with all three IDs); unified manage page posts payloads the reused legacy controllers do not accept (bilingual basics → locale-driven action; attribute pairs → update requiring lookup IDs); availability keyed off `stocks.quantity` or the 300s cached `total_quantity` with no write-path invalidation. P1s — inconsistent JSON handling (manual `json_encode` into a cast column), text-field incoherence (`description`/`description_en`/locale-specific persistence), stock-list N+1s, variant name/SKU built from nonexistent `$stock->product_name`. P2 — the admin product API is a third writer misaligned with `Stock::$fillable`; freeze until a shared write service exists. Single most important change: `attributes` as the only writable source, every path through one normalizer/service.
- **Gemini draft (r1-gemini.txt)**: P0s — `description` vs `description_en` column inconsistency; stale N+1 cache (`ProductVariantController` never invalidates `Stock::CACHE_KEY_TOTAL_QUANTITY` → stale 0 for 5 min). P1s — split-brain data model (admin `store()` writes both, admin `update()` pivots only, seller JSON only; JSON is the de facto truth since prod pivots are nearly empty; merge the 4 existing fabric pivot rows into JSON); fragile unified-page architecture (`back()->withInput()` loses active-tab state; recommended AJAX/Livewire). P2 — 0-byte placeholder.jpg. Verdict: JSON canonical + drop pivots + denormalize total quantity.
- **OpenCode draft (r1-opencode.txt, 114 bytes)**: failed to produce any review — `Error: Model not found: opencode/minimax-m2.5-free` plus a missing `_kb_opencode_sync` shell function. This is why the synthesized panel verdict records a 3-reviewer panel with "OpenCode absent".
- **Convergence**: all three completed drafts independently named the dual-source variant model as the root cause of variants not reaching buyers and prescribed one canonical JSON source behind a single write service — the design later implemented as `VariantWriteService`.

## See also
- [[sources/panel-2026-05-30-product-mgmt-backend]]
- [[concepts/variant-write-service]]
- [[concepts/options-matrix-variant-builder]]
