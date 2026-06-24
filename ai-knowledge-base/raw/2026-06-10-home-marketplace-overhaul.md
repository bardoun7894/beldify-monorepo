# Home marketplace overhaul + second SW P0 + products infinite scroll — 2026-06-10 morning (wave 2)

Follow-up to [[2026-06-10-prod-console-errors-images-sw]]. User directive: world-class marketplace home, mobile-first, professional (zero emoji), AliExpress-style product browsing, fresh products on reload, infinite scroll, non-tech-friendly navigation.

## P0 discovered during audit: serwist string handlers killed all API/image fetches

After the morning's defaultCache import fix made SW registration SUCCEED, a worse latent bug activated: `sw.ts` `runtimeCaching` used **string handler names** (`handler: 'StaleWhileRevalidate'`) — that's workbox *build-config* syntax. The serwist v9 **runtime** API needs strategy INSTANCES (`new StaleWhileRevalidate({...})`). Strings register silently; every matched fetch then calls `.handle()` on a string → rejects → `net::ERR_FAILED` on ALL `/api/*` + image requests once the SW controls the page. `/products` showed "Failed to fetch" platform-wide for SW-controlled visitors. Third consecutive bug masked by `typescript.ignoreBuildErrors: true`.

Fix (commit 7b8aeb2, deployed as build #1): strategy instances throughout; API route switched SWR → **NetworkFirst** (networkTimeoutSeconds 6, only 200s cached, auth/csrf excluded) which also delivers the "fresh on reload" requirement — cache is offline-fallback only. Static-assets matcher now tests `url.pathname` (the old `^\/` regex against href never matched — dead route). Verified live: products API 200 through the active SW.

**Diagnostic signature for the future:** same-origin fetch failing `net::ERR_FAILED` while curl returns 200 = service worker handler throwing. Check `runtimeCaching` handler TYPES first.

## Overhaul (4 parallel agents, shared tree, no stash/branch ops — discipline held)

- **FE-A home (a28216d)**: hero 85vh → 38vh mobile/45vh desktop; horizontal category-chips rail + deals/new-arrivals rails above the fold; `DiscoverFeed.tsx` (AliExpress "more to love"): useSWRInfinite + IntersectionObserver, 2-col mobile; `page.tsx` revalidate 300→60 + `export const revalidate = 60`; nested-`<main>` fixed (inner → div); trust-signals icon row; sections null-out when data empty.
- **FE-B products (baea639)**: numbered pagination → infinite scroll (useSWRInfinite + sentinel + skeletons + end-state), URL-state architecture preserved; AliExpress card density (2-col, clamped title, `.currency-mad` prices, strike-through compare-at, free-ship badge >500 MAD); emoji purge across ProductCard/QuickView/TraditionalProductCard; `bg-[#252555]` + amber/white WCAG P0s fixed; Darija typo "االمنتوجات"→"المنتوجات" fixed (59 occurrences in src/i18n/locales/ma.json — locales live THERE, not public/locales).
- **FE-C nav (317366b)**: bottom nav 3→5 labeled tabs (الرئيسية / الأصناف / السوق المفتوح / السلة+badge / حسابي|تسجيل الدخول), grid-cols-5, 48px targets, solid bg (glassmorphism P2 removed), safe-area inset, hides on /checkout; deleted dead duplicates components/layout/BottomNavigation.tsx + components/navigation/BottomNavigation.tsx.
- **Navbar badge bug (7121049, main session)**: `CartContextType`/`WishlistContextType` expose NO `cartItemCount`/`wishlistCount` — Navbar destructured undefined → header cart + wishlist badges NEVER rendered. Counts now computed from `state.items.reduce(...)` / `wishlistItems.length`. Same ignoreBuildErrors class.

## Backend findings (BE agent, commits 372db8f6 + 7e80941a)

- `GET /api/products/all` envelope: `{ data: Product[], message, pagination: {current_page,last_page,per_page,total}, facets }` — **pagination object only present when `?page=` is supplied**. sort=newest = created_at DESC ✓. per_page was UNCAPPED → now `min(50, max(1, int))`, default 20.
- No server-side cache on the listing; `Cache-Control: public, max-age=60` header delegates to CDN/browser — fine for freshness.
- **Two more raw-IP URL bugs fixed**: `getSubcategoriesByGender` (CategoryController:210) + `getAllSubcategories` (:331) used `asset()` (APP_URL-based) instead of `Storage::disk('public')->url()` (ASSET_URL-based). Regression tests added (note: invisible in test env where APP_URL==storage URL — verified by inspection).
- **OPEN PERF ISSUE (backlog)**: `getHeaderCategories` + `getAllCategories` call `forgetMultiple(['header_categories','categories','stocks'])` on EVERY READ — category cache is perpetually cold; 900-1440s TTLs never apply. Fixing requires moving invalidation to write paths; deliberately deferred.
- Pre-existing test failures: ~17 CategoryApi (legacy /api/mobile/* routes 404), 6 ProductApi (factory column drift), 1 StorefrontMarketplaceOverhaul — all pre-date today; QA-1 backlog item.

## Deploys

- Frontend build #1 (SW fix) + build #2 (overhaul): rsync changed files into /var/local/beldify-monorepo/beldify-frontend (live tree = docker build context), `docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend`. Dead nav files rm'd on server too.
- Backend: rsync 2 controllers + `docker restart beldify-backend` (opcache) + smokes with `-H "Host: pro.beldify.com"` (localhost:7894 without Host header 404s — nginx default vhost).

Related: [[beldify-pwa-webpush]], [[beldify-prod-deploy]], [[beldify-products-infinite-scroll]], [[beldify-product-feed-api-shape]], [[beldify-mobile-nav-cart-context-bug]], [[beldify-discover-feed-pagination]].

## Post-deploy verification round (build #3 — polish)

Live verification of build #2 found 4 more issues, fixed in commit 7c34e74 (build #3):
1. **Dead 64px band under header on EVERY page**: `layout-client.tsx` main had `pt-16` "for fixed navbar" — but Navbar is `position: sticky` (occupies flow space). Padding removed.
2. **Sort chips rendered raw i18n keys** (`price_asc`, `top_rated`) — `t(labelKey, value)` used the key VALUE as fallback. Darija fallbacks added inline. (i18n backlog: add proper sort.* keys to all 5 locales.)
3. **Product card torn-image glyphs**: overnight-seeded demo products carry FABRICATED unsplash IDs (404 at unsplash). ProductCard now has `onError → imgFailed` state → branded placeholder branch. (Data backlog: replace seed product images with real files.)
4. **Bottom-nav label truncation**: `max-w-[56px] truncate` clipped "تسجيل الدخول"/"السوق المفتوح" → clamp raised to 72px + guest label shortened to "دخول" (new key navigation.login_short).

Verified live after build #2: single `<main>` (nested-main fixed), zero emoji in home DOM, category chips rail, DiscoverFeed renders (catalog only has 12 products → page 1 = entire catalog, end-state correct), 5 nav tabs, products API 200 through NetworkFirst SW. Pushed: monorepo main 7c34e74, backend main 7e80941a.
