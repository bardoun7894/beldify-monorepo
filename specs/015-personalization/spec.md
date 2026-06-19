# Feature Specification: Personalized "For You" — Behavioral Intelligence Layer

**Feature Branch**: `015-personalization`
**Created**: 2026-06-19
**Status**: Draft
**Input**: User description: "Make the app intelligence-based like AliExpress/Amazon — learn what the user navigates, searches, likes, and buys; remember favourites; show them what they always search for and what they're into. Primary emphasis: learn from what the user **navigates** most."

## Context

Beldify already collects rich behavioral raw data — wishlist (explicit favorites + restock/price-drop flags), orders (+ "buy again" reorder), follow-a-shop (`store_followers`), search, reviews — and ships a generic `DiscoverFeed.tsx` (AliExpress-style infinite scroll, `?sort=newest|popular`). But there is **no layer that learns from it**: no behavioral event log, no per-user taste profile, no personalized endpoint. The DiscoverFeed is identical for every visitor. Infra is ready: Redis is live, queue workers run, the scheduler is wired (since 2026-06-10), and `AiManager`/OpenRouter is available. No embeddings/vector store yet (Meilisearch is the roadmap step for that).

**This feature builds the missing brain:** capture behavior (navigation first), turn it into a per-user affinity profile, rank products for each user, and surface them — without heavy ML. The dominant signal, per product owner, is **navigation/browsing** (what the user looks at and dwells on), complemented by explicit signals (wishlist, cart, purchase, follow).

## Approach (staged — value at each stage, ML only when earned)

- **Stage 0 (this spec's MVP):** behavioral event log + affinity profile in Redis + personalize the existing DiscoverFeed + "Recently viewed" + "Because you viewed X". Heuristic/content-based, **no ML**.
- **Stage 1:** item-item collaborative filtering ("frequently bought/viewed together") via a nightly job.
- **Stage 2 (future, separate feature):** embeddings/semantic similarity once Meilisearch lands.

## Signal model (weights, navigation-weighted)

Implicit feedback with time-decay (recent navigation matters most). Indicative weights:

| Signal | Type | Weight |
|---|---|---|
| Product view (PDP) | navigation | 1 |
| Dwell > 10s / scroll-depth on PDP | navigation | +1 |
| Category / collection browse | navigation | 1 |
| DiscoverFeed impression (seen, not clicked) | navigation | 0.25 |
| Search query | navigation | 2 |
| Add to cart | intent | 3 |
| Wishlist add | explicit | 4 |
| Follow shop | explicit | 4 |
| Purchase | strongest | 5 |

Profile dimensions derived: top categories, price band, attribute prefs (color/fabric/size from `product_variants.attributes`), favorite sellers, recent searches, recently-viewed list.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture what the user navigates (Priority: P1)

Every meaningful browsing action — PDP views, category browsing, searches, dwell, feed impressions, plus cart/wishlist/follow/purchase — is recorded as a weighted, timestamped event tied to the user (or guest token), and merges into the user's history on login.

**Why this priority**: Nothing can be learned without the signal log. Navigation is the highest-volume, earliest signal (a user browses long before they buy), so capturing it well is the foundation of the whole feature.

**Independent Test**: Browse several PDPs and run a search as a guest, then log in; confirm the events are recorded against the guest token and re-attributed to the user on login, with correct event types and weights.

**Acceptance Scenarios**:

1. **Given** a guest viewing a product, **When** the PDP loads (and on dwell), **Then** a `view` event (and a dwell bonus) is recorded with `guest_token`, `stock_id`, weight, and timestamp.
2. **Given** a user runs a search, **When** the query submits, **Then** a `search` event with the query text is recorded.
3. **Given** a guest with browsing history logs in, **When** authentication completes, **Then** all guest events merge into the user's history (same pattern as guest cart/wishlist merge) with no duplication.
4. **Given** high event volume, **When** events are sent, **Then** they are batched/beaconed (not one request per view) and ingestion never blocks page rendering.

---

### User Story 2 - Personalized "For You" feed + Recently Viewed (Priority: P1)

The home DiscoverFeed becomes personalized: products are ranked by the user's affinity profile (driven mostly by what they navigate), and a "Recently viewed" rail lets them resume. New/anonymous users still get a sensible trending feed (cold start).

**Why this priority**: This is the visible payoff — the user immediately sees a store that feels tailored to them, like AliExpress/Amazon. It's independently shippable on top of US1.

**Independent Test**: Seed a profile with strong affinity for one category/price band; fetch the For-You feed and confirm those products rank above unrelated ones; confirm a fresh user gets the trending fallback.

**Acceptance Scenarios**:

1. **Given** a user who repeatedly browses caftans in a mid price band, **When** they open the home feed, **Then** caftans in that band rank near the top, above unrelated categories.
2. **Given** a brand-new user with no history, **When** they open the home feed, **Then** they get the trending/popular feed (no empty state, no error).
3. **Given** a user who viewed several products, **When** they return, **Then** a "Recently viewed" rail shows those items in recency order.
4. **Given** the profile updates after new browsing, **When** the feed is refreshed, **Then** the ranking reflects the newer affinity (recency-weighted).

---

### User Story 3 - "Because you viewed X" / Similar items (Priority: P2)

On the PDP and home, contextual rails recommend items related to what the user just looked at — content-based (same category + similar attributes) initially, upgraded by co-occurrence in Stage 1.

**Why this priority**: Strong cross-sell and "rabbit hole" engagement, but depends on the signal log (US1) and is secondary to the headline For-You feed.

**Independent Test**: View a product, then confirm the PDP "Similar items" and a home "Because you viewed X" rail surface items sharing its category/attributes.

**Acceptance Scenarios**:

1. **Given** a user viewed product X, **When** they see the PDP or return home, **Then** a "Because you viewed X" rail shows items in X's category with similar attributes (color/fabric/price).
2. **Given** no strong matches exist, **When** the rail renders, **Then** it falls back to same-category popular items rather than showing empty.

---

### Edge Cases

- **Cold start** (no history) → trending/popular/new arrivals; blend personalization in as signals accrue.
- **Guest → login merge** → events re-attributed once; idempotent; no double-counting (respect existing guest-token merge path).
- **Privacy / opt-out** → a user setting to disable personalization; when off, serve the generic feed and stop profiling. Events are first-party only; no PII beyond user/guest id.
- **Stale profile** → time-decay so last-year's browsing doesn't dominate today's feed.
- **Sparse catalog / empty category** (many prod categories have few products) → rails fall back gracefully; never show fewer than N or an empty rail.
- **Performance** → feed ranking must read a precomputed/cached profile (Redis), not compute over the raw event log per request.
- **Bot/abuse traffic** → ignore obviously non-human event floods in profile building.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record weighted, timestamped behavioral events — navigation (PDP view, dwell, category browse, feed impression, search), intent (add-to-cart), and explicit (wishlist, follow, purchase) — tied to `user_id` or `guest_token`.
- **FR-002**: Event ingestion MUST be batched/beaconed from the client and MUST NOT block page rendering or the user action.
- **FR-003**: Guest events MUST merge into the user's history on login, idempotently, reusing the existing guest-token → auth merge path.
- **FR-004**: The system MUST derive a per-user affinity profile (top categories, price band, attribute preferences, favorite sellers, recent searches, recently-viewed) with **time-decay**, and cache it in Redis for low-latency reads.
- **FR-005**: A personalized feed endpoint MUST accept the user/guest context and return products ranked by the affinity profile, reading the cached profile (not the raw log) per request.
- **FR-006**: The existing DiscoverFeed MUST consume the personalized feed for users with sufficient signal, and MUST fall back to trending/popular for cold-start users — never an empty or error state.
- **FR-007**: The system MUST provide a "Recently viewed" list per user/guest in recency order.
- **FR-008**: The system MUST provide a "similar items / because you viewed X" recommendation (content-based on category + `product_variants.attributes`; upgraded by co-occurrence in Stage 1), with a same-category-popular fallback.
- **FR-009**: Profile/ranking computation MUST be incremental on event plus a scheduled rebuild job (reuse the wired scheduler), not synchronous heavy work on the request path.
- **FR-010**: Users MUST be able to opt out of personalization; when off, the generic feed is served and profiling stops.
- **FR-011**: All recommendation responses MUST respect content-locale rules and MUST NOT leak another user's data; cached feed payloads MUST NOT embed viewer-specific flags that could cache-poison across users.
- **FR-012**: Cold-start and sparse-category cases MUST degrade gracefully to popularity-based results.

### Key Entities

- **UserInteraction (event log)** *(new)*: one row per behavioral event — `user_id` nullable, `guest_token` nullable, `event_type`, `subject_type`/`subject_id` (stock/category/store/query), `weight`, `query_text` nullable, `metadata` json, `created_at`. Indexed on (`user_id`,`created_at`) and (`subject_type`,`subject_id`). High-write; consider pruning/rollup.
- **AffinityProfile** *(derived, cached)*: per-user computed preferences (category scores, price band, attribute prefs, seller prefs, recent searches, recently-viewed). Lives in Redis (rebuilt incrementally + nightly); optionally a thin DB snapshot table for durability.
- **ProductRecommendation / co-occurrence** *(Stage 1)*: precomputed item→related-items map from co-views/co-purchases, cached for "bought/viewed together".
- Reuses existing: `stocks` (catalog), `categories`, `product_variants.attributes`, `customer_wishlists`, `orders`, `store_followers`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥ 95% of PDP views, searches, add-to-cart, wishlist, and purchase actions emit a correctly-typed event (verified by instrumentation test).
- **SC-002**: Guest browsing history merges to the user account on login with zero duplicate events (idempotency verified).
- **SC-003**: The For-You feed endpoint responds in < 150ms p95 by reading the cached profile (no per-request scan of the event log).
- **SC-004**: For a user with a dominant category affinity, ≥ 70% of the top-10 feed items belong to their top-3 categories/price band (offline eval on seeded profiles).
- **SC-005**: New/anonymous users always receive a non-empty feed (trending fallback) — 0 empty/error states.
- **SC-006**: Engagement lift — measurable increase in feed click-through and PDP-from-feed vs. the generic feed (A/B or before/after), once live.
- **SC-007**: Opt-out fully stops profiling and serves the generic feed (verified).
