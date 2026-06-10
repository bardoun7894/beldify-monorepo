# Research: buyer-ai

**Generated**: 2026-06-10
**Feature**: [spec.md](./spec.md)

## Prior art from KB

*Seeded 2026-06-10T22:05 from the feature-007 research pass (same session) — see [[../007-ai-seller-credits/research.md]] for the verified AI-infrastructure code map.*

### Reusable AI plumbing (verified in 007)

- `app/Services/Ai/AiManager.php` + `Contracts/ChatClient.php` (`chat()`/`json()`, null on failure) + `OpenAiCompatibleClient` (fallback-model retry). Keys DB-backed/encrypted ([[beldify-ai-settings-db-backed]]), model `openrouter/free` ([[beldify-ai-openrouter]]).
- Feature-007 pattern to copy for failure paths: AI null → graceful fallback. (007 refunds credits; 008 has no credits — just degrade.)
- `SellerAiService` (007) shows prompt structure + JSON-shape validation; `CategoryTranslationService` shows locale-constrained JSON output.

### Catalog & search

- Catalog truth is `stocks` + `product_images.stock_id`; `products` table is legacy/EMPTY ([[beldify-catalog-stocks-table]]). Any product resolution mirrors `SellerProductController`/public product controllers.
- FULLTEXT search + facets shipped 2026-06-10 (Wave 5b, BE-9) — smart-search assist must FEED this, not replace it.

### Reviews

- Order-scoped review endpoints shipped 2026-06-10 21:20 (`472b6f06`): review-status + bulk submit, owner+delivered only, `verified_purchase`, moderation `pending`. Summaries must use APPROVED reviews only.
- Reviews hardening landed in Wave 5b (BE-14).

### Verticals / sizing

- `store_types` verticals + conditional product fields ([[beldify-seller-verticals-jewelry]]); size advice must constrain to the product's real variants (options-matrix/variant system — see [[concepts/options-matrix-variant-builder]], [[concepts/variant-write-service]]).

### Constraints carried forward

- [[beldify-whatsapp-never-checkout]] — no seller contact data in any AI output.
- [[concepts/caching-strategy]] — existing cache patterns; review-summary cache must invalidate on new approved review, never inline-regenerate on request path.
- [[beldify-i18n-architecture]] — 5 locales, Darija default; assist must handle Darija input.
- [[beldify-nested-backend-git-repo]] + [[parallel-agents-shared-tree-stash-hazard]] — branch/commit both repos separately; explicit-path staging only.
- Throttle precedent: 007 AI endpoints use `throttle:10,1`; public buyer endpoints need per-IP guest limits.
- BUILD GATE: frontend prod deploy rsyncs the LIVE local working tree ([[beldify-frontend-prod-deploy]]) — do not start 008 frontend work while a deploy agent is syncing (007 deploy in flight at spec time).
