---
name: PHP Opcache Deployment Pitfall
description: PHP-FPM opcache pins the old autoload classmap in memory even after composer dump-autoload — container restart (not docker restart) required to flush
type: concept
tags: [php, request, state, docker, docker-compose, pattern, cache]
sources: [daily/2026-05-23.md]
created: "2026-05-23"
updated: "2026-05-23"
---
# PHP Opcache Deployment Pitfall

## Overview
`composer dump-autoload` writes a new classmap to disk, but the PHP-FPM workers running inside a container keep the old compiled classmap in opcache memory. Until the PHP-FPM process restarts, every request is served by code that can't find newly-mapped classes, producing `ReflectionException: Class not found` or `BadMethodCallException`. This is a silent, hard-to-diagnose failure because the files are correct on disk but wrong in the running process.

## Key Points
- `composer dump-autoload --optimize` writes `vendor/composer/autoload_classmap.php` to disk — it does NOT flush the running PHP-FPM process's opcache
- PHP-FPM workers cache compiled class definitions in opcache for the lifetime of the process; `docker restart` sends a SIGHUP which can preserve opcache depending on `opcache.save_comments` config
- The symptom looks identical to a case-sensitivity namespace mismatch: `ReflectionException: Class App\Http\Controllers\API\... not found`
- `docker compose up -d` (without `--force-recreate`) starts a NEW container from the existing image — opcache is always empty on a fresh container, so this pattern reliably flushes it
- `docker compose up -d --force-recreate <service>` forces container recreation even when no config changed — the most direct cure

## Details
During the 2026-05-23 session, the Beldify backend was exhibiting persistent 500 errors after a `composer dump-autoload` that fixed a PSR-4 namespace mismatch. The `dump-autoload` ran successfully, regenerating 40,919 classes with no skip warnings. The 500s continued because the PHP-FPM workers (running inside the `beldify-backend` container) still had the broken classmap compiled in opcache.

`docker restart beldify-backend` sends a SIGHUP to the supervisor or s6 process that manages php-fpm. Depending on how PHP-FPM was started, this may or may not flush opcache. In the Beldify container the restart path does NOT flush opcache.

### Reliable flush procedures

```bash
# Option 1: Force-recreate the container (always flushes opcache)
docker compose -f docker-compose.yml up -d --force-recreate app

# Option 2: Use docker restart (works IF php-fpm is PID 1 or gets SIGTERM)
docker restart beldify-backend

# Option 3: Send USR2 to php-fpm master process to gracefully restart workers
docker exec beldify-backend kill -USR2 $(docker exec beldify-backend cat /run/php-fpm.pid)

# Option 4: Clear opcache via php -r (no web request needed)
docker exec beldify-backend php -r "opcache_reset();"
```

Option 1 (`--force-recreate`) is the most reliable because it starts with a clean process state. Options 3 and 4 are faster (no container restart) but depend on PID availability and opcache being enabled in CLI mode respectively.

### Detection: how to tell if opcache is the culprit
If `composer dump-autoload` completed with "Generated optimized autoload files" and no PSR-4 skip lines, but the app still 500s with class-not-found errors, opcache is almost certainly the cause. Verify:

```bash
# Check what autoload path is actually in memory via a running request
docker exec beldify-backend php -r "var_dump(opcache_get_status()['opcache_enabled']);"
# true = opcache active; old compiled files may still be pinned
```

### The force-recreate requirement
The `env_file` directive in `docker-compose.yml` makes this worse: because env vars are baked in at container creation time, `docker restart` picks up neither new env vars nor a fresh opcache. `--force-recreate` is the single command that solves both simultaneously (see [[concepts/docker-env-file-recreation]]).

## Related Concepts
- [[concepts/docker-env-file-recreation]] — Companion pitfall: `.env` changes also require force-recreate, not restart
- [[concepts/docker-deployment]] — Container lifecycle context; the `beldify-backend` service
- [[concepts/missing-views-git-restore]] — The namespace mismatch that preceded this opcache issue; both were part of the same 500-error chain

## Sources
- [[daily/2026-05-23.md]] — 500 errors persisted after `composer dump-autoload`; root cause traced to opcache; force-recreate resolved it in the 2026-05-23 session
