# Data Model: Brownfield App Improvement Sprint

**Date**: 2026-01-26
**Status**: Complete

## Overview

This is a brownfield improvement sprint. **No new data entities are introduced.**

All changes focus on improving existing code without modifying the data model.

## Existing Entities (Reference)

The Beldify application has 70+ Eloquent models. Key entities relevant to this sprint:

### User (existing)
- Used in: Auth flows, authorization checks, logging context
- **Sprint Impact**: Add user_id to structured logs for debugging

### Order (existing)
- Used in: Checkout flow, payment processing
- **Sprint Impact**: Target for N+1 query optimization in order listing

### Product (existing)
- Used in: Product feeds, search, cart
- **Sprint Impact**: Target for N+1 query optimization in product listing

### Cart (existing)
- Used in: Cart management, checkout
- **Sprint Impact**: State preservation on error scenarios

## No New Migrations

This sprint does not introduce new tables or columns.

**Index Migrations** (Performance):
- Indexes may be added to existing columns based on slow query analysis
- These are DDL changes, not schema changes
- Example: `CREATE INDEX idx_orders_user_status ON orders(user_id, status)`

## Logging Context Fields

New structured log fields (not database columns):

| Field | Type | Description |
|-------|------|-------------|
| correlation_id | string (UUID) | Request tracing ID |
| user_id | int/null | Authenticated user ID |
| endpoint | string | API route path |
| method | string | HTTP method |
| duration_ms | int | Request processing time |
| error_code | string | Application error code |

These fields are added to log entries, not persisted to database.

## Cache Keys (Reference)

Existing cache patterns that may be optimized:

```php
// User-related
"user:{id}"
"user:{id}:permissions"

// Product-related
"products:featured"
"products:category:{id}"
"product:{id}"

// Cart-related
"cart:{user_id}"
"cart:{session_id}"
```

**Sprint Impact**: Review TTLs and invalidation patterns for optimization.
