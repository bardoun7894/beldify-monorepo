---
name: laravel-blade-route-guard-pattern
description: Wrapping route() calls in @if(Route::has()) guards prevents 500s when routes are renamed or not yet registered
type: concept
---

# Laravel Blade Route Guard Pattern

## Problem

Blade templates that call `route('some.route.name')` throw a fatal 500 (`Route [name] not defined`) when the route doesn't exist — even if the template is only partially rendered. This is common when:

- Routes are renamed during refactors
- A feature is conditionally registered
- Admin sidebar items reference routes that are environment-specific

Example in Beldify's legacy admin sidebar:

```blade
{{-- BREAKS if route not registered --}}
<a href="{{ route('carts.index') }}">...</a>
```

The correct route name was `admin.carts.index` — the legacy sidebar had the un-prefixed version.

## Fix: Route::has() Guard

Wrap every non-trivial route reference in a guard:

```blade
@if(Route::has('admin.carts.index'))
    <a href="{{ route('admin.carts.index') }}">...</a>
@endif
```

For sidebar items built from a config array, use a ternary at the point of render:

```blade
href="{{ Route::has($item['url']) ? route($item['url']) : '#' }}"
```

## Scope in Beldify (2026-05-28)

A background agent swept all admin sidebar and page views for broken route references:

- **50 references** identified as potentially unguarded across admin views
- **1 genuinely unguarded** reference found: `admin.community.images.delete` in `community/show.blade.php`
- Fixed with: `@if(Route::has('admin.community.images.delete'))` guard
- All other 49 were already guarded or the routes existed

## When to Apply

Apply `Route::has()` guards proactively to:
- Any sidebar item
- Any action button in a listing view
- Any breadcrumb link
- Any conditional "edit this in admin" style link in public-facing views

Do NOT guard internal form `action="{{ route(...) }}"` — those should 500 if the route is missing (fail loudly at the right layer).

## Related

- [[concepts/missing-views-git-restore]] — similar pattern: views missing on prod cause 500s
- [[concepts/beldify-admin-v3-sidebar]] — sidebar built from config array; Route::has guard added at render time

## Sources
- [[sources/daily/2026-05-28]] — session 6d18f0a6, `Route [carts.index] not defined` error + background agent 50-route sweep
