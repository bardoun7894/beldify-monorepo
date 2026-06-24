# Implementation Plan: Personalized "For You" — Behavioral Intelligence Layer

**Branch**: `015-personalization` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

## Summary

Add the three missing pieces — a behavioral **event log**, an **affinity-profile builder** (cached in Redis, rebuilt by a scheduled job), and a **personalized feed endpoint** — then wire the existing `DiscoverFeed` to it and add Recently-Viewed + Similar-Items rails. Navigation (views/dwell/browse/search) is the dominant, highest-volume signal. Heuristic/content-based first (no ML); item-item co-occurrence as a fast follow; embeddings deferred to the Meilisearch era.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 10), TypeScript 5.x (Next.js 15)
**Storage**: MySQL (`user_interactions` event log + optional `affinity_profiles` snapshot); **Redis** for live profiles + cached feeds
**Infra reused**: wired scheduler (profile/co-occurrence jobs), queue workers, Redis cache, existing `DiscoverFeed.tsx` + `useSWRInfinite`
**Testing**: PHPUnit Feature (`php artisan test tests/Feature/...`), Vitest (`npm run test` from `beldify-frontend`)
**Constraints**: feed reads cached profile (<150ms p95), never scans raw log per request; cache must not poison across users; guest→auth merge idempotent

## Data Model

### New: `user_interactions` (high-write event log)
```
id, user_id nullable fk, guest_token nullable string(index),
event_type string,          # view|dwell|browse|impression|search|add_to_cart|wishlist|follow|purchase
subject_type string,        # stock|category|store|query
subject_id bigint nullable, # null for free-text query
query_text string nullable,
weight decimal(4,2),
metadata json nullable,
created_at (index)
INDEX (user_id, created_at), (guest_token, created_at), (subject_type, subject_id)
```
Retention: rollup/prune raw rows older than N days after they're folded into profiles.

### New (optional, durability): `affinity_profiles`
```
user_id pk/fk, category_scores json, price_band json, attribute_prefs json,
seller_prefs json, recent_searches json, recently_viewed json,
personalization_enabled bool default true, recomputed_at
```
Live copy in Redis (`reco:profile:{user_id}` / `reco:profile:guest:{token}`); DB row is the durable snapshot + opt-out flag.

## Components

**Backend**
- `EventController` → `POST /api/v1/events` (batched array; accepts user or `X-Guest-Token`; cheap insert, queueable).
- `InteractionMergeService` — on login, re-attribute `guest_token` rows to `user_id`, idempotent (reuse cart/wishlist merge hook).
- `AffinityProfileService` — build/update profile from events with **time-decay**; read-through Redis cache.
- `RecommendationService` — `forYou(user, page)` (rank catalog by profile), `recentlyViewed(user)`, `similarTo(stockId, user)` (content-based: same category + `product_variants.attributes` similarity + popularity fallback).
- Endpoints: `GET /api/v1/recommendations/for-you`, `/recently-viewed`, `GET /api/products/{id}/similar`.
- Scheduled jobs (scheduler already wired): `reco:rebuild-profiles` (nightly), Stage 1 `reco:build-cooccurrence` (nightly co-view/co-purchase matrix → cached).
- Opt-out: `PUT /api/v1/me/preferences { personalization_enabled }`.

**Frontend**
- `lib/track.ts` — `track(event)` helper; debounced/batched beacon; fires on PDP view + dwell, category browse, search submit, add-to-cart, wishlist, DiscoverFeed impressions; respects guest token; never blocks UI.
- `DiscoverFeed.tsx` — switch source to `/recommendations/for-you` when signal exists, else `?sort=popular` (cold start).
- New rails: "Recently viewed" (home + PDP), "Because you viewed X" / PDP "Similar items".
- Opt-out toggle in account settings.

## Ranking (Stage 0, explainable)

`score(product) = Σ over profile dimensions ( dimension_weight × match(product, dimension) ) × recency_decay × popularity_prior`
— category affinity, price-band proximity, attribute overlap (color/fabric), seller affinity; popularity prior breaks ties and handles cold catalog. Deterministic and debuggable; no black box.

## Test Strategy (TDD)

**Backend Feature**: event ingest + batching; guest→user merge idempotency (no dup); profile build with decay; for-you ranking honors dominant affinity; cold-start returns popular; similar-items same-category + fallback; opt-out serves generic + stops profiling; cache not poisoned across users.
**Frontend Vitest**: `track()` batches + fires on the right actions; DiscoverFeed uses for-you when signal present, popular when not; Recently-viewed + Similar rails render + fallback.

## Migration & Deploy

- 1–2 additive migrations (`user_interactions`, optional `affinity_profiles`). No backfill (history starts accumulating immediately).
- Register the new scheduled jobs; ensure queue worker handles event-ingest queue.
- `php artisan migrate` + container restart + config/route clear. Redis already provisioned.

## Rollout

- **Phase A (US1)**: ship event capture + merge silently → start accruing signal (no visible change). Deploy early so data exists before ranking goes live.
- **Phase B (US2)**: personalize DiscoverFeed + Recently-viewed, behind a flag; A/B vs generic.
- **Phase C (US3 + Stage 1)**: Similar-items + co-occurrence job.
- Privacy: first-party only, opt-out, guest data merged once; document in `docs/architecture/`.

## Complexity Tracking

| Decision | Why | Rejected |
|---|---|---|
| Heuristic/content-based first | 80% of the value, 0 ML, uses Redis+scheduler already present | ML ranking — no traffic/labels yet, premature |
| Redis-cached profile | <150ms feed; raw-log scan per request is too slow | Compute on request — fails SC-003 |
| Separate event log table | High-write, prune-able, decoupled from catalog | Bolting counters onto `stocks` — lossy, no per-user history |
| Defer embeddings | Needs Meilisearch (roadmap) | Build vector store now — large infra lift before product validated |
