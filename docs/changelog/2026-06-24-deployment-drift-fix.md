# Deployment Drift Fix — 2026-06-24

Status: ✅ DEPLOYED. Server backend (`/var/local/beldify-monorepo`) on `main` at `d53921a`.

## The Bug: Server Running Wrong Branch

**Root cause:** The production server (`MyContabo`) was pinned to the auto-improve bot branch (`hermes/auto-improve/2026-06-23`) instead of `main`. Multiple committed fixes never reached production because:

1. The deploy target checked out the auto-improve branch, not `main`
2. The auto-improve CI writes to its own detached branch — no rebase onto `main` before deploy
3. No post-deploy step merges auto-improve back to `main`

**Impact:** At least 4 committed fixes were undelivered, including P0 storefront rendering failures and a P1 null-safety 404 fix.

## Fix Applied

### 1. Committed Pending Local Changes

**Backend** (`390fe07f` — 7 files):

| File | Change |
|------|--------|
| `app/Http/Controllers/API/ShopController.php` | `getProducts()` rewritten → delegates to `ProductController@index` with `store_id` filter |
| `app/Http/Controllers/Admin/CustomerController.php` | ERP scoping removed — admin sees all customers |
| `routes/api.php` | Route handler renamed `products`→`getProducts` + numeric `where('storeId','[0-9]+')` |
| `tests/Feature/ShopApiTest.php` | Tests updated for stock-based catalog via `ProductController@index` |
| `composer.json` + lock | PHP platform pinned to 8.3.30 |
| `resources/lang/{ar,en,ma}/tailoring.php` | +114 lines "Made in Morocco" landing page copy |

**Frontend** (`d53921a` — 9 files):

| File | Change |
|------|--------|
| `src/i18n/locales/{ar,de,en,es,fr,ma,nl}.json` | `compare.*` key block added to all 7 locales |
| `package-lock.json` | Lockfile update |
| `public/sw.js` | Service worker update |

### 2. Server Backend → `main` (executed via `server-fix.js`)

| Step | Status |
|------|--------|
| `/var/local/beldify-monorepo` → checkout `main` (`d53921a`) | ✅ Done |
| Docker containers (`beldify-backend`, `beldify-nginx-backend`) restart | ✅ Done |
| `php artisan migrate --force` | ✅ Up to date |
| Caches cleared (view, route, config, app) + re-cached | ✅ Done |
| `/var/local/beldify-backend-auto` → checkout `main` + pull + migrate | ✅ Done |

### 3. Server State After Fix

| Service | Status | Port |
|---------|--------|------|
| Frontend (`beldify-auto-frontend-1`) | ✅ Up, HTTP 200 | 4987 → 3001 |
| Backend app (`beldify-backend`) | ✅ Up (restarted) | 9000 (fpm) |
| Nginx (`beldify-nginx-backend`) | ✅ Up (restarted) | 7894 → 80 |
| MySQL | ✅ Healthy | 3307 |
| Redis | ✅ Running | 6381 |

## Verification

| Check | Result |
|-------|--------|
| Frontend lint (`npm run lint`) | ✅ 0 errors/warnings |
| Backend fix-specific tests (ShopApiTest) | ✅ 3/3 passed |
| Other backend tests (14 failures) | ⚠️ Pre-existing — SQLite schema mismatch, AI gate 403, route 404s. NOT caused by this fix. |
| Frontend dev build (`npm run build:dev`) | ✅ Succeeds, all pages including `/compare` compiled |
| Server monorepo branch | ✅ `main` (d53921a) |

## Remaining Items

- **Frontend container production rebuild** — the worktree at `/var/local/beldify-auto/` was pruned during `git worktree remove`. Run:
  ```bash
  cd /var/local/beldify-monorepo && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
  ```
- **Auto-improve deploy pipeline** — update the bot to rebase onto `main` before generating PRs, rather than working on a detached branch. See `specs/016-deployment-drift-fix/` for the full spec.

## Key Files

| File | Purpose |
|------|---------|
| `specs/016-deployment-drift-fix/spec.md` | Bug spec |
| `specs/016-deployment-drift-fix/plan.md` | Fix plan |
| `specs/016-deployment-drift-fix/tasks.md` | Task checklist |
| `specs/016-deployment-drift-fix/server-fix.js` | Server ops script |
| `docs/changelog/2026-06-24-deployment-drift-fix.md` | This changelog entry |
| `ai-knowledge-base/raw/panel/2026-06-24-deployment-drift.md` | Panel analysis artifact |

## Related

- [Overnight Deploy Runbook (2026-06-10)](2026-06-10-overnight-deploy-runbook.md) — previous deploy with rsync gotchas
