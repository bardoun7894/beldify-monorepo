# Research: Brownfield App Improvement Sprint

**Date**: 2026-01-26
**Status**: Complete

## Executive Summary

This document captures architecture analysis and technology decisions for the Beldify
brownfield improvement sprint. All technical context has been resolved; no NEEDS
CLARIFICATION items remain.

## Current Architecture Analysis

### Backend (Laravel 10)

**Entry Points**:
- `routes/api.php` - Main API routes (v1 prefix)
- `routes/auth.php` - Authentication endpoints
- `routes/cart.php` - Cart management
- `routes/admin.php` - Admin dashboard
- `routes/seller.php` - Seller portal

**Critical Flows**:
1. **Authentication**: Sanctum-based, token refresh via middleware
2. **Checkout**: Cart → Payment → Order flow with multiple integrations
3. **Product Feeds**: Paginated lists with filters, sorting, search
4. **Form Submissions**: User input → Validation → Persistence

**Risk Areas Identified**:
- `app/Exceptions/Handler.php` - Single point for all exception handling
- `app/Http/Middleware/Authenticate.php` - Token validation
- `app/Services/CacheService.php` - Redis dependency, no graceful degradation
- Multiple controllers with inline try/catch (inconsistent patterns)

### Frontend (Next.js 15)

**Entry Points**:
- `src/app/` - App Router pages
- `src/services/axiosInstance.ts` - Centralized HTTP client
- `src/contexts/` - Global state (auth, cart, locale)

**Critical Flows**:
1. **Login**: Form → API → Token storage → Redirect
2. **Checkout**: Cart context → Payment form → Confirmation
3. **Feeds**: List components → Pagination → Infinite scroll
4. **Forms**: React Hook Form → Validation → API submission

**Risk Areas Identified**:
- `src/services/axiosInstance.ts` - Global error interceptor affects all calls
- `src/utils/errorHandler.ts` - Error categorization logic
- `src/components/ErrorBoundary.tsx` - Catch-all for React errors
- No request deduplication (duplicate API calls on re-renders)

## Technology Decisions

### Observability Stack

**Decision**: Sentry for error tracking and performance monitoring

**Rationale**:
- Native Laravel and Next.js SDKs available
- Unified dashboard for both backend and frontend errors
- Distributed tracing support out of the box
- Correlation IDs automatic via Sentry trace headers
- Performance monitoring included (transactions, web vitals)

**Alternatives Considered**:
- Datadog: More comprehensive APM but higher cost and complexity
- Laravel Telescope: Backend only, no frontend integration
- Custom logging: More work, no dashboard, no alerting

**Implementation**:
- Backend: `sentry/sentry-laravel` package
- Frontend: `@sentry/nextjs` package
- Shared: Project DSN, environment tagging, release tracking

### Error Handling Pattern

**Decision**: Structured error responses with correlation IDs

**Backend Pattern**:
```php
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "correlation_id": "uuid-v4",
    "details": {} // Optional field-level errors
  }
}
```

**Frontend Pattern**:
```typescript
interface AppError {
  type: 'network' | 'validation' | 'auth' | 'server' | 'unknown';
  message: string;
  correlationId?: string;
  retryable: boolean;
}
```

**Rationale**:
- Correlation IDs enable end-to-end tracing
- Error types enable appropriate UI responses
- Retryable flag enables automatic retry logic

### Performance Optimization Strategy

**Decision**: Incremental N+1 fixes + strategic caching + frontend virtualization

**Backend Optimizations**:
1. Add eager loading to high-traffic repository methods
2. Add missing database indexes based on slow query log
3. Implement cache-aside pattern for frequently accessed data
4. Add Redis graceful degradation (fallback to database)

**Frontend Optimizations**:
1. Add request deduplication to Axios instance
2. Implement virtual scrolling for product feeds
3. Optimize bundle splitting for critical paths

**Rationale**:
- N+1 queries are the most common performance issue in Laravel apps
- Caching provides immediate latency reduction
- Virtual scrolling reduces DOM nodes and improves FPS

### Security Hardening Approach

**Decision**: Pre-commit hooks + CI scanning + authz audit

**Implementation**:
1. Add gitleaks pre-commit hook for secret detection
2. Add gitleaks to CI pipeline for PR validation
3. Audit critical endpoints for authz middleware usage
4. Add sensitive field masking to log configuration

**Rationale**:
- Pre-commit catches secrets before they enter history
- CI provides defense-in-depth for bypassed hooks
- Authz audit verifies existing middleware coverage
- Log masking prevents PII exposure in logs

## Integration Points

### Sentry Integration

**Backend Setup**:
```bash
composer require sentry/sentry-laravel
php artisan sentry:publish
# Configure SENTRY_LARAVEL_DSN in .env
```

**Frontend Setup**:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# Configure NEXT_PUBLIC_SENTRY_DSN in .env
```

### Pre-commit Hook Setup

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks/releases

# Add to .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

## Dependencies to Add

### Backend (composer.json)

```json
{
  "require": {
    "sentry/sentry-laravel": "^4.0"
  },
  "require-dev": {
    "barryvdh/laravel-debugbar": "^3.9"
  }
}
```

### Frontend (package.json)

```json
{
  "dependencies": {
    "@sentry/nextjs": "^8.0.0"
  },
  "devDependencies": {
    "@tanstack/react-virtual": "^3.0.0"
  }
}
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Exception Handler changes break error responses | Add comprehensive tests before modifying |
| Axios interceptor changes break API calls | Test all critical flows after modification |
| N+1 fixes change query behavior | Compare result sets before/after |
| Index migrations cause downtime | Use online DDL, deploy off-peak |
| Sentry overhead impacts performance | Configure sampling rate appropriately |

## Open Questions (None)

All technical decisions have been made. No blocking questions remain.
