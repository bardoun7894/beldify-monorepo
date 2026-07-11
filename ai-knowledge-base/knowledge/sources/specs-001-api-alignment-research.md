---
name: specs/001-api-alignment/research.md
description: Auto-synced from specs/001-api-alignment/research.md
type: source
sync_origin: specs/001-api-alignment/research.md
sync_hash: 2679b3b3794d115a
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/001-api-alignment/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research: Frontend-Backend API Alignment

**Feature**: 001-api-alignment | **Date**: 2026-01-31

## R1: Hardcoded URL Strategy

**Decision**: Centralize all API base URL references through `beldify-frontend/src/config/constants.ts` using `NEXT_PUBLIC_API_URL` environment variable.

**Rationale**: Currently ~40 files reference `https://pro.beldify.com` — some with env var fallback, some purely hardcoded. A single source of truth eliminates environment-specific bugs and simplifies deployment across staging/production.

**Alternatives considered**:
- Per-file env var checks (current state) — rejected: inconsistent, error-prone
- `.env` only without centralized constant — rejected: still allows drift if files import differently

## R2: Cross-Domain Messaging Fallback

**Decision**: Remove all cross-domain fallback logic. Each messaging UI surface must call exactly one domain-specific proxy route.

**Rationale**: The current `messagingService.ts` tries primary → fallback → local endpoints, and `messages/route.ts` iterates through frontend → buyer → community conversations endpoints. This masks routing bugs and can return data from the wrong domain.

**Alternatives considered**:
- Keep fallback with logging — rejected: still masks bugs, violates single-responsibility
- Circuit breaker pattern — rejected: over-engineering for what should be a simple correct route

## R3: Missing Backend Routes (FR-015)

**Decision**: Defer missing routes (`/api/cart/merge-guest`, `/cart/checkout`, `/api/v1/buyer/messages/shops/{shopId}/check`). Remove frontend calls that depend on non-existent backend routes and add TODO comments for future backend implementation.

**Rationale**: This feature is scoped as frontend-only alignment. Adding backend routes would expand scope significantly. The spec's unanswered clarification (FR-015) defaults to the safest approach: remove broken calls now, implement backend routes in a dedicated feature.

**Alternatives considered**:
- Add backend routes now — rejected: scope creep, requires separate testing and review
- Stub with mock responses — rejected: masks the gap, could ship broken features

## R4: Buyer Message Mark-Read Pattern

**Decision**: Use `POST /api/v1/frontend/messages/mark-read/{messageId}` as the canonical mark-read endpoint for buyer messaging. The frontend must resolve the specific message ID rather than using shop-level read marking.

**Rationale**: Backend only exposes message-ID-based mark-read. The frontend currently sends `PUT /api/v1/buyer/messages/shops/{shopId}/read` which doesn't exist. Aligning to the actual backend route is the correct fix.

**Alternatives considered**:
- Add shop-level mark-read to backend — rejected: out of scope, backend change
- Mark-all-read by conversation — rejected: different semantics, backend doesn't support it for buyer domain

## R5: Community Response Endpoints

**Decision**: Replace frontend CRUD/status calls (`/api/v1/community/responses/{id}` and `/api/v1/community/responses/{id}/status`) with the backend's accept/reject endpoints (`/api/v1/community/posts/{post}/responses/{response}/accept|reject`).

**Rationale**: Backend does not expose generic CRUD or status-change endpoints for responses. The accept/reject pattern is already implemented in the backend and matches the business logic.

**Alternatives considered**:
- Add CRUD endpoints to backend — rejected: out of scope
- Keep frontend calls and ignore errors — rejected: broken user experience

## R6: Auth Profile Endpoint

**Decision**: Use `GET /user/profile` as the canonical profile endpoint (prefixed with API base URL). Remove references to `/api/auth/user`.

**Rationale**: Backend exposes `GET /user/profile` and `POST /user/profile` under sanctum auth. The frontend's `/api/auth/user` path doesn't exist in the backend.

**Alternatives considered**:
- Use `/auth/check` — rejected: returns auth status, not full profile data

## R7: Password Reset Flow

**Decision**: Remove frontend API calls to `/api/auth/forgot-password` and `/api/auth/reset-password`. Redirect users to the web-based password reset flow (`/{locale}/password/reset`).

**Rationale**: Backend only exposes password reset through web (Blade) routes, not API routes. The mobile API has these routes but they're under `/mobile/v1/auth/` prefix, not the frontend API.

**Alternatives considered**:
- Call mobile API endpoints — rejected: different auth middleware and intended audience
- Add API routes to backend — rejected: out of scope

## R8: Next.js Proxy Pattern

**Decision**: All browser-initiated API calls go through Next.js API routes (`/api/*`) which proxy to the Laravel backend. Services should call relative proxy paths, not the backend directly.

**Rationale**: Avoids CORS issues, centralizes auth token handling, and allows server-side cookie management with Sanctum.

**Alternatives considered**:
- Direct browser-to-backend calls — rejected: CORS complications, cookie domain issues
- API gateway — rejected: infrastructure change out of scope

