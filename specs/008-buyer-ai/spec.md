# Feature 008 — Buyer-Facing AI (free tier)

**Status**: draft approved in principle 2026-06-10 22:05 ("ok" to spec); build gated on feature-007 prod deploy completing (shared-tree safety).
**Branch (when built)**: `feat/buyer-ai` (monorepo + nested beldify-backend repo)
**Depends on**: feature 007 AI plumbing (`AiManager`, `ChatClient`) — no credit billing here.

## Problem

All AI value currently sits on the seller side (feature 007, credit-billed). Buyers
get no help finding, trusting, or sizing products. Buyer AI is free by design: it
raises conversion and GMV, and the platform earns through order commissions —
charging buyers would suppress exactly the behavior we want.

## Monetization & cost model (locked principle)

- **Free for buyers. No credits, no wallet.** Seller credits (007) stay seller-only.
- Cost control instead of billing: aggressive caching + throttles (stricter for
  guests) + `openrouter/free` model via existing DB-backed `AiManager` keys.
- Hard grounding rule: every endpoint answers ONLY from supplied catalog/review
  data (strict system prompt + JSON output). The AI never invents product claims.

## Scope — v1 (three features)

### 1. Review summaries (PDP)

- `GET /api/products/{id}/review-summary` (public, cached) → per-locale
  `{summary, pros[], cons[], review_count, generated_at}`.
- Generated from approved reviews only; **cached persistently** (table or cache
  with version key) and regenerated lazily when a new approved review changes
  `review_count` — never on every request. Below N=3 reviews → 204/empty (no AI).
- FE: summary card + pros/cons chips at top of PDP Reviews tab; skeleton; hidden
  when empty. Localized to the buyer's locale (5 locales).

### 2. Smart search / shopping assistant

- `POST /api/search/assist` `{query, locale}` (public, throttled ~10/min guest,
  20/min auth) → `{filters: {keywords, category_id?, price_min?, price_max?},
  reply}` — AI converts natural language (incl. Darija) into structured filters,
  results come from the EXISTING catalog search (FULLTEXT + facets), not from
  the AI. The `reply` is a one-line localized "showing caftans under 800 MAD".
- Catalog truth stays in `stocks` ([[beldify-catalog-stocks-table]]); the AI only
  produces filters — products are never AI-selected directly.
- FE: search bar "✨ assist" affordance on home/products page; submitting a
  natural-language query routes through assist → renders the normal product
  grid with the parsed filter chips visible (editable/removable).

### 3. Size & fit advisor (PDP, apparel/tailoring verticals)

- `POST /api/products/{id}/size-advice` `{height_cm, weight_kg, fit_preference?,
  usual_size?}` (public, throttled) → `{recommended_size, confidence, note}`
  constrained to the product's actual available sizes/variants; respects
  vertical fields ([[beldify-seller-verticals-jewelry]]). Non-sized products → 422.
- FE: "Find my size" link beside the size selector on PDP → small sheet with the
  2–4 inputs → recommendation with honest confidence wording. Never auto-selects
  without the buyer confirming.

## Phase 2 (same architecture, build on demand)

- PDP product Q&A grounded in description/specs/reviews, with "Ask the seller"
  fallback into in-app messaging ([[beldify-realtime-messaging]]).
- Open Souk request writer (buyer-side twin of 007's listing writer) for
  community custom-order posts ([[beldify-opensouk-blind-bidding]]).
- Gift finder quiz (NL → filters reuse of feature 2).

## Out of scope

Visual search (image embeddings — different stack), personalized feeds,
buyer-side billing of any kind, AI-generated review content (never).

## Non-functional

- Review summaries: zero AI calls on cache hit; regeneration is queued/lazy,
  never inline on a buyer request path. Target PDP overhead ≈ 0 ms on hit.
- All endpoints: graceful degrade — AI failure returns empty/fallback (search
  falls back to literal keyword search; size advisor returns "size chart"
  pointer; summary stays hidden). The storefront NEVER errors because AI is down.
- Throttle + abuse: per-IP guest limits; responses exclude any seller contact
  data ([[beldify-whatsapp-never-checkout]]).
- i18n: all five locales (ar, ma, fr, en, es), output in the buyer's locale.
- Tests: mocked ChatClient throughout; cache-invalidation test for summaries;
  filter-extraction contract tests; vertical/size constraint tests.
