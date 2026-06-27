# Tasks: Fix Deployment Drift

## [x] 1. Commit backend uncommitted changes
- [x] `ShopController.php` — `getProducts()` rewrite (390fe07f)
- [x] `CustomerController.php` — ERP scoping removed (390fe07f)
- [x] `routes/api.php` — route rename + constraint (390fe07f)
- [x] `composer.json` + lock — PHP 8.3.30 pin (390fe07f)
- [x] Locales — tailoring landing page (390fe07f)
- [x] `ShopApiTest.php` — updated tests (390fe07f)

## [x] 2. Commit frontend uncommitted changes
- [x] 7 locale files — `compare.*` keys (d53921a)
- [x] `package-lock.json` — lockfile update (d53921a)
- [x] `public/sw.js` — service worker (d53921a)

## [x] 3. Switch server backend to main
- [x] `/var/local/beldify-monorepo` — checked out `main` (d53921a)
- [x] Docker compose restarted (app + nginx)
- [x] Migrations up to date
- [x] All caches cleared and re-cached
- [x] `/var/local/beldify-backend-auto` — checked out `main` + pulled + migrated

## [ ] 4. Switch server frontend to main (partially done)
- [x] Frontend container `beldify-auto-frontend-1` still running, HTTP 200
- [ ] `/var/local/beldify-auto/` was removed by git worktree prune — needs rebuild
- [ ] Run production build: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend`

## [ ] 5. Fix deploy pipeline (auto-improve)
- [ ] Update auto-improve workflow to rebase onto `main` before PR generation

## [x] 6. Documentation (docs phase)
- [x] Changelog entry created: `docs/changelog/2026-06-24-deployment-drift-fix.md`
- [x] Panel artifact saved: `ai-knowledge-base/raw/panel/2026-06-24-deployment-drift.md`
- [x] Spec files updated with docs phase completion
