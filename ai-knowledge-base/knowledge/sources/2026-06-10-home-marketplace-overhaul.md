---
name: Home marketplace overhaul + second SW P0 + products infinite scroll
description: "2026-06-10 wave 2 — serwist string-handler P0 killed all API/image fetches; 4-agent home/products/nav overhaul (AliExpress-style); backend product-feed findings; three prod builds deployed"
type: source
tags: [route, factory, typescript, state, fetch, docker, docker-compose, deploy, cart, checkout]
sources: [raw/2026-06-10-home-marketplace-overhaul.md]
created: "2026-06-10"
updated: "2026-06-10"
---
# Home marketplace overhaul + second SW P0 + products infinite scroll

## Summary
Follow-up session log to the same morning's console-error fixes. After the `defaultCache` import fix made service-worker registration succeed, a worse latent bug activated: string handler names in `runtimeCaching` broke every API and image fetch for SW-controlled visitors. The session then executed a four-agent home/products/navigation overhaul (mobile-first, AliExpress-style browsing, infinite scroll, professional zero-emoji styling), recorded backend product-feed API findings, and shipped three production frontend builds plus a backend deploy.

## Key points
- **P0 — serwist string handlers**: `sw.ts` `runtimeCaching` used string handler names (`handler: 'StaleWhileRevalidate'`) — workbox *build-config* syntax. The serwist v9 *runtime* API needs strategy INSTANCES (`new StaleWhileRevalidate({...})`). Strings register silently; every matched fetch then calls `.handle()` on a string → rejects → `net::ERR_FAILED` on all `/api/*` + image requests once the SW controls the page. `/products` showed "Failed to fetch" platform-wide. Third consecutive bug masked by `typescript.ignoreBuildErrors: true`.
- **Fix (commit 7b8aeb2, build #1)**: strategy instances throughout; API route switched SWR → NetworkFirst (`networkTimeoutSeconds: 6`, only 200s cached, auth/csrf excluded) which also delivers fresh-on-reload — cache is offline-fallback only. The static-assets matcher now tests `url.pathname` (the old `^\/` regex against href never matched — dead route).
- **Diagnostic signature**: same-origin fetch failing `net::ERR_FAILED` while curl returns 200 = service-worker handler throwing. Check `runtimeCaching` handler TYPES first.
- **FE-A home (a28216d)**: hero 85vh → 38vh mobile/45vh desktop; category-chips rail + deals/new-arrivals rails above the fold; `DiscoverFeed.tsx` (useSWRInfinite + IntersectionObserver, 2-col mobile); revalidate 300→60; nested `<main>` fixed; trust-signals row; sections null-out when data empty.
- **FE-B products (baea639)**: numbered pagination → infinite scroll (useSWRInfinite + sentinel + skeletons + end-state); AliExpress card density; `.currency-mad` prices; emoji purge; `bg-[#252555]` + amber/white WCAG P0s fixed; Darija typo "االمنتوجات"→"المنتوجات" (59 occurrences in `src/i18n/locales/ma.json` — locales live there, not `public/locales`).
- **FE-C nav (317366b)**: bottom nav 3→5 labeled tabs (home / categories / Open Souk / cart+badge / account-or-login), 48px targets, solid bg, safe-area inset, hides on /checkout; two dead duplicate BottomNavigation components deleted.
- **Navbar badge bug (7121049)**: `CartContextType`/`WishlistContextType` expose no `cartItemCount`/`wishlistCount` — Navbar destructured undefined, so header cart + wishlist badges NEVER rendered. Counts now computed from `state.items.reduce(...)` / `wishlistItems.length`. Same ignoreBuildErrors class.
- **Backend (372db8f6 + 7e80941a)**: `GET /api/products/all` envelope `{ data, message, pagination, facets }` — pagination object only present when `?page=` is supplied; per_page was uncapped → now `min(50, max(1, int))`, default 20; no server-side cache on the listing, `Cache-Control: public, max-age=60` delegates to CDN/browser. Two more raw-IP URL bugs fixed: `getSubcategoriesByGender` (CategoryController:210) + `getAllSubcategories` (:331) used `asset()` (APP_URL-based) instead of `Storage::disk('public')->url()` (ASSET_URL-based).
- **Open perf issue (backlog)**: `getHeaderCategories` + `getAllCategories` call `forgetMultiple(['header_categories','categories','stocks'])` on EVERY READ — category cache perpetually cold; 900–1440s TTLs never apply. Fix requires moving invalidation to write paths; deliberately deferred.
- **Build #3 polish (7c34e74)**: dead 64px band removed (`pt-16` under a `position: sticky` navbar that already occupies flow space); sort chips rendered raw i18n keys → Darija fallbacks inline; seeded demo products carry fabricated Unsplash IDs (404) → ProductCard `onError` → branded placeholder; bottom-nav label clamp 56→72px + guest label shortened to "دخول".
- Pre-existing test failures noted (~17 CategoryApi legacy mobile routes, 6 ProductApi factory drift, 1 StorefrontMarketplaceOverhaul) — pre-date the session.
- **Deploys**: frontend rsync changed files into `/var/local/beldify-monorepo/beldify-frontend` (live tree = docker build context) + `docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend`; backend rsync 2 controllers + `docker restart beldify-backend` (opcache) + smokes with `-H "Host: pro.beldify.com"`.

## See also
- [[sources/2026-06-10-prod-console-errors-images-sw]]
- [[concepts/serwist-service-worker-pitfalls]]
- [[concepts/storefront-home-marketplace-overhaul]]
- [[concepts/typescript-ignore-build-errors-hazard]]
- [[concepts/caching-strategy]]
- [[concepts/category-image-pipeline]]
- [[entities/serwist]]
