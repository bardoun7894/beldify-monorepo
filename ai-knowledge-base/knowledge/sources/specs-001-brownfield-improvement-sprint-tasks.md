---
name: specs/001-brownfield-improvement-sprint/tasks.md
description: Auto-synced from specs/001-brownfield-improvement-sprint/tasks.md
type: source
sync_origin: specs/001-brownfield-improvement-sprint/tasks.md
sync_hash: ca4100ea4d041809
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/001-brownfield-improvement-sprint/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks: Brownfield App Improvement Sprint

**Input**: Design documents from `/specs/001-brownfield-improvement-sprint/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.
Each task follows the pattern: (1) instrumentation/tests, (2) minimal code change, (3) verification.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `beldify-backend/`
- **Frontend**: `beldify-frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish baselines and install shared dependencies

- [ ] T001 Run baseline test coverage and save to specs/001-brownfield-improvement-sprint/baseline-coverage.txt
- [ ] T002 [P] Install sentry/sentry-laravel package in beldify-backend/composer.json
- [ ] T003 [P] Install @sentry/nextjs package in beldify-frontend/package.json
- [ ] T004 [P] Install barryvdh/laravel-debugbar (dev) in beldify-backend/composer.json
- [ ] T005 Run composer install and npm install to update lock files

**Checkpoint**: Dependencies installed, baseline captured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that enables all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create beldify-backend/app/Helpers/CorrelationId.php helper to generate/retrieve request correlation IDs
- [ ] T007 Create beldify-backend/app/Http/Middleware/AddCorrelationId.php middleware
- [ ] T008 Register AddCorrelationId middleware in beldify-backend/app/Http/Kernel.php (global middleware)
- [ ] T009 Add SENTRY_LARAVEL_DSN to beldify-backend/.env.example
- [ ] T010 [P] Add NEXT_PUBLIC_SENTRY_DSN to beldify-frontend/.env.example
- [ ] T011 Verify middleware is active: curl request returns X-Correlation-Id header

**Checkpoint**: Foundation ready - correlation IDs flowing through all requests

---

## Phase 3: User Story 1 - Crash-Free Experience (Priority: P1) 🎯 MVP

**Goal**: All exceptions handled gracefully with user-friendly error messages

**Independent Test**: Exercise login, checkout, forms, feeds under error conditions; verify no unhandled exceptions

### Tests for US1

- [ ] T012 [P] [US1] Create unit test for error response format in beldify-backend/tests/Unit/ErrorResponseTest.php
- [ ] T013 [P] [US1] Create unit test for error categorization in beldify-frontend/src/utils/__tests__/errorHandler.test.ts
- [ ] T014 [P] [US1] Create E2E test for network error handling in beldify-frontend/tests/e2e/error-handling.spec.ts
- [ ] T015 [US1] Run tests and verify they FAIL (red phase)

### Implementation for US1

- [ ] T016 [US1] Add structured error response method to beldify-backend/app/Exceptions/Handler.php (render method)
- [ ] T017 [US1] Add correlation_id to all error responses in beldify-backend/app/Exceptions/Handler.php
- [ ] T018 [US1] Enhance error categorization in beldify-frontend/src/utils/errorHandler.ts (add retryable flag)
- [ ] T019 [US1] Add global error interceptor with retry logic to beldify-frontend/src/services/axiosInstance.ts
- [ ] T020 [US1] Add retry mechanism to beldify-frontend/src/components/ErrorBoundary.tsx
- [ ] T021 [US1] Improve error UI in beldify-frontend/src/components/common/ErrorMessage.tsx
- [ ] T022 [US1] Update beldify-frontend/src/app/error.tsx with correlation ID display (dev mode only)
- [ ] T023 [US1] Update beldify-frontend/src/app/global-error.tsx with retry button

### Verification for US1

- [ ] T024 [US1] Run all US1 tests and verify they PASS (green phase)
- [ ] T025 [US1] Manual verification: trigger network error on login, verify user-friendly message shown
- [ ] T026 [US1] Manual verification: trigger 500 error on checkout, verify cart state preserved
- [ ] T027 [US1] Commit US1 changes with message "feat(stability): structured error responses with correlation IDs"

**Checkpoint**: User Story 1 complete - crash-free error handling verified

---

## Phase 4: User Story 2 - Faster App Interactions (Priority: P2)

**Goal**: P95 <200ms reads, <500ms writes, reduced frame drops

**Independent Test**: Measure P95 latency and frame drops before/after; verify improvement

### Tests for US2

- [ ] T028 [P] [US2] Create performance baseline test in beldify-backend/tests/Feature/PerformanceBaselineTest.php
- [ ] T029 [P] [US2] Create query count assertions in beldify-backend/tests/Feature/N1QueryTest.php
- [ ] T030 [P] [US2] Create Playwright performance test in beldify-frontend/tests/e2e/performance.spec.ts
- [ ] T031 [US2] Run baseline performance tests and record metrics

### Implementation for US2 - Backend

- [ ] T032 [US2] Identify N+1 queries in product listing using Debugbar; document in specs/001-brownfield-improvement-sprint/n1-queries.md
- [ ] T033 [US2] Add eager loading to ProductRepository in beldify-backend/app/Repositories/ (specific file TBD from audit)
- [ ] T034 [US2] Add eager loading to OrderRepository in beldify-backend/app/Repositories/ (specific file TBD from audit)
- [ ] T035 [US2] Create migration for missing indexes in beldify-backend/database/migrations/ (columns TBD from slow query log)
- [ ] T036 [US2] Add graceful degradation to beldify-backend/app/Services/CacheService.php (fallback to DB on Redis failure)

### Implementation for US2 - Frontend

- [ ] T037 [P] [US2] Add request deduplication to beldify-frontend/src/services/axiosInstance.ts
- [ ] T038 [P] [US2] Install @tanstack/react-virtual in beldify-frontend/package.json
- [ ] T039 [US2] Add virtual scrolling to product list component (specific file TBD from codebase audit)

### Verification for US2

- [ ] T040 [US2] Run performance tests and compare to baseline
- [ ] T041 [US2] Verify P95 read latency <200ms using Debugbar/logs
- [ ] T042 [US2] Verify P95 write latency <500ms using Debugbar/logs
- [ ] T043 [US2] Commit US2 changes with message "perf: N+1 fixes, eager loading, and frontend virtualization"

**Checkpoint**: User Story 2 complete - performance targets met

---

## Phase 5: User Story 3 - Quick Issue Diagnosis (Priority: P3)

**Goal**: Structured JSON logs with correlation IDs, distributed tracing via Sentry

**Independent Test**: Trigger error, search logs by correlation ID, verify complete context available

### Tests for US3

- [ ] T044 [P] [US3] Create unit test for structured log format in beldify-backend/tests/Unit/LogFormatTest.php
- [ ] T045 [P] [US3] Create test for Sentry capture in beldify-backend/tests/Feature/SentryIntegrationTest.php
- [ ] T046 [US3] Run tests and verify they FAIL (red phase)

### Implementation for US3 - Backend

- [ ] T047 [US3] Run php artisan sentry:publish to create beldify-backend/config/sentry.php
- [ ] T048 [US3] Add Sentry channel to stack in beldify-backend/config/logging.php
- [ ] T049 [US3] Configure structured JSON formatter in beldify-backend/config/logging.php (daily channel)
- [ ] T050 [US3] Add Sentry::captureException to beldify-backend/app/Exceptions/Handler.php (report method)
- [ ] T051 [US3] Add user context to Sentry in beldify-backend/app/Providers/AppServiceProvider.php

### Implementation for US3 - Frontend

- [ ] T052 [US3] Run npx @sentry/wizard -i nextjs to scaffold Sentry config
- [ ] T053 [US3] Configure Sentry DSN in beldify-frontend/sentry.client.config.ts
- [ ] T054 [US3] Add user context to Sentry in beldify-frontend (auth context integration)
- [ ] T055 [US3] Update beldify-frontend/src/utils/consoleLogger.ts to include correlation IDs

### Verification for US3

- [ ] T056 [US3] Run php artisan sentry:test and verify event appears in Sentry dashboard
- [ ] T057 [US3] Trigger frontend error and verify it appears in Sentry with user context
- [ ] T058 [US3] Verify structured logs: docker logs beldify-backend | jq . (should parse as JSON)
- [ ] T059 [US3] Run all US3 tests and verify they PASS (green phase)
- [ ] T060 [US3] Commit US3 changes with message "feat(observability): Sentry integration and structured logging"

**Checkpoint**: User Story 3 complete - observability operational

---

## Phase 6: User Story 4 - Security Best Practices (Priority: P4)

**Goal**: No secrets in repo, authz verified on critical endpoints, sensitive data masked in logs

**Independent Test**: Run gitleaks, verify zero secrets; test critical endpoints without auth, verify 401/403

### Tests for US4

- [ ] T061 [P] [US4] Create test for log masking in beldify-backend/tests/Unit/LogMaskingTest.php
- [ ] T062 [P] [US4] Create authz test for admin endpoints in beldify-backend/tests/Feature/AdminAuthzTest.php
- [ ] T063 [P] [US4] Create authz test for payment endpoints in beldify-backend/tests/Feature/PaymentAuthzTest.php
- [ ] T064 [US4] Run tests and verify current state (document any failures)

### Implementation for US4

- [ ] T065 [US4] Verify .gitignore includes .env, *.key, credentials.* patterns in beldify-backend/.gitignore
- [ ] T066 [P] [US4] Verify .gitignore includes .env.local, *.key patterns in beldify-frontend/.gitignore
- [ ] T067 [US4] Create .pre-commit-config.yaml with gitleaks hook in repository root
- [ ] T068 [US4] Add sensitive field masking to beldify-backend/config/logging.php (tap into formatter)
- [ ] T069 [US4] Audit admin routes in beldify-backend/routes/admin.php for auth middleware; document gaps
- [ ] T070 [US4] Audit seller routes in beldify-backend/routes/seller.php for auth middleware; document gaps
- [ ] T071 [US4] Audit payment-related controllers for authz checks; document gaps

### Verification for US4

- [ ] T072 [US4] Run gitleaks detect --source beldify-backend --verbose; verify zero secrets
- [ ] T073 [US4] Run gitleaks detect --source beldify-frontend --verbose; verify zero secrets
- [ ] T074 [US4] Run all US4 tests and verify they PASS
- [ ] T075 [US4] Commit US4 changes with message "security: pre-commit hooks, log masking, authz audit"

**Checkpoint**: User Story 4 complete - security baseline established

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, and rollout preparation

- [ ] T076 Run full backend test suite: php artisan test
- [ ] T077 Run full frontend test suite: npx playwright test
- [ ] T078 [P] Update quickstart.md with any new verification commands discovered
- [ ] T079 [P] Create rollback checklist in specs/001-brownfield-improvement-sprint/rollback.md
- [ ] T080 Run quickstart.md verification commands end-to-end
- [ ] T081 Create PR with all changes; include summary of metrics improvements
- [ ] T082 Deploy to staging environment and monitor for 24 hours
- [ ] T083 Document any issues found in staging in specs/001-brownfield-improvement-sprint/staging-issues.md

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL USER STORIES
    │
    ├──▶ Phase 3 (US1: Stability) 🎯 MVP
    │         │
    │         ▼
    ├──▶ Phase 4 (US2: Performance)
    │         │
    │         ▼
    ├──▶ Phase 5 (US3: Observability)
    │         │
    │         ▼
    └──▶ Phase 6 (US4: Security)
              │
              ▼
         Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 - No dependencies on other stories - **MVP**
- **US2 (P2)**: Can start after Phase 2 - Independent of US1 (but benefit from US1's error handling)
- **US3 (P3)**: Can start after Phase 2 - Independent (but benefits from US1's correlation IDs)
- **US4 (P4)**: Can start after Phase 2 - Independent of other stories

### Within Each User Story (Brownfield Pattern)

1. **Tests first**: Write failing tests for new behavior
2. **Minimal change**: Implement smallest code change to pass tests
3. **Verification**: Manual verification + run full test suite
4. **Commit**: Atomic, mergeable commit with clear message

### Parallel Opportunities

**Phase 1**: T002, T003, T004 can run in parallel (different package managers)

**Phase 2**: T009, T010 can run in parallel (different .env files)

**US1 Tests**: T012, T013, T014 can run in parallel (different test files)

**US2 Backend/Frontend**: T037, T038 can run in parallel with backend tasks (different repos)

**US3 Tests**: T044, T045 can run in parallel

**US4 Tests**: T061, T062, T063 can run in parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 tests in parallel:
Task: "Create unit test for error response format in beldify-backend/tests/Unit/ErrorResponseTest.php"
Task: "Create unit test for error categorization in beldify-frontend/src/utils/__tests__/errorHandler.test.ts"
Task: "Create E2E test for network error handling in beldify-frontend/tests/e2e/error-handling.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T011)
3. Complete Phase 3: User Story 1 (T012-T027)
4. **STOP and VALIDATE**: Merge US1, deploy to staging
5. Monitor crash-free rate for 48 hours before continuing

### Incremental Delivery (Recommended)

1. Setup + Foundational → Foundation ready
2. US1 (Stability) → Merge → Deploy → Monitor (Week 1)
3. US2 (Performance) → Merge → Deploy → Monitor (Week 2)
4. US3 (Observability) → Merge → Deploy → Monitor (Week 3)
5. US4 (Security) → Merge → Deploy → Monitor (Week 4)
6. Polish → Final release

### Rollback Strategy Per Story

| Story | Rollback Method |
|-------|-----------------|
| US1 | Git revert commit; error responses return to previous format |
| US2 | Git revert; down migrations for indexes if needed |
| US3 | Remove Sentry DSN from .env; logs return to previous format |
| US4 | Remove pre-commit hook; no code changes to revert |

---

## Notes

- All tasks are small and independently mergeable
- Each commit should pass CI (lint, tests, build)
- Stop at any checkpoint to validate independently
- Specific file paths (TBD) will be determined during implementation audit
- Brownfield approach: minimal changes, maximum stability

