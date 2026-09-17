---
name: specs/001-api-alignment/plan.md
description: Auto-synced from specs/001-api-alignment/plan.md
type: source
sync_origin: specs/001-api-alignment/plan.md
sync_hash: 01cb3034dc8d67ea
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/001-api-alignment/plan.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Implementation Plan: Frontend-Backend API Alignment

**Branch**: `001-api-alignment` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-api-alignment/spec.md`

## Summary

Align all frontend API calls in the Next.js 15 application to match the actual Laravel backend route definitions. This involves correcting ~40 mismatched endpoint paths across messaging (buyer/seller/community), cart, wishlist, auth, reviews, and community domains. Additionally, eliminate cross-domain messaging fallback logic, replace ~40 hardcoded `pro.beldify.com` references with environment-based configuration, and standardize all browser API calls through Next.js proxy routes.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 15 frontend), PHP 8.x (Laravel 10 backend)
**Primary Dependencies**: Next.js 15, Axios, Laravel Sanctum, Pusher/Echo (real-time)
**Storage**: N/A (no schema changes — routing alignment only)
**Testing**: ESLint + contract tests for endpoint verification
**Target Platform**: Web (SSR + client-side)
**Project Type**: Web application (monorepo: beldify-frontend + beldify-backend)
**Performance Goals**: API response times per constitution (<200ms P95 reads, <500ms writes)
**Constraints**: Zero downtime — changes are frontend-only path corrections
**Scale/Scope**: ~42 API route files, ~17 service files, ~40 files with hardcoded URLs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — Readability | PASS | Centralizing API base URL improves readability |
| I. Code Quality — Consistency | PASS | Standardizing all routes to match backend eliminates inconsistency |
| I. Code Quality — Single Responsibility | PASS | No new god objects; each proxy route handles one domain |
| I. Code Quality — Type Safety | PASS | TypeScript strict mode maintained |
| I. Code Quality — Error Handling | PASS | Removing silent fallback logic; explicit error paths |
| II. Testing — Contract Testing | PASS | API contracts between frontend and backend will have dedicated contract definitions |
| III. UX Consistency — Error States | PASS | Users will receive clear errors instead of silent cross-domain fallbacks |
| IV. Performance — API Response Times | PASS | No performance regression; fewer fallback retries improves latency |

**Gate Result**: PASS — no violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-api-alignment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
beldify-frontend/
├── src/
│   ├── app/api/                    # Next.js proxy routes (42 route.ts files)
│   │   ├── messages/               # Buyer/seller/community messaging proxies
│   │   ├── community/              # Community posts and responses proxies
│   │   └── ...                     # Other domain proxies
│   ├── services/                   # Client-side API service layers (17 files)
│   │   ├── api/                    # Typed service modules (cart, wishlist, auth, etc.)
│   │   ├── communityService.ts     # Community messaging + posts
│   │   ├── messagingService.ts     # Cross-domain messaging (to be refactored)
│   │   └── ...
│   ├── config/constants.ts         # Centralized API URL config
│   └── constants/api.ts            # API constants (hardcoded — to be fixed)
└── tests/                          # Contract and integration tests
```

**Structure Decision**: Web application monorepo. Changes are frontend-only, targeting `beldify-frontend/src/app/api/` (proxy routes) and `beldify-frontend/src/services/` (client services). No backend changes.

## Complexity Tracking

No constitution violations — this section is intentionally empty.

