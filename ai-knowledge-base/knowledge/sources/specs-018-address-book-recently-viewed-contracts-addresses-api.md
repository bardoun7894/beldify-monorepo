---
name: specs/018-address-book-recently-viewed/contracts/addresses-api.md
description: Auto-synced from specs/018-address-book-recently-viewed/contracts/addresses-api.md
type: source
sync_origin: specs/018-address-book-recently-viewed/contracts/addresses-api.md
sync_hash: 078bb560f14dd9b5
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/018-address-book-recently-viewed/contracts/addresses-api.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# API Contract: Address Book (existing, documented — no new endpoints)

Base path: `/api/user/addresses` (auth:sanctum required). Mirrored under `/api/mobile/user/addresses` via `Mobile\AddressController`.

## GET /api/user/addresses
Returns all addresses for the authenticated user, `is_default` first then newest first.
```json
{ "success": true, "data": [ { "id": 1, "type": "home", "name": "...", "is_default": true, "...": "..." } ] }
```

## POST /api/user/addresses
Creates an address for the authenticated user.

**Request**: `type?, name, phone?, address_line_1, address_line_2?, city, state?, postal_code?, country, latitude?, longitude?, is_default?`

**New validation (this feature, FR-006)**: if the user already has 10 addresses, respond:
```json
{ "success": false, "message": "You've reached the 10-address limit. Delete one to add a new address." }
```
HTTP 422. Enforced server-side before the existing validation/creation logic runs — this is the source of truth; the frontend guard is UX-only, not a security boundary.

**Response (201, unchanged)**:
```json
{ "success": true, "data": { "id": 5, "...": "...", "is_default": false } }
```

## PUT /api/user/addresses/{id}
Updates an address owned by the caller (unchanged — patch semantics, ownership-checked, 404 for cross-user or nonexistent).

## DELETE /api/user/addresses/{id}
Deletes an address owned by the caller (unchanged). No auto-promotion of a new default when the deleted address was default — matches spec edge case ("leave no default if none remain").

## POST /api/user/addresses/{id}/default
Marks an address as default; `Address::boot()` saving hook clears any other default for the same user (unchanged).

---

No new endpoints, no breaking changes to existing request/response shapes — this contract only adds one validation branch to `POST`.

