---
name: laravel-static-service-anti-pattern
description: Calling instance service methods with :: static syntax causes white-screen 500s; fix is app(ClassName::class)->method()
type: concept
---

# Laravel Static Service Anti-Pattern

## Problem

Instance methods on Laravel service classes were called with `::` (static) syntax across 43 files (~118 call sites):

```php
// WRONG — ClassName::method() on a non-static method
CacheService::getProducts($sellerId);
StorageService::uploadFile($request->file('image'));
```

This works in PHP when the method body doesn't reference `$this`, but fails with a fatal error (white-screen 500) the moment any method touches instance state, injected dependencies, or calls `$this->repository`.

## Root Cause

Services were registered as singletons and designed to be instantiated via DI, but callers copy-pasted static-style invocations that happened to work during early development when the methods were thin. As methods gained dependencies the pattern silently became a time bomb.

## Fix

Replace every static call with container resolution:

```php
// CORRECT — resolve from container, call as instance
app(CacheService::class)->getProducts($sellerId);
app(StorageService::class)->uploadFile($request->file('image'));
```

In controllers that already inject the service via constructor, use the injected instance directly instead.

## Scope in Beldify (2026-05-28)

- **CacheService**: 17 files, ~45 call sites
- **StorageService**: 26 files, ~73 call sites
- Total: 43 files, ~118 replacements
- Trigger: white-screen on admin pages immediately after container restart

## Detection

```bash
grep -r "CacheService::" app/Http/Controllers/ --include="*.php"
grep -r "StorageService::" app/Http/Controllers/ --include="*.php"
```

## Sources
- [[sources/daily/2026-05-28]] — session 6d18f0a6, initial white-screen debugging
