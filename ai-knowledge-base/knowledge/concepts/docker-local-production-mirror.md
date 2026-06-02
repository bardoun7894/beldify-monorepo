---
name: Docker Local Production Mirror
description: Multi-step pattern for replicating the Beldify Contabo production server to a local Docker stack — server tarball + mysqldump + named volume — enabling fast local iteration without touching prod
type: concept
sources: [daily/2026-05-29.md]
created: 2026-05-29
updated: 2026-05-29
---

# Docker Local Production Mirror

## Overview
When the production server (Contabo) has diverged from the local development tree — due to direct-on-prod fixes, migration drift, or seeding state — the fastest way to reproduce and debug is to create an exact local mirror. The mirror pulls the live codebase via SSH tarball, imports a live database snapshot, and runs the complete stack locally under `docker-compose.local.yml`. The critical constraint is using a named Docker volume (not a macOS bind mount) to preserve Linux ext4 case-sensitivity.

## Key Points
- **Named volume, not bind mount**: macOS APFS is case-insensitive; a bind mount exposes this to the container, breaking Laravel translator and PSR-4. Named volumes use Docker's internal ext4 — always case-sensitive. See [[concepts/macos-docker-case-sensitivity-pitfall]].
- **Separate compose file**: `docker-compose.local.yml` uses `beldify-local-*` container names and offset ports (`7895:80`, `3307:3306`, `6381:6379`) so it coexists with the existing `beldify-nginx`/`beldify-app` development stack without collision.
- **DB import via mysqldump**: Production database is dumped with `mysqldump`, copied via scp, and imported into the local container's MySQL. Database state is production-accurate including seeded records, roles, and feature flags.
- **No hot-reload**: Because the code lives in a named volume, edits from the Mac must be pushed with `docker cp`. This is a trade-off accepted during debug sessions; active feature development uses the normal bind-mount dev stack.
- **Opcache caveat**: After copying files into the container, PHP-FPM opcache holds compiled versions. Trigger reset with `docker exec beldify-local-app php -r "opcache_reset();"` or `docker-compose -f docker-compose.local.yml up -d --force-recreate`.

## Details

### docker-compose.local.yml structure
```yaml
version: "3.8"

volumes:
  beldify_local_code:
    external: true   # pre-populated from server tarball

services:
  beldify-local-nginx:
    image: nginx:alpine
    container_name: beldify-local-nginx
    ports:
      - "7895:80"
    volumes:
      - beldify_local_code:/var/www/html:ro
      - ./nginx/local.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - beldify-local-app

  beldify-local-app:
    image: php:8.2-fpm
    container_name: beldify-local-app
    volumes:
      - beldify_local_code:/var/www/html
    env_file:
      - beldify-backend/.env.local   # DB_HOST=beldify-local-mysql, etc.
    depends_on:
      - beldify-local-mysql
      - beldify-local-redis

  beldify-local-mysql:
    image: mysql:8.0
    container_name: beldify-local-mysql
    ports:
      - "3307:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: beldify
    volumes:
      - beldify_local_db:/var/lib/mysql

  beldify-local-redis:
    image: redis:7-alpine
    container_name: beldify-local-redis
    ports:
      - "6381:6379"

volumes:
  beldify_local_db:
```

### Step-by-step mirror procedure

**Step 1 — Snapshot production code**
```bash
# On Contabo server
ssh root@contabo
tar czf /tmp/beldify-backend.tar.gz \
    --exclude='.git' \
    --exclude='storage/logs' \
    -C /var/www/html .
```

**Step 2 — Pull down tarball**
```bash
# On macOS
scp root@contabo:/tmp/beldify-backend.tar.gz /tmp/
```

**Step 3 — Populate named volume**
```bash
docker volume create beldify_local_code
docker run --rm \
  -v beldify_local_code:/dest \
  -v /tmp/beldify-backend.tar.gz:/src.tar.gz \
  alpine sh -c "tar xzf /src.tar.gz -C /dest"
```

**Step 4 — Dump production database**
```bash
# On Contabo server
docker exec beldify-mysql mysqldump \
    -u root -p"$DB_PASSWORD" beldify > /tmp/beldify-prod.sql
scp root@contabo:/tmp/beldify-prod.sql /tmp/
```

**Step 5 — Start the local stack**
```bash
docker-compose -f docker-compose.local.yml up -d
```

**Step 6 — Import database**
```bash
docker exec -i beldify-local-mysql \
    mysql -u root -proot beldify < /tmp/beldify-prod.sql
```

**Step 7 — Fix .env for local**
Inside the named volume the `.env` still points to Contabo. Patch for local:
```bash
docker exec beldify-local-app \
    sed -i \
      -e 's|DB_HOST=.*|DB_HOST=beldify-local-mysql|' \
      -e 's|REDIS_HOST=.*|REDIS_HOST=beldify-local-redis|' \
      -e 's|APP_URL=.*|APP_URL=http://localhost:7895|' \
      /var/www/html/.env
docker exec beldify-local-app php artisan config:clear
```

**Step 8 — Verify**
```bash
# Admin login
open http://localhost:7895/ar/admin/login

# Seller dashboard
open http://localhost:7895/ar/seller/dashboard
```

### Pushing code edits into the mirror
Since there is no bind mount, edits from macOS must be pushed explicitly:
```bash
# Single file
docker cp beldify-backend/app/Http/Controllers/Admin/CommunityController.php \
    beldify-local-app:/var/www/html/app/Http/Controllers/Admin/CommunityController.php

# After pushing PHP files, reset opcache
docker exec beldify-local-app php -r "opcache_reset();"

# After pushing lang files, also restart FPM opcache
docker-compose -f docker-compose.local.yml up -d --force-recreate beldify-local-app
```

### Applying fixes to both local mirror and canonical repo
A disciplined pattern emerged during the 2026-05-29 session: all fixes were applied to both (a) the local mirror via `docker cp` for immediate testing, and (b) the `beldify-backend` git repository as targeted edits. This avoids wholesale-overwriting the in-progress Atlas admin migration changes that exist in git but not on the production server.

## Related Concepts
- [[concepts/macos-docker-case-sensitivity-pitfall]] — Root cause requiring named volume; detailed explanation of what breaks with bind mount
- [[concepts/php-opcache-deployment-pitfall]] — Must reset opcache after pushing files into running container
- [[concepts/docker-env-file-recreation]] — env_file is frozen at container creation; `.env` edits need `--force-recreate`
- [[concepts/docker-deployment]] — Production Contabo Docker stack this mirrors

## Sources
- [[daily/2026-05-29.md]] — Local production mirror built during session; case-sensitivity root cause discovered and resolved; dual-apply pattern (mirror + git) established for all fixes in the session
