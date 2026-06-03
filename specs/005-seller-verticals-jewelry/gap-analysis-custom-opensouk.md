# Gap Analysis — Custom Order + Open Souk (2026-06-03)

Two read-only end-to-end audits. Branch audited: `feat/storefront-marketplace-overhaul` (the 005 work now lives here).

## The keystone finding: two "custom" systems that don't connect

- **Open Souk** (`CommunityPost` + `PostResponse`) = the **buyer-facing** path. Our simple "Request a Custom Piece" form posts here. A buyer can post; a seller can respond. **But the loop dead-ends** — an accepted response creates no order, no deal, no tracking.
- **`custom_orders` pipeline** (quote → deposit → progress → delivered → revenue) = backend **complete and well-tested**, but the **frontend is 100% mocked** and it has **no buyer entry** (we rerouted `/custom-orders/new` to Open Souk), so it's **orphaned**.

**What we miss = the bridge.** The `custom_orders` pipeline is exactly the "deal/fulfilment" machinery the Open Souk loop is missing. Connecting them (accepted response → create a `custom_order`) unifies both, gives the pipeline its buyer entry, and completes the Open Souk loop. This is the central product decision.

---

## Open Souk gaps

### P0 — core loop broken
- **OS-P0-1** `CommunityPostController::show():173` caches with a literal key `community_post` (no `$post->id`) → **every post detail returns the same cached post for 5 min**. (The list method above it documents this exact bug class.) Fix: key on `community_post:{id}`.
- **OS-P0-2** `PostResponseController:44` calls `PostResponse::communityStatsFor()` which **doesn't exist** → `GET /community/sellers/{shopId}/stats` 500s (frontend `getSellerStats` too). Implement or remove.
- **OS-P0-3** **Response auth/routing split**: detail page shows a "Submit Proposal" form to any authed non-owner, but the wired route is `role:store_owner` → **buyers get 403**; the notification-firing `PostResponseController::store` has **no route at all**. Decide product rule (who can respond?) then fix routing.

### P1 — incomplete
- **OS-P1-4** `delivery_days` collected by the form but missing from `PostResponse::$fillable` + resource → silently dropped.
- **OS-P1-5** `product_specifications`/`colors`/`styles` are stored + serialized but **never rendered** on the detail page → the custom piece's material/purity/size are invisible.
- **OS-P1-6** Feed filter param mismatch: FE sends `q`/`category_id`/`per_page`/`budget`/`skills[]`; backend reads `search`/`category`, ignores per_page (uses `limit`), and `scopeFilter` has no budget/skills → search + most filters are no-ops.
- **OS-P1-7** `has_my_proposal` never set in the resource → the "already submitted" guard never engages (dup only caught by a 422).
- **OS-P1-8** **No conversion from accepted response → order/deal** — `PostResponse::accept()` only flips status. ← the keystone bridge.
- **OS-P1-9** No notification to matching sellers when a new post is created (only response→author notifies).
- **OS-P1-10** Backend `CommunityApiTest` uses wrong payload/route (would 422/404); no frontend tests for the Open Souk loop.

### P2/P3
- Mock data in `communityService` dev branches (shops/messages); stub methods that throw; public `GET posts/{id}/responses` (no auth) exposes responder name + price (privacy, SUSPECTED); images upload+render OK; new posts default `status=open` (visible — OK).

---

## Custom Order gaps

### P0 — not usable
- **CO-P0-1** Frontend fully mocked: `customOrderService.ts` + `verticalService.ts` both `USE_MOCK=true`. Live `api.*` branches are dead.
- **CO-P0-2** **No buyer entry** to `POST /api/v1/custom-orders` — `/custom-orders/new` renders the Open Souk form; nothing calls `submitCustomOrder`.
- **CO-P0-3** Store-targeted `CustomOrderForm` is **dead code** (imported only by tests).
- **CO-P0-4** Seller page `/seller/custom-orders` runs on inline `MOCK_SELLER_ORDERS`; **no `fetchSellerCustomOrders()` exists** → backend `GET /api/v1/seller/custom-orders` has no caller. (Flipping USE_MOCK alone won't wire it.)

### P1
- **CO-P1-5** No notifications on submit/quote/status-change (FCM stack exists, not used here).
- **CO-P1-6** Quote→advance loop non-functional E2E (mock + seller page never loads real orders).
- **CO-P1-7** Buyer cannot cancel (advance requires `isStoreOwner`) — confirm intended.

### P2/P3
- `delivery_date` never written (always null). i18n inline AR/EN ternaries (bypasses 5-locale). No seller-dashboard nav link to `/seller/custom-orders`. No buyer deposit-payment step (by design, D1).

### Correct (verified)
- Backend lifecycle guards, exclusive quote transition (D4), idempotent revenue at delivered (short-string source_type), PII guard, authorization, routes A1–A6 + sellerIndex — all correct.

---

## Recommended path (to confirm)

**Unify**: make Open Souk the buyer path and connect it to the pipeline.
1. Fix the 3 Open Souk P0s (cache key, stats method, response auth/routing) — the loop must work regardless.
2. On **accept response** → create a `custom_order` linking post+response+seller, then run the existing quote/deposit/progress/delivered/revenue pipeline. The seller's `/seller/custom-orders` + buyer `/custom-orders/[id]` become the post-acceptance management/tracking UI.
3. Wire the frontend: flip USE_MOCK, add `fetchSellerCustomOrders()`, render specs on detail, fix filter params.
4. Notifications: new post → matching sellers; response → poster; status changes → both.
5. Retire the orphaned store-targeted `CustomOrderForm` (or keep as a shop-page "request direct" entry).
