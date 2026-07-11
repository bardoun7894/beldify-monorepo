---
name: specs/010-search-fixes/tasks.md
description: Auto-synced from specs/010-search-fixes/tasks.md
type: source
sync_origin: specs/010-search-fixes/tasks.md
sync_hash: 31a4cd068e38af17
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/010-search-fixes/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks — Spec 010 Search Fixes

Dependency-ordered, role-tagged. P0 first. Build in isolated worktrees (concurrent sessions own the main tree). Each task: TDD, zero new test failures, lint+build clean.

## Wave 1 — P0 (ship immediately, tiny + high-impact)

- [x] **T1 [backend]** Sort parity: in `ProductController` accept the frontend sort values (`price_asc`→price asc, `price_desc`→price desc, `top_rated`→reviews desc) OR add them as aliases to the existing `price_low`/`price_high`/`popular` cases. Add `relevance` (FULLTEXT score when `q` present). Keep `newest`. Ref: `ProductController.php:170-185`.
- [x] **T2 [frontend]** Add a "relevance" option to `SORT_OPTIONS` (default when a query is present) and confirm the 4 existing values now map. Ref: `products/page.tsx:85-90`. **DONE 2026-06-15:** extracted sort vocab into `src/app/products/sortConfig.ts` (`BASE_SORT_OPTIONS` + `RELEVANCE_SORT_OPTION`, `resolveSort`/`sortOptionsForQuery`/`defaultSortForQuery`); relevance chip + default surfaces only when `q` present; `products.sort.relevance` key added to all 7 locales (parity held, 2658 tests green).
- [x] **T3 [qa]** Regression test: assert each FE sort value yields a distinct, correct ordering against a seeded fixture (backend feature test + a frontend unit test on the options↔request mapping). **DONE 2026-06-15:** frontend unit test `src/app/products/__tests__/sortConfig.test.ts` (9 cases — vocabulary lockstep, query-scoped relevance, `resolveSort` URL→effective). Backend feature test (28 cases) shipped with T1 on backend `main` a12b8ec6 (live-verified). **Wave 1 (P0) CLOSED.**

## Wave 2 — P1 (discovery + measurement)

- [ ] **T4 [backend]** `search_queries` table + model + write path (term, normalized_term, result_count, user_id nullable, guest_token nullable, locale, created_at). Index on normalized_term + result_count. Record on every product search.
- [ ] **T5 [backend]** Real suggestions endpoint: `GET /api/search/suggestions?q=` → top product names + categories matching prefix (cap 8), cached briefly. De-mock `Mobile/SearchController::suggestions/trending/history/search` to use real data (T4 powers trending = top normalized_terms; history = per-user from search_queries). [depends T4]
- [ ] **T6 [frontend]** Header search typeahead: debounced (~150ms) dropdown wired to T5, keyboard-navigable, RTL-safe, shows recent (auth) + trending. Ref: `Navbar.tsx:214-221`. [depends T5]
- [ ] **T7 [backend]** Extend `computeFacets()` with `store` and `vertical` buckets + counts; ensure `in_stock`/`customizable` counts are present. Ref: `ProductController.php:932-1057`.
- [ ] **T8 [frontend]** Filter UI: add store + vertical filter groups (with counts) to `ProductFilters`; wire to query params. [depends T7]
- [ ] **T9 [backend]** Admin view / endpoint listing top zero-result queries from `search_queries`. [depends T4]

## Wave 3 — P2 (quality)

- [ ] **T10 [backend]** Partial/prefix match + curated synonym & transliteration map (djellaba/jellaba, caftan/kaftan/qaftan, takchita/takshita, …); "did you mean" suggestion on zero results.
- [ ] **T11 [backend]** Verify FULLTEXT columns are utf8mb4 + suitable collation; add a collation migration only if needed (test on a copy). Document Arabic search behavior in research.md.
- [ ] **T12 [backend+frontend]** Open Souk request search (or cross-link from product results to matching community requests).
- [ ] **T13 [qa]** End-to-end: search → facet → sort → paginate happy path across ar/en locales; zero-result path shows did-you-mean + Open Souk cross-link.

## Out of scope (separate specs)
- Meilisearch/Scout migration.
- Checkout `/orders/quote` 500 + multi-seller single-order + tax-default (→ propose spec 011-checkout-integrity).
- Account/PDP/notification findings (→ propose spec 012 after verification).

## Definition of done
Each wave: merged to main via `update-ref` (no shared-tree disruption), deployed, smoke-verified live, session log + KB updated.

