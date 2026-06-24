# 2026-06-11 — Prod console errors fixed: SW beacon no-response + unsplash 404s

Continuation of [[2026-06-10-prod-console-errors-images-sw]] — both issues root-caused and shipped.

## Issue 1 — `sw.js` no-response on Cloudflare insights beacon

**Symptom:** `Uncaught (in promise) no-response :: [{"url":"https://static.cloudflareinsights.com/beacon.min.js/..."}]` + `net::ERR_FAILED` on every page load for clients that block the beacon (adblockers).

**Root cause:** `@serwist/next/worker`'s `defaultCache` ends with TWO catch-alls that `respondWith()` every remaining GET, third-party included:
1. `matcher: ({sameOrigin}) => !sameOrigin` → `NetworkFirst({cacheName: "cross-origin", networkTimeoutSeconds: 10})`
2. `matcher: /.*/i, method: GET` → `NetworkOnly()`

When the client blocks the request, the strategy's fetch rejects → serwist throws `no-response` → the page sees `net::ERR_FAILED` *from the SW* instead of the browser's quiet native `ERR_BLOCKED_BY_CLIENT`. Removing only the first is NOT enough — the `/.*/` NetworkOnly entry matches cross-origin too (regex matches at index 0).

**Fix (`beldify-frontend/src/app/sw.ts`, commit 05ad89e):**
```ts
const isCatchAll = (entry: RuntimeCaching): boolean =>
  (entry.handler as { cacheName?: string }).cacheName === 'cross-origin' ||
  (entry.matcher instanceof RegExp && entry.matcher.source === '.*');
const scopedDefaultCache = defaultCache.filter((entry) => !isCatchAll(entry));
// ...runtimeCaching: [...customEntries, ...scopedDefaultCache]
```
Also scoped the images runtime cache to `sameOrigin && request.destination === 'image'` so blocked third-party images can't reproduce the same noise. Unmatched requests now bypass the SW entirely (no route match → no respondWith → native browser handling).

**Deploy:** scp single `sw.ts` to live tree `/var/local/beldify-monorepo/beldify-frontend/src/app/` (server base md5-verified == git HEAD first), then `docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend`. Avoids `sync-and-run.sh` full rsync, which would have dragged unmerged branch work (feat/home-p2-cards-chips-souk @ 8f7dde6) onto prod.

## Issue 2 — `_next/image` 404s for unsplash product images

**Symptom:** home page `GET /_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1605518293438...&w=640` → 404.

**Root cause:** NOT code — `git log -S` across both repos found nothing. Prod DB seed/demo content: all 18 `product_images.image_path` rows are full unsplash URLs; 3 of those URLs are **fabricated photo IDs** that 404 upstream (`photo-1605518293438-7e8dbe2b8a3a`, `photo-1620331317084-2c46dc7e9c19`, `photo-1622519624810-c1f4f1a1a1a1`), shared by **8 stocks**: 3, 6, 7, 8, 9, 10, 11, 12. Next's optimizer proxies the upstream 404 through.

**Fix:** replaced per-stock with 8 distinct curl-verified-200 unsplash IDs via `docker exec -i beldify-backend php artisan tinker` UPDATE on `product_images` (each product now has its own image instead of sharing). API verified clean immediately; home HTML stayed stale (Next fetch cache embeds product JSON server-side) until the frontend rebuild flushed it.

Local Docker mirror checked: 0 unsplash rows in local `product_images` — different seed state, nothing to fix.

## Collateral fix — clobbered `next.config.js`

`npm run build:prod` = `cp next.config.js next.config.dev.bak && cp next.config.prod.js next.config.js && next build --no-lint; mv next.config.dev.bak next.config.js`. An interrupted build (21:47, prior session death) killed the shell before the `mv` → `next.config.js` left as a byte-identical copy of `next.config.prod.js` (SW enabled in dev, `allowedDevOrigins` gone — would have broken dev hot-reload through CF). Restored via `git checkout -- next.config.js`. **Lesson:** after any interrupted `build:prod`, diff `next.config.js` vs `next.config.prod.js` and look for a stranded `next.config.dev.bak`.

## Infra gotcha — SSH alias confusion

`~/.ssh/config` alias `frontend` → 31.220.95.90 is NOT the beldify prod box (port 22 there times out; only 443 open). Beldify prod = **MyContabo (91.230.110.187)**, live tree `/var/local/beldify-monorepo`, compose project `beldify-monorepo`, backend container `beldify-backend` (source of truth: `sync-and-run.sh`).

## Deploy epilogue — BuildKit COPY-layer cache false-hit (new gotcha)

First server rebuild (`compose up -d --build frontend`) produced a fresh-looking image (new tag, ~10 min build) whose `sw.js` was **compiled from the OLD sw.ts** — BuildKit reused a stale `COPY . .` layer from the 21:13 image build despite the changed file in the context (scp'd, mtime+size+md5 verified pre-build). Detection: `docker run --rm --entrypoint sh <image> -c 'grep -o cross-origin public/sw.js | wc -l'` — old code = 2 occurrences, fixed code = 3 (the `isCatchAll` literal). **Rule: after shipping a single-file change into an image build, verify a content marker INSIDE the image before recreating the container; if stale → `compose build --no-cache <svc>` then `up -d <svc>`.**

Second gotcha tonight: SSH sessions to MyContabo dropped repeatedly mid-command ("Connection reset by peer"). One drop killed compose between image-tag and container-recreate, leaving the container on the older image. **Rule: run server builds detached (`nohup ... > /tmp/log 2>&1 < /dev/null &`) and poll the log; never let a long build depend on the SSH session staying alive.**

Also: `Dockerfile.prod` line 15 is back to `npm ci || npm install` (memory said the fallback was removed — the 00:25 full rsync restored the repo version). Version-drift hazard to fix properly later. Builder runs plain `next build` against tree `next.config.js` (serwist active because NODE_ENV=production), NOT `npm run build:prod`.

## Verification evidence

- vitest: 145 files / 2331 tests passed (32s)
- `tsc --noEmit`: exit 0
- local `build:prod`: exit 0, regenerated `public/sw.js` (68496 bytes, committed with sw.ts)
- prod API post-update: dead IDs grep = 0 hits; `/_next/image?url=<new>` → 200 ×2
- prod DB re-SELECT after UPDATE: 8/8 rows show new URLs
