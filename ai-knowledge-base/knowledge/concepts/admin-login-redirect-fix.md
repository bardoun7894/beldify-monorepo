---
name: Admin Login Redirect Fix
description: Fixing the post-login 404 in the Beldify Laravel admin — RouteServiceProvider::HOME mismatch, LoginController::redirectTo() path, and stale session "intended" URL artifacts
type: concept
sources: [daily/2026-05-21.md]
created: 2026-05-21
updated: 2026-05-21
---

# Admin Login Redirect Fix

## Overview
After restoring admin views to the Beldify Contabo backend, the login flow still produced 404 errors. The root cause was a three-layer mismatch between where the app thought the dashboard was, where the routes actually mapped, and what Blade templates were named. An additional complication: once the server-side fix was in place, the browser still showed 404 because the Laravel session had stored a stale `intended` URL from earlier failed attempts.

## Key Points
- `RouteServiceProvider::HOME` was set to `/dashboard` — this route does not exist; the admin route is `/admin/dashboard` (with locale prefix)
- `LoginController::redirectTo()` returned `/{$locale}/admin/dashboard` — correct path, but the Blade view was named `admin.dashboard.index` while only `admin.dashboard` existed on disk
- `DashboardController::index()` called `view('admin.dashboard.index')` — thrown 500 even after routing was fixed
- Sidebar links used route names like `carts.index` but the registered names were `admin.carts.index` — fixed by wrapping with `Route::has($name) ? route($name) : '#'` so missing routes degrade to `#`
- Stale `intended` URL in Laravel session: even after server-side fix, browser holds old redirect destination until session is cleared or incognito window used

## Details

### The three fixes applied

**Fix 1 — RouteServiceProvider::HOME**
```php
// Before
public const HOME = '/dashboard';

// After
public const HOME = '/admin/dashboard';
```
This constant is used by Laravel's authentication scaffolding as the default redirect after login. With `/dashboard`, every login attempt landed on a 404 because no route was registered for that path.

**Fix 2 — DashboardController::index() view name**
```php
// Before (thrown 500: View [admin.dashboard.index] not found)
return view('admin.dashboard.index');

// After
return view('admin.dashboard');
```
Only `resources/views/admin/dashboard.blade.php` existed on the server. The `.index` suffix was a remnant pointing at a non-existent nested file.

**Fix 3 — Sidebar route-name graceful degradation**
Many sidebar entries reference route names without the `admin.` prefix (e.g. `carts.index` instead of `admin.carts.index`). Instead of patching 28+ individual route names in the menu config array, a guard was added at the rendering layer:
```blade
{{-- Before (throws exception if route name doesn't exist) --}}
href="{{ route($item['url']) }}"

{{-- After (falls back to '#' for unregistered route names) --}}
href="{{ Route::has($item['url']) ? route($item['url']) : '#' }}"
```
This makes the dashboard load even when some sidebar links point at non-existent route names. Sidebar links with `#` are a visible indicator of route names that still need patching.

### The stale session problem
After all three server-side fixes were confirmed working via curl (login POST → 302 → `/en/admin/dashboard` → 200), the user's browser still navigated to `/en/admin/dashboard` followed by a 404. Laravel stores the originally-requested URL in the session as `intended` when auth middleware redirects unauthenticated requests. Earlier failed login attempts had stored `/en/admin/dashboard`, `/en/dashboard/`, etc. These stale `intended` URLs persisted in the session cookie even after the routes were fixed.

**Resolution**: clear cookies for `pro.beldify.com` in the browser, or use an incognito window where no prior session exists.

### Verification command
```bash
curl -c /tmp/cookies.txt -b /tmp/cookies.txt -L \
  -d "email=beldify@gmail.com&password=...&_token=$(curl -s https://pro.beldify.com/login | grep '_token' | head -1 | sed 's/.*value="\([^"]*\)".*/\1/')" \
  https://pro.beldify.com/en/login
# Should follow redirect chain and land on /en/admin/dashboard with HTTP 200
```

## Related Concepts
- [[concepts/missing-views-git-restore]] — The view restoration work that preceded this login fix
- [[concepts/admin-atlas-migration]] — Broader context of the admin surface work
- [[concepts/docker-deployment]] — Container where hot-patches were applied
- [[entities/laravel]] — Framework providing the auth scaffolding being fixed

## Sources
- [[daily/2026-05-21.md]] — Full debugging trace: 404 → 500 → 302 + stale session; all three fixes applied and verified with curl end-to-end
