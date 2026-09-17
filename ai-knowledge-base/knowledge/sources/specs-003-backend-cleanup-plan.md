---
name: specs/003-backend-cleanup/plan.md
description: Auto-synced from specs/003-backend-cleanup/plan.md
type: source
sync_origin: specs/003-backend-cleanup/plan.md
sync_hash: 1009196a4531dbb2
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/003-backend-cleanup/plan.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Implementation Plan: Laravel Backend Cleanup & Refactoring

**Branch**: `003-backend-cleanup` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-backend-cleanup/spec.md`

## Summary

Comprehensive refactoring of the Beldify Laravel backend to address security vulnerabilities, reduce controller complexity, expand test coverage to 40%, optimize database performance, and establish code quality infrastructure. The approach prioritizes security fixes first, followed by incremental refactoring with tests to prevent regression.

## Technical Context

**Language/Version**: PHP 8.1+ with Laravel 10.x
**Primary Dependencies**:
- Laravel Sanctum (API authentication)
- Spatie Laravel Permission (RBAC)
- Laravel Firebase FCM (notifications)
- AWS S3 SDK (storage)
- DataTables (admin interfaces)

**Storage**: MySQL 8.0+, Redis (caching)
**Testing**: PHPUnit with Pest, Laravel HTTP Tests
**Target Platform**: Linux server (production), Docker (development)
**Project Type**: Web API backend

**Performance Goals**:
- P95 API latency <200ms for reads, <500ms for writes
- Support 2x expected peak load (per constitution)
- Cache hit rate >80% on product queries

**Constraints**:
- Maintain backward compatibility with existing frontend
- No breaking API changes without versioning
- Zero downtime deployments

**Scale/Scope**:
- 158 controllers, 119 models, 27 services
- 1,175 PHP files total
- Multi-tenant (store/seller architecture)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Current State | Plan Compliance | Action Required |
|-----------|---------------|-----------------|-----------------|
| **I. Code Quality** | Controllers avg 270 lines, incomplete repository pattern | Will reduce to <150 avg, complete repository pattern | Refactor target controllers |
| - Readability | Inconsistent naming | Will standardize | Apply naming conventions |
| - Single Responsibility | Violated in large controllers | Will extract services | Create ProductFilterService, etc. |
| - Type Safety | Partial typing | Will add strict types | PHPStan level 5 enforcement |
| - Error Handling | Inconsistent | Will standardize | Create error handling traits |
| **II. Testing Standards** | 5-10% coverage | Will achieve 40%+ | Add unit, integration, contract tests |
| - Test-First | Not practiced | Will implement for new code | Document TDD workflow |
| - Coverage Requirements | Below 80% | Target 80% on critical paths | Focus on auth, orders, payments |
| - Test Naming | Inconsistent | Will standardize | Use "should...when" pattern |
| **III. User Experience** | N/A (backend) | API consistency | Standardize response formats |
| **IV. Performance** | N+1 queries, missing indexes | Will optimize | Add indexes, eager loading |
| - API Response Times | Unknown baseline | Will benchmark | Target <200ms P95 |
| - Database Queries | N+1 queries present | Will eliminate | Use eager loading |

**Gate Status**: PASS with required actions documented above

## Project Structure

### Documentation (this feature)

```text
specs/003-backend-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Refactoring targets
├── quickstart.md        # Phase 1: Development setup
├── contracts/           # Phase 1: API documentation updates
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
beldify-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/         # 158 controllers (refactoring target)
│   │   │   ├── Admin/           # Admin panel controllers
│   │   │   ├── API/             # API controllers (versioned)
│   │   │   │   ├── Backend/     # Seller-facing API
│   │   │   │   ├── Frontend/    # Customer-facing API
│   │   │   │   └── Mobile/      # Mobile app API
│   │   │   ├── Seller/          # Seller dashboard controllers
│   │   │   └── User/            # User account controllers
│   │   ├── Middleware/          # 23 middleware classes
│   │   └── Requests/            # Form Requests (expansion target)
│   │       └── [NEW]            # Add 50+ new Form Requests
│   ├── Models/                  # 119 models (cleanup target)
│   ├── Services/                # 27 services (expansion target)
│   │   ├── [NEW] ProductFilterService.php
│   │   ├── [NEW] ProductCacheService.php
│   │   ├── [NEW] MessageRepository.php
│   │   ├── [NEW] OrderRepository.php
│   │   └── ...
│   └── Repositories/            # 6 repositories (expansion target)
│       ├── [NEW] UserRepository.php
│       ├── [NEW] StoreRepository.php
│       └── ...
├── database/
│   └── migrations/              # 170 migrations + new index migrations
├── tests/
│   ├── Unit/                    # Expand from 1 to 50+ tests
│   │   ├── Services/            # [NEW] Service unit tests
│   │   └── Repositories/        # [NEW] Repository unit tests
│   └── Feature/                 # Expand from 9 to 30+ tests
│       ├── API/                 # [NEW] API contract tests
│       └── Integration/         # [NEW] Integration tests
├── phpstan.neon                 # [NEW] Static analysis config
├── .php-cs-fixer.php            # [NEW] Code style config
└── phpunit.xml                  # Update coverage settings
```

**Structure Decision**: Maintain existing Laravel structure, expand Services and Repositories directories with new extracted classes. Add comprehensive test structure.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern for all refactored controllers | Testability and single responsibility | Direct Eloquent in controllers prevents proper unit testing and leads to code duplication |
| PHPStan baseline file for existing code | Cannot fix all 1000+ violations immediately | Enforcing strict types on legacy code would block all development |
| Multiple service classes per domain | Complex business logic requires separation | Single service per domain would recreate the "god class" problem |

## Phase 0: Research Summary

### Security Research Findings

1. **Command Injection Fix**
   - **Decision**: Replace `exec()` calls with Laravel `Process` facade
   - **Rationale**: Process facade provides proper escaping and timeout handling
   - **Files**: `app/Console/Commands/SafeProductionSeed.php`

2. **Input Validation Strategy**
   - **Decision**: Create Form Request for every controller action that modifies state
   - **Rationale**: Centralized validation, reusable rules, automatic 422 responses
   - **Alternatives**: Inline validation rejected due to code duplication

3. **Authorization Middleware**
   - **Decision**: Use Spatie Permission middleware on all routes
   - **Rationale**: Already integrated, consistent with existing auth patterns
   - **Files**: `routes/api.php`, `routes/web.php`

### Refactoring Research Findings

1. **Controller Extraction Pattern**
   - **Decision**: Extract to Service + Repository layers
   - **Rationale**: Matches existing partial implementation, testable, maintainable
   - **Pattern**:
     ```
     Controller → Service (business logic) → Repository (data access)
     ```

2. **Query Builder Extraction**
   - **Decision**: Create QueryBuilder classes for complex filtering
   - **Rationale**: ProductController color filtering is 200+ lines, reusable elsewhere
   - **Files**: New `app/QueryBuilders/ProductQueryBuilder.php`

3. **Caching Strategy**
   - **Decision**: Service-level caching with Redis, tag-based invalidation
   - **Rationale**: Controller-level caching is inconsistent, hard to invalidate
   - **Pattern**:
     ```php
     Cache::tags(['products'])->remember($key, $ttl, fn() => $repository->find(...))
     ```

### Testing Research Findings

1. **Test Framework**
   - **Decision**: PHPUnit with Pest syntax for new tests
   - **Rationale**: Pest provides cleaner syntax, PHPUnit compatibility maintained
   - **Setup**: Add `pestphp/pest` to dev dependencies

2. **Database Testing**
   - **Decision**: Use RefreshDatabase trait with factories
   - **Rationale**: Isolated tests, reproducible state
   - **Setup**: Create factories for all models

3. **API Testing**
   - **Decision**: Laravel HTTP tests with JSON assertions
   - **Rationale**: Built-in, fast, validates response structure
   - **Coverage**: All API endpoints

### Performance Research Findings

1. **Index Strategy**
   - **Decision**: Add indexes on foreign keys, status columns, timestamps
   - **Priority Columns**: `user_id`, `store_id`, `product_id`, `status`, `created_at`
   - **Implementation**: New migration per table group

2. **N+1 Elimination**
   - **Decision**: Default eager loading in repositories, explicit `with()` in queries
   - **High-Impact**: `Stock` model `$appends` causing N+1, convert to lazy loading
   - **Measurement**: Enable query logging in tests to detect N+1

3. **Caching Layer**
   - **Decision**: Redis with 15-minute TTL for listings, instant invalidation on write
   - **Rationale**: Balance between freshness and performance
   - **Invalidation**: Tag-based clearing on relevant model events

## Phase 1: Design Artifacts

### Refactoring Targets

#### 1. ProductController (1,591 → <400 lines)

**Current Structure**:
```
ProductController.php (1,591 lines)
├── index() - 300+ lines (filtering, pagination, mapping)
├── show() - 100+ lines
├── store() - 150+ lines
├── update() - 150+ lines
├── colorFiltering() - 200+ lines (nested loops, raw SQL)
└── ...10+ more methods
```

**Target Structure**:
```
ProductController.php (<300 lines)
├── Uses ProductService
├── Uses ProductRepository
└── Thin controller methods

ProductService.php (~200 lines)
├── getFilteredProducts()
├── createProduct()
├── updateProduct()
└── Business logic

ProductRepository.php (~150 lines)
├── findWithRelations()
├── paginateWithFilters()
└── Data access

ProductQueryBuilder.php (~100 lines)
├── applyFilters()
├── applyColorFilter()
└── Complex query building

ProductCacheService.php (~80 lines)
├── getCachedList()
├── invalidateProduct()
└── Cache management
```

#### 2. MessageController (1,050 → <400 lines)

**Current**: Duplicated across 3 files (API, Backend, Seller)
**Target**: Single MessageRepository + MessageService used by all controllers

#### 3. OrderController (941 → <400 lines)

**Current**: Multi-guard logic, complex queries, caching
**Target**: OrderRepository + OrderService with guard-agnostic methods

### New Service Classes

| Service | Responsibility | Extracted From |
|---------|---------------|----------------|
| ProductFilterService | Product filtering logic | ProductController |
| ProductCacheService | Product caching | ProductController |
| ColorQueryBuilder | Color filtering | ProductController |
| MessageRepository | Message CRUD | MessageController (3 files) |
| OrderRepository | Order queries | OrderController |
| InvoiceService | Invoice generation | InvoiceControllers (2 files) |
| AuthService | Auth logic | User model |
| ProfileService | Profile logic | User model |

### Form Requests to Create

**Priority 1 (Security-Critical)**:
- `LoginRequest`, `RegisterRequest`
- `CreateOrderRequest`, `UpdateOrderRequest`
- `CreateProductRequest`, `UpdateProductRequest`
- `PaymentRequest`, `RefundRequest`

**Priority 2 (Data Integrity)**:
- `CreateStoreRequest`, `UpdateStoreRequest`
- `CreateReviewRequest`
- `MessageRequest`
- `AddToCartRequest`, `UpdateCartRequest`

**Priority 3 (Completeness)**:
- All remaining state-changing endpoints (~30 more)

### Database Indexes to Add

```sql
-- Priority 1: Foreign Keys
ALTER TABLE orders ADD INDEX idx_orders_user_id (user_id);
ALTER TABLE orders ADD INDEX idx_orders_store_id (store_id);
ALTER TABLE products ADD INDEX idx_products_category_id (category_id);
ALTER TABLE stocks ADD INDEX idx_stocks_product_id (product_id);
ALTER TABLE messages ADD INDEX idx_messages_conversation_id (conversation_id);

-- Priority 2: Status and Filters
ALTER TABLE orders ADD INDEX idx_orders_status (status);
ALTER TABLE products ADD INDEX idx_products_status (status);
ALTER TABLE stocks ADD INDEX idx_stocks_quantity (quantity);

-- Priority 3: Timestamps and Composite
ALTER TABLE orders ADD INDEX idx_orders_created_at (created_at);
ALTER TABLE products ADD INDEX idx_products_store_status (store_id, status);
```

## Implementation Strategy

### Phase Execution Order

1. **Phase 1: Security (Week 1-2)**
   - Fix command injection vulnerabilities
   - Add Form Requests for critical endpoints
   - Apply authorization middleware

2. **Phase 2: Testing Foundation (Week 2-3)**
   - Set up PHPUnit/Pest configuration
   - Create model factories
   - Write characterization tests for target controllers

3. **Phase 3: Refactoring (Week 3-6)**
   - Extract services and repositories
   - Refactor one controller at a time
   - Maintain test coverage throughout

4. **Phase 4: Performance (Week 6-7)**
   - Add database indexes
   - Implement caching layer
   - Optimize N+1 queries

5. **Phase 5: Quality Infrastructure (Week 7-8)**
   - Configure PHPStan
   - Configure PHP CS Fixer
   - Update CI pipeline

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Characterization tests before refactoring |
| Performance regression | Benchmark before/after each change |
| Incomplete migration | Feature flags for gradual rollout |
| Team adoption | Document patterns, provide examples |

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Security vulnerabilities | 5+ high/critical | 0 | Automated scan |
| Avg controller lines | 270 | <150 | LOC analysis |
| Test coverage | 5-10% | 40% | PHPUnit coverage |
| API P95 latency | Unknown | <200ms | Application monitoring |
| PHPStan errors | 1000+ | 0 (new code) | CI pipeline |
| Form Request coverage | 8% (12/158) | 100% (state-changing) | Code audit |

