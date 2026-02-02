# Feature Specification: Laravel Backend Cleanup & Refactoring

**Feature Branch**: `003-backend-cleanup`
**Created**: 2026-01-26
**Status**: Draft
**Input**: Technical planning for Laravel backend cleanup focusing on: (1) Security fixes, (2) Large controller refactoring, (3) Test coverage expansion, (4) Performance optimization, (5) Code quality improvements.

## Overview

The Beldify Laravel backend is a mature e-commerce application with 1,175 PHP files, 158 controllers, 119 models, and 170 migrations. While functional, the codebase exhibits several issues requiring immediate attention:

- **Security vulnerabilities**: Command injection, mass assignment risks
- **Code quality**: Controllers averaging 270 lines (target: 150), incomplete repository pattern
- **Testing**: Only 5-10% test coverage (target: 40%)
- **Performance**: N+1 queries, inefficient filtering, missing database indexes

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Security Hardening (Priority: P1) MVP

As a platform administrator, I need all security vulnerabilities fixed so that user data and system integrity are protected from malicious actors.

**Why this priority**: Security vulnerabilities pose immediate risk to user data and business reputation. Must be addressed before any other improvements.

**Independent Test**: Run security audit tools (PHPStan security rules, Laravel security checker) and verify zero high/critical findings. Manual penetration testing on fixed endpoints.

**Acceptance Scenarios**:

1. **Given** a command execution in SafeProductionSeed.php, **When** the code is refactored, **Then** all shell commands use Laravel Process facade or queued jobs with proper escaping
2. **Given** controllers accepting `$request->all()`, **When** Form Request validation is added, **Then** only validated data reaches models and controllers
3. **Given** API endpoints without proper authorization, **When** middleware is applied, **Then** all endpoints require appropriate role/permission checks
4. **Given** raw SQL with user input, **When** queries are refactored, **Then** all database interactions use parameterized queries or Eloquent

---

### User Story 2 - Large Controller Refactoring (Priority: P2)

As a developer, I need oversized controllers refactored into focused classes so that code is maintainable, testable, and follows single responsibility principle.

**Why this priority**: Large controllers (>400 lines) hinder testing, increase bug introduction risk, and slow development velocity.

**Independent Test**: Measure line counts for target controllers. Run existing tests to verify no regression. New tests should achieve 80% coverage on refactored code.

**Target Controllers**:
- ProductController.php (1,591 → <400 lines)
- MessageController.php (1,050 → <400 lines)
- OrderController.php (941 → <400 lines)
- CartController.php (933 → <400 lines)
- InvoiceControllers (1,164 + 1,094 → <400 each)

**Acceptance Scenarios**:

1. **Given** ProductController with 1,591 lines, **When** refactored with services and query builders, **Then** controller is under 400 lines with extracted ProductFilterService, ProductCacheService
2. **Given** duplicated message handling across 3 controllers, **When** consolidated into MessageRepository, **Then** single source of truth with all controllers using shared repository
3. **Given** OrderController with complex multi-guard logic, **When** refactored with OrderRepository, **Then** all order retrieval uses consistent repository methods
4. **Given** business logic in models (User.php 539 lines), **When** extracted to services, **Then** models contain only relationships, scopes, and simple accessors

---

### User Story 3 - Test Coverage Expansion (Priority: P3)

As a developer, I need comprehensive test coverage so that I can refactor confidently and catch regressions early.

**Why this priority**: Current 5-10% coverage is critically low. Tests enable safe refactoring and prevent regression.

**Independent Test**: Run `php artisan test --coverage` and verify minimum 40% line coverage overall, 80% on critical paths.

**Acceptance Scenarios**:

1. **Given** 27 services with 0 unit tests, **When** tests are added, **Then** all services have unit tests with 80% coverage
2. **Given** 6 repositories, **When** tests are added, **Then** all repository methods have corresponding test cases
3. **Given** critical business logic (orders, payments, commissions), **When** feature tests are added, **Then** all critical paths have integration tests
4. **Given** API endpoints, **When** contract tests are added, **Then** response schemas are validated against documentation

---

### User Story 4 - Performance Optimization (Priority: P4)

As a user, I need fast API responses so that the shopping experience is smooth and responsive.

**Why this priority**: Performance directly impacts user satisfaction and conversion rates. Current N+1 queries and missing indexes cause latency.

**Independent Test**: Run performance benchmarks before/after. Target: P95 latency <200ms for read operations, <500ms for writes.

**Acceptance Scenarios**:

1. **Given** ProductController with N+1 queries in color filtering, **When** optimized with eager loading and batched queries, **Then** product listing P95 <200ms
2. **Given** 4 explicit indexes across 170 migrations, **When** indexes added for foreign keys and common filters, **Then** query performance improves 30%+
3. **Given** no caching on high-frequency queries, **When** caching layer implemented, **Then** cache hit rate >80% on product listings
4. **Given** Stock model with computed `$appends`, **When** lazy loading implemented, **Then** N+1 queries eliminated

---

### User Story 5 - Code Quality Infrastructure (Priority: P5)

As a developer, I need automated code quality tools so that standards are enforced consistently and code reviews focus on logic rather than style.

**Why this priority**: Automated tooling prevents technical debt accumulation and standardizes development practices.

**Independent Test**: Run full CI pipeline with new quality gates. All checks must pass.

**Acceptance Scenarios**:

1. **Given** no static analysis, **When** PHPStan level 5 configured, **Then** CI fails on type errors and new code must be type-safe
2. **Given** inconsistent code style, **When** PHP CS Fixer configured, **Then** all code follows PSR-12 standard automatically
3. **Given** no pre-commit hooks, **When** hooks configured, **Then** lint and type-check run before commits
4. **Given** incomplete Form Requests (12 for 158 controllers), **When** requests added, **Then** all state-changing endpoints use Form Request validation

---

### Edge Cases

- What happens when refactored code encounters legacy data formats?
  - Migration scripts must handle backward compatibility
- How does system handle failed cache invalidation?
  - Implement cache versioning with fallback to database
- What if PHPStan rules conflict with legacy code patterns?
  - Use baseline file for existing violations, enforce on new code only
- How to handle test data dependencies?
  - Use factories and seeders, avoid production data in tests

## Requirements *(mandatory)*

### Functional Requirements

#### Security
- **FR-001**: System MUST NOT execute shell commands directly; use Laravel Process facade or queued jobs
- **FR-002**: System MUST validate all input through Form Request classes before processing
- **FR-003**: System MUST use parameterized queries; no raw SQL with user input
- **FR-004**: System MUST apply authorization middleware to all API endpoints
- **FR-005**: System MUST NOT log sensitive data (passwords, tokens, PII)

#### Refactoring
- **FR-006**: Controllers MUST NOT exceed 400 lines of code
- **FR-007**: Models MUST NOT contain business logic; use services instead
- **FR-008**: System MUST use repository pattern for all database operations in refactored code
- **FR-009**: Duplicate code MUST be consolidated into shared services or traits

#### Testing
- **FR-010**: All new code MUST have corresponding unit tests
- **FR-011**: Critical paths (auth, orders, payments) MUST have 80% test coverage
- **FR-012**: API responses MUST be validated against documented schemas
- **FR-013**: Tests MUST be isolated and not depend on external services or production data

#### Performance
- **FR-014**: Database queries MUST use appropriate indexes
- **FR-015**: N+1 queries MUST be eliminated using eager loading
- **FR-016**: High-frequency queries MUST be cached with proper invalidation
- **FR-017**: API responses MUST meet P95 <200ms for reads, <500ms for writes

#### Quality
- **FR-018**: Code MUST pass PHPStan level 5 analysis
- **FR-019**: Code MUST follow PSR-12 coding standard
- **FR-020**: All public methods MUST have proper PHPDoc annotations

### Key Entities *(affected by refactoring)*

- **ProductController**: Split into ProductController, ProductFilterService, ProductCacheService, ColorQueryBuilder
- **MessageController**: Extract to MessageRepository, MessageCacheService, NotificationService
- **OrderController**: Extract to OrderRepository, OrderQueryService
- **User Model**: Extract auth logic to AuthService, profile logic to ProfileService
- **Stock Model**: Move calculations to StockCalculationService

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero high/critical security vulnerabilities in automated scans
- **SC-002**: All target controllers under 400 lines after refactoring
- **SC-003**: Test coverage reaches 40% overall, 80% on critical paths
- **SC-004**: P95 API latency <200ms for product listing, order retrieval endpoints
- **SC-005**: PHPStan level 5 passes with zero errors on new/refactored code
- **SC-006**: All 158 controllers have corresponding Form Request validation (for state-changing operations)
- **SC-007**: N+1 query count reduced by 90% on major endpoints
- **SC-008**: Development velocity improvement measured by PR merge time reduction

### Timeline Estimates

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| US1: Security | 1-2 weeks | Vulnerability fixes, Form Requests |
| US2: Refactoring | 2-3 weeks | Refactored controllers, services |
| US3: Testing | 2-3 weeks | Test suite, 40% coverage |
| US4: Performance | 1-2 weeks | Indexes, caching, optimization |
| US5: Quality | 1 week | PHPStan, CS Fixer, CI updates |
| **Total** | **7-11 weeks** | Production-ready improvements |
