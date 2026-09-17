---
name: specs/018-address-book-recently-viewed/plan.md
description: Auto-synced from specs/018-address-book-recently-viewed/plan.md
type: source
sync_origin: specs/018-address-book-recently-viewed/plan.md
sync_hash: 29d790a4fcb14e28
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/018-address-book-recently-viewed/plan.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Implementation Plan: Buyer Address Book & Recently-Viewed Shelf

**Branch**: `018-address-book-recently-viewed` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-address-book-recently-viewed/spec.md`

## Summary

**Critical discovery during planning**: both sub-features are already substantially implemented and wired end-to-end in the codebase, not greenfield. This plan is therefore a **gap-closing plan**, not a build-from-scratch plan. See Existing Implementation Audit below for what already works and exactly what's missing to satisfy the spec's functional requirements in full.

### Existing Implementation Audit

**Address Book (US1, US2) — ~90% done:**
- Backend: `Address` model (`app/Models/Address.php`), migration `2026_06_10_000001_create_addresses_table.php`, `AddressController` (web + `Mobile/AddressController`) at `/api/user/addresses` (index/store/update/destroy/set-default), all auth:sanctum-gated, ownership-checked. `Address::boot()` saving-event hook already enforces "exactly one default" (FR-003). 14/14 feature tests passing (`tests/Feature/AddressBookTest.php`).
- Frontend: `AddressBook.tsx` (profile/account page, full CRUD UI), `addressService.ts`, checkout page (`src/app/checkout/page.tsx`) already loads saved addresses, renders them as selectable options, pre-selects default, and prefills the shipping form (`handleAddressSelect`). Guest checkout path is untouched (saved-address UI is gated behind `isAuthenticated`), satisfying FR-005.
- **Gap**: FR-006 (cap at 10 addresses per user, reject 11th with clear message) is **not implemented** anywhere — neither `AddressController::store` nor `Mobile/AddressController::store` nor the frontend form checks a count limit.
- **Not yet verified**: edge case "delete the currently-default address" (spec allows falling back to no-default, which is what `boot()` naturally does since nothing re-assigns a new default — needs a test to confirm, not a code change).

**Recently-Viewed Shelf (US3) — ~85% done:**
- Frontend: `src/utils/recentlyViewed.ts` (localStorage-backed, move-to-front-on-review logic, `addRecentlyViewed`), `RecentlyViewedRail.tsx` (renders nothing when empty — satisfies FR-008), wired into `HomeContent.tsx`, PDP (`src/app/products/[id]/page.tsx`) calls `addRecentlyViewed` on view. Existing tests: `recentlyViewed.test.ts`, `recently-viewed-rail.test.ts`, `pdp-recently-viewed.test.ts`.
- **Gap 1**: spec FR-007 requires a cap of **20**; code has `MAX_ITEMS = 12`. Mismatch — must bump `MAX_ITEMS` to 20 and update/add tests.
- **Gap 2**: FR-011 requires omitting deleted/unavailable products from the rail at render time. `RecentlyViewedRail.tsx` currently renders whatever is in localStorage with no availability check — no gap in "moves to front on re-view" or "no dup" (already handled in `recentlyViewed.ts`), but the stock/availability filter does not exist.

### Technical Approach for Remaining Work

1. **Address cap (FR-006)**: add a `where('user_id', ...)->count() >= 10` guard in both `AddressController::store` and `Mobile/AddressController::store`, returning a 422 with a clear message before creation. Add a corresponding frontend guard/toast in `AddressBook.tsx` (defense in depth, not the source of truth — backend is authoritative).
2. **Recently-viewed cap (FR-007)**: bump `MAX_ITEMS` from 12 → 20 in `recentlyViewed.ts`; update `recentlyViewed.test.ts` assertions that hardcode 12.
3. **Recently-viewed availability filter (FR-011)**: `RecentlyViewedRail` needs product availability data it doesn't currently fetch (localStorage only stores id/name/price/image — no stock status). Options: (a) fetch a lightweight batch endpoint keyed by the stored IDs and filter client-side, or (b) rely on existing product list/search endpoints if they already return availability for arbitrary ID sets. Confirm the cheapest existing endpoint during implementation rather than adding a new one.
4. **Edge-case test**: add a feature test confirming deleting a default address leaves `is_default` unset elsewhere (no auto-promotion required per spec — "leave no default if none remain" is acceptable).

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 15, App Router) — frontend; PHP 8.2+ (Laravel 11) — backend
**Primary Dependencies**: React 18, Tailwind CSS, Laravel Sanctum (auth), Eloquent ORM
**Storage**: PostgreSQL (addresses — server-persisted, per spec FR-001–006); browser `localStorage` (recently-viewed — explicitly client-side only for v1, per FR-010)
**Testing**: PHPUnit (`php artisan test`) for backend; existing Jest/Vitest-style unit tests for frontend utils (`recentlyViewed.test.ts` etc.)
**Target Platform**: Web (Next.js storefront + Laravel API), existing Docker Compose dev stack
**Project Type**: Web (monorepo: `beldify-backend/` + `beldify-frontend/`)
**Performance Goals**: Address selection at checkout <10s (SC-001); address CRUD confirmation <2s (SC-004) — both already met by existing implementation, no new perf work needed
**Constraints**: Recently-viewed must add zero server round-trips for the write path (client-side only); address cap must be enforced server-side as the source of truth
**Scale/Scope**: 3 backend edits (2 controllers + 1 test), 3 frontend edits (1 constant, 1 rail component, tests) — small, surgical gap-closing scope, not a new subsystem

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: Changes are additive/corrective to existing, already-conventional code (Eloquent guards, existing util). No new patterns introduced. PASS.
- **Testing Standards**: Existing coverage (14 backend tests, 3 frontend test files) will be extended, not replacing test-first — each gap fix gets a failing test first (cap rejection, MAX_ITEMS=20, availability filter). PASS.
- **Test Pyramid**: Unit tests for `recentlyViewed.ts` cap constant; feature test for backend cap enforcement and default-deletion edge case; no new E2E needed since checkout integration already has coverage (`checkout-shipping-address.test.ts`). PASS.
- No violations requiring Complexity Tracking justification — this is the smallest possible diff to close the spec's stated functional gaps.

## Project Structure

### Documentation (this feature)

```text
specs/018-address-book-recently-viewed/
├── plan.md              # This file
├── research.md          # Phase 0 output (KB prior art + architecture notes)
├── data-model.md        # Phase 1 output (below)
├── quickstart.md        # Phase 1 output (below)
├── contracts/           # Phase 1 output (below — documents EXISTING contract, no new endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
beldify-backend/
├── app/Http/Controllers/API/AddressController.php          # add cap-of-10 guard to store()
├── app/Http/Controllers/API/Mobile/AddressController.php    # add cap-of-10 guard to store()
├── app/Models/Address.php                                    # no change (boot() already correct)
└── tests/Feature/AddressBookTest.php                         # add: cap-rejection, default-deletion edge case

beldify-frontend/
├── src/utils/recentlyViewed.ts                               # MAX_ITEMS 12 → 20
├── src/utils/__tests__/recentlyViewed.test.ts                # update hardcoded 12 assertions
├── src/components/home/RecentlyViewedRail.tsx                # add availability filter before render
├── src/__tests__/recently-viewed-rail.test.ts                 # add: filters unavailable/deleted products
├── src/app/profile/components/AddressBook.tsx                # add client-side cap guard/toast (defense in depth)
└── src/services/addressService.ts                            # no change (contract unchanged)
```

**Structure Decision**: Existing monorepo structure (`beldify-backend/` Laravel API + `beldify-frontend/` Next.js App Router) is unchanged — this feature only touches files already established by the prior (undocumented) implementation. No new directories, no new services.

## Complexity Tracking

No violations — not applicable. This plan closes 3 well-scoped functional gaps in already-shipped code; no new architecture, patterns, or projects are introduced.

