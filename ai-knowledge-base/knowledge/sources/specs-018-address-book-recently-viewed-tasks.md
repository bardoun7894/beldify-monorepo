---
name: specs/018-address-book-recently-viewed/tasks.md
description: Auto-synced from specs/018-address-book-recently-viewed/tasks.md
type: source
sync_origin: specs/018-address-book-recently-viewed/tasks.md
sync_hash: 731dee1c6100b1bf
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/018-address-book-recently-viewed/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks: Buyer Address Book & Recently-Viewed Shelf

**Input**: Design documents from `/specs/018-address-book-recently-viewed/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/addresses-api.md, quickstart.md

**Context**: Both sub-features are already implemented in the codebase (undocumented prior work). This is a gap-closing task list, not new construction — see plan.md's Existing Implementation Audit. Tests are included per project CLAUDE.md's TDD mandate (test-driven-development skill).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (address save/reuse), US2 (default address), US3 (recently-viewed)

## Path Conventions

Web app monorepo: `beldify-backend/` (Laravel), `beldify-frontend/` (Next.js)

---

## Phase 1: Setup

- [X] T001 Confirm existing test suites are green before touching anything: `cd beldify-backend && docker-compose -f docker-compose.dev.yml exec backend php artisan test --filter=AddressBookTest` and `cd beldify-frontend && npm test -- recentlyViewed recently-viewed-rail checkout-shipping-address`

## Phase 2: Foundational

No blocking foundational work — the schema, models, controllers, and components already exist (see plan.md audit). Each user story below is independently gap-closing.

---

## Phase 3: User Story 1 - Save and reuse a shipping address (P1)

**Goal**: Close the one remaining gap — enforce the 10-address cap (FR-006). Everything else in US1 (create/list/edit/delete, checkout selectable options, guest-checkout unaffected) already works.

**Independent Test**: Log in as a buyer with 10 saved addresses, attempt to add an 11th via Account → Addresses, confirm rejection with a clear message; confirm the 11th is also rejected via the same endpoint hit directly (mobile controller).

- [X] T002 [P] [US1] Write failing test `user_cannot_create_11th_address` in `beldify-backend/tests/Feature/AddressBookTest.php` — seed 10 addresses for a user, POST an 11th, assert HTTP 422 and a clear rejection message
- [X] T003 [P] [US1] Write failing test `mobile_user_cannot_create_11th_address` in `beldify-backend/tests/Feature/AddressBookTest.php` for the `Mobile/AddressController` equivalent
- [X] T004 [US1] Add a count guard (max 10) to `store()` in `beldify-backend/app/Http/Controllers/API/AddressController.php` — return 422 with the rejection message before creating
- [X] T005 [US1] Add the same count guard to `store()` in `beldify-backend/app/Http/Controllers/API/Mobile/AddressController.php`
- [X] T006 [US1] Run `php artisan test --filter=AddressBookTest` and confirm all tests (existing 14 + 2 new) pass
- [X] T007 [P] [US1] Add a client-side cap guard/toast in `beldify-frontend/src/app/profile/components/AddressBook.tsx` (defense in depth only — disable/hide the "add address" action at 10, show the same rejection copy) — added `MAX_ADDRESSES=10` const, `handleAdd` early-returns with a toast at cap, toolbar "Add address" button disabled at cap

**Checkpoint**: US1 fully satisfies FR-001–006.

---

## Phase 4: User Story 2 - Set a default address (P2)

**Goal**: Confirm the already-implemented default-address behavior handles the deletion edge case correctly (spec allows "no default remains" — no auto-promotion required).

**Independent Test**: Add two addresses, mark one default, delete the default one, confirm no address is left marked default and no error occurs; confirm checkout still renders the remaining address as selectable with none pre-selected.

- [X] T008 [US2] Write test `deleting_default_address_leaves_no_default` in `beldify-backend/tests/Feature/AddressBookTest.php` — create 2 addresses (one default), delete the default one, assert the remaining address has `is_default = false` and no exception is thrown
- [X] T009 [US2] Run `php artisan test --filter=AddressBookTest` and confirm the new test passes with zero code changes (validates `Address::boot()` behavior is already correct)

**Checkpoint**: US2 fully satisfies FR-003 and the default-deletion edge case, confirmed by test rather than new code.

---

## Phase 5: User Story 3 - Rediscover a recently-viewed product (P2)

**Goal**: Close two gaps — cap mismatch (12 vs. spec's 20) and missing availability filter (FR-011).

**Independent Test**: View 21 distinct products in one browser, return to homepage, confirm exactly 20 most-recent show. Then have one of those products marked out-of-stock/deleted (admin side), reload homepage, confirm it no longer appears in the rail.

- [X] T010 [P] [US3] Update `beldify-frontend/src/utils/__tests__/recentlyViewed.test.ts` — change assertions hardcoding a cap of 12 to expect 20; add a test asserting the 21st view evicts the oldest entry
- [X] T011 [US3] Bump `MAX_ITEMS` from 12 to 20 in `beldify-frontend/src/utils/recentlyViewed.ts`
- [X] T012 [P] [US3] Write failing test in `beldify-frontend/src/__tests__/recently-viewed-rail.test.ts` asserting `RecentlyViewedRail` omits an entry whose product is unavailable/deleted, given a mocked availability response
- [X] T013 [US3] Identify the cheapest existing endpoint/service that returns availability for a batch of product IDs (check `productService`/search endpoints before adding anything new) and wire it into `beldify-frontend/src/components/home/RecentlyViewedRail.tsx` to filter items before render — used existing `productService.getProduct(id)` per-item (no batch endpoint exists), called in parallel for all stored items
- [X] T014 [US3] Run `npm test -- recentlyViewed recently-viewed-rail` and confirm all tests pass; run `tsc --noEmit` to catch any `RecentlyViewedItem` shape mismatch (KB-documented `ignoreBuildErrors` hazard — see research.md Task patterns)

**Checkpoint**: US3 fully satisfies FR-007, FR-008, FR-009, FR-010, FR-011.

---

## Phase 6: Polish & Cross-Cutting

- [X] T015 [P] Run full scoped verification: backend `--filter=AddressBookTest` (19/19 pass), frontend `recentlyViewed`/`recently-viewed-rail`/`checkout-shipping-address`/`addressService` (63/63 pass) — did NOT run the full suites (KB-documented 600s watchdog risk on full runs)
- [X] T016 Run `npm run lint` (frontend) per project CLAUDE.md verification step — no ESLint warnings or errors
- [X] T017 Manual smoke test per quickstart.md step 4 — 11th-address rejection verified LIVE against the running API (seeded a real user with 10 addresses via tinker, POST to `/api/user/addresses` returned HTTP 422 "You have reached the maximum of 10 saved addresses...", smoke data cleaned up after); 21-product rail truncation and unavailable-product filtering are covered by automated component tests only (no browser session available in this pass) — recommend one manual browser check before merge to confirm visual behavior
- [X] T018 Sync to local Docker mirror via `sync-local.sh` run from **repo root** (not from `beldify-backend/`) per KB guidance, then `docker restart beldify-local-app` to flush opcache — done, re-verified 19/19 green post-restart
- [ ] T019 `/kb-spec post` → `/kb-docs-sync` to mirror spec.md/plan.md/tasks.md/research.md into the KB, correcting the KB's prior blind spot on these two features — pending, run after this report

## Dependencies

- Phase 1 (Setup) blocks everything — confirms baseline is green before any edit.
- Phase 2 (Foundational): none — no blocking work.
- Phase 3 (US1), Phase 4 (US2), Phase 5 (US3) are **fully independent** of each other — different files, different subsystems (address cap vs. default-deletion test vs. recently-viewed cap/filter). Can be done in any order or in parallel by different people.
- Phase 6 (Polish) depends on all three user-story phases being complete.

## Parallel Execution Examples

Within Phase 3: T002 and T003 (different test methods, same file — sequential edits, but no code dependency) can be drafted in parallel then merged; T004 and T005 (different files) are parallelizable.

Across phases: US1 (T002–T007), US2 (T008–T009), and US3 (T010–T014) touch entirely disjoint files and can be assigned to three different agents/engineers simultaneously with zero merge conflicts.

## Implementation Strategy

**MVP scope**: US1 alone (T001–T007) closes the highest-priority gap (FR-006, the address cap) with the smallest possible diff — 2 test methods + 2 one-line guards + 1 frontend guard.

**Incremental delivery**: Ship US1 → US2 (test-only, zero risk) → US3 (slightly larger, needs an availability-data decision in T013) in that order, since US1 is P1 and the others are P2. All three can also ship together in one PR given the total diff is small (≈10 files, no schema changes).
