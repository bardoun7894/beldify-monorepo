# Plan: Fix Deployment Drift

## Phase 1: Commit local changes
- **Backend**: commit 7 modified files (ShopController, CustomerController, routes, composer, locales, tests)
- **Frontend**: commit locale `compare.*` keys + new compare page + lockfile + sw

## Phase 2: Switch server to main (backend)
- SSH → checkout main, pull, migrate, clear cache, restart fpm/octane

## Phase 3: Switch server to main (frontend)
- SSH → checkout main, pull, npm build, restart pm2/nginx

## Phase 4: Fix deploy pipeline
- Add deploy step that ensures auto-improve rebases onto main before PR

## Rollback
- `git stash` local changes if deploy breaks
- Server: `git reflog` to return to auto-improve branch
