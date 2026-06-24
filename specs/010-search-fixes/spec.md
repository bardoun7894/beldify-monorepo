# Spec 010 — Search Feature Fixes & Hardening

**Status:** draft
**Created:** 2026-06-14
**Owner:** TBD
**Source:** Gap audit 2026-06-14 (see [research.md](./research.md))

## Problem

The Beldify product/search experience has one confirmed user-facing bug and a set of missing-expected-behaviors that limit catalog discovery — the single most important conversion path for a multi-seller marketplace. Search currently runs on MySQL FULLTEXT (Meilisearch deferred) and is products-only.

## Goals

1. **Fix sort** so every advertised sort option actually works (currently 3 of 4 are silently broken).
2. **Make search discoverable** — typeahead suggestions, recent searches, no dead ends on typos.
3. **Make results filterable** the way a multi-seller marketplace expects — by store and by vertical, with counts.
4. **Make search measurable** — log queries (especially zero-result) so the catalog gap is visible.
5. **Remove fake data** — the mobile suggestion/trending/history endpoints currently return hardcoded mocks.

## Non-Goals

- Full Meilisearch/Scout migration (tracked separately; FULLTEXT stays the engine for now).
- AI/natural-language search (the `SearchAssistBar` AI path is out of scope here).
- Multi-currency search.

## Functional Requirements

### FR1 — Sort parity (P0, confirmed bug)
The frontend `SORT_OPTIONS` values MUST match the backend `ProductController` switch cases. Today:
- FE sends `price_asc`, `price_desc`, `top_rated`; BE handles `price_low`, `price_high`, `popular`.
- Only `newest` matches; the other three silently fall through to default order.
Fix by aligning the contract (preferred: backend accepts the FE values, or add aliases) AND add a regression test asserting every FE sort value maps to a distinct BE ordering. Add an explicit **"relevance"** sort option (default when a query is present; FULLTEXT relevance already computed server-side).

### FR2 — Search typeahead (P1)
The header search input MUST offer debounced suggestions as the user types (product names + categories), backed by a real endpoint. Keyboard-navigable, RTL-safe, dismissable.

### FR3 — Recent & trending searches (P1)
Logged-in users see their recent searches; all users see trending searches. Backed by real data (see FR5), not mocks.

### FR4 — Store & vertical facets (P1)
`computeFacets()` MUST return store/seller and vertical (jewelry/tailoring/womenswear/…) facet buckets with result counts, and the filter UI MUST expose them. Reuse the existing `vertical` field already on product payloads.

### FR5 — Search analytics (P1)
Persist every search query (term, result count, user/guest, locale, timestamp) to a `search_queries` table. Surface zero-result queries to admin. This replaces the mocked `track-search` endpoint.

### FR6 — De-mock mobile search (P1)
`Mobile/SearchController` `suggestions()`, `trending()`, `history()`, `search()` MUST return real data or be removed if the mobile app does not consume them. No hardcoded iPhone/electronics fixtures.

### FR7 — Typo & synonym tolerance (P2)
At minimum: trailing-wildcard/partial match and a curated synonym/transliteration map for high-value terms (djellaba/jellaba, caftan/kaftan/qaftan, takchita/takshita). Surface a "did you mean" suggestion on zero results.

### FR8 — Arabic FULLTEXT correctness (P2)
Verify the FULLTEXT index columns are `utf8mb4` with an appropriate collation; confirm Arabic/Darija queries return relevant results. Document the result.

### FR9 — Open Souk search (P2)
Allow searching community requests, or at least surface a clear cross-link from product search results to matching Open Souk requests.

## Success Criteria

- All sort options change result order verifiably (test-covered).
- Typeahead returns real suggestions within ~150ms debounce.
- Facets include store + vertical with non-zero counts on seeded data.
- Zero-result queries are queryable in the DB after a search.
- No endpoint returns hardcoded mock fixtures.
- No NEW test failures; lint + build clean; deployed and smoke-verified.

## Risks

- Heavy concurrent activity in the repo → build all work in isolated git worktrees, merge via `update-ref`.
- Arabic FULLTEXT may need a collation migration (data migration risk — test on a copy first).
