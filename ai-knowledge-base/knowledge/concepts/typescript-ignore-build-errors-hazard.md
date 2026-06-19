---
name: typescript.ignoreBuildErrors Production Hazard
description: Next.js typescript.ignoreBuildErrors true let at least three type-detectable bugs ship to Beldify prod in one day — wrong-package import, string SW handlers, and destructuring nonexistent context fields
type: concept
sources: [raw/2026-06-10-prod-console-errors-images-sw.md, raw/2026-06-10-home-marketplace-overhaul.md, raw/2026-06-10-frontend-completeness-audit.md]
created: 2026-06-10
updated: 2026-06-10
---

# typescript.ignoreBuildErrors Production Hazard

## Overview
The Beldify frontend's `next.config` sets `typescript.ignoreBuildErrors: true`, so `next build` succeeds even when the TypeScript compiler reports errors. On 2026-06-10 this single setting was identified as the common cause that let three consecutive production bugs ship — each one would have been a compile-time type error.

## The three masked bugs (all 2026-06-10)
1. **Wrong-package import**: `import { defaultCache } from 'serwist'` — the symbol does not exist in that package (it lives in `@serwist/next/worker`), so the import is `undefined` and the service worker threw `s.defaultCache is not iterable` at evaluation time, killing SW registration in prod.
2. **String handlers in `runtimeCaching`**: `handler: 'StaleWhileRevalidate'` (workbox build-config syntax) instead of serwist v9 strategy instances — type-incompatible with serwist's runtime types; at runtime every SW-matched fetch failed with `net::ERR_FAILED`, breaking all API and image requests platform-wide.
3. **Destructuring nonexistent context fields**: `Navbar` destructured `cartItemCount`/`wishlistCount` from `CartContextType`/`WishlistContextType`, which expose no such fields — the values were always `undefined`, so the header cart and wishlist badges never rendered. Fixed by computing counts from `state.items.reduce(...)` and `wishlistItems.length` (commit 7121049).

## Why this matters
The failure pattern is consistent: the code compiles, deploys, and fails only at runtime in production — in two of the three cases inside a service worker, where errors are especially hard to observe (no page-level stack trace; symptoms appear as failed network requests or silently missing UI). Each bug was found by reading prod console output or live-verifying deployed builds, not by CI. The hazard compounds with the fact that the service worker exists only in production builds, so dev sessions can never reproduce SW-class failures.

## Mitigation direction
Until `ignoreBuildErrors` can be turned off (which requires paying down the existing type-error backlog), treat any runtime `undefined`-shaped failure in prod as potentially type-detectable, and live-verify deployed builds rather than trusting a green `next build`.

**Update 2026-06-10 (evening)**: the type-error backlog was paid down during the frontend completeness sweep — `tsc` went from 252 errors to 0, and the session's quality gate now requires tsc 0 / lint 0 / vitest green ([[sources/2026-06-10-frontend-completeness-audit]]). Whether `ignoreBuildErrors` itself has been flipped to `false` in `next.config` was not recorded; until confirmed, the hazard stands.

## See also
- [[concepts/serwist-service-worker-pitfalls]] — bugs 1 and 2 in detail
- [[concepts/storefront-home-marketplace-overhaul]] — bug 3 (navbar badges) fixed during the overhaul
- [[sources/2026-06-10-prod-console-errors-images-sw]]
- [[sources/2026-06-10-home-marketplace-overhaul]]
- [[sources/2026-06-10-frontend-completeness-audit]]
