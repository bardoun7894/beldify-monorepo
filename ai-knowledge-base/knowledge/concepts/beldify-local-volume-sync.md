---
name: Beldify Local Named-Volume Sync Pattern
description: The local Docker stack at :7895 serves code from a named volume (beldify_local_code), not a bind mount — host edits require explicit sync via sync-local.sh + opcache-aware restart to appear
type: concept
sources: [daily/2026-05-31.md, daily/2026-06-01.md, daily/2026-06-02.md]
created: 2026-05-31
updated: 2026-06-02
---

# Beldify Local Named-Volume Sync Pattern

## Overview
The Beldify local development stack (running at `http://localhost:7895`) uses a named Docker volume `beldify_local_code` mounted over `/var/www/html` inside the container. Unlike a bind mount, this volume is an isolated copy of the code that does NOT automatically reflect host file system changes. Every code edit must be explicitly synced into the volume using `sync-local.sh`. Additionally, PHP-FPM opcache (for PHP files including lang files) and Laravel's compiled Blade cache (for `.blade.php` files) must be invalidated separately.

## Key Points
- **Named volume ≠ bind mount**: edits to `beldify-backend/resources/views/*.blade.php` on the host do NOT appear in the container until synced — the container has its own isolated copy
- **`sync-local.sh`** is the canonical sync tool: it copies changed views + lang files into the volume via `docker cp`, rebuilds `public/css/tailwind.css` via the Tailwind CLI, and clears Laravel view/config/route caches
- **Opcache for PHP files**: even after `sync-local.sh`, PHP lang files (e.g. `ar/messages.php`) may not resolve until the PHP-FPM container is restarted (`docker restart beldify-local-app`) — opcache holds the old compiled version in shared memory
- **When stack is down**: if containers are stopped (e.g. MySQL OOM-killed), `sync-local.sh` fails because it uses `docker cp` into a running container. Fix: bring the stack back up first with `docker compose -f docker-compose.local.yml up -d --build`, then sync
- **Tailwind rebuild**: new `tw-*` utility classes added to Blade templates will be invisible until `sync-local.sh` runs (it rebuilds `tailwind.css` via the Tailwind CLI scanning all Blade files)

## Details

### Why named volume instead of bind mount
On macOS, APFS is case-insensitive. A bind mount exposes this case-insensitivity to the container, breaking Laravel translator group lookups and PSR-4 autoloading. Named volumes use Docker's internal ext4 filesystem, which is always case-sensitive. See [[concepts/macos-docker-case-sensitivity-pitfall]] for full details.

### sync-local.sh workflow
```bash
bash sync-local.sh
# → docker cp views/lang/CSS into beldify_local_code volume
# → Tailwind CLI rebuild → public/css/tailwind.css
# → docker exec ... php artisan view:clear
# → docker exec ... php artisan config:clear
# → docker exec ... php artisan route:clear
```

After running `sync-local.sh`, PHP files (controllers, models, lang files) still need the FPM opcache cleared:
```bash
docker restart beldify-local-app
# or: docker exec beldify-local-app php -r "opcache_reset();"
```

### The invisible-styles trap (2026-05-31)
New `tw-bg-indigo-*` classes were added to Blade templates during the Atlas admin migration. The compiled `tailwind.css` was built months earlier, before any admin view used indigo-specific utilities. So `tw-bg-indigo-700` computed to `transparent` in the browser — the class string existed in HTML but its CSS rule was absent from the stylesheet. Running `sync-local.sh` (which includes the Tailwind rebuild) added 1.4KB of new utilities and resolved all blank/unstyled elements.

### The lang-file opcache trap (2026-05-31)
`ar/messages.php` was synced with `active_products => 'المنتجات النشطة'` but the dashboard still rendered "ACTIVE PRODUCTS" in English. Root cause: `validate_timestamps = On` is set but `docker cp` can backdate file mtime, causing opcache to believe the file hasn't changed. Solution: `docker restart beldify-local-app` (full FPM restart, always flushes opcache). After restart, all lang keys resolved correctly.

### Stack recovery after OOM kill
MySQL is the most likely container to OOM-kill (exit code 137). When it goes down, the dependent containers (app, nginx) also stop. Recovery:
```bash
docker compose -f docker-compose.local.yml up -d --build
# Wait for MySQL health check (~30s)
bash sync-local.sh
```
The named volumes `beldify_local_code` and `beldify_local_db` persist across OOM kills.

### PHP and route file sync gap (2026-06-01)
`sync-local.sh` only syncs `resources/` (views, lang files, frontend assets). It does **NOT** copy `app/` (controllers, models, middleware) or `routes/` (PHP route files). Changes to these directories require an explicit `docker cp` followed by a container restart:

```bash
# After editing app/ or routes/ PHP files
docker cp beldify-backend/app/. beldify-local-app:/var/www/html/app/
docker cp beldify-backend/routes/. beldify-local-app:/var/www/html/routes/
docker restart beldify-local-app
```

This gap was hit repeatedly during the no-store gating work (new middleware class, updated Kernel.php, updated seller route group) — all three changes lived in `app/` or `routes/` and were invisible to the running container until `docker cp` + restart. A common symptom is that a freshly added middleware class throws `Target class [seller.store] does not exist` even after the Kernel is updated, because the container is serving the old `app/Http/Kernel.php`.

### Run sync-local.sh from monorepo root, not from beldify-backend/ (2026-06-02)

`sync-local.sh` uses relative paths that assume the current working directory is the **monorepo root** (`beldify/`). Running it from inside `beldify-backend/` will fail with "No such file or directory" — the paths it constructs (`beldify-backend/resources/...`) don't exist relative to that subdirectory.

```bash
# CORRECT — run from monorepo root
cd /path/to/beldify
bash sync-local.sh

# WRONG — fails silently or with path errors
cd beldify-backend
bash ../sync-local.sh   # still breaks if any path inside uses a relative anchor
```

Symptom: the container keeps serving the old view/lang content despite sync appearing to complete without error.

## Related Concepts
- [[concepts/macos-docker-case-sensitivity-pitfall]] — root cause requiring named volume over bind mount
- [[concepts/php-opcache-deployment-pitfall]] — opcache behavior that requires container restart for lang files
- [[concepts/docker-env-file-recreation]] — companion: env_file also frozen at container creation
- [[concepts/docker-local-production-mirror]] — broader context of the local mirror strategy

## Sources
- [[daily/2026-05-31.md]] — Sync pattern documented across multiple sessions; invisible-styles root cause traced to missing Tailwind rebuild; lang-file opcache restart required after sync; stack recovery after MySQL OOM kill
- [[daily/2026-06-01.md]] — Session 25023e79: sync-local.sh does not sync app/ or routes/; docker cp + restart required for new middleware and route changes
- [[daily/2026-06-02.md]] — sync-local.sh must be run from monorepo root, not from inside beldify-backend/; running from wrong directory gives "No such file or directory" and container keeps serving old view
