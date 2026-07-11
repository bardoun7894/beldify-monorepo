---
name: docs/api/open-souk-proposals.md
description: Auto-synced from docs/api/open-souk-proposals.md
type: source
sync_origin: docs/api/open-souk-proposals.md
sync_hash: ac7dfbace42abad6
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from docs/api/open-souk-proposals.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Open Souk — Proposals (Blind Bidding)

## Overview
Open Souk is a buyer-request / seller-proposal marketplace modeled on mostaql.com.
Proposals use **blind bidding**: a seller's proposal (price, description, identity) is
private between that seller and the buyer who posted the request. Competing sellers
cannot see each other's proposals or prices.

Domain: a **community post** = a buyer request; a **`PostResponse`** = a seller proposal.

## Proposal visibility

| Viewer | Sees |
|---|---|
| **Buyer** (post owner) | ALL proposals in full — price, description, seller identity |
| **Seller** (proposal author) | Only their OWN proposal + the total count |
| **Other seller** | Count only — no competitor content/price/identity |
| **Anonymous** | Post + count only, zero proposal content |

### Endpoint — `GET /api/v1/community/posts/{post}/responses`
Returns proposals **scoped to the caller** (resolved via the Sanctum guard):
- post owner → all proposals
- authoring seller → own proposal only (matched by `user_id` or an owned active `shop_id`)
- everyone else / anonymous → empty array

**Uncached on purpose** — the response set is per-viewer. Never wrap in
`CacheService::remember()` without a viewer-keyed cache key, or it will leak
competitors' proposals across users.

### Count — `proposalCount`
`CommunityPostResource` exposes `proposalCount` (= `response_count`) on every post.
It **never embeds the `responses` array** (the resource renders inside
viewer-independent cached paths — embedding would leak via the cache). Clients must
use `proposalCount` for the count, not `responses.length`.

## Editing a proposal (seller)
Sellers submit and edit proposals **only in the Laravel seller dashboard**
(`pro.beldify.com`), never on the Next.js storefront.

- Route: `GET|POST /seller/community/posts/{post}/responses/{response}/edit`
- A proposal may be edited a **maximum of 3 times**, and only while `status = pending`.
- `PostResponse::canEdit()` enforces: caller is the author **and** status is pending
  **and** `edit_count < 3`. `editsRemaining()` returns `max(0, 3 - edit_count)`.
- Enforced server-side — the UI cap is not the gate.
- Migration: `2026_06_09_000001_add_edit_count_to_post_responses` (`edit_count` TINYINT, default 0).

## Contacting a seller (buyer)
A buyer may message a seller about a post **only after accepting** one of their proposals.

- Real path: `POST /api/v1/buyer/messages/send` → `Frontend\BuyerMessageController::sendMessage`,
  body keyed on `shop_id` + `post_id`.
- When `post_id` is present, the send is **403'd** unless the caller owns the post AND an
  **accepted** `PostResponse` exists for that buyer↔seller pair.
- When `post_id` is absent, general shop/PDP messaging is **unaffected**.
- A defense-in-depth copy of the gate also exists on the community
  `MessageController::sendMessage` route.

## Notes / gotchas
- The storefront contact button (`ResponseCard`) renders only for
  `isPostOwner && isAccepted` and links to `/community/messages/{shopId}?postId={postId}`,
  which sends `post_id` so the accepted happy-path passes the gate.
- Controllers live under the lowercase `app/Http/Controllers/Api/` path; the Linux deploy
  maps `API → Api` via a symlink (`sync-and-run.sh`). See the case-sensitivity note in the KB.

## Related
- `app/Http/Controllers/Api/PostResponseController.php` — visibility scoping
- `app/Http/Resources/CommunityPostResource.php` — `proposalCount`, no embedded responses
- `app/Http/Controllers/Seller/CommunityController.php` — edit + own-only dashboard view
- Tests: `CommunityResponseVisibilityTest`, `PostResponseEditTest`, `BuyerMessageContactGateTest`, `OpenSoukContactGateTest`

