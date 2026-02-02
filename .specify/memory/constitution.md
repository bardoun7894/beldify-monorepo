<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0 (initial ratification)

Modified principles: N/A (initial creation)

Added sections:
  - Core Principles (4 principles)
  - Performance Standards
  - Development Workflow
  - Governance

Removed sections: N/A

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (already aligned - Constitution Check section present)
  - .specify/templates/spec-template.md ✅ (already aligned - testing scenarios, success criteria)
  - .specify/templates/tasks-template.md ✅ (already aligned - test-first guidance, phase structure)
  - .specify/templates/commands/*.md ⚠ (no files found - none to update)

Follow-up TODOs: None
-->

# Beldify Constitution

## Core Principles

### I. Code Quality

All code MUST adhere to consistent quality standards across both backend and frontend:

- **Readability**: Code MUST be self-documenting with clear naming conventions; comments
  explain "why" not "what"
- **Consistency**: All modules MUST follow established project style guides enforced via
  automated linting (ESLint, Prettier, or language-equivalent)
- **Single Responsibility**: Each function, class, or module MUST have one clear purpose;
  no god objects or functions exceeding 50 lines without justification
- **Type Safety**: TypeScript strict mode (frontend) and typed Python/language-equivalent
  (backend) MUST be enforced; no `any` types without documented justification
- **Error Handling**: All error paths MUST be explicitly handled; no silent failures;
  errors MUST propagate with context

**Rationale**: Consistent code quality reduces cognitive load, accelerates onboarding,
and minimizes defect introduction.

### II. Testing Standards

Testing is MANDATORY for all production code:

- **Test-First Development**: Tests MUST be written before implementation for new features;
  Red-Green-Refactor cycle enforced
- **Coverage Requirements**: Minimum 80% line coverage for new code; critical paths
  (auth, payments, data mutations) MUST have 100% coverage
- **Test Pyramid**: Unit tests form the base (fast, isolated); integration tests verify
  component boundaries; E2E tests cover critical user journeys only
- **Contract Testing**: API contracts between frontend and backend MUST have dedicated
  contract tests; schema changes MUST not break existing consumers
- **Test Naming**: Tests MUST follow "should [expected behavior] when [condition]" pattern

**Rationale**: Comprehensive testing prevents regressions, enables confident refactoring,
and serves as living documentation.

### III. User Experience Consistency

All user-facing interfaces MUST provide a cohesive, predictable experience:

- **Design System Adherence**: All UI components MUST use shared design tokens (colors,
  spacing, typography); no inline magic values
- **Responsive Behavior**: All interfaces MUST function correctly on mobile (320px),
  tablet (768px), and desktop (1024px+) breakpoints
- **Accessibility**: WCAG 2.1 AA compliance MANDATORY; all interactive elements MUST
  be keyboard-navigable; images MUST have alt text
- **Loading States**: All async operations MUST display loading indicators; skeleton
  screens preferred over spinners for content areas
- **Error States**: Users MUST receive clear, actionable error messages; never expose
  raw technical errors

**Rationale**: Consistent UX builds user trust, reduces support burden, and ensures
inclusive access for all users.

### IV. Performance Requirements

All code MUST meet defined performance thresholds:

- **API Response Times**: P95 latency MUST be <200ms for read operations, <500ms for
  write operations; violations require optimization or caching
- **Frontend Metrics**: Largest Contentful Paint <2.5s, First Input Delay <100ms,
  Cumulative Layout Shift <0.1 (Core Web Vitals)
- **Bundle Size**: Frontend JavaScript bundle MUST NOT exceed 250KB gzipped for initial
  load; lazy loading MANDATORY for non-critical paths
- **Database Queries**: No N+1 queries permitted; all queries MUST use indexes; queries
  exceeding 100ms require review
- **Memory**: Backend services MUST NOT exceed allocated memory limits; memory leaks
  constitute blocking defects

**Rationale**: Performance directly impacts user satisfaction, conversion rates, and
infrastructure costs.

## Performance Standards

**Monitoring and Compliance**:

- All production services MUST expose metrics endpoints for performance monitoring
- Performance budgets MUST be validated in CI pipeline before merge
- Baseline performance tests MUST run on every deployment
- Performance regressions >10% from baseline MUST block deployment

**Load Testing**:

- Critical paths MUST be load-tested before major releases
- System MUST handle 2x expected peak load without degradation
- Graceful degradation strategies MUST be defined for overload scenarios

## Development Workflow

**Code Review Requirements**:

- All changes MUST be reviewed by at least one other developer
- Reviews MUST verify principle compliance (quality, testing, UX, performance)
- No merge without passing CI (lint, tests, build, performance budget)

**Quality Gates**:

| Gate | Requirement | Blocking |
|------|-------------|----------|
| Lint | Zero errors | Yes |
| Tests | All pass, coverage met | Yes |
| Build | Successful compilation | Yes |
| Performance | Within budget | Yes |
| Review | Approved by 1+ reviewer | Yes |

**Definition of Done**:

A feature is complete when:
1. All acceptance criteria from spec are met
2. Tests written and passing
3. Code reviewed and approved
4. Performance validated against budget
5. Documentation updated (if applicable)
6. Deployed to staging and verified

## Governance

**Constitution Authority**:

This constitution supersedes all other development practices and conventions. In case
of conflict, constitution principles take precedence.

**Amendment Procedure**:

1. Proposed changes MUST be documented with rationale
2. All team members MUST be notified of proposed amendments
3. Changes require majority approval from active contributors
4. Approved changes MUST include migration plan for existing code
5. Version number increments according to semantic versioning:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or material expansion
   - PATCH: Clarifications and non-semantic refinements

**Compliance Review**:

- All pull requests MUST be checked against constitution principles
- Violations MUST be documented in Complexity Tracking if justified
- Unjustified violations MUST be resolved before merge

**Version**: 1.0.0 | **Ratified**: 2026-01-26 | **Last Amended**: 2026-01-26
