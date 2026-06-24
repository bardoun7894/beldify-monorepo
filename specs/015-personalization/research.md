# Research: personalization

**Generated**: 2026-06-19
**Feature**: [spec.md](./spec.md)

## Prior art from KB

*Mode: pre · Question: behavioral tracking / recommendations / related products / preference profile + supporting infra.*

**What exists (raw signals, no learning layer):**
- **Wishlist** — `customer_wishlists` (+ `notify_on_restock`, `notify_on_price_drop`, `target_price`); daily `SendWishlistNotifications` at 10:00; guest wishlist is client-side localStorage. [[concepts/beldify-guest-wishlist]]
- **Orders + reorder** — `POST /api/orders/{orderNumber}/reorder`, owner-scoped. [[sources/hooked-2026-06-09-opensouk-marketplace-loop]]
- **Follow-a-shop** — `store_followers` + `FollowShopButton.tsx`; "new drop" notification path exists but no job fires it. [[concepts/beldify-retention-loop-closure]]
- **Search** — MySQL FULLTEXT/LIKE; Meilisearch on roadmap. [[concepts/marketplace-completeness-roadmap]]
- **`DiscoverFeed.tsx`** — AliExpress-style `useSWRInfinite + IntersectionObserver`, `GET /api/products/all?sort=newest|popular`; **no user signal** — identical for everyone. [[sources/2026-06-10-home-marketplace-overhaul]]

**Catalog/attribute model:** catalog = `stocks` (legacy `products` empty); `product_variants.attributes` JSON canonical for color/size/fabric (pivots nearly empty in prod); categories 8 parent + subs, bilingual + slug + parent_id. [[concepts/variant-write-service]]

**Infra ready:** Redis live (`{domain}:{entity}:{id}`, 5-min TTL pattern); queue workers running; scheduler wired 2026-06-10 (`wishlist:send-notifications` daily, `carts:process-abandoned` hourly); `AiManager` + OpenRouter DB-backed.
**Infra missing:** no embeddings/vector store; **no behavioral event log**; no recently-viewed; no related-products logic; no preference profile; no search-history persistence.

**Gap (this feature):** the *signal aggregation layer* (a `user_interactions` event log), a *scoring/ranking job*, and a *personalized endpoint* that accepts user context. Meilisearch (built-in vector search) is the natural Stage-2 infra step. [[concepts/marketplace-completeness-roadmap]]

## Conventions to follow

- **Guest → auth merge**: reuse the guest-token merge path used by cart/wishlist (idempotent). [[concepts/beldify-guest-wishlist]] [[memory: beldify-guest-cart-unblocked]]
- **Redis caching**: `{domain}:{entity}:{id}`; cache the affinity profile + feed, never scan the raw log per request.
- **Cache-poison rule**: feed/recommendation resources served from cache MUST NOT embed viewer-specific fields — overlay per-request. [[concepts/open-souk-feature]]
- **Content-locale**: product fields via `LanguageService::contentLocale()` not hardcoded `$locale==='ar'`. [[concepts/i18n-7-locale-expansion]]
- **Scheduler/queue**: profile rebuild + co-occurrence as scheduled jobs (scheduler already wired); heavy work off the request path.
- **FE**: don't gate user feedback behind debug flags; `useSWRInfinite` already the feed pattern; batch/beacon events.
- **Don't over-build**: Stage 0 (heuristic) + Stage 1 (item-item co-occurrence) ≈ 80% of the Amazon feel with zero ML/embeddings; embeddings wait for Meilisearch.
