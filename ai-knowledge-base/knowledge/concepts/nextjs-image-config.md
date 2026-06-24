---
name: Next.js Image Hostname Whitelist
description: Configuring allowed remote hostnames for next/image to prevent broken product and category images
type: concept
sources: [daily/2026-05-14.md]
created: 2026-05-15
updated: 2026-05-15
---

# Next.js Image Hostname Whitelist

## Overview
Next.js's `next/image` component validates that image `src` URLs come from a pre-approved list of hostnames defined in `next.config.js`. Any hostname not on the list causes the image optimizer to reject the request with an error, breaking the image on the frontend. The Beldify frontend experienced this when category and product images were served from `api.beldify.com` and `images.unsplash.com`.

## Key Points
- Whitelist is set under `images.remotePatterns` (or older `images.domains`) in `next.config.js`
- Hostnames added for Beldify: `api.beldify.com`, `www.beldify.com`, `images.unsplash.com`, `pro.beldify.com`
- The `/categories` page errored in production because `api.beldify.com` was not yet in the whitelist
- Newly added hostnames require a Next.js rebuild/restart to take effect — they are baked at build time in dev mode's webpack cache
- The permanent solution was to have the API return `pro.beldify.com` URLs (already whitelisted) instead of `api.beldify.com` URLs, avoiding whitelist complexity

## Details
On 2026-05-14, the `/categories` page threw a runtime error because category images were served from `api.beldify.com`, which was not in `next.config.js`'s `remotePatterns`. The fix required two steps:

1. **`next.config.js`** — added `api.beldify.com`, `www.beldify.com`, and `images.unsplash.com` to the whitelist
2. **Container restart** — the webpack cache needed to be invalidated for the new whitelist to propagate

Even after adding the hostname and restarting the container, the `/` homepage still errored on category images because Next.js dev server's webpack persistent cache had the old `next/image` allowed-hostname validation baked in from an earlier compile. Partial `rm -rf .next` didn't flush all lazily-recompiled chunks.

The workaround that definitively resolved it: change the **API response** to return `https://pro.beldify.com/storage/...` URLs instead of `https://api.beldify.com/storage/...`. Since `pro.beldify.com` was already in the whitelist before this session, it loaded reliably without requiring any cache invalidation.

### Modified files
- `next.config.js` — expanded `remotePatterns`
- `app/Http/Controllers/API/CategoryController.php` — `resolveCategoryImage()` helper now returns `pro.beldify.com` URLs for local-storage paths
- `app/Http/Controllers/API/BestSellersController.php` — same `pro.beldify.com` pattern for product images

## Related Concepts
- [[concepts/cloudflare-caching-issue]] — Complementary caching problem that blocked the whitelist fix from reaching visitors even after correct config
- [[concepts/docker-deployment]] — Container restart needed to apply whitelist changes
- [[concepts/atlas-design-system]] — Design context under which category images were added
- [[entities/nextjs]] — Framework enforcing the hostname whitelist

## Sources
- [[daily/2026-05-14.md]] — Whitelist errors surfaced; both config and API-response fixes applied; `pro.beldify.com` workaround confirmed working
