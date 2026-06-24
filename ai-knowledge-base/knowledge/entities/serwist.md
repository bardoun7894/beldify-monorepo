---
name: Serwist
description: Service-worker library (workbox successor) with a Next.js integration — powers the Beldify PWA service worker and web push delivery surface
type: entity
sources: [raw/2026-06-10-prod-console-errors-images-sw.md, raw/2026-06-10-home-marketplace-overhaul.md, raw/2026-06-11-prod-console-errors-fix.md]
created: 2026-06-10
updated: 2026-06-11
---

# Serwist

## What it is
Serwist is the actively maintained successor to Google's workbox for building service workers, with a first-class Next.js integration (`@serwist/next`). Beldify's installable PWA uses it: `src/app/sw.ts` is the service-worker source, compiled into `public/sw.js` during production builds.

## Key facts
- Beldify runs serwist **v9**, whose runtime API takes strategy **instances** (`new NetworkFirst({...})`, `new StaleWhileRevalidate({...})`) in `runtimeCaching` — string handler names are workbox build-config syntax and fail at fetch time when used with the runtime API.
- `defaultCache` is exported by `@serwist/next/worker`, **not** by the core `serwist` package — importing it from `'serwist'` yields `undefined` and kills SW script evaluation.
- The Beldify SW is generated only by production builds (`docker-compose.prod.yml` / `npm run build:prod`); `next dev` serves no SW, so SW-class bugs cannot reproduce locally in dev mode.
- Beldify's API runtime caching policy is NetworkFirst with `networkTimeoutSeconds: 6`, caching only 200 responses and excluding auth/csrf routes — fresh data on reload, cache as offline fallback.
- Verification habit after changing `sw.ts`: run `npm run build:prod`, check the regenerated `public/sw.js` content, and run `node --check public/sw.js`.
- Both 2026-06-10 serwist incidents shipped because `typescript.ignoreBuildErrors: true` suppressed the type errors that would have flagged the wrong import and the wrong handler shapes at build time — serwist bugs in this codebase surface only in production console output, never in CI or dev.
- `defaultCache` (from `@serwist/next/worker`) ends with two catch-all routes — `!sameOrigin` → NetworkFirst `"cross-origin"` and `/.*/` → NetworkOnly — that respond to EVERY remaining GET including third-party analytics; Beldify filters both out before spreading (commit 05ad89e) so unmatched requests bypass the SW. See [[concepts/serwist-service-worker-pitfalls]] Pitfall 3.

## See also
- [[concepts/serwist-service-worker-pitfalls]]
- [[entities/nextjs]]
- [[sources/2026-06-10-prod-console-errors-images-sw]]
- [[sources/2026-06-10-home-marketplace-overhaul]]
- [[sources/2026-06-11-prod-console-errors-fix]]
