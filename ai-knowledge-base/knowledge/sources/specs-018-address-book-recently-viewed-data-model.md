---
name: specs/018-address-book-recently-viewed/data-model.md
description: Auto-synced from specs/018-address-book-recently-viewed/data-model.md
type: source
sync_origin: specs/018-address-book-recently-viewed/data-model.md
sync_hash: b89304486ba650e3
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/018-address-book-recently-viewed/data-model.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Data Model: Buyer Address Book & Recently-Viewed Shelf

Both entities already exist in the codebase. This documents current state plus the one schema-adjacent change (the address cap is enforced in application code, not a DB constraint).

## Saved Address (server-persisted)

**Table**: `addresses` (migration `2026_06_10_000001_create_addresses_table.php`)
**Model**: `App\Models\Address`

| Field | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users.id | owner; ownership enforced in controller (`where('user_id', ...)`) |
| type | string enum home\|work\|other | default `home` |
| name | string | recipient name (FR-001) |
| phone | string, nullable | |
| address_line_1 | string | required |
| address_line_2 | string, nullable | |
| city | string | required (FR-001) |
| state | string, nullable | |
| postal_code | string, nullable | |
| country | string | required |
| latitude / longitude | decimal, nullable | from map-pin flow, not required by this spec |
| is_default | boolean | exactly one `true` per user_id, enforced by `Address::boot()` saving hook (FR-003) |
| timestamps | | |

**Validation rules**:
- 0–10 addresses per `user_id` (FR-006) — **new**: enforced by a count check in `AddressController::store` / `Mobile/AddressController::store` before insert; 11th attempt returns 422 with a clear rejection message.
- Exactly one default at a time — already enforced via model event, no change needed.
- Ownership — already enforced (404/403 on cross-user access), covered by existing tests.

**State transitions**: none beyond default-flag reassignment on save (already implemented). Deleting the default address leaves no default (acceptable per spec edge case) — no auto-promotion logic required.

## Recently-Viewed Entry (client-side only, v1)

**Storage**: browser `localStorage`, key managed by `src/utils/recentlyViewed.ts`
**Shape** (`RecentlyViewedItem`): `{ id, name, price, image }` — no server table, no `customer_id` scoping (FR-010, explicit v1 limitation).

| Field | Notes |
|---|---|
| id | product id — used for `/products/{id}` link and de-dup key |
| name | display name |
| price | display price at time of last view |
| image | thumbnail URL |

**Rules**:
- Cap at 20 entries (FR-007) — **change**: `MAX_ITEMS` constant currently 12, must become 20.
- Most-recent-first ordering, re-viewing moves an existing entry to front rather than duplicating (FR-009) — already implemented (`addRecentlyViewed`).
- Entries for deleted/unavailable products must be omitted at render time (FR-011) — **gap**: no availability check exists yet; `RecentlyViewedRail` must filter against current product availability before rendering. No change to the stored data shape — filtering is render-time only, so a stale localStorage entry naturally drops off once the product becomes unavailable, without needing an eviction write-back.

