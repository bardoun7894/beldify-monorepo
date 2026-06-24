---
name: Missing Views Git Restore Pattern
description: How to recover admin views that exist in git origin/main but were never deployed (or were deleted without commit) to the Contabo production server
type: concept
sources: [daily/2026-05-21.md]
created: 2026-05-21
updated: 2026-05-21
---

# Missing Views Git Restore Pattern

## Overview
During the 2026-05-21 admin dashboard debugging session, the Beldify admin surface on the Contabo server was discovered to be severely incomplete: 307 admin views and 12 seller views existed in `origin/main` but only 1 admin view was present on disk. The views had never been deployed — or had been deleted from disk without a corresponding git commit. The fix was a full git restore from `origin/main` followed by a clean rsync to the server.

## Key Points
- **Symptom**: routes resolve (302 redirect), but rendered views throw `View [admin.xxx] not found` 500 errors
- **Diagnosis**: `git ls-files HEAD -- resources/views/admin/ | wc -l` shows all files in HEAD; `ls resources/views/admin/` on the server shows only a fraction
- **Root cause pattern**: files exist in git but were never synced to the production host, OR they were deleted from the working tree without `git rm` (so git doesn't know they're missing, but the filesystem is empty)
- **Restore command**: `git checkout HEAD -- resources/views/` from inside the repo on the developer machine, then rsync to the server
- **macOS→Linux case-sensitivity trap**: controller namespace `API` on macOS (case-insensitive) maps to `Api` on Linux Docker (case-sensitive) — must rename the directory on the Linux host and update all namespace declarations

## Details

### Symptom vs root cause distinction
When a Laravel route resolves (returns 302 or redirects to login) but the subsequent authenticated request 500s with "View [x] not found", the routing layer is functional — the missing piece is the Blade view file. This is distinct from a route-not-found (404) situation.

### Restore workflow used on 2026-05-21
```bash
# On developer Mac — restore from origin/main
git fetch origin
git checkout origin/main -- resources/views/
git checkout origin/main -- app/
git checkout origin/main -- routes/

# Verify count
git ls-files HEAD -- resources/views/admin/ | wc -l
# Expected: 308

# Rsync to Contabo (preserve directory structure, delete orphans)
rsync -avz --delete \
  --exclude='vendor/' \
  --exclude='node_modules/' \
  beldify-backend/ MyContabo:/var/local/beldify-monorepo/beldify-backend/

# IMPORTANT: do NOT --exclude='resources/views/vendor/' — this strips pagination templates
# The safe exclude is --exclude='vendor/' (only the PHP vendor dir at the root)
```

### macOS→Linux case-sensitivity bug
The Beldify backend has controllers in `app/Http/Controllers/API/` (uppercase `API`). On macOS (HFS+ case-insensitive), PHP `use App\Http\Controllers\Api\...` namespace declarations resolve to the same directory. On the Linux Docker container (ext4 case-sensitive), `Controllers\Api\` and `Controllers\API\` are different paths — PHP throws "Class not found" for every controller in that namespace.

**Fix**: rename on the Linux host and update all namespace declarations:
```bash
# On Contabo
mv /var/www/app/Http/Controllers/API /var/www/app/Http/Controllers/Api
docker exec beldify-backend sed -i 's|Controllers\\API\\|Controllers\\Api\\|g' \
  $(grep -rl 'Controllers\\API\\' /var/www/app/)
docker exec beldify-backend php artisan config:clear
```

### Hot-patch via docker cp (avoids rebuild)
After a file is in the correct state on the host, use `docker cp` to push it into the running container immediately — no image rebuild needed:
```bash
# Copy a single directory
docker cp beldify-backend/resources/views beldify-backend:/var/www/resources/

# Clear Laravel caches to pick up new views
docker exec beldify-backend php artisan view:clear
docker exec beldify-backend php artisan cache:clear
docker exec beldify-backend php artisan config:clear
```

### Anti-pattern: rsync with over-broad excludes
Earlier in the session, rsync with `--exclude='vendor'` accidentally also excluded `resources/views/vendor/` (Laravel's pagination template directory published with `vendor:publish`). This caused all paginated views to 500 with "View [vendor.pagination.custom_paginate] not found". Always use `--exclude='/vendor/'` (leading slash anchors to root) or `--exclude='vendor/'` carefully to avoid collateral exclusions.

## Related Concepts
- [[concepts/docker-deployment]] — Container lifecycle within which this pattern applies
- [[concepts/docker-bind-mount-over-rebuild]] — Complementary shortcut for source-code edits
- [[concepts/admin-atlas-migration]] — The migration work that triggered the missing-views discovery
- [[entities/laravel]] — Framework whose Blade views needed restoration

## Sources
- [[daily/2026-05-21.md]] — Full discovery and restore cycle observed; case-sensitivity bug found and fixed; rsync pitfall with vendor/ exclude documented
