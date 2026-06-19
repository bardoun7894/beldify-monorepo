---
name: Prod console errors fixed — SW beacon noise + dead unsplash product images (2026-06-11)
description: Both 2026-06-10 prod console errors closed — serwist defaultCache catch-alls stripped (CF beacon no-response) and 8 product_images rows with fabricated unsplash IDs replaced in the prod DB; BuildKit stale-layer deploy caught by an in-image grep marker
type: source
sources: [raw/2026-06-11-prod-console-errors-fix.md]
created: 2026-06-11
updated: 2026-06-11
---

# Prod console errors fixed — SW beacon noise + dead unsplash product images

## Summary
Session closing the two production console errors carried over from 2026-06-10: the service-worker `no-response` error on the Cloudflare insights beacon, and `_next/image` 404s for unsplash product images on the home page. The SW error came from `@serwist/next/worker` `defaultCache`'s two trailing catch-all routes responding to third-party requests; the image 404s were prod **database** content (fabricated unsplash photo IDs in `product_images.image_path`), not code. Both fixes were deployed and live-verified the same night; the deploy surfaced a BuildKit layer-cache hazard and recurring SSH drops to the prod host.

## Key points
- SW fix (commit 05ad89e): filter the `!sameOrigin`→NetworkFirst("cross-origin") and `/.*/`→NetworkOnly catch-alls out of `defaultCache` before spreading, and scope the images runtime cache to `sameOrigin` — unmatched requests bypass the SW so client-blocked beacons fail natively and quietly.
- Image fix: 3 fabricated unsplash photo IDs (404 upstream) shared across 8 stocks (3, 6, 7, 8, 9, 10, 11, 12) in `product_images.image_path`; replaced per-stock with 8 distinct curl-verified-200 unsplash URLs via `docker exec -i beldify-backend php artisan tinker`. `git log -S` proved the IDs never existed in either repo.
- Home HTML kept embedding the dead URLs after the API was clean — Next.js server-side fetch cache; flushed by the frontend container rebuild.
- First rebuild shipped a "fresh" image compiled from the OLD sw.ts — BuildKit `COPY . .` layer cache false-hit; detected by grepping a content marker inside the image (`cross-origin` ×2 = old, ×3 = fixed); resolved with `compose build --no-cache frontend`.
- Interrupted `npm run build:prod` leaves `next.config.js` clobbered with the prod config (the `mv` restore never runs if the shell dies mid-build) — restored from git HEAD.
- SSH alias `frontend` (31.220.95.90) is not the beldify host; deploys go to MyContabo (91.230.110.187), live tree `/var/local/beldify-monorepo`. SSH sessions dropped repeatedly — server builds must run `nohup`-detached.
- Verification: vitest 2331/2331 (145 files), `tsc --noEmit` clean, served `sw.js` md5 == image artifact md5, home/products 200, zero dead image refs in home HTML.

## See also
- [[concepts/serwist-service-worker-pitfalls]]
- [[concepts/docker-buildkit-copy-layer-cache-hazard]]
- [[concepts/typescript-ignore-build-errors-hazard]]
- [[entities/serwist]]
- [[entities/beldify]]
- [[sources/2026-06-10-prod-console-errors-images-sw]]
