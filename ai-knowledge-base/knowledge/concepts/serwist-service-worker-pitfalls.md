---
name: Serwist Service Worker Pitfalls
description: Three prod-breaking serwist source bugs — defaultCache imported from 'serwist' instead of '@serwist/next/worker', string handler names instead of strategy instances in runtimeCaching, and defaultCache trailing catch-alls that turn blocked third-party beacons into SW no-response errors — plus the diagnostic signatures for each
type: concept
sources: [raw/2026-06-10-prod-console-errors-images-sw.md, raw/2026-06-10-home-marketplace-overhaul.md, raw/2026-06-11-prod-console-errors-fix.md]
created: 2026-06-10
updated: 2026-06-11
---

# Serwist Service Worker Pitfalls

## Overview
The Beldify PWA service worker is built with serwist (the workbox successor integrated with Next.js). On 2026-06-10 two distinct source-level bugs in `src/app/sw.ts` broke production in sequence, and both compiled cleanly because `typescript.ignoreBuildErrors: true` suppressed the type errors that would have caught them. Neither bug was a build-mode problem — an earlier theory that the sw.js failure came from running `next dev` in prod was wrong for this incident; prod was already on the real production image (Dockerfile.prod, `next start`).

## Pitfall 1 — `defaultCache` imported from the wrong package
`defaultCache` is exported by `@serwist/next/worker`, NOT by the core `serwist` package (`'defaultCache' in require('serwist')` → false). Importing it from `'serwist'` yields `undefined`; the bundled `...s.defaultCache` spread then throws `Uncaught TypeError: s.defaultCache is not iterable` during SW script evaluation, so registration fails entirely ("Failed to register a ServiceWorker ... script evaluation failed"). Fixed in monorepo commit 1c88612. Verification: after `npm run build:prod`, the regenerated `public/sw.js` inlines the next-data/next-image/static-image-assets caches with zero `defaultCache` references, and `node --check` passes.

## Pitfall 2 — string handler names instead of strategy instances
`runtimeCaching: [{ handler: 'StaleWhileRevalidate' }]` is workbox *build-config* syntax. The serwist v9 *runtime* API requires strategy INSTANCES (`new StaleWhileRevalidate({...})`, `new NetworkFirst({...})`). String handlers register silently; every matched fetch then calls `.handle()` on a string, rejects, and surfaces as `net::ERR_FAILED` on ALL `/api/*` and image requests once the SW controls the page — `/products` showed "Failed to fetch" platform-wide. This bug was latent until Pitfall 1 was fixed (a dead SW can't break fetches), which is why fixing registration made things worse before commit 7b8aeb2 fixed the handlers.

**Diagnostic signature:** a same-origin fetch failing with `net::ERR_FAILED` while `curl` returns 200 means a service-worker handler is throwing. Check the `runtimeCaching` handler TYPES first.

## Pitfall 3 — defaultCache trailing catch-alls make third-party failures loud (2026-06-11)
`@serwist/next/worker`'s `defaultCache` ends with two catch-all routes: `({sameOrigin}) => !sameOrigin` → `NetworkFirst({cacheName: "cross-origin"})`, and `/.*/i` (GET) → `NetworkOnly()`. Both `respondWith()` every otherwise-unmatched GET — third-party included — so a client-blocked analytics request (the Cloudflare insights beacon under adblockers) rejects inside the SW as `Uncaught (in promise) no-response` + `net::ERR_FAILED` on every page load, instead of the browser's quiet native `ERR_BLOCKED_BY_CLIENT`. Removing only the cross-origin entry is NOT enough: a RegExp matcher applies to cross-origin URLs whenever it matches at index 0, which `/.*/` always does. Fix (commit 05ad89e): filter both entries out of `defaultCache` before spreading (predicate: `handler.cacheName === 'cross-origin' || matcher instanceof RegExp && matcher.source === '.*'`) and scope the images runtime cache to `sameOrigin` — unmatched requests then bypass the SW entirely (no route → no `respondWith` → native handling).

**Deploy verification signature:** the compiled `public/sw.js` contains the string `cross-origin` exactly 3 times with the fix (defaultCache definition + filter literal) vs 2 without — a greppable in-image marker that caught a BuildKit stale-layer deploy the same night (see [[concepts/docker-buildkit-copy-layer-cache-hazard]]).

## Chosen caching policy
- API routes use **NetworkFirst** (`networkTimeoutSeconds: 6`, only 200 responses cached, auth/csrf excluded) — this delivers fresh-data-on-reload with the cache as offline fallback only.
- The static-assets matcher must test `url.pathname`; the old `^\/` regex tested against the full href and never matched (a dead route).
- The SW only exists in production builds (`docker-compose.prod.yml`); dev has none, so these failures are invisible locally under `npm run dev`.

## See also
- [[concepts/typescript-ignore-build-errors-hazard]] — why both bugs compiled cleanly
- [[concepts/storefront-home-marketplace-overhaul]] — the overhaul deployed alongside the handler fix
- [[concepts/beldify-retention-loop-closure]] — the push/notification loop that depends on a working SW
- [[concepts/docker-buildkit-copy-layer-cache-hazard]] — the deploy hazard Pitfall 3's marker exposed
- [[entities/serwist]]
- [[sources/2026-06-10-prod-console-errors-images-sw]]
- [[sources/2026-06-10-home-marketplace-overhaul]]
- [[sources/2026-06-11-prod-console-errors-fix]]
