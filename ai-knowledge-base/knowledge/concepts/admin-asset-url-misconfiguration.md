---
name: Admin Asset URL Misconfiguration (APP_URL)
description: APP_URL pointing to a raw IP over HTTP causes all Laravel asset() calls to generate wrong URLs, producing MIME-type errors that silently block every CSS and JS file on the admin dashboard
type: concept
sources: [daily/2026-05-21.md]
created: 2026-05-21
updated: 2026-05-21
---

# Admin Asset URL Misconfiguration (APP_URL)

## Overview
When Laravel's `APP_URL` environment variable points to a raw IP address over HTTP (e.g. `http://91.230.110.187:7894`) while the public-facing site is served at an HTTPS domain (e.g. `https://pro.beldify.com`), every call to the `asset()` helper generates a URL with the wrong base. Browsers enforce strict MIME checking — when the wrong URL returns an HTML fallback page instead of CSS or JavaScript, the browser refuses to apply it, silently killing all styles and scripts even though the files exist on disk.

## Key Points
- **Root cause**: `APP_URL=http://91.230.110.187:7894` → `asset('css/app.css')` generates `http://91.230.110.187:7894/css/app.css` → browser upgrades to HTTPS → raw IP:port has no HTTPS listener → Cloudflare/SPA catch-all returns `text/html` → strict MIME check blocks the resource
- **Distinguishing symptom**: "Refused to apply style from '...' because its MIME type ('text/html') is not a supported stylesheet MIME type" appears for every local asset — not for CDN assets (which have correct base URLs)
- **Cascade failure**: With `vendors.min.js` returning HTML, jQuery plugins never register → every inline `$(...)` block that calls `.modal()`, `.ajaxSetup()`, or any plugin method throws `$ is not a function`, even though `window.$` exists from the CDN jQuery load
- **The files exist on disk** — this is NOT a missing-file problem; `curl http://127.0.0.1:7894/admin/app-assets/vendors/js/vendors.min.js` returns the correct JS from inside the network. The problem is the URL the browser is told to request
- **Fix**: Set both `APP_URL=https://pro.beldify.com` and `ASSET_URL=https://pro.beldify.com` in `.env`, then clear and rebuild the config cache

## Details
On 2026-05-21, the Beldify admin dashboard at `https://pro.beldify.com/ar/admin/dashboard` was throwing 15+ MIME-type console errors and a cascade of `$ is not a function` errors. Every `admin/app-assets/...`, `css/`, `js/`, `sounds/`, and `icons/` asset was returning `text/html`. Direct inspection of the container confirmed all files existed on disk. The root cause was `APP_URL=http://91.230.110.187:7894` in the `.env` file — the value set during initial Docker deployment on MyContabo.

A separate `.env.production` file had the correct `https://pro.beldify.com` value, but it was not the file the running container was reading. The container's `APP_URL` needed to be updated via `sed` + `docker cp` (since the compose file uses an `env_file` directive pointing to `.env`, not `.env.production`).

### Fix procedure
```env
# In beldify-backend/.env (the file the container reads via env_file)
APP_URL=https://pro.beldify.com
ASSET_URL=https://pro.beldify.com
```

Then invalidate the config cache — the values are compiled into `bootstrap/cache/config.php` at boot:

```bash
# Option A: clear inside the running container
docker exec beldify-backend php artisan config:clear
docker exec beldify-backend php artisan config:cache

# Option B: force-recreate the container (re-reads env_file from scratch)
docker compose -f docker-compose.yml up -d --force-recreate app
```

`ASSET_URL` is the variable that the `asset()` helper actually checks. In some Laravel versions, `APP_URL` alone isn't enough — always set both.

### How to detect this is the root cause
```bash
# Check the resolved value inside the container
docker exec beldify-backend php artisan tinker --execute="echo config('app.url');"
# If it prints an IP or http:// while the site is HTTPS → root cause confirmed

# From outside, verify a static asset URL
curl -I https://pro.beldify.com/admin/app-assets/vendors/js/vendors.min.js
# Content-Type: text/html → MIME mismatch, asset route not matching
# Content-Type: application/javascript → asset route working correctly
```

### Additional files that 404'd for the same reason
Once `APP_URL` was fixed and the missing `public/` assets were restored to the container via `docker cp`, all of the following returned `200` with correct MIME types:
- `admin/app-assets/vendors/js/vendors.min.js` (application/javascript)
- `admin/app-assets/js/core/app.min.js` (application/javascript)
- `js/force-light-mode.js`, `js/my_admin_js.js` (application/javascript)
- `admin/app-assets/images/ico/favicon.ico` (image/vnd.microsoft.icon)
- `/sounds/notification.mp3` (audio/mpeg)

## Related Concepts
- [[concepts/docker-deployment]] — Container context where the `.env` file lives and where `config:cache` must be run; the bind-mount pattern means `.env` changes do NOT auto-reload without a container restart or `config:clear`
- [[concepts/admin-atlas-migration]] — The migration session this issue blocked; all CSS/JS was rendered invisible until APP_URL was corrected
- [[concepts/missing-views-git-restore]] — Another infrastructure issue that surfaced in the same session on the same server

## Sources
- [[daily/2026-05-21.md]] — Root cause identified during admin CSS debugging session (1295f6ce); all MIME-type errors resolved after APP_URL + ASSET_URL fix + missing assets restored to container via docker cp
