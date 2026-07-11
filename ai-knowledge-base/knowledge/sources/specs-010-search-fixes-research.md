---
name: specs/010-search-fixes/research.md
description: Auto-synced from specs/010-search-fixes/research.md
type: source
sync_origin: specs/010-search-fixes/research.md
sync_hash: 1cfcbc51c7f05b1b
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/010-search-fixes/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research: Search Fixes (Spec 010)

**Generated:** 2026-06-14
**Feature:** [spec.md](./spec.md)

## Audit findings (2026-06-14 gap sweep)

### CONFIRMED (code-verified by maintainer)
- **Sort mismatch (P0).** FE `products/page.tsx:86-89` sends `newest`, `price_asc`, `price_desc`, `top_rated`. BE `ProductController.php:172-184` handles `price_low`, `price_high`, `newest`, `name_asc`, `name_desc`, `popular`. Only `newest` matches → 3 of 4 sorts silently fall through to default order.
- Pagination meta is only added `if ($request->filled('page'))` (`ProductController.php:300`). Frontend `useSWRInfinite` sends `page=` so first load is page=1 (meta present) — likely OK, but confirm no path requests without `page`.

### REPORTED by audit, NOT yet code-verified (verify before building)
- Header search has no typeahead (plain `<input type=search>`), `Navbar.tsx:214-221`.
- `Mobile/SearchController` `suggestions/trending/history/search` return hardcoded mock fixtures (`:86-321`).
- No `search_queries`/analytics table; `track-search` route exists but no persistence.
- `computeFacets()` returns categories/colors/sizes/fabrics/price only — no store, no vertical (`:932-1057`).
- No typo tolerance / synonyms; FULLTEXT NATURAL LANGUAGE only.
- FULLTEXT index added `2026_06_10_000001_add_fulltext_index_to_stocks_table.php`; Arabic collation unverified.
- Two search service classes (`SearchService` vs `ProductSearchService`); only `ProductSearchService` used → possible dead code.
- Open Souk requests not searchable (products-only).

## Prior art from KB
- Search runs on **MySQL FULLTEXT** as the interim engine; **Meilisearch/Scout deferred** (backlog `2026-06-10-backlog-make-later`).
- `vertical` field already exposed on product payloads (storeType→slug via `Verticals` guard, commits 87d0d8ae / 3a349984) — reuse for FR4 vertical facet.
- Card payload already carries `compare_price`, `variants_count`, `review_count`, `stock_quantity`.

## Conventions to honor
- API prefix `/api/v1`; Sanctum + httpOnly cookies; PostgreSQL? (No — MySQL 8 in prod per docker). Tailwind utility classes, white-canvas Atlas tokens, RTL-safe logical properties, i18n across ar/ma/en/fr/es.
- Build isolated (worktrees), merge via `update-ref`, deploy via git-archive→rsync→build.

## Arabic search behavior & FULLTEXT collation (T11 — 2026-06-16)

**Verdict: no collation migration required for correctness.**

How Arabic search actually resolves (`ProductSearchService::applySearch`):
- MySQL path = `MATCH(...) AGAINST(? IN NATURAL LANGUAGE MODE)` **OR** a LIKE
  union across `product_name_{en,ar}` + `description_{en,ar}`.
- The LIKE union is the safety net: `LIKE '%قفطان%'` matches Arabic substrings
  regardless of FULLTEXT tokenization/collation. T10 expands that union across
  synonym/transliteration variants. Recall is therefore independent of the
  FULLTEXT collation — confirmed green by `ProductSearchTest`'s Arabic cases.
- The `ft_stocks_search` index (migration `2026_06_10_000001`) is, per its own
  docblock, *"never required for correctness"*. It only improves **relevance
  ranking** for the `MATCH` clause; on Arabic, MySQL's default parser is
  space-delimited (no stemming) so ranking is approximate either way.

What still warrants a one-time prod check (read-only, do NOT migrate blind):
```sql
-- Confirm the Arabic text columns are utf8mb4 (not latin1/utf8mb3):
SHOW FULL COLUMNS FROM stocks
  WHERE Field IN ('product_name_ar','description_ar','product_name_en','description_en');
-- Expect Collation = utf8mb4_unicode_ci or utf8mb4_0900_ai_ci.
SHOW TABLE STATUS LIKE 'stocks';  -- expect Collation utf8mb4_*
```
Only if a column reports a non-utf8mb4 charset should a `MODIFY COLUMN ...
CHARACTER SET utf8mb4` migration be written — and tested on a DB copy first,
because changing a column charset rebuilds the table and the FULLTEXT index.

**Recommendation:** ship T10 as-is (recall is correct today); treat the column
charset audit as an ops checklist item, not a code task.

