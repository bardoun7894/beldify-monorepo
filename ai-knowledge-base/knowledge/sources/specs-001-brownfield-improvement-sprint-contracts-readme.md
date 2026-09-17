---
name: specs/001-brownfield-improvement-sprint/contracts/README.md
description: Auto-synced from specs/001-brownfield-improvement-sprint/contracts/README.md
type: source
sync_origin: specs/001-brownfield-improvement-sprint/contracts/README.md
sync_hash: 7a310161f02f234d
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/001-brownfield-improvement-sprint/contracts/README.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# API Contracts: Brownfield App Improvement Sprint

## Overview

This is a brownfield improvement sprint. **No new API endpoints are introduced.**

All existing API contracts remain unchanged. This sprint focuses on:

1. **Error Response Format** - Standardizing error responses across existing endpoints
2. **Performance** - Optimizing existing endpoint implementations
3. **Observability** - Adding tracing headers to existing responses
4. **Security** - Verifying authorization on existing endpoints

## Error Response Contract (Standardization)

All API error responses MUST follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "correlation_id": "uuid-v4-here",
    "details": {
      "field_name": ["Validation error message"]
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid auth token |
| `AUTHORIZATION_DENIED` | 403 | User lacks permission |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error (details hidden) |
| `SERVICE_UNAVAILABLE` | 503 | Temporary service issue |

## Response Headers (New)

All responses will include these headers for observability:

```
Sentry-Trace: {trace-id}-{span-id}-{sampled}
X-Correlation-Id: {uuid-v4}
X-Response-Time: {milliseconds}
```

## Existing Endpoints (No Changes to Contracts)

### Authentication
- `POST /api/v1/login` - Login (existing)
- `POST /api/v1/logout` - Logout (existing)
- `POST /api/v1/register` - Register (existing)
- `POST /api/v1/refresh` - Token refresh (existing)

### Products
- `GET /api/v1/products` - List products (existing, performance target)
- `GET /api/v1/products/{id}` - Get product (existing)

### Cart
- `GET /api/v1/cart` - Get cart (existing)
- `POST /api/v1/cart/add` - Add to cart (existing)
- `POST /api/v1/cart/remove` - Remove from cart (existing)

### Orders
- `GET /api/v1/orders` - List orders (existing, performance target)
- `POST /api/v1/orders` - Create order (existing, checkout flow)
- `GET /api/v1/orders/{id}` - Get order (existing)

### Admin
- All admin endpoints require `CheckAdminAccess` middleware (security audit target)

### Seller
- All seller endpoints require `CheckStoreDetailsMiddleware` (security audit target)

## Contract Testing

Existing contract tests should continue to pass. New tests will be added for:

1. Error response format compliance
2. Correlation ID presence in responses
3. Authorization middleware coverage

See `tests/Feature/Contracts/` for existing contract tests.

