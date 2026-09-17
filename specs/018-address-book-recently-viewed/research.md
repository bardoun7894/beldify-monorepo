# Research: address-book-recently-viewed

**Generated**: 2026-07-05
**Feature**: [spec.md](./spec.md)

<!-- Sections below are populated by /kb-spec <mode> before each Spec Kit phase.
     Each section is owned by exactly one mode and is replaced wholesale on re-run.
     Free-form notes added by the user between sections are preserved. -->

## Prior art from KB

*Queried at 2026-07-05T23:47:07Z · Mode: pre · Question: "What prior decisions, constraints, or related work does the KB have about buyer saved addresses (address book) and a recently-viewed products shelf?"*

The KB has limited but consistent prior art on both features. Here's what it contains:

---

### Buyer Address Book

**Status: unbuilt, roadmap item #9.**

- [[concepts/marketplace-completeness-roadmap]] places it at priority 9 in the "roadmap to #1 Moroccan marketplace" (after returns, payouts, referral, search, invoices, shipping zones, and email verification).
- [[sources/hooked-2026-06-09-opensouk-marketplace-loop]] ranks "saved address / express checkout" as #8 in the Hooked feature list — specifically framed as an **investment action** that reduces friction on repeat purchase.
- [[sources/2026-06-10-frontend-completeness-audit]] notes that "auth address prefill" survived from the 06-09 pass — implying the checkout page *can* pre-populate a known address for authenticated users at payment time, but there is no dedicated address-book management UI (list, add, edit, delete, set-default).
- No existing DB migration for a `customer_addresses` table was found in any source.

**Constraint noted:** The checkout currently uses a hardcoded 0.15 tax rate ignoring `config('cart.tax_rate')` ([[sources/hooked-2026-06-09-opensouk-marketplace-loop]]). Any address-book work that touches the checkout total flow should fix this too.

---

### Recently-Viewed Products Shelf

**Status: unbuilt, explicitly called out twice as a retention gap.**

- [[concepts/beldify-retention-loop-closure]] (both the 06-09 original and the 06-19 delta) consistently flags it as one of **the weakest investment surfaces** — the user browses, views a product, and the session dead-ends with no re-entry hook. The delta audit explicitly deferred it: *"followed-shops feed and recently-viewed shelf — both are investment actions that currently dead-end with no return loop."*
- [[sources/hooked-2026-06-09-opensouk-marketplace-loop]] ranks it #5 in the Hooked feature backlog.
- [[concepts/home-merchandising-roadmap]] (Phase 1) describes upgrading product cards toward mini-PDPs and adding rails, but does not explicitly include a recently-viewed rail. The DiscoverFeed infinite scroll (shipped 06-10) partially fills the "rediscovery" role but is not personalized.

**No backend table or frontend component** for recently-viewed exists in any source. The most natural implementation would be client-side (`localStorage`) for guests (matching how the guest wishlist was done — [[concepts/marketplace-completeness-roadmap]]) with server-side persistence merged on login.

---

**Bottom line:** Both features are documented as intentionally deferred roadmap items. Address book has a soft dependency on express-checkout UX; recently-viewed is the higher-leverage retention win given it directly feeds the return loop the Hooked audits identified as the platform's weakest layer.

## Architecture notes from KB

*Queried at 2026-07-06T00:00:00Z · Mode: plan · Question: "What architectural decisions, tech stack choices, or integration patterns does the KB document for buyer address book (checkout saved addresses) and client-side recently-viewed products (similar to guest wishlist pattern)?"*

The KB has **no architectural spec** for either feature — only roadmap placement. No schema, controller pattern, or API contract is documented for the address book; recently-viewed has no implementation at all.

The closest adjacent pattern for both is the **guest wishlist** ([[beldify-guest-wishlist]]): client-side `localStorage` + merge-on-login, explicitly chosen over server-side persistence because the equivalent server table (`customer_wishlists`) is `customer_id`-bound and too costly for the guest case. This is a direct precedent for recently-viewed (spec already scopes it client-side-only for v1, matching this reasoning).

For the address book, since it needs real server-side CRUD (checkout selection, edit/delete, default flag) rather than a guest-merge case, the closer precedent is the existing `customer_addresses`-shaped work: none exists yet, so this plan should follow standard Laravel patterns already used elsewhere in the codebase (e.g. `customer_wishlists`, `store_revenues`) — a `customer_id`-scoped table, Eloquent model with a `default()` scope enforcing exactly one default via a DB transaction, and a REST resource controller under `/api/v1/buyer/addresses`.

No prior art conflicts with the spec's approach (server DB table for addresses, localStorage-only for recently-viewed). Proceed with standard Laravel/Next.js conventions per project CLAUDE.md — no KB-documented gotchas to avoid here beyond the general note that guest checkout must remain untouched (FR-005), consistent with [[beldify-guest-checkout]] and [[beldify-whatsapp-never-checkout]] growth constraints.

**Correction discovered during `/speckit.plan`:** both features already exist in the codebase (undocumented prior work) — `Address` model/controller/tests on the backend, `AddressBook.tsx` + checkout integration and `recentlyViewed.ts` + `RecentlyViewedRail.tsx` on the frontend. The KB had no record of this because it was never captured. This plan is a gap-closing pass (address cap, recently-viewed cap mismatch 12→20, availability filtering), not new construction. Feeding this into `/kb-ingest` afterward will correct the KB's blind spot for future queries.

## Task patterns from KB

*Queried at 2026-07-06T00:05:00Z · Mode: tasks · Question: "What task breakdown patterns, known pitfalls, or testing approaches does the KB record for closing small backend validation gaps (address cap) and frontend localStorage constant/filter changes (recently-viewed) in Laravel + Next.js?"*

**Backend validation gap (address cap):**
- [[concepts/dev-workflow]]: small fixes follow Explore → Plan → Implement → Verify → Commit; no orchestrator fan-out needed for a single-field validation rule (trivial-fix carve-out per CLAUDE.md — still log via `/kb-spec log`, skip fan-out).
- [[concepts/php-opcache-deployment-pitfall]]: after syncing validation logic to the local Docker mirror, clear opcache or the old rule keeps firing.
- Testing: one PHPUnit feature test per rule (`assertStatus(422)` over cap, `assertCreated()` at cap). Run scoped (`--filter=AddressBookTest`), not the full suite — [[orchestrator-stall-full-suite]] documents full-suite runs hitting the 600s watchdog.

**Frontend recently-viewed (localStorage):**
- [[concepts/beldify-retention-loop-closure]]: the guest-wishlist merge-on-login path **silently dropped** persisted flags in a past bug — any future merge/hydration logic must forward state, not overwrite it. Not directly applicable here (recently-viewed has no merge-on-login in this spec) but a caution if that's added later.
- [[concepts/typescript-ignore-build-errors-hazard]]: this project's Next.js config sets `ignoreBuildErrors: true` — a shape mismatch in `RecentlyViewedItem` (e.g., `id` as string vs number) compiles silently and fails at runtime. Run `tsc --noEmit` explicitly, don't rely on `npm run build` to catch it.
- Testing: scoped Vitest/Jest runs (`recentlyViewed.test.ts`, `recently-viewed-rail.test.ts`), not the full suite — mirrors [[beldify-vitest-dual-config-hazard]] guidance to run targeted files given the large suite size.

**Task breakdown pattern applied to tasks.md below:** trivial-fix carve-out — log via `/kb-spec log`, write failing tests first per gap (TDD), implement narrowly, verify scoped, sync via `sync-local.sh` from repo root (not from `beldify-backend/` — [[beldify-sync-local-run-from-root]]).

## Implementation notes from KB

*Queried at 2026-07-06T00:10:00Z · Mode: implement · Question: "What code patterns, conventions, bug fixes, or gotchas does the KB document about buyer address book, saved shipping addresses, or recently-viewed products shelf?"*

**TL;DR: both features are ~85-90% built already (undocumented prior work) — this is a gap-closing implementation, not greenfield.**

**Buyer Address Book — ~90% done:**
- `App\Models\Address` + migration `2026_06_10_000001_create_addresses_table.php` already exist; `AddressController` at `/api/user/addresses` (index/store/update/destroy/set-default), auth:sanctum + ownership-checked; `Mobile\AddressController` mirrors it at `/api/mobile/user/addresses`.
- `Address::boot()` saving-event hook already enforces exactly-one-default (FR-003) — no work needed there.
- `AddressBook.tsx` (profile/account) has full CRUD UI; checkout already loads saved addresses, pre-selects default, prefills shipping form.
- 14/14 feature tests passing (`tests/Feature/AddressBookTest.php`).
- **The one real gap: FR-006 (10-address cap) is unenforced.** Add `where('user_id', auth()->id())->count() >= 10` guard to **both** `AddressController::store()` and `Mobile/AddressController::store()`, return 422.
- Confirmed safe, no code needed: deleting the default address leaves `is_default` unset for the rest — handled by omission in `Address::boot()`.

**Recently-Viewed Shelf — ~85% done:**
- `src/utils/recentlyViewed.ts` (localStorage, move-to-front already works), `RecentlyViewedRail.tsx` (renders nothing when empty, satisfies FR-008), wired into `HomeContent.tsx` + PDP. Tests exist: `recentlyViewed.test.ts`, `recently-viewed-rail.test.ts`, `pdp-recently-viewed.test.ts`.
- **Gap 1:** `MAX_ITEMS = 12` but spec requires 20 — bump constant + update test assertions.
- **Gap 2:** no availability filter — FR-011 requires omitting deleted/unavailable products at render time; no existing batch-availability-check endpoint, so identify the cheapest existing endpoint before adding a new one.

**Gotchas to watch during implementation:**
1. `ignoreBuildErrors: true` [[concepts/typescript-ignore-build-errors-hazard]] — a shape mismatch in `RecentlyViewedItem` (e.g. `id` string vs number) compiles silently; run `tsc --noEmit` explicitly.
2. Full-suite watchdog [[concepts/beldify-retention-loop-closure]] / [[orchestrator-stall-full-suite]] — run scoped tests only (`--filter=AddressBookTest`), never the full PHPUnit/Vitest suite.
3. `sync-local.sh` must run from monorepo root, not `beldify-backend/` [[beldify-sync-local-run-from-root]] — wrong cwd fails silently, container keeps serving old code.
4. Opcache after backend edits [[concepts/php-opcache-deployment-pitfall]] — `docker restart beldify-local-app` after syncing the cap guard; sync alone won't flush it.

**KB blind spot corrected:** prior KB entries ([[concepts/marketplace-completeness-roadmap]], [[sources/hooked-2026-06-09-opensouk-marketplace-loop]]) described both features as unbuilt roadmap items. That was stale — they were built but never captured. `/kb-ingest` after this feature ships should close that gap for future queries.
