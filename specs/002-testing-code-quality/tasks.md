# Tasks: Testing Infrastructure & Code Quality Sprint

**Input**: Design documents from `/specs/002-testing-code-quality/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This sprint IS about testing infrastructure, so test tasks are included by nature of the requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `beldify-frontend/src/`
- **Backend**: `beldify-backend/tests/`, `beldify-backend/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install testing dependencies and configure testing framework

- [x] T001 Install Vitest and React Testing Library dependencies in beldify-frontend/package.json
- [x] T002 [P] Create Vitest configuration file at beldify-frontend/vitest.config.ts
- [x] T003 [P] Create Vitest setup file at beldify-frontend/vitest.setup.ts
- [x] T004 [P] Add test scripts to beldify-frontend/package.json (test, test:watch, test:coverage, test:ui)
- [x] T005 [P] Configure path aliases in beldify-frontend/vitest.config.ts to match tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core test utilities that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create test utilities directory structure at beldify-frontend/src/test-utils/
- [x] T007 [P] Create custom render wrapper with providers in beldify-frontend/src/test-utils/index.tsx
- [x] T008 [P] Create mock fixtures directory at beldify-frontend/src/test-utils/fixtures/
- [x] T009 [P] Create mock handlers directory at beldify-frontend/src/test-utils/mocks/
- [x] T010 [P] Create user fixture in beldify-frontend/src/test-utils/fixtures/user.ts
- [x] T011 [P] Create cart fixture in beldify-frontend/src/test-utils/fixtures/cart.ts
- [x] T012 [P] Create products fixture in beldify-frontend/src/test-utils/fixtures/products.ts
- [x] T013 Install MSW (Mock Service Worker) for API mocking in beldify-frontend/package.json
- [x] T014 [P] Configure MSW handlers in beldify-frontend/src/test-utils/mocks/handlers.ts
- [x] T015 [P] Configure MSW server in beldify-frontend/src/test-utils/mocks/server.ts
- [x] T016 Write first example test to verify setup at beldify-frontend/src/test-utils/__tests__/setup.test.tsx
- [x] T017 Run npm test to verify testing framework is working

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Frontend Testing Infrastructure (Priority: P1) MVP

**Goal**: Complete testing infrastructure with CI/CD integration so tests run automatically

**Independent Test**: Run `npm test` and `npm run test:coverage` - both should execute successfully and generate reports

### Implementation for User Story 1

- [x] T018 [US1] Update CI/CD workflow to add test job in .github/workflows/ci.yml
- [x] T019 [P] [US1] Configure coverage thresholds in beldify-frontend/vitest.config.mts (80% lines/functions/branches)
- [x] T020 [P] [US1] Add coverage exclusions for config files and mocks in beldify-frontend/vitest.config.mts
- [x] T021 [US1] Configure coverage reporters (text, json, html) in beldify-frontend/vitest.config.mts
- [x] T022 [P] [US1] Add Codecov integration to CI/CD workflow in .github/workflows/ci.yml
- [x] T023 [US1] Document test running commands in specs/002-testing-code-quality/quickstart.md
- [x] T024 [US1] Verify CI/CD pipeline runs tests and blocks on failure

**Checkpoint**: At this point, User Story 1 should be fully functional - developers can write and run tests

---

## Phase 4: User Story 2 - Critical Path Test Coverage (Priority: P2)

**Goal**: Write comprehensive tests for auth and cart contexts achieving 80% coverage

**Independent Test**: Run `npm run test:coverage` and verify auth and cart contexts show >= 80% line coverage

### AuthContext Tests

- [ ] T025 [P] [US2] Create AuthContext test file at beldify-frontend/src/contexts/__tests__/AuthContext.test.tsx
- [ ] T026 [US2] Write test for successful login flow in AuthContext.test.tsx
- [ ] T027 [P] [US2] Write test for login failure handling in AuthContext.test.tsx
- [ ] T028 [P] [US2] Write test for login network error handling in AuthContext.test.tsx
- [ ] T029 [US2] Write test for logout flow (clear tokens, state reset) in AuthContext.test.tsx
- [ ] T030 [P] [US2] Write test for automatic token refresh in AuthContext.test.tsx
- [ ] T031 [P] [US2] Write test for manual token refresh in AuthContext.test.tsx
- [ ] T032 [P] [US2] Write test for expired token handling in AuthContext.test.tsx
- [ ] T033 [US2] Write test for session persistence (localStorage) in AuthContext.test.tsx
- [ ] T034 [P] [US2] Write test for Google OAuth login flow in AuthContext.test.tsx

### CartContext Tests

- [ ] T035 [P] [US2] Create CartContext test file at beldify-frontend/src/contexts/__tests__/CartContext.test.tsx
- [ ] T036 [US2] Write test for adding single item to cart in CartContext.test.tsx
- [ ] T037 [P] [US2] Write test for adding multiple items to cart in CartContext.test.tsx
- [ ] T038 [P] [US2] Write test for adding duplicate item (quantity increment) in CartContext.test.tsx
- [ ] T039 [US2] Write test for removing item from cart in CartContext.test.tsx
- [ ] T040 [P] [US2] Write test for updating item quantity in CartContext.test.tsx
- [ ] T041 [P] [US2] Write test for clearing entire cart in CartContext.test.tsx
- [ ] T042 [US2] Write test for cart persistence across page reload in CartContext.test.tsx
- [ ] T043 [P] [US2] Write test for cart total calculation in CartContext.test.tsx

### Form Validation Tests

- [ ] T044 [P] [US2] Create form validation test file at beldify-frontend/src/components/__tests__/FormValidation.test.tsx
- [ ] T045 [US2] Write test for required field validation in FormValidation.test.tsx
- [ ] T046 [P] [US2] Write test for email format validation in FormValidation.test.tsx
- [ ] T047 [P] [US2] Write test for password strength validation in FormValidation.test.tsx
- [ ] T048 [US2] Write test for field-level error display in FormValidation.test.tsx
- [ ] T049 [P] [US2] Write test for form-level error display in FormValidation.test.tsx
- [ ] T050 [US2] Write test for successful form submission in FormValidation.test.tsx
- [ ] T051 [P] [US2] Write test for form submission loading state in FormValidation.test.tsx

### Coverage Verification

- [ ] T052 [US2] Run coverage report and verify AuthContext >= 80% line coverage
- [ ] T053 [US2] Run coverage report and verify CartContext >= 80% line coverage

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - testing infra + critical path tests

---

## Phase 5: User Story 3 - Large Component Refactoring (Priority: P3)

**Goal**: Refactor oversized components to under 400 lines while preserving behavior

**Independent Test**: Measure component line counts and verify all existing tests pass after refactoring

### AuthContext Refactoring

- [ ] T054 [US3] Write characterization tests for current AuthContext behavior in beldify-frontend/src/contexts/__tests__/AuthContext.characterization.test.tsx
- [ ] T055 [US3] Create auth directory structure at beldify-frontend/src/contexts/auth/
- [ ] T056 [P] [US3] Extract token management to beldify-frontend/src/contexts/auth/useTokenManager.ts
- [ ] T057 [P] [US3] Write tests for useTokenManager hook in beldify-frontend/src/contexts/auth/__tests__/useTokenManager.test.ts
- [ ] T058 [P] [US3] Extract Google OAuth to beldify-frontend/src/contexts/auth/useGoogleAuth.ts
- [ ] T059 [P] [US3] Write tests for useGoogleAuth hook in beldify-frontend/src/contexts/auth/__tests__/useGoogleAuth.test.ts
- [ ] T060 [P] [US3] Extract auth API calls to beldify-frontend/src/contexts/auth/authApi.ts
- [ ] T061 [P] [US3] Extract TypeScript types to beldify-frontend/src/contexts/auth/authTypes.ts
- [ ] T062 [US3] Update AuthContext.tsx to use extracted modules (target: <200 lines)
- [ ] T063 [US3] Run all auth tests to verify no regression after refactoring
- [ ] T064 [US3] Verify AuthContext.tsx is under 400 lines

### Navbar Refactoring

- [ ] T065 [US3] Write characterization tests for current Navbar behavior in beldify-frontend/src/components/layout/__tests__/Navbar.characterization.test.tsx
- [ ] T066 [US3] Create navbar directory structure at beldify-frontend/src/components/layout/navbar/
- [ ] T067 [P] [US3] Extract NavSearch component to beldify-frontend/src/components/layout/navbar/NavSearch.tsx
- [ ] T068 [P] [US3] Extract NavUserMenu component to beldify-frontend/src/components/layout/navbar/NavUserMenu.tsx
- [ ] T069 [P] [US3] Extract NavCart component to beldify-frontend/src/components/layout/navbar/NavCart.tsx
- [ ] T070 [P] [US3] Extract NavWishlist component to beldify-frontend/src/components/layout/navbar/NavWishlist.tsx
- [ ] T071 [P] [US3] Extract NavLanguage component to beldify-frontend/src/components/layout/navbar/NavLanguage.tsx
- [ ] T072 [P] [US3] Extract NavMobile component to beldify-frontend/src/components/layout/navbar/NavMobile.tsx
- [ ] T073 [US3] Update Navbar.tsx to use extracted components (target: <200 lines)
- [ ] T074 [US3] Run all navbar tests to verify no regression after refactoring
- [ ] T075 [US3] Verify Navbar.tsx is under 400 lines

### MegaOffers Refactoring (Optional - if time permits)

- [ ] T076 [P] [US3] Write characterization tests for MegaOffers in beldify-frontend/src/components/__tests__/MegaOffers.characterization.test.tsx
- [ ] T077 [US3] Create megaoffers directory at beldify-frontend/src/components/mega-offers/
- [ ] T078 [P] [US3] Extract OfferCard component to beldify-frontend/src/components/mega-offers/OfferCard.tsx
- [ ] T079 [P] [US3] Extract OfferFilters component to beldify-frontend/src/components/mega-offers/OfferFilters.tsx
- [ ] T080 [US3] Update MegaOffers.tsx to use extracted components (target: <300 lines)
- [ ] T081 [US3] Verify MegaOffers.tsx is under 400 lines

**Checkpoint**: All refactored components should be under 400 lines with passing tests

---

## Phase 6: User Story 4 - Backend Test Coverage Expansion (Priority: P4)

**Goal**: Add comprehensive tests for backend services achieving 30% coverage increase

**Independent Test**: Run `php artisan test --coverage` and compare to baseline

### CommissionService Tests

- [ ] T082 [P] [US4] Create CommissionService unit test file at beldify-backend/tests/Unit/Services/CommissionServiceTest.php
- [ ] T083 [US4] Write test for standard commission calculation in CommissionServiceTest.php
- [ ] T084 [P] [US4] Write test for zero amount edge case in CommissionServiceTest.php
- [ ] T085 [P] [US4] Write test for maximum amount edge case in CommissionServiceTest.php
- [ ] T086 [P] [US4] Write test for multi-tier commission structure in CommissionServiceTest.php
- [ ] T087 [US4] Write test for commission type variations in CommissionServiceTest.php

### CommissionAccountingService Tests

- [ ] T088 [P] [US4] Create CommissionAccountingService test file at beldify-backend/tests/Unit/Services/CommissionAccountingServiceTest.php
- [ ] T089 [US4] Write test for accounting entry creation in CommissionAccountingServiceTest.php
- [ ] T090 [P] [US4] Write test for audit trail generation in CommissionAccountingServiceTest.php

### MessageService Tests

- [ ] T091 [P] [US4] Create MessageService unit test file at beldify-backend/tests/Unit/Services/MessageServiceTest.php
- [ ] T092 [US4] Write test for message creation in MessageServiceTest.php
- [ ] T093 [P] [US4] Write test for message retrieval in MessageServiceTest.php
- [ ] T094 [P] [US4] Write test for seller/buyer conversation flow in MessageServiceTest.php
- [ ] T095 [US4] Write test for message notification triggers in MessageServiceTest.php

### CacheService Tests

- [ ] T096 [P] [US4] Create CacheService unit test file at beldify-backend/tests/Unit/Services/CacheServiceTest.php
- [ ] T097 [US4] Write test for cache get/set operations in CacheServiceTest.php
- [ ] T098 [P] [US4] Write test for cache invalidation in CacheServiceTest.php
- [ ] T099 [P] [US4] Write test for fallback behavior when cache is unavailable in CacheServiceTest.php

### Feature Tests

- [ ] T100 [P] [US4] Create auth endpoints feature test at beldify-backend/tests/Feature/Api/AuthControllerTest.php
- [ ] T101 [US4] Write feature test for login endpoint in AuthControllerTest.php
- [ ] T102 [P] [US4] Write feature test for logout endpoint in AuthControllerTest.php
- [ ] T103 [P] [US4] Write feature test for token refresh endpoint in AuthControllerTest.php

### Coverage Verification

- [ ] T104 [US4] Run backend coverage report and compare to baseline
- [ ] T105 [US4] Verify backend coverage increased by at least 30 percentage points

**Checkpoint**: Backend test coverage significantly improved with all new tests passing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [ ] T106 [P] Update README.md with testing instructions
- [ ] T107 [P] Create TESTING.md documentation file in beldify-frontend/
- [ ] T108 Add code review checklist item for test presence verification
- [ ] T109 [P] Clean up any unused test utilities or fixtures
- [ ] T110 Run full test suite (frontend + backend) and verify all tests pass
- [ ] T111 Verify CI/CD pipeline completes successfully with all test jobs
- [ ] T112 Run quickstart.md validation commands

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) - Can proceed after foundation ready
- **US2 (Phase 4)**: Depends on US1 (testing infrastructure must be working)
- **US3 (Phase 5)**: Depends on US2 (tests must exist before refactoring)
- **US4 (Phase 6)**: Can run in parallel with US2/US3 (backend independent of frontend)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational only - MVP deliverable
- **User Story 2 (P2)**: Requires US1 (needs testing framework)
- **User Story 3 (P3)**: Requires US2 (needs tests before refactoring)
- **User Story 4 (P4)**: Foundational only - can run in parallel with US2/US3

### Within Each User Story

- Characterization tests MUST be written before refactoring
- Unit tests before integration tests
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- US4 (backend) can run in parallel with US2 and US3 (frontend)
- Tests within a story marked [P] can run in parallel
- Component extractions within US3 marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch AuthContext tests in parallel:
Task: "Write test for login failure handling in AuthContext.test.tsx"
Task: "Write test for login network error handling in AuthContext.test.tsx"
Task: "Write test for automatic token refresh in AuthContext.test.tsx"
Task: "Write test for manual token refresh in AuthContext.test.tsx"
Task: "Write test for expired token handling in AuthContext.test.tsx"
Task: "Write test for Google OAuth login flow in AuthContext.test.tsx"
```

## Parallel Example: User Story 3 - Navbar Extraction

```bash
# Launch all navbar sub-component extractions in parallel:
Task: "Extract NavSearch component to beldify-frontend/src/components/layout/navbar/NavSearch.tsx"
Task: "Extract NavUserMenu component to beldify-frontend/src/components/layout/navbar/NavUserMenu.tsx"
Task: "Extract NavCart component to beldify-frontend/src/components/layout/navbar/NavCart.tsx"
Task: "Extract NavWishlist component to beldify-frontend/src/components/layout/navbar/NavWishlist.tsx"
Task: "Extract NavLanguage component to beldify-frontend/src/components/layout/navbar/NavLanguage.tsx"
Task: "Extract NavMobile component to beldify-frontend/src/components/layout/navbar/NavMobile.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T017)
3. Complete Phase 3: User Story 1 (T018-T024)
4. **STOP and VALIDATE**: Verify `npm test` works and CI runs tests
5. Deploy/demo if ready - developers can now write tests!

### Incremental Delivery

1. Complete Setup + Foundational + US1 → Testing infrastructure ready (MVP!)
2. Add User Story 2 → Critical path tests with 80% coverage
3. Add User Story 3 → Refactored components under 400 lines
4. Add User Story 4 → Backend test coverage improved 30%
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (frontend testing infra)
   - Developer B: User Story 4 (backend tests - can start immediately)
3. After US1 completes:
   - Developer A: User Story 2 (critical path tests)
   - Developer B: Continues US4
4. After US2 completes:
   - Developer A: User Story 3 (refactoring)
   - Developer B: Finish US4

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Test-first for refactoring: Write characterization tests BEFORE any code changes
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Phase 1: Setup | 5 | 4 |
| Phase 2: Foundational | 12 | 9 |
| Phase 3: US1 - Testing Infra | 7 | 3 |
| Phase 4: US2 - Critical Path Tests | 29 | 20 |
| Phase 5: US3 - Refactoring | 28 | 17 |
| Phase 6: US4 - Backend Tests | 24 | 16 |
| Phase 7: Polish | 7 | 3 |
| **Total** | **112** | **72** |
