---
name: specs/005-seller-verticals-jewelry/contracts.md
description: Auto-synced from specs/005-seller-verticals-jewelry/contracts.md
type: source
sync_origin: specs/005-seller-verticals-jewelry/contracts.md
sync_hash: c27111288c3ba606
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/005-seller-verticals-jewelry/contracts.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# API Contracts: 005-seller-verticals-jewelry

**Scope**: Phase 0 gate — WS-A (backend), WS-B (frontend), WS-C (fabric/tailoring fixes), WS-D (QA) code against these names.
**Status**: LOCKED for WS-A/WS-B/WS-D. Fabric seam recommendation pending orchestrator decision (see §B).
**Created**: 2026-06-02

---

## Conventions

- All endpoints are under `/api/v1/`.
- Auth: Laravel Sanctum bearer token.
- Errors follow the project-standard envelope: `{ "message": string, "errors"?: object }`.
- PII rule: **never expose User.email or User.name** (name is always null — use `display_name`). This is a standing constraint from tailoring bug #9.
- `source_type` values are **short strings** (`'order'`, `'tailoring_order'`, `'custom_order'`), not FQCN. See §C and locked decision #6.

---

## A. HTTP API Contracts

### A1. GET /api/v1/verticals/{slug}/config

Returns the ordered field schema for a vertical. Used by both the seller product form and the buyer custom-request form.

**Auth**: Any authenticated user (buyer or seller). Field schema contains no user-specific data.
**Path param**: `slug` — one of `regular`, `tailor`, `menswear`, `womenswear`, `jewelry`.

#### Request

```http
GET /api/v1/verticals/{slug}/config
Authorization: Bearer {token}
```

No body.

#### Response — 200 OK

```json
{
  "data": {
    "vertical": "jewelry",
    "fields": [
      {
        "key": "material",
        "label": "Material",
        "type": "select",
        "required": true,
        "options": ["gold", "silver", "copper", "brass", "mixed"],
        "group": null
      },
      {
        "key": "purity",
        "label": "Purity",
        "type": "select",
        "required": false,
        "options": ["24k", "21k", "18k", "14k", "925", "800"],
        "group": null
      },
      {
        "key": "weight_grams",
        "label": "Weight (grams)",
        "type": "decimal",
        "required": false,
        "options": null,
        "group": null
      },
      {
        "key": "size",
        "label": "Size",
        "type": "text",
        "required": false,
        "options": null,
        "group": null
      },
      {
        "key": "gemstone_type",
        "label": "Gemstone Type",
        "type": "select",
        "required": false,
        "options": ["none", "diamond", "emerald", "ruby", "sapphire", "pearl", "semi-precious", "other"],
        "group": "gemstone"
      },
      {
        "key": "gemstone_count",
        "label": "Gemstone Count",
        "type": "integer",
        "required": false,
        "options": null,
        "group": "gemstone"
      },
      {
        "key": "gemstone_carat",
        "label": "Gemstone Carat",
        "type": "decimal",
        "required": false,
        "options": null,
        "group": "gemstone"
      },
      {
        "key": "engraving",
        "label": "Engraving",
        "type": "text",
        "required": false,
        "options": null,
        "group": null
      },
      {
        "key": "finish",
        "label": "Finish",
        "type": "select",
        "required": false,
        "options": ["polished", "matte", "gold-plated", "enamel", "antique"],
        "group": null
      }
    ]
  }
}
```

**Apparel verticals** (`tailor`, `menswear`, `womenswear`) return the apparel field set (measurements + fabric + style). Example truncated — WS-A owns the full field list; WS-B must call this endpoint at render time, not hardcode fields.

**`regular` vertical** returns `"fields": []` (no custom config, ready-made only).

#### Error responses

| Status | When |
|---|---|
| 404 | `slug` not in `['regular','tailor','menswear','womenswear','jewelry']` |
| 401 | Unauthenticated |

---

### A2. POST /api/v1/custom-orders

Buyer submits a made-to-order request. Creates a `custom_orders` record with `status = 'requested'`.

**Auth**: Authenticated buyer. `customer_id` is derived from the authenticated user — it is **never** accepted from the request body.

#### Request

```json
{
  "store_id": 12,
  "vertical": "jewelry",
  "spec": {
    "material": "gold",
    "purity": "18k",
    "weight_grams": 5.2,
    "gemstone_type": "emerald",
    "gemstone_count": 1,
    "gemstone_carat": 0.5,
    "engraving": "لنا",
    "finish": "polished"
  },
  "notes": "For a wedding, needed by end of month"
}
```

Field rules:
- `store_id`: required, integer, must `exist:stores,id`.
- `vertical`: required, string, must be a valid vertical slug that supports `made_to_order` capability.
- `spec`: required, JSON object. For `jewelry`: `material` is required within spec; all other spec fields are optional. For apparel: validated per apparel shape.
- `notes`: optional, string, max 2000 chars.

#### Response — 201 Created

```json
{
  "data": {
    "id": 87,
    "store_id": 12,
    "vertical": "jewelry",
    "spec": {
      "material": "gold",
      "purity": "18k",
      "weight_grams": 5.2,
      "gemstone_type": "emerald",
      "gemstone_count": 1,
      "gemstone_carat": 0.5,
      "engraving": "لنا",
      "finish": "polished"
    },
    "notes": "For a wedding, needed by end of month",
    "status": "requested",
    "quote_amount": null,
    "deposit_amount": null,
    "deposit_paid": false,
    "eta": null,
    "delivery_date": null,
    "customer": {
      "id": 44,
      "display_name": "FATIMA Z."
    },
    "progress": [],
    "created_at": "2026-06-02T10:00:00Z",
    "updated_at": "2026-06-02T10:00:00Z"
  }
}
```

#### Error responses

| Status | When |
|---|---|
| 422 | Validation failure (missing `material` for jewelry, invalid `store_id`, etc.) |
| 403 | Authenticated user is not a buyer, or store does not support `made_to_order` |
| 401 | Unauthenticated |

---

### A3. GET /api/v1/custom-orders/{id}

Buyer tracks a single custom order: status, quote details, and full progress timeline.

**Auth**: Authenticated buyer. Must own the order (`customer_id = auth()->id()`). Store owner may also view (for quoting/advancing).

#### Request

```http
GET /api/v1/custom-orders/87
Authorization: Bearer {token}
```

No body.

#### Response — 200 OK

```json
{
  "data": {
    "id": 87,
    "store_id": 12,
    "vertical": "jewelry",
    "spec": { "material": "gold", "purity": "18k" },
    "notes": "For a wedding, needed by end of month",
    "status": "quoted",
    "quote_amount": "1200.00",
    "deposit_amount": "400.00",
    "deposit_paid": false,
    "eta": "2026-06-30",
    "delivery_date": null,
    "customer": {
      "id": 44,
      "display_name": "FATIMA Z."
    },
    "store": {
      "id": 12,
      "name": "Atlas Bijoux",
      "slug": "atlas-bijoux"
    },
    "progress": [
      {
        "id": 1,
        "status": "requested",
        "note": null,
        "created_by": 44,
        "created_at": "2026-06-02T10:00:00Z"
      },
      {
        "id": 2,
        "status": "quoted",
        "note": "Price includes 18k gold + emerald setting",
        "created_by": 99,
        "created_at": "2026-06-03T09:15:00Z"
      }
    ],
    "created_at": "2026-06-02T10:00:00Z",
    "updated_at": "2026-06-03T09:15:00Z"
  }
}
```

**CustomOrderProgress item shape** (used in `progress[]` above):

```json
{
  "id": integer,
  "status": string,          // the lifecycle status this entry records
  "note": string | null,     // optional seller note for this transition
  "created_by": integer,     // user_id of the actor (buyer or store owner)
  "created_at": "ISO8601"
}
```

#### Error responses

| Status | When |
|---|---|
| 403 | Authenticated user is neither the customer nor the store owner |
| 404 | Order does not exist |
| 401 | Unauthenticated |

---

### A4. GET /api/v1/custom-orders

Buyer lists their own custom orders, most recent first. Filtered automatically to `customer_id = auth()->id()`.

**Auth**: Authenticated buyer.

#### Request

```http
GET /api/v1/custom-orders?status=quoted&vertical=jewelry&page=1
Authorization: Bearer {token}
```

Query params (all optional):
- `status`: filter by lifecycle status string.
- `vertical`: filter by vertical slug.
- `page`: integer, default 1 (15 per page, follows Laravel default pagination).

#### Response — 200 OK

```json
{
  "data": [
    {
      "id": 87,
      "store_id": 12,
      "vertical": "jewelry",
      "status": "quoted",
      "quote_amount": "1200.00",
      "deposit_amount": "400.00",
      "deposit_paid": false,
      "eta": "2026-06-30",
      "store": {
        "id": 12,
        "name": "Atlas Bijoux",
        "slug": "atlas-bijoux"
      },
      "created_at": "2026-06-02T10:00:00Z",
      "updated_at": "2026-06-03T09:15:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  },
  "links": {
    "first": "https://api.beldify.com/api/v1/custom-orders?page=1",
    "last": "https://api.beldify.com/api/v1/custom-orders?page=1",
    "prev": null,
    "next": null
  }
}
```

Note: `spec` is **omitted** from the list view (large JSON field). Buyer fetches the full spec via A3.

#### Error responses

| Status | When |
|---|---|
| 401 | Unauthenticated |

---

### A5. POST /api/v1/custom-orders/{id}/quote

Store owner sets a quote: price, required deposit, and ETA. Advances status `requested → quoted`. Appends a progress entry.

**Auth**: Authenticated store owner. Must own the store that received the order (`store.user_id = auth()->id()`).

#### Request

```json
{
  "quote_amount": 1200.00,
  "deposit_amount": 400.00,
  "eta": "2026-06-30"
}
```

Field rules:
- `quote_amount`: required, numeric, > 0.
- `deposit_amount`: required, numeric, >= 0, <= `quote_amount`.
- `eta`: required, date string (`Y-m-d`), must be in the future.

#### Response — 200 OK

Returns the full `CustomOrder` resource (same shape as A3 response, updated fields).

```json
{
  "data": {
    "id": 87,
    "status": "quoted",
    "quote_amount": "1200.00",
    "deposit_amount": "400.00",
    "deposit_paid": false,
    "eta": "2026-06-30",
    "progress": [
      {
        "id": 1,
        "status": "requested",
        "note": null,
        "created_by": 44,
        "created_at": "2026-06-02T10:00:00Z"
      },
      {
        "id": 2,
        "status": "quoted",
        "note": null,
        "created_by": 99,
        "created_at": "2026-06-03T09:15:00Z"
      }
    ]
  }
}
```

#### Error responses

| Status | When |
|---|---|
| 409 | Status is not `requested` (illegal transition) |
| 422 | Validation failure |
| 403 | Authenticated user is not the store owner |
| 404 | Order does not exist |
| 401 | Unauthenticated |

---

### A6. POST /api/v1/custom-orders/{id}/advance

Store owner advances the custom order through its lifecycle. Appends a progress entry.

**Auth**: Authenticated store owner. Must own the store that received the order.

#### Request

```json
{
  "status": "in_progress",
  "note": "Started working on the setting"
}
```

Field rules:
- `status`: required, string, must be a legal next status per the transition table below.
- `note`: optional, string, max 2000 chars.

#### Legal Transition Table

This table is the authoritative source for the 409 guard in `CustomOrderService`. Any transition not listed here must return 409.

| Current status | Allowed next statuses |
|---|---|
| `requested` | `quoted`, `cancelled` |
| `quoted` | `deposit_paid`, `cancelled` |
| `deposit_paid` | `in_progress`, `cancelled` |
| `in_progress` | `ready`, `cancelled` |
| `ready` | `delivered`, `cancelled` |
| `delivered` | `closed` |
| `closed` | _(none — terminal)_ |
| `cancelled` | _(none — terminal)_ |

Notes:
- The `quote` endpoint (A5) handles `requested → quoted` exclusively (it carries the quote payload). The `advance` endpoint may also accept `requested → quoted` if a note-only advance is needed, but **quote amount must be set first via A5 or the advance must carry the same payload** — WS-A to decide; recommend A5 is the exclusive path for the quote transition.
- `deposit_paid`: there is currently **no separate buyer pay-deposit endpoint**. The store owner marks this transition after verifying payment externally (bank transfer, cash, etc.). Open question — see §D.
- `cancelled` is reachable from any pre-`delivered` state (`requested`, `quoted`, `deposit_paid`, `in_progress`, `ready`). It is **not** reachable from `delivered` or `closed`.

#### Response — 200 OK

Returns the full `CustomOrder` resource (same shape as A3).

#### Error responses

| Status | When |
|---|---|
| 409 | Transition not in legal table above |
| 422 | `status` field missing or not a valid lifecycle value |
| 403 | Authenticated user is not the store owner |
| 404 | Order does not exist |
| 401 | Unauthenticated |

---

### A7. CustomOrder API Resource — field inventory

This is the canonical shape WS-A must implement as `App\Http\Resources\CustomOrderResource`. No raw model may be returned. The resource is used by A2, A3, A4, A5, A6.

```text
id               integer
store_id         integer
vertical         string       // jewelry | menswear | womenswear | tailor
spec             object       // raw JSON from custom_orders.spec
notes            string|null
status           string       // real enum column — NOT computed accessor (see bug #5)
quote_amount     string|null  // decimal as string ("1200.00")
deposit_amount   string|null  // decimal as string
deposit_paid     boolean
eta              date|null    // "Y-m-d"
delivery_date    date|null    // "Y-m-d"
customer         object       // { id: int, display_name: string } — no email, no name
store            object       // { id: int, name: string, slug: string }
progress         array        // CustomOrderProgress[] (see shape above)
created_at       ISO8601
updated_at       ISO8601
```

**PII guarantee**: `customer.display_name` comes from the `display_name` accessor on the User model (not `name`, which is always null — KB: beldify-user-no-name-column). Email is **never** included.

**List view (A4)**: omit `spec` and `progress` fields to keep list responses lean. Full detail is only in A3/A5/A6.

---

## B. Fabric-Pivot Seam (Load-Bearing — WS-A and WS-C Code Against These Names)

### B1. Pinned names

These names are locked. All workstreams must use them verbatim.

| Artifact | Locked name |
|---|---|
| Catalog table | `tailoring_fabrics` (reshaped — see B2) |
| Pivot table | `tailoring_order_fabric_usage` |
| Pivot model | `App\Models\TailoringOrderFabricUsage` |
| Pivot FK (order side) | `order_id` → `tailoring_orders.id` |
| Pivot FK (fabric side) | `fabric_id` → `tailoring_fabrics.id` |

### B2. `tailoring_fabrics` reshaped columns

The current migration (`2024_03_20_000001_create_tailoring_fabrics_table.php`) defines a line-item schema that contradicts the model. WS-C reshapes the table to match what the model and controller already assume:

```text
id                  bigint unsigned, primary key
name                string
code                string, unique
description         text, nullable
price_per_meter     decimal(10,2)
color               string, nullable
pattern             string, nullable
stock_quantity      decimal(10,2), default 0
width               decimal(10,2), nullable
composition         string, nullable
reorder_point       decimal(10,2), nullable
image               string, nullable
company_id          bigint unsigned, FK → companies.id
timestamps
```

### B3. `tailoring_order_fabric_usage` pivot columns

```text
id              bigint unsigned, primary key
order_id        bigint unsigned, FK → tailoring_orders.id, index
fabric_id       bigint unsigned, FK → tailoring_fabrics.id
quantity_used   decimal(10,2)
unit_price      decimal(10,2)
timestamps
```

Model: `App\Models\TailoringOrderFabricUsage`

### B4. Ownership

| Migration/model | Owned by |
|---|---|
| `tailoring_fabrics` reshape migration | WS-C |
| `tailoring_order_fabric_usage` pivot migration | WS-C |
| `App\Models\TailoringOrderFabricUsage` (pivot model) | WS-C |
| `TailoringOrder` fabric relations (via pivot) | WS-C |
| `custom_orders` + `custom_order_progress` migrations | WS-A |
| `CustomOrder` model + `CustomOrderProgress` model | WS-A |
| `CustomOrder` fabricUsage relation (if apparel consumes fabric) | WS-A — **see open seam below** |

### B5. Open Seam — Fabric Pivot FK vs. Custom Orders (ORCHESTRATOR DECISION REQUIRED)

**The contradiction:**

The pinned pivot `tailoring_order_fabric_usage.order_id` is a hard FK to `tailoring_orders.id`. Under locked decision #5 ("apparel custom orders reference catalog fabrics via the pivot"), this FK cannot directly serve `custom_orders` rows — `custom_orders` is a separate table.

**Recommended resolution (compatible with locked #5):**

> Convert the pivot `order_id` column to a polymorphic pair: `usable_id` (unsigned bigint) + `usable_type` (string, short-name). `TailoringOrder` would set `usable_type = 'tailoring_order'`; `CustomOrder` would set `usable_type = 'custom_order'`. The pivot model becomes `TailoringOrderFabricUsage::usable()` → `morphTo()`. This preserves the fabric catalog as the single source, satisfies #5 for both legacy tailoring and new custom orders, and requires no separate pivot table per order type.
>
> Alternative: defer custom-order fabric consumption entirely (a separate pivot if ever needed). This is safe because **jewelry custom orders need no fabric at all** — the WS-A jewelry path is fully unblocked by this decision. Only apparel custom orders (menswear/womenswear) have a theoretical need, and they are post-MVP.
>
> **This is an orchestrator-surface decision. Do not pick a schema that drops the fabric catalog (tailoring_fabrics) or creates a duplicate pivot. Both alternatives above preserve the catalog. WS-A and WS-B proceed; WS-C implements whichever the orchestrator picks. Jewelry is unblocked regardless.**

---

## C. `custom_orders` Table Shape

For WS-A migrations and WS-D test assertions.

### `custom_orders`

```text
id                  bigint unsigned, primary key
store_id            bigint unsigned, FK → stores.id, index
customer_id         bigint unsigned, FK → users.id, index
vertical            string                // 'jewelry' | 'menswear' | 'womenswear' | 'tailor'
spec                json                  // vertical-specific fields
notes               text, nullable
quote_amount        decimal(12,2), nullable
deposit_amount      decimal(12,2), nullable
deposit_paid        boolean, default false
status              string                // REAL enum column — NOT a computed accessor
                                          // values: requested|quoted|deposit_paid|in_progress
                                          //         |ready|delivered|closed|cancelled
                                          // Constraint: learn from tailoring bug #5 — no getStatusAttribute()
eta                 date, nullable
delivery_date       date, nullable
timestamps
softDeletes
```

Suggested DB-level constraint: `status` as a MySQL `enum` or a `CHECK` constraint (driver-safe note: `enum` works on both MySQL and SQLite via string column with validation).

### `custom_order_progress`

```text
id                  bigint unsigned, primary key
custom_order_id     bigint unsigned, FK → custom_orders.id, index
status              string                // the lifecycle status this entry records
note                text, nullable
created_by          bigint unsigned       // user_id of the actor
timestamps
```

No `softDeletes` on progress — entries are append-only audit records.

### `store_revenues` additions

The existing `store_revenues.source_type` is a plain string column. Two additions are needed:

1. Add `'custom_order'` as a new valid value alongside existing `'order'` and `'tailoring_order'`.
2. Add a nullable `custom_order_id` column: `bigint unsigned, nullable, FK → custom_orders.id`.

**Existing string-vs-class inconsistency**: `StoreRevenue::recordRevenue()` writes `source_type = 'order'` (short string), but `Store::getTotalRevenue()` and `Store::getMonthlyRevenue()` query `where('source_type', Order::class)` and `where('source_type', TailoringOrder::class)` (FQCN). Per locked decision #6, the canonical form is the **short string**. WS-A's `recordForCustomOrder()` must write `source_type = 'custom_order'`. Reconciling the existing FQCN reads in `Store.php` is in-scope for WS-A (fix the two `where('source_type', Order::class)` calls to use `'order'`, and `TailoringOrder::class` to `'tailoring_order'`).

---

## D. Open Questions

| # | Question | Blocking whom | Recommended resolution |
|---|---|---|---|
| D1 | Is `deposit_paid` marked by the store owner via `advance` (current contract), or does a separate buyer "confirm deposit" endpoint exist (e.g., POST /custom-orders/{id}/pay-deposit)? | WS-A (service logic), WS-B (UI flow) | Recommend store owner marks it via `advance` (external payment verification). Separate buyer endpoint can be added in a later phase when Beldify integrates online deposit payments. |
| D2 | Polymorphic pivot vs. deferred per B5 — which form does the orchestrator pick? | WS-C (pivot migration), WS-A (apparel custom-order fabric relation) | Either unblocks jewelry. Decision needed before WS-C writes the pivot migration. |
| D3 | `stocks.customization_options` live read path — is this column currently read by any frontend/API code (PDP, cart), or is it dormant? (spec.md §9 item 1) | WS-A (product create/update), WS-B (PDP rendering) | Runtime code-search needed. Do not assume it is live without verification. |
| D4 | Should `quote` endpoint (A5) be the **exclusive** path for `requested → quoted` (with amount/eta payload), or can `advance` (A6) also carry the quote transition? | WS-A, WS-D | Recommend A5 is exclusive for the quote transition. A6 handles all subsequent status advances. |
| D5 | Jewelry category placement in the existing `categories` tree — what is the parent node? | WS-A (category seed) | Locked decision #7 adds a top-level Jewelry category. Confirm parent = null (root) or existing root category id before seeding. |

---

*Contracts frozen for WS-B mocking and WS-A coding. Fabric seam (B5) is the only item requiring orchestrator resolution before WS-C writes its pivot migration. WS-A jewelry path is fully unblocked.*

---

## D-RESOLVED (orchestrator decisions, 2026-06-02)

| # | Decision |
|---|---|
| **D1** | Store owner marks `deposit_paid` via the `advance` endpoint (A6). No separate buyer pay-deposit endpoint this phase — payment verified externally (matches Beldify COD/proof model). |
| **D2** | **DEFER custom-order fabric consumption.** WS-C's usage pivot stays tailoring-scoped (`tailoring_order_fabric_usage.order_id` → `tailoring_orders`). Apparel custom orders record fabric choice inside `custom_orders.spec` JSON (catalog fabric id + name) — no inventory-linked consumption yet. A polymorphic-pivot upgrade (`usable_id`/`usable_type`) is a documented FOLLOW-UP for when apparel custom orders need stock-decrementing fabric usage. **Jewelry needs no fabric — unaffected.** WS-C and WS-A both unblocked; neither builds a cross-order pivot now. |
| **D3** | Treat `stocks.customization_options` as a LIVE buyer picker path (KB-confirmed). WS-A still runtime-verifies the read site and notes it; does not block. |
| **D4** | `quote` (A5) is the EXCLUSIVE `requested → quoted` transition (carries amount/eta). `advance` (A6) handles all subsequent status moves and rejects a `quoted` target with 409. |
| **D5** | Jewelry category seeded at ROOT (`parent_id = null`) in the existing `categories` tree. |
| **source_type bug** | WS-A fixes the pre-existing `Store.php` FQCN-vs-short-string inconsistency: pin current behavior with a test FIRST, then standardize on short strings (`'order'`/`'tailoring_order'`/`'custom_order'`) and align reads. |

