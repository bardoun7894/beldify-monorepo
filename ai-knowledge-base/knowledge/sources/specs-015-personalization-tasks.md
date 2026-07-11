---
name: specs/015-personalization/tasks.md
description: Auto-synced from specs/015-personalization/tasks.md
type: source
sync_origin: specs/015-personalization/tasks.md
sync_hash: fe3c36d00c7f6317
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/015-personalization/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

---
description: "Task list for personalization / For-You behavioral intelligence"
---

# Tasks: Personalized "For You" — Behavioral Intelligence Layer

**Input**: specs/015-personalization/ (spec.md, plan.md, research.md)
**Tests**: REQUIRED (TDD). Roles: BE · FE · QA.
Paths: backend = `beldify-backend/`, frontend = `beldify-frontend/`.

## Phase 1: Setup
- [ ] T001 [BE] Branch `015-personalization` in both repos (backend is its own repo).

## Phase 2: Foundational (BLOCKS all)
- [ ] T002 [BE] Migration `create_user_interactions_table` (event log per plan.md; indexes on user_id/guest_token/subject; SQLite-parity-safe).
- [ ] T003 [BE] Migration `create_affinity_profiles_table` (durable snapshot + `personalization_enabled` flag).
- [ ] T004 [BE] `UserInteraction` + `AffinityProfile` models (fillable, casts json, relations).

## Phase 3: US1 — Capture navigation/behavior (P1) 🎯 MVP foundation
### Tests first
- [ ] T005 [P][QA][US1] Feature: `POST /api/v1/events` ingests a batch (guest + auth), correct type/weight, non-blocking.
- [ ] T006 [P][QA][US1] Feature: guest→user merge on login is idempotent (no duplicate events).
### Impl
- [ ] T007 [BE][US1] `EventController` + route `POST /api/v1/events` (batched, accepts `X-Guest-Token`; queueable insert).
- [ ] T008 [BE][US1] `InteractionMergeService` + hook into the existing login/guest-merge path (reuse cart/wishlist merge).
- [ ] T009 [FE][US1] `lib/track.ts` beacon helper (debounced/batched; guest-token aware; never blocks UI).
- [ ] T010 [FE][US1] Wire `track()` into PDP view+dwell, category browse, search submit, add-to-cart, wishlist, DiscoverFeed impressions.

**Checkpoint**: signal accrues end-to-end. Deployable silently (no visible change) so data exists before ranking goes live.

## Phase 4: US2 — Personalized For-You feed + Recently viewed (P1)
### Tests first
- [ ] T011 [P][QA][US2] Feature: profile build applies time-decay; for-you ranking puts dominant-affinity items in top-10 (SC-004).
- [ ] T012 [P][QA][US2] Feature: cold-start user → popular fallback, never empty (SC-005); feed reads cached profile not raw log (SC-003).
### Impl — backend
- [ ] T013 [BE][US2] `AffinityProfileService` (build from events, time-decay, read-through Redis cache `reco:profile:*`).
- [ ] T014 [BE][US2] `RecommendationService::forYou()` + `recentlyViewed()`; endpoints `GET /api/v1/recommendations/for-you`, `/recently-viewed`. Cache must not embed viewer-specific flags (cache-poison rule).
- [ ] T015 [BE][US2] Scheduled job `reco:rebuild-profiles` (nightly) registered in the wired scheduler.
- [ ] T016 [BE][US2] `PUT /api/v1/me/preferences` opt-out; when off serve generic + stop profiling.
### Impl — frontend
- [ ] T017 [FE][US2] `DiscoverFeed.tsx` → consume `/recommendations/for-you` when signal exists, else `?sort=popular`.
- [ ] T018 [FE][US2] "Recently viewed" rail (home + PDP) from `/recently-viewed`.
- [ ] T019 [FE][US2] Personalization opt-out toggle in account settings.

**Checkpoint**: home feels tailored; cold start safe; opt-out works.

## Phase 5: US3 — Because-you-viewed / Similar items (P2) + Stage 1 CF
### Tests first
- [ ] T020 [P][QA][US3] Feature: `GET /api/products/{id}/similar` returns same-category + attribute-similar items, popularity fallback when sparse.
### Impl
- [ ] T021 [BE][US3] `RecommendationService::similarTo()` (content-based: category + `product_variants.attributes`; fallback).
- [ ] T022 [FE][US3] PDP "Similar items" rail + home "Because you viewed X" rail.
- [ ] T023 [BE][US3] Stage 1 nightly job `reco:build-cooccurrence` (co-view/co-purchase matrix → cached "bought/viewed together"); upgrade `similarTo()` to blend it in.

## Phase 6: Polish & Verify
- [ ] T024 [QA] Targeted suites green: `php artisan test tests/Feature/Recommendations` + `npm run test`; capture evidence.
- [ ] T025 [BE] Docs: `docs/architecture/personalization.md` (signal model, ranking formula, privacy/opt-out, retention) + `docs/api/recommendations.md`.
- [ ] T026 [Reviewer] `requesting-code-review` (cache-poison + privacy + cold-start focus).

## Dependencies
- Phase 2 blocks all. **US1 (Phase 3) is the foundation — ship + deploy first to accrue signal.** US2 needs US1 data; US3 needs US1 + US2 profile. FE feed tasks depend on the BE endpoint contract.
- Direct specialist dispatch (BE in beldify-backend, FE in beldify-frontend — different dirs, parallel-safe); QA writes failing tests first.

## Notes
- Navigation is the dominant signal — instrument PDP view/dwell + browse + search first and well.
- Never scan the raw event log on the request path (SC-003). Never poison cache across users (FR-011).
- Don't over-build: Stage 0 + Stage 1 ship the Amazon feel; embeddings wait for Meilisearch.

