---
name: Docker Production Deployment
description: Docker Compose setup and container management patterns for Beldify on MyContabo
type: concept
tags: [laravel, php, artisan, nextjs, html, state, effect, docker, docker-compose, nginx]
sources: [daily/2026-05-14.md, daily/2026-05-21.md]
created: "2026-05-15"
updated: "2026-05-21"
---
# Docker Production Deployment

## Overview
Beldify production runs on a MyContabo VPS with two separate Docker Compose projects: `docker-compose.dev.yml` (frontend) and a backend compose file (backend + MySQL + Redis). Containers are managed via SSH from the developer's Mac. The frontend uses `next dev` in development mode with bind-mounted source files for hot reload.

## Key Points
- Two compose projects: `docker-compose.dev.yml` (frontend only) and `docker-compose.yml` (backend + MySQL + Redis)
- Frontend container: `beldify-frontend`, host port `3001 → container 3000`
- Backend container: `beldify-backend`, host port `8002 → nginx → PHP-FPM`
- MySQL container: `beldify-mysql`, host port `5432`
- SSH alias: `MyContabo` (configured in `~/.ssh/config`)
- Bind-mount path on host: `/var/local/beldify-monorepo/`
- Backups saved to: `/var/local/beldify-monorepo/backups/`

## Details
The frontend runs `next dev` (development server) rather than a production build. This has the benefit of HMR (hot module replacement) for rapid iteration, but introduces a complication: Next.js persists a webpack cache in `.next/cache/` that survives container restarts via the bind mount. When source files change but the cache stales, the running app may serve old chunks.

The correct rebuild sequence for the frontend:
```bash
# On MyContabo
cd /var/local/beldify-monorepo
docker compose -f docker-compose.dev.yml down frontend
rm -rf beldify-frontend/.next          # wipe webpack cache from bind mount
docker compose -f docker-compose.dev.yml build --no-cache frontend
docker compose -f docker-compose.dev.yml up -d frontend
```

For backend-only changes (PHP), `docker cp` the changed file directly into the running `beldify-backend` container — no rebuild needed:
```bash
docker cp local/path/file.php beldify-backend:/var/www/html/path/file.php
docker exec beldify-backend php artisan cache:clear
```

### Port conflicts observed
`uptime-kuma` was previously running on host port `3001`, conflicting with `beldify-frontend`. Resolution: restart `uptime-kuma` without a published host port (internal network only) or move it to a non-conflicting port (`3031`).

### Storage permissions
The `/var/www/html/storage/` directory inside `beldify-backend` is bind-mounted from the host, which was owned by UID 501 (macOS developer user). This caused `permission denied` errors from PHP-FPM (running as `www-data`). Fix:
```bash
docker exec -u root beldify-backend chown -R www-data:www-data /var/www/html/storage
docker exec -u root beldify-backend chmod -R 775 /var/www/html/storage
```

## Related Concepts
- [[concepts/production-db-reset]] — Database operations executed inside Docker containers
- [[concepts/cloudflare-caching-issue]] — CF caching that layered on top of container-level correctness
- [[concepts/nextjs-image-config]] — next/image whitelist that required container restart to take effect
- [[entities/laravel]] — Backend application running inside `beldify-backend`
- [[entities/mysql]] — Database container in the stack

### OOM kill recovery (2026-05-21)
Both backend + MySQL + Redis containers exited with code 137 (OOM kill) after approximately 6 days of uptime. Recovery procedure:

```bash
# On MyContabo — bring up full backend stack after OOM kill
cd /var/local/beldify-monorepo
docker compose -f docker-compose.yml up -d
# MySQL healthcheck takes ~30s; backend starts once MySQL is healthy

# Run migrations after recovery
docker exec beldify-backend php artisan migrate --force

# Run seeders if needed
docker exec beldify-backend php artisan db:seed --class=DatabaseSeeder --force
```

The named volume `beldify_mysql_data` survives container exits — all database data is preserved across OOM kills as long as the volume is not explicitly removed.

### Nginx reverse proxy for pro.beldify.com
Cloudflare routes `pro.beldify.com` to the MyContabo server on port 80. Nginx on the host (`/etc/nginx/sites-enabled/pro.beldify.com.conf`) proxies to `127.0.0.1:7894` which is the `beldify-backend` container's host port. The 502 "origin unreachable" error from Cloudflare means either:
1. The `beldify-backend` container is not running (most common — OOM kill)
2. Docker's network bridge hasn't been connected

The backend container port mapping is `7894:8080` (host:container). Verify with:
```bash
curl -I http://127.0.0.1:7894/api/health
# Should return HTTP/1.1 200 if container is up and routing works
```

### Container name conflicts after OOM
After OOM kill, old containers may exist in `Exited` state. `docker compose up -d` will fail with "name already in use" until stale containers are removed:
```bash
docker rm beldify-backend beldify-mysql beldify-redis
docker compose -f docker-compose.yml up -d
```

## Sources
- [[daily/2026-05-14.md]] — Full container lifecycle observed; port conflicts; storage permissions; rebuild sequence documented
- [[daily/2026-05-21.md]] — OOM kill recovery; nginx reverse proxy topology confirmed; container name conflict on restart
