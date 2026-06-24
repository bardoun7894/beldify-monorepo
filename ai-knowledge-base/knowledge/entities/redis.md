---
name: Redis
description: In-memory data store used for caching in Beldify backend
type: entity
sources: [sources/backend-claude]
created: 2026-05-08
updated: 2026-05-08
---

# Redis

## What it is
In-memory data structure store used for caching in the Beldify Laravel backend. Provides fast data retrieval and reduces database load.

## Key facts
- Configured via REDIS_HOST, REDIS_PORT
- CacheService uses Redis with fallback strategies
- Cache keys follow pattern: `{domain}:{entity}:{id}`
- Cache invalidation implemented on data updates

## See also
- [[sources/backend-claude]]
- [[entities/laravel]]
- [[concepts/caching-strategy]]