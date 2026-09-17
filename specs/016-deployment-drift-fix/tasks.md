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

## [x] 4. Switch server frontend to main (superseded, verified 2026-07-02)
- [x] `/var/local/beldify-auto/` container/worktree no longer exists on server — deploy strategy moved off the `beldify-auto` worktree entirely
- [x] Prod frontend now served by `beldify-monorepo-frontend-1` (checked out `main`, currently at `ada31a9`, 2026-06-29) via direct rsync deploy (see c9dc184/2c3fb5c fixes) — no separate build step needed, task is moot

## [ ] 5. Fix deploy pipeline (auto-improve) — no local hook found, external to this repo
- [ ] Update auto-improve workflow to rebase onto `main` before PR generation (workflow config not present in `beldify-backend/.github/workflows/` or this repo — likely lives in the external Hermes bot config; needs the bot's own repo/config to fix, out of scope for this codebase)

## [x] 6. Documentation (docs phase)
- [x] Changelog entry created: `docs/changelog/2026-06-24-deployment-drift-fix.md`
- [x] Panel artifact saved: `ai-knowledge-base/raw/panel/2026-06-24-deployment-drift.md`
- [x] Spec files updated with docs phase completion
