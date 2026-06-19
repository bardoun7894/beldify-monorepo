---
name: Prod console errors fixed — category image 400s + sw.js evaluation failure
description: 2026-06-10 morning prod fixes — category images 400ing via /_next/image (wiped storage symlink + raw-IP ASSET_URL) and service-worker registration dead from a serwist defaultCache mis-import
type: source
sources: [raw/2026-06-10-prod-console-errors-images-sw.md]
created: 2026-06-10
updated: 2026-06-10
---

# Prod console errors fixed — category image 400s + sw.js evaluation failure

## Summary
Session log of two user-visible failures on the www.beldify.com homepage, diagnosed and fixed on the morning of 2026-06-10 (~06:45–07:10). Category images returned 400 through `/_next/image` due to two stacked causes (a wiped `public/storage` symlink and raw-IP media URLs emitted by the API), and the service worker failed to register because `defaultCache` was imported from the wrong serwist package. The document also records an explicit correction to prior KB content about how category image URLs are generated.

## Key points
- **Image cause A — symlink wiped**: an overnight backend rsync without `--keep-dirlinks` deleted the `public/storage` → `storage/app/public` symlink; all 19 category image files were intact but nginx had nothing to serve. Fix: `docker exec beldify-backend php artisan storage:link`. Post-rsync checklist now includes `ls -ld /var/www/html/public/storage || php artisan storage:link`.
- **Image cause B — raw-IP media URLs**: `CategoryController::getStorageUrl()` → `Storage::disk('public')->url()` → public disk `'url' => env('ASSET_URL', env('APP_URL')).'/storage'`. Prod had `APP_URL=http://91.230.110.187:7894` and no `ASSET_URL`, so the API emitted raw-IP URLs which `next/image` `remotePatterns` correctly rejected with 400.
- **Fix B**: appended `ASSET_URL=https://pro.beldify.com` to prod `.env` (backup kept), then `docker compose ... up -d --force-recreate --no-deps app` (compose `env_file` is read at container CREATE; container ENV beats phpdotenv loading), then `config:clear` + `cache:clear`. Verified: `getAllCategories` returns `https://pro.beldify.com/storage/categories/...` and `/_next/image` returns 200.
- **KB correction**: the `resolveCategoryImage()` helper that hardcoded `pro.beldify.com` NO LONGER EXISTS in the backend; URL generation is now `Storage::disk('public')->url()` governed by `ASSET_URL`/`APP_URL`. `.env.example` documents `ASSET_URL` (backend commit 5926cd5b).
- **SW root cause (source bug, NOT build-mode)**: `src/app/sw.ts` imported `defaultCache` from `'serwist'`, but it is exported by `'@serwist/next/worker'` (verified via `node -e`: `'defaultCache' in require('serwist')` → false). Spreading `undefined` threw `s.defaultCache is not iterable` during SW script evaluation; registration failed. Masked at build time by `typescript.ignoreBuildErrors: true`.
- **Prior theory corrected**: "sw.js error = prod running `next dev` instead of `next build`" was WRONG for this instance — prod was already on the real production image (Dockerfile.prod, `next start`).
- **SW fix**: monorepo commit 1c88612 (`import { defaultCache } from '@serwist/next/worker'`); verified via `npm run build:prod` (regenerated `public/sw.js` has 0 `defaultCache` refs, `node --check` passes); deployed by rsyncing `sw.ts` to the live tree and `docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend`.
- **Ops notes**: `curl localhost:7894/api/...` returns Laravel's 404 page without the right Host header — always smoke-test through public domains; a 404 probe of `https://api.beldify.com/storage/...` was cached by Cloudflare with `max-age=14400` — probe carefully before fixes land (pro.beldify.com had a clean cache); a concurrent session was committing to monorepo `main` simultaneously, commits interleaved safely.

## See also
- [[concepts/category-image-pipeline]]
- [[concepts/nextjs-image-config]]
- [[concepts/docker-env-file-recreation]]
- [[concepts/serwist-service-worker-pitfalls]]
- [[concepts/typescript-ignore-build-errors-hazard]]
- [[entities/serwist]]
- [[sources/2026-06-10-home-marketplace-overhaul]]
