---
name: Caching Strategy
description: Redis-based caching approach in Beldify Laravel backend
type: concept
tags: [laravel, php, redis, service-repository, repository, pattern, performance, cache]
sources: [sources/backend-claude]
created: "2026-05-08"
updated: "2026-05-08"
---
# Caching Strategy

## Overview
The Beldify backend uses Redis-based caching to improve performance and reduce database load. Cache operations are centralized through the CacheService.

## Key Points
- Use `CacheService` for all caching operations
- Cache keys follow pattern: `{domain}:{entity}:{id}`
- Implement cache invalidation on data updates
- Redis configured via REDIS_HOST, REDIS_PORT

## Cache Operations
```php
// Store in cache
CacheService::put($key, $value, $ttl);

// Retrieve from cache
CacheService::get($key, $default);

// Invalidate on update
CacheService::forget($key);
```

## Fallback Strategy
CacheService includes fallback to database if Redis is unavailable, ensuring graceful degradation.

## See also
- [[sources/backend-claude]]
- [[entities/redis]]
- [[entities/laravel]]
- [[concepts/service-repository-pattern]]