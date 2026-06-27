---
name: "Storefront Home & Marketplace Overhaul (2026-06-10)"
description: "AliExpress-style mobile-first overhaul of home, products listing, and bottom navigation — compressed hero, category chips rail, DiscoverFeed and products infinite scroll, 5-tab nav, and the product-feed API contract"
type: concept
tags: [migration, policy, typescript, state, cart, checkout, product, category, shipping, pattern]
sources:
  - raw/2026-06-10-home-marketplace-overhaul.md
  - raw/2026-06-10-i18n-7-locale-expansion.md
  - raw/2026-06-10-frontend-completeness-audit.md
created: "2026-06-10"
updated: "2026-06-10"
---
# Storefront Home & Marketplace Overhaul (2026-06-10)

## Overview
On 2026-06-10 the Beldify storefront home, products listing, and mobile navigation were overhauled toward a world-class mobile-first marketplace experience: AliExpress-style product browsing density, fresh products on reload, infinite scroll, and non-tech-friendly navigation, with a professional zero-emoji presentation. The work ran as four parallel agents in a shared tree (no stash/branch operations — discipline held) plus a main-session bug fix, deployed across three production frontend builds.

## What changed
- **Home (commit a28216d)**: hero compressed from 85vh to 38vh mobile / 45vh desktop; a horizontal category-chips rail and deals/new-arrivals rails sit above the fold; `DiscoverFeed.tsx` implements the AliExpress "more to love" pattern (useSWRInfinite + IntersectionObserver, 2-col mobile); page revalidate 300→60 (`export const revalidate = 60`); a nested `<main>` was fixed (inner element → div); trust-signals icon row added; sections null-out when their data is empty.
- **Products listing (commit baea639)**: numbered pagination replaced by infinite scroll (useSWRInfinite + sentinel + skeletons + end-state) while preserving the URL-state architecture; AliExpress card density (2-col, clamped titles, `.currency-mad` prices, strike-through compare-at, free-shipping badge >500 MAD); emoji purged from ProductCard/QuickView/TraditionalProductCard; hardcoded `bg-[#252555]` and amber/white WCAG contrast P0s fixed; the Darija typo "االمنتوجات"→"المنتوجات" fixed across 59 occurrences (locale files live in `src/i18n/locales/`, not `public/locales/`).
- **Bottom nav (commit 317366b)**: 3 → 5 labeled tabs (home / categories / Open Souk / cart with badge / account-or-login), `grid-cols-5`, 48px touch targets, solid background (glassmorphism removed as a P2), iOS safe-area inset, hidden on /checkout; two dead duplicate BottomNavigation components deleted.
- **Navbar badge fix (commit 7121049)**: header cart/wishlist badges had never rendered because the contexts expose no `cartItemCount`/`wishlistCount` fields — see [[concepts/typescript-ignore-build-errors-hazard]].

## Product-feed API contract (backend findings)
`GET /api/products/all` returns `{ data: Product[], message, pagination: {current_page, last_page, per_page, total}, facets }` — the `pagination` object is only present when `?page=` is supplied. `sort=newest` maps to `created_at DESC`. `per_page` was uncapped and is now clamped `min(50, max(1, int))` with default 20. The listing has no server-side cache; a `Cache-Control: public, max-age=60` header delegates freshness to CDN/browser, which suits the fresh-on-reload requirement alongside the SW's NetworkFirst policy ([[concepts/serwist-service-worker-pitfalls]]).

## Post-deploy polish round (build #3, commit 7c34e74)
Live verification of build #2 surfaced four fit-and-finish issues: a dead 64px band under the header on every page (`pt-16` compensating for a navbar that is `position: sticky` and already occupies flow space — padding removed); sort chips rendering raw i18n keys (`t(labelKey, value)` used the key value as fallback; inline Darija fallbacks added, proper `sort.*` keys backlogged); torn-image glyphs on product cards (overnight-seeded demo products carry fabricated Unsplash IDs that 404 — `onError` → branded placeholder branch added; real seed images backlogged); bottom-nav label truncation (clamp raised 56→72px, guest label shortened to "دخول").

## Same-day closures (later 2026-06-10 sessions)
The `sort.*` keys backlog item was closed by the 7-locale i18n expansion (`products.sort.newest/price_low/price_high/popular` authored ×7 locales — [[sources/2026-06-10-i18n-7-locale-expansion]]), which also fixed DiscoverFeed's hardcoded `locale=ma` so the feed finally respects the user's language. The frontend completeness audit built the `/mega-offers` and `/mega-offers/[slug]` pages that home had been linking to without their existing ([[sources/2026-06-10-frontend-completeness-audit]]).

## See also
- [[concepts/serwist-service-worker-pitfalls]] — the SW fix deployed as build #1 of the same morning
- [[concepts/typescript-ignore-build-errors-hazard]] — the navbar badge bug class
- [[concepts/atlas-frontend-migration]] — the broader storefront migration this builds on
- [[concepts/i18n-7-locale-expansion]] — closed this page's sort.* backlog and the DiscoverFeed locale bug
- [[sources/2026-06-10-home-marketplace-overhaul]]
- [[sources/2026-06-10-i18n-7-locale-expansion]]
- [[sources/2026-06-10-frontend-completeness-audit]]
