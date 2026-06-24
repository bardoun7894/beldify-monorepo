---
name: Docker env_file Recreation Requirement
description: Docker reads env_file only at container creation — .env changes require --force-recreate, not docker restart, to take effect
type: concept
sources: [daily/2026-05-23.md]
created: 2026-05-23
updated: 2026-05-23
---

# Docker env_file Recreation Requirement

## Overview
When a `docker-compose.yml` service uses `env_file: - .env`, Docker reads that file exactly once — at container creation time. Any subsequent changes to the `.env` file on the host are invisible to the running container until it is recreated. `docker restart` and `docker compose restart` do NOT re-read `env_file`; they only restart the process inside the existing container. The container's environment was frozen when it was first created.

## Key Points
- `env_file` is evaluated at `docker compose up` / `docker run` time and baked into the container's environment namespace
- `docker restart <container>` restarts the main process (PID 1) but does not touch the container's environment
- `docker compose restart <service>` has the same limitation — same container, same frozen env
- `docker compose up -d --force-recreate <service>` destroys and re-creates the container, re-reading `env_file` from disk
- This affects ANY env var: `APP_DEBUG`, `APP_URL`, `APP_KEY`, `DB_HOST`, `LOG_LEVEL`, etc.

## Details
In the 2026-05-23 session, `APP_DEBUG=false` was set in the running container's environment even though the `.env` file on disk read `APP_DEBUG=true`. The `.env` had been modified with `sed` (or `docker cp`) after the container was started. `docker restart beldify-backend` applied the process-level restart but did not expose the debug exception pages, because the container still had `APP_DEBUG=false` from its creation env snapshot.

Only after running `docker compose up -d --force-recreate app` did the container pick up `APP_DEBUG=true` and begin showing the debug stack traces needed for diagnosis.

### Verification
```bash
# Check what value the RUNNING container actually sees — not what's on disk
docker exec beldify-backend printenv APP_DEBUG
# If this differs from your .env file, the container needs --force-recreate

# Check all env vars the container has
docker exec beldify-backend printenv | sort
```

### When to use --force-recreate vs restart

| Change type | Command needed |
|-------------|---------------|
| `.env` variable added or changed | `docker compose up -d --force-recreate <service>` |
| Source code changed (bind-mounted) | `docker compose restart <service>` or bind-mount delivers immediately |
| `composer.json` / `package.json` changed | `docker compose build && docker compose up -d --force-recreate` |
| `Dockerfile` changed | `docker compose build --no-cache && docker compose up -d --force-recreate` |
| Opcache stale after `composer dump-autoload` | `docker compose up -d --force-recreate <service>` |

### Gotcha: mid-debugging env changes
When toggling `APP_DEBUG=true` for diagnosis and back to `false` for production, always `--force-recreate` both times. A `docker restart` may appear to work (the process stops and starts) but the env var is unchanged, making subsequent debug output invisible.

### Compound with opcache
`--force-recreate` solves both the env-freeze problem and the opcache problem simultaneously (see [[concepts/php-opcache-deployment-pitfall]]). When a deploy goes wrong and you're unsure which layer is stale, `--force-recreate` is the single command that resets both.

## Related Concepts
- [[concepts/php-opcache-deployment-pitfall]] — Sibling pitfall resolved by the same `--force-recreate` command
- [[concepts/docker-deployment]] — Broader container management context for Beldify on MyContabo
- [[concepts/admin-asset-url-misconfiguration]] — A case where the wrong `APP_URL` was set in `.env` and a container recreate was needed to propagate the fix

## Sources
- [[daily/2026-05-23.md]] — `APP_DEBUG=true` in `.env` not visible in container until `--force-recreate`; traced during the persistent 500 debugging session
