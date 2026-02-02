# Implementation Plan: Brownfield App Improvement Sprint

**Branch**: `001-brownfield-improvement-sprint` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-brownfield-improvement-sprint/spec.md`

## Summary

Incremental improvements to the existing Beldify application focusing on stability (crash
reduction), performance optimization, observability (structured logging + Sentry), and
security hardening. No rewrites; all changes preserve existing APIs and user flows.

## Technical Context

**Language/Version**: PHP 8.1+ (Laravel 10 backend), TypeScript (Next.js 15 frontend)
**Primary Dependencies**: Laravel Sanctum, Eloquent ORM, React 18, Axios, Tailwind CSS
**Storage**: MySQL (primary), Redis (cache/queue), Local/S3/Contabo (files)
**Testing**: PHPUnit + Mockery (backend), Playwright (frontend E2E)
**Target Platform**: Docker containers (production), Linux-based
**Project Type**: Web application (backend + frontend)
**Performance Goals**: P95 <200ms reads, <500ms writes, LCP <2.5s, FID <100ms
**Constraints**: Incremental changes only; no breaking API changes; weekly releases
**Scale/Scope**: 70+ Eloquent models, multi-tenant (stores), Arabic/English i18n

**Observability**: Sentry for error tracking and performance monitoring
**Runtime**: Docker containers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Error handling explicit, no silent failures | PASS - FR-001 to FR-004 address this |
| I. Code Quality | Functions <50 lines, single responsibility | VERIFY - audit during implementation |
| II. Testing Standards | Test-first for new error handlers | PASS - regression tests mandated |
| II. Testing Standards | 100% coverage on critical paths (auth, payments) | VERIFY - measure current baseline |
| III. UX Consistency | User-friendly error messages | PASS - FR-003 requires this |
| III. UX Consistency | Loading states for async operations | VERIFY - audit during P2 |
| IV. Performance | P95 <200ms reads, <500ms writes | PASS - SC-003, SC-004 targets |
| IV. Performance | No N+1 queries | PASS - FR-008 requires elimination |

**Gate Result**: PASS (with verification points during implementation)

## Project Structure

### Documentation (this feature)

```text
specs/001-brownfield-improvement-sprint/
├── plan.md              # This file
├── research.md          # Phase 0 output - architecture analysis
├── data-model.md        # Phase 1 output - no new entities (brownfield)
├── quickstart.md        # Phase 1 output - verification commands
├── contracts/           # Phase 1 output - no new APIs (brownfield)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (existing repository)

```text
beldify-backend/
├── app/
│   ├── Exceptions/
│   │   └── Handler.php              # P1: Enhanced error handling
│   ├── Http/
│   │   ├── Middleware/              # P1, P3: Error capture + logging middleware
│   │   └── Controllers/             # P1: Controller-level try/catch
│   ├── Services/
│   │   └── CacheService.php         # P2: Performance optimization
│   ├── Providers/
│   │   └── AppServiceProvider.php   # P3: Sentry provider registration
│   └── Logging/
│       └── [NEW] SentryHandler.php  # P3: Sentry log handler
├── config/
│   ├── logging.php                  # P3: Sentry channel configuration
│   └── [NEW] sentry.php             # P3: Sentry configuration
├── routes/
│   └── api.php                      # P4: Middleware verification
└── tests/
    ├── Feature/                     # P1-P4: Integration tests
    └── Unit/                        # P1-P4: Unit tests

beldify-frontend/
├── src/
│   ├── utils/
│   │   ├── errorHandler.ts          # P1: Enhanced error handling
│   │   └── consoleLogger.ts         # P3: Structured logging
│   ├── components/
│   │   ├── ErrorBoundary.tsx        # P1: Improved error boundaries
│   │   └── common/ErrorMessage.tsx  # P1: User-friendly error UI
│   ├── services/
│   │   └── axiosInstance.ts         # P1: Global error interceptor
│   └── app/
│       ├── error.tsx                # P1: Route error handling
│       └── global-error.tsx         # P1: Global error handling
├── sentry.client.config.ts          # P3: Sentry browser SDK
└── tests/
    └── e2e/                         # P1-P2: Playwright tests
```

**Structure Decision**: Web application with existing backend/frontend separation.
All changes are modifications to existing files; new files only for Sentry configuration.

## Architecture Overview (Current State)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js 15 (App Router)                                                    │
│  ├── React Error Boundaries (error.tsx, global-error.tsx)                   │
│  ├── Axios Instance → API calls to backend                                  │
│  ├── Context API (auth, cart, locale)                                       │
│  └── Toast Notifications (error display)                                    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTPS (REST API)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Laravel 10 (PHP 8.1+)                                                      │
│  ├── Middleware Stack (Auth, CORS, Locale, Permissions)                     │
│  ├── Controllers → Services → Repositories → Models                         │
│  ├── Exception Handler (app/Exceptions/Handler.php)                         │
│  └── Sanctum Authentication                                                 │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     MySQL       │    │     Redis       │    │   File Storage  │
│  (Primary DB)   │    │ (Cache/Queue)   │    │ (S3/Contabo)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

External Services:
├── Firebase FCM (Push Notifications)
├── Pusher (WebSocket/Real-time)
└── Payment Gateways (via Controllers)
```

## Risk Areas (Brownfield Focus)

| Area | Risk Level | Description |
|------|------------|-------------|
| Exception Handler | HIGH | Central point for all backend errors; changes affect all flows |
| Axios Instance | HIGH | Global HTTP client; interceptor changes affect all API calls |
| Auth Middleware | MEDIUM | Token refresh logic interacts with error handling |
| Redis Cache | MEDIUM | Cache failures can cascade; need graceful degradation |
| Database Queries | MEDIUM | N+1 fixes require careful testing to avoid regressions |

## Proposed Changes Per Story

### User Story 1 (P1): Crash-Free Experience

**Goal**: All exceptions handled gracefully; user-friendly error messages

| File | Change | Risk | Rollback |
|------|--------|------|----------|
| `app/Exceptions/Handler.php` | Add structured error responses, correlation IDs | HIGH | Git revert |
| `app/Http/Middleware/` | Add error capture middleware | MEDIUM | Remove middleware |
| `src/utils/errorHandler.ts` | Enhance error categorization | MEDIUM | Git revert |
| `src/services/axiosInstance.ts` | Add global error interceptor with retry | HIGH | Git revert |
| `src/components/ErrorBoundary.tsx` | Add retry mechanism, better fallback UI | LOW | Git revert |

**Test Strategy**:
- Unit: Test error categorization functions
- Integration: Test error flows through middleware
- E2E: Test user flows under error conditions (network offline, 500 responses)

### User Story 2 (P2): Faster App Interactions

**Goal**: P95 <200ms reads, <500ms writes, reduced frame drops

| File | Change | Risk | Rollback |
|------|--------|------|----------|
| `app/Repositories/*.php` | Add eager loading, fix N+1 | MEDIUM | Git revert |
| `app/Services/CacheService.php` | Optimize cache patterns | LOW | Git revert |
| `database/migrations/` | Add missing indexes | MEDIUM | Down migration |
| `src/services/api/` | Add request deduplication | LOW | Git revert |
| List components | Add virtualization for long lists | LOW | Git revert |

**Test Strategy**:
- Unit: Benchmark individual queries before/after
- Integration: Measure API response times in test suite
- E2E: Performance budget tests with Playwright

### User Story 3 (P3): Quick Issue Diagnosis

**Goal**: Structured JSON logs, distributed tracing via Sentry

| File | Change | Risk | Rollback |
|------|--------|------|----------|
| `config/logging.php` | Add Sentry channel to stack | LOW | Remove channel |
| `config/sentry.php` [NEW] | Sentry configuration | LOW | Delete file |
| `app/Providers/AppServiceProvider.php` | Register Sentry | LOW | Remove registration |
| `app/Exceptions/Handler.php` | Capture exceptions to Sentry | LOW | Remove capture call |
| `sentry.client.config.ts` [NEW] | Frontend Sentry SDK | LOW | Delete file |

**Test Strategy**:
- Unit: Verify log format structure
- Integration: Verify Sentry receives test errors
- Manual: Verify Sentry dashboard shows errors with context

### User Story 4 (P4): Security Best Practices

**Goal**: No secrets in repo, authz verified on critical endpoints

| File | Change | Risk | Rollback |
|------|--------|------|----------|
| `.gitignore` | Ensure .env, secrets excluded | LOW | Git revert |
| Pre-commit hooks | Add secret scanning (gitleaks) | LOW | Remove hook |
| `app/Http/Middleware/` | Audit authz middleware usage | LOW | N/A (audit only) |
| `config/logging.php` | Add sensitive field masking | LOW | Git revert |

**Test Strategy**:
- Unit: Test log masking functions
- Integration: Test authz checks on critical endpoints
- Automated: CI secret scanning

## Verification Plan

### Pre-Implementation Baseline

```bash
# Backend performance baseline
cd beldify-backend
php artisan test --coverage > baseline-coverage.txt
# Note current test count and coverage %

# Database query baseline (use Laravel Debugbar or Telescope)
# Manually record N+1 queries in login, checkout, feeds

# Frontend performance baseline
cd beldify-frontend
npx playwright test
# Record LCP, FID, CLS from test results
```

### Post-Implementation Verification

```bash
# P1: Stability verification
cd beldify-backend
php artisan test --filter=Exception
php artisan test --filter=Error

cd beldify-frontend
npx playwright test --grep="error handling"

# P2: Performance verification
cd beldify-backend
php artisan test --filter=Performance
# Compare query counts to baseline

# P3: Observability verification
# Trigger test error, verify in Sentry dashboard
curl -X POST http://localhost:8000/api/test-error

# P4: Security verification
cd beldify-backend
gitleaks detect --source . --verbose
# Should find 0 secrets
```

## Rollout Plan

### Phase 1: Stability (Week 1)
1. Deploy Exception Handler changes to staging
2. Run full test suite
3. Monitor Sentry for new error patterns
4. Deploy to production with feature flag if available
5. Monitor crash-free rate for 48 hours

### Phase 2: Performance (Week 2)
1. Deploy N+1 fixes to staging
2. Run performance baseline comparison
3. Load test critical endpoints
4. Deploy index migrations (off-peak hours)
5. Monitor P95 latency for 48 hours

### Phase 3: Observability (Week 3)
1. Deploy Sentry integration to staging
2. Verify error capture working
3. Deploy to production
4. Create Sentry alerts for error rate thresholds

### Phase 4: Security (Week 4)
1. Add pre-commit hooks to repo
2. Run secret scan on full history
3. Remediate any findings
4. Update CI pipeline with secret scanning

## Complexity Tracking

> No constitution violations identified. All changes are incremental and within brownfield constraints.

| Check | Status |
|-------|--------|
| No breaking API changes | PASS |
| Backward compatible flows | PASS |
| Incremental changes only | PASS |
| Tests for all new code | PLANNED |
