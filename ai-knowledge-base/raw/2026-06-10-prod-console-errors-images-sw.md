# Prod console errors fixed: category image 400s + sw.js evaluation failure — 2026-06-10 morning

Two user-visible failures on www.beldify.com homepage, diagnosed and fixed ~06:45–07:10.

## Issue 1 — category images 400 via /_next/image (TWO stacked causes)

Console: `GET https://www.beldify.com/_next/image?url=http%3A%2F%2F91.230.110.187%3A7894%2Fstorage%2Fcategories%2F... 400 (Bad Request)` for all category images.

**Cause A — `public/storage` symlink wiped on prod.** The overnight backend rsync (deploy #1 didn't use `--keep-dirlinks`) deleted the `public/storage` → `storage/app/public` symlink. All 19 category image files were intact; nginx just had nothing to serve. Even a correct URL 404'd.
Fix: `docker exec beldify-backend php artisan storage:link`. **Post-rsync checklist now includes:** `ls -ld /var/www/html/public/storage || php artisan storage:link` (alongside the storage/logs perms recheck).

**Cause B — API emitted raw-IP media URLs.** `CategoryController::getStorageUrl()` → `Storage::disk('public')->url()` → `filesystems.php` public disk: `'url' => env('ASSET_URL', env('APP_URL')).'/storage'`. Prod has `APP_URL=http://91.230.110.187:7894` (internal origin) and no ASSET_URL → raw-IP URLs → next/image remotePatterns (pro/api/www.beldify.com, unsplash, contabostorage) rightly rejected them with 400.
Fix: appended `ASSET_URL=https://pro.beldify.com` to prod `beldify-backend/.env` (backup `.env.bak-assetfix-*`), then `docker compose -f docker-compose.backend.yml up -d --force-recreate --no-deps app` (compose `env_file` is read at container CREATE; container ENV beats phpdotenv `.env`/`.env.production` loading), then `config:clear` + `cache:clear`.
Verified: `getAllCategories` returns `https://pro.beldify.com/storage/categories/...`; `/_next/image?url=https%3A%2F%2Fpro.beldify.com%2F...` → 200 image/jpeg.

**KB correction:** [[concepts/category-image-pipeline]] describes a `resolveCategoryImage()` helper hardcoding pro.beldify.com — that helper NO LONGER EXISTS in the backend. URL generation is now `Storage::disk('public')->url()` governed by `ASSET_URL`/`APP_URL`. `.env.example` documents ASSET_URL (backend commit 5926cd5b).

## Issue 2 — sw.js `s.defaultCache is not iterable` (SW registration dead)

Console: `sw.js:2 Uncaught TypeError: s.defaultCache is not iterable` + `Failed to register a ServiceWorker ... script evaluation failed`.

**Root cause (source bug, NOT build-mode):** `src/app/sw.ts` had `import { defaultCache, Serwist } from 'serwist'` — but `defaultCache` is exported by `@serwist/next/worker`, not core `serwist` (verified: `node -e` shows `'defaultCache' in require('serwist')` → false). The bundled `...s.defaultCache` spread of `undefined` threw during SW script evaluation. `typescript.ignoreBuildErrors: true` masked it at build time.

The prior KB/memory theory ("error = prod running next dev instead of next build") was WRONG for this instance — prod was already on the real production image (Dockerfile.prod, `next start`); the source import was the bug.

Fix: monorepo commit 1c88612 (`import { defaultCache } from '@serwist/next/worker'`). Verified locally via `npm run build:prod`: regenerated `public/sw.js` has 0 `defaultCache` refs and inlines next-data/next-image/static-image-assets caches; `node --check` passes. Deployed by rsyncing the single `sw.ts` to `/var/local/beldify-monorepo/beldify-frontend/` and rebuilding: `docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend` (per the compose file's canonical instructions; deps layer cached so build ≪ 8min).

## Ops notes

- `curl localhost:7894/api/...` from the server returns Laravel's 404 page (Host-header dependent routing) — always smoke-test API routes through the public domains.
- A probe of `https://api.beldify.com/storage/...` while it 404'd got cached by Cloudflare with `max-age=14400` — careful probing prod URLs through CF before fixes land; pro.beldify.com had a clean cache and was used instead.
- Concurrent-session note: another active session was committing to monorepo `main` simultaneously (translations merge, checkout TDZ fix); commits interleaved safely, no branch ops performed from this session.

Related: [[beldify-prod-deploy]], [[beldify-pwa-webpush]], [[beldify-contabo-storage-dead]], [[beldify-api-php-case-sensitivity]] (rsync-kills-symlinks family), [[concepts/nextjs-image-config]], [[concepts/category-image-pipeline]] (needs correction).
