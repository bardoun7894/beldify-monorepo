---
name: Docker bind-mount over rebuild
description: "When source is bind-mounted into a container, the image only needs to be rebuilt for OS/composer/npm dependency changes — pure source-code edits arrive on container start via the volume mount"
type: concept
tags: [php, blade, artisan, docker, docker-compose, cloudflare, bind-mount, cache]
sources: [sources/sessions-2026-05-14-7f3c17d0]
created: "2026-05-21"
updated: "2026-05-21"
---
# Docker bind-mount over rebuild

## Summary
Beldify's `docker-compose.dev.yml` defines bind mounts that project the host source directory into the container's working directory (`./beldify-frontend:/app`, `./beldify-backend/src:/var/www/src`, etc.). Once a clean image is built with the OS layers, composer/npm dependencies, and PHP/Node configuration, **source-code edits do not require a rebuild** — they arrive in the container the next time it's started via the bind mount. Only changes to `package.json`, `composer.json`, `Dockerfile`, or system packages require a fresh image build.

## Why this matters
A `docker compose build --no-cache` on the Beldify backend takes 5–10 minutes (PHP extensions compile, composer install, npm install). On a server with intermittent BuildKit cache corruption, the rebuild can stall indefinitely with no visible progress (`Sl` sleeping subprocess, `layer sha256… was not found (corruption?)` daemon log). Stalled builds are expensive to detect — they look "in progress" but emit no output.

When debugging a stuck build, the question to ask is: **what actually changed?** If the changes are limited to PHP, Blade, JS, or TS source files, the rebuild was never needed in the first place.

## Workflow
After detecting a stalled or corrupted BuildKit build:

```bash
# Kill the stuck build process
sudo pkill -f 'docker (build|compose).*backend'

# Bring the container up from the existing image — source bind-mounts deliver fresh code
docker compose -f docker-compose.dev.yml up -d --no-build app
# OR if the container is already running:
docker compose -f docker-compose.dev.yml restart app
```

For Blade view edits that don't even need a container restart, the workflow is even shorter:

```bash
# Copy edited file directly into the running container's /var/www/
docker cp /var/local/beldify-monorepo/beldify-backend/resources/views/admin/foo.blade.php \
  beldify-backend:/var/www/resources/views/admin/foo.blade.php

# Clear Laravel's compiled-views cache
docker exec beldify-backend php artisan view:clear
```

## When rebuild IS required
- A new dependency is added to `composer.json` or `package.json`
- A change to `Dockerfile` or `docker-compose.*.yml`
- A new PHP extension is needed
- An OS package update
- The image's `node_modules` or `vendor/` directories are stale relative to the lockfile

## Trade-off
Skipping the rebuild keeps the OS/dependency layers from being refreshed. If the image is months old, security patches and upstream package versions drift. Periodic clean rebuilds (weekly or before release cycles) are still wise. But mid-development, the bind-mount shortcut saves significant time.

## Related Concepts
- [[concepts/docker-deployment]]
- [[concepts/cloudflare-caching-issue]]

## Sources
- [[sources/sessions-2026-05-14-7f3c17d0]]
