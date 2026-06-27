---
name: macOS Docker Bind-Mount Case-Sensitivity Pitfall
description: "macOS APFS/HFS+ case-insensitive filesystem bleeds through Docker bind mounts, breaking Laravel translator group lookups, PSR-4 autoloading, and Blade view resolution — fix is a Linux named volume"
type: concept
tags: [laravel, php, blade, html, docker, volume, pattern, named-volume]
sources: [daily/2026-05-29.md]
created: "2026-05-29"
updated: "2026-05-29"
---
# macOS Docker Bind-Mount Case-Sensitivity Pitfall

## Overview
When a Docker container on macOS uses a **bind mount**, the container's filesystem is backed by the host's macOS APFS/HFS+ volume, which is case-insensitive by default. Files that differ only in case — e.g., `messages.php` and `Messages.php` — are treated as the same file. This causes Laravel translator group lookups, PSR-4 autoloader namespace resolution, and Blade view discovery to fail in ways that work correctly on the production Linux server (ext4, case-sensitive).

## Key Points
- **Bind mount = macOS filesystem**: Docker bind mounts expose the host's case-insensitive APFS/HFS+ volume inside the container. The container's Linux kernel sees case-insensitive behavior despite being Linux.
- **Named volume = Linux ext4**: A named Docker volume (`docker volume create`) is backed by a directory inside the Docker VM's own Linux filesystem — always ext4, always case-sensitive. This is the correct fix.
- **Laravel translator crash**: `__('Messages')` performs a group lookup for the file `lang/{locale}/Messages.php`. On macOS, `messages.php` and `Messages.php` match the same file. Laravel loads the entire `messages.php` array as the "translation value", then `htmlspecialchars(Array)` crashes with `PHP Warning: Array to string conversion`.
- **PSR-4 autoloader confusion**: A directory named `app/Http/Controllers/Api/` and a namespace declared as `App\Http\Controllers\API\` (uppercase `I`) are identical on macOS but diverge on Linux. Composer dump-autoload may build the classmap using one casing; the Linux server resolves to the other directory, causing `Class not found` fatal errors.
- **Silent production divergence**: These bugs are invisible in development on macOS (everything appears to work) and only surface on the production Linux server or inside a named-volume container.

## Details

### The translator crash in depth
The Beldify admin header includes `{{ __('Messages') }}` to render a nav label. Laravel's `__()` helper first tries a string lookup in JSON lang files, then falls back to a PHP group file lookup. On a case-sensitive Linux machine, `lang/ar/Messages.php` does not exist (the file is `messages.php`, lowercase), so the helper returns the key `'Messages'` as a string — safe, visible as a fallback.

On macOS with a bind mount, `lang/ar/Messages.php` resolves to `messages.php` (same inode). Laravel successfully opens the file, gets back an array of 1324 translation keys, and assigns the entire array as the "translation". The value is then passed to `htmlspecialchars()` for HTML encoding, which cannot accept an array:

```
PHP Warning: htmlspecialchars(): Argument #1 ($string) must be of type string, array given
```

This crashes the entire page render with a 500 error visible to the developer but masked from production (since production runs on ext4 where the file is not found).

### PSR-4 case mismatch
Similarly, `app/Http/Controllers/Api/` (lowercase `i`) on macOS matches `App\Http\Controllers\API\` (uppercase `I`) because the filesystem treats them as the same directory. `composer dump-autoload` generates a classmap that works locally but fails on the Linux production server where `api/` ≠ `API/`. The fix is to align the directory name with the namespace declaration exactly and run `composer dump-autoload -o` on Linux.

### Fix: migrate to a named Docker volume
The only correct fix for local Docker development on macOS is to replace the bind mount with a named volume pre-loaded from the server:

```bash
# On the production server — create a code tarball
tar czf /tmp/beldify-backend.tar.gz -C /var/www/html .

# On macOS — copy tarball down
scp root@contabo:/tmp/beldify-backend.tar.gz /tmp/

# Create the named volume and populate it
docker volume create beldify_local_code
docker run --rm \
  -v beldify_local_code:/dest \
  -v /tmp/beldify-backend.tar.gz:/src.tar.gz \
  alpine sh -c "tar xzf /src.tar.gz -C /dest"

# Use the named volume in docker-compose.local.yml
# services:
#   app:
#     volumes:
#       - beldify_local_code:/var/www/html   # ← named volume, not ./:/var/www/html
```

**Trade-off**: named volumes provide case-sensitivity but no hot-reload. File edits from the Mac must be pushed into the container via `docker cp` or `docker exec`. For rapid iteration during debugging this is acceptable; for active development prefer a bind mount with awareness of the pitfall.

### Detecting the pitfall
If `__('SomeKey')` returns an array (visible as `Array` in rendered HTML or as a `htmlspecialchars` warning), the translator found a PHP lang file by the wrong case. Check:

```bash
# Is the container using a bind mount or named volume?
docker inspect <container_name> | grep -A5 Mounts

# Bind mount: "Type": "bind" — case-insensitive on macOS
# Named volume: "Type": "volume" — case-sensitive always
```

## Related Concepts
- [[concepts/docker-local-production-mirror]] — Pattern for building and maintaining the named-volume local mirror
- [[concepts/php-opcache-deployment-pitfall]] — Second stage of the same debugging session: after the case issue is fixed, opcache pins old class maps
- [[concepts/docker-env-file-recreation]] — Third stage: env_file is frozen at container creation, not at restart
- [[entities/laravel]] — Framework whose translator and autoloader are affected

## Sources
- [[daily/2026-05-29.md]] — Discovered during local Docker mirror setup; root cause of `htmlspecialchars(): array given` crash on admin header; fixed by migrating from bind mount to named volume (`beldify_local_code`)
