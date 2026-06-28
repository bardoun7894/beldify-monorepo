# Research — Drift Detection System (T002)

## KB Prior Art

### prod-local-git-drift ([[concepts/prod-local-git-drift]])

CSS cache-buster bumps applied directly on prod without committing cause divergence.
Example: `head.blade.php` had `?v=14` on prod that was never in git.
**Fix pattern**: catch-up commits before every deploy.
**Prevention**: use `?v={{ config('app.version') }}` pattern.

### PHP Opcache Pitfall ([[concepts/php-opcache-deployment-pitfall]])

After syncing code, PHP-FPM opcache pins old autoload classmap.
**Fix**: `docker restart beldify-backend` is required.

### Serwist SW Pitfalls ([[concepts/serwist-service-worker-pitfalls]])

`sw.js` is a generated PWA file that frequently conflicts during sync.
**Fix**: Auto-resolve with `--theirs` during pull.

### Docker Deployment ([[concepts/docker-deployment]])

Standard pattern: `git pull` on server via SSH.
Submodules need explicit `git submodule update --remote --merge`.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | Python 3 (stdlib) | No pip dependencies; SSH via subprocess |
| Output | Table with status cols | Human-readable, parseable |
| Conflict resolve | `--theirs` for sw.js only | Generated PWA file; others abort |
| Submodule sync | `git submodule update --remote --merge` | Standard upstream merge |
| Container restart | `docker restart beldify-backend` | Resets PHP opcache |
| `--quick` | SHA-only | ~2s per repo |
| `--fix` | Pull + resolve + submodule + restart | Idempotent |

## File

`scripts/drift-check.py` in project root.
