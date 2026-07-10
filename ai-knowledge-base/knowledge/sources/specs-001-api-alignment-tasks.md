---
name: specs/001-api-alignment/tasks.md
description: Auto-synced from specs/001-api-alignment/tasks.md
type: source
sync_origin: specs/001-api-alignment/tasks.md
sync_hash: c5ee6d65f33424c6
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/001-api-alignment/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks: Frontend-Backend API Alignment

**Input**: Design documents from `/specs/001-api-alignment/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `beldify-frontend/src/` for all changes (frontend-only feature)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Centralize API base URL configuration — prerequisite for all endpoint corrections

- [x] T001 Update `beldify-frontend/src/config/constants.ts` to export `API_BASE_URL` from `NEXT_PUBLIC_API_URL` without hardcoded fallback to `pro.beldify.com`
- [x] T002 Update `beldify-frontend/src/constants/api.ts` to import and re-export from `config/constants.ts` instead of hardcoding `API_BASE_URL`
- [x] T003 Update `beldify-frontend/src/services/axiosInstance.ts` to use centralized `API_BASE_URL` from `config/constants.ts` instead of hardcoded URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Remove cross-domain fallback logic and standardize proxy base URL usage across all messaging routes

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Remove multi-endpoint fallback logic (primary/fallback/local) from `beldify-frontend/src/services/messagingService.ts` — replace with single domain-aware API call pattern using centralized `API_BASE_URL`
- [x] T005 Remove cross-domain conversation fallback loop (frontend→buyer→community) from `beldify-frontend/src/app/api/messages/route.ts` GET handler (lines 37-74)
- [x] T006 [P] Replace hardcoded `pro.beldify.com` in `beldify-frontend/src/services/communityService.ts` with centralized `API_BASE_URL`
- [x] T007 [P] Replace hardcoded `pro.beldify.com` in `beldify-frontend/src/services/tailorService.ts` with centralized `API_BASE_URL`
- [x] T008 [P] Replace hardcoded `pro.beldify.com` in `beldify-frontend/src/contexts/RealtimeChatContext.tsx` with centralized `API_BASE_URL`

**Checkpoint**: Foundation ready — all files use centralized URL config, no fallback logic remains

---

## Phase 3: User Story 1 — Buyer Messaging Works End-to-End (Priority: P1) 🎯 MVP

**Goal**: All buyer messaging proxy routes call the correct backend endpoints

**Independent Test**: Log in as buyer, list conversations, send message, mark read, check unread count — all succeed without 404s

### Implementation for User Story 1

- [x] T009 [US1] Update `beldify-frontend/src/app/api/messages/route.ts` GET to proxy to `GET /api/v1/buyer/messages/shops` (not `/conversations`)
- [x] T010 [US1] Update `beldify-frontend/src/app/api/messages/unread/route.ts` to proxy to `GET /api/v1/buyer/messages/unread-count` (not `/unread`)
- [x] T011 [US1] Update `beldify-frontend/src/app/api/messages/send/route.ts` to proxy to `POST /api/v1/buyer/messages/send` using centralized URL
- [x] T012 [US1] Update `beldify-frontend/src/app/api/messages/[shopId]/route.ts` GET to proxy to `GET /api/v1/buyer/messages/shops/{shopId}`
- [x] T013 [US1] Update `beldify-frontend/src/app/api/messages/[shopId]/route.ts` PUT (mark-read) to proxy to `PUT /api/v1/frontend/messages/mark-read/{messageId}` — convert shop-level read to message-ID-based read
- [x] T014 [US1] Update `beldify-frontend/src/app/api/messages/shops/[shopId]/route.ts` to proxy to `GET /api/v1/buyer/messages/shops/{shopId}` using centralized URL
- [x] T015 [US1] Remove or stub `beldify-frontend/src/app/api/messages/[shopId]/check/route.ts` — backend route does not exist for buyer domain (add TODO comment for future backend implementation)

**Checkpoint**: Buyer messaging fully functional and testable independently

---

## Phase 4: User Story 2 — Cart and Checkout Operations Are Consistent (Priority: P1)

**Goal**: All cart operations use correct backend endpoints and payload shapes

**Independent Test**: Add item to cart, apply coupon, remove coupon — all calls succeed

### Implementation for User Story 2

- [x] T016 [US2] Update `beldify-frontend/src/services/api/cartService.ts` coupon apply to use `POST /cart/apply-coupon` (not `POST /api/cart/coupon`)
- [x] T017 [US2] Update `beldify-frontend/src/services/api/cartService.ts` coupon remove to use `POST /cart/remove-coupon` (not `DELETE /api/cart/coupon`)
- [x] T018 [US2] Update `beldify-frontend/src/services/api.ts` coupon endpoints to match `apply-coupon` and `remove-coupon` paths
- [x] T019 [US2] Update `beldify-frontend/src/app/wishlist/page.tsx` cart add to use `POST /cart/items` with stock/variant payload (not `POST /api/cart`)
- [x] T020 [US2] Update `beldify-frontend/src/services/api/cartService.ts` add-to-cart to use `POST /cart/items` with stock and variant details
- [x] T021 [US2] Remove or stub `merge-guest` call in `beldify-frontend/src/services/api/cartService.ts` — backend route does not exist (add TODO comment)
- [x] T022 [US2] Remove or stub `checkout` call in `beldify-frontend/src/services/api.ts` — backend route does not exist (add TODO comment)

**Checkpoint**: Cart operations fully functional and testable independently

---

## Phase 5: User Story 3 — Community Posts and Responses Work Correctly (Priority: P2)

**Goal**: All community CRUD and response accept/reject use versioned backend endpoints

**Independent Test**: Create post, update it, accept a response, delete post — all calls use `/api/v1/community/*`

### Implementation for User Story 3

- [x] T023 [P] [US3] Update `beldify-frontend/src/app/api/community/posts/route.ts` POST to proxy to `POST /api/v1/community/posts`
- [x] T024 [P] [US3] Update `beldify-frontend/src/app/api/community/posts/[id]/route.ts` PUT/DELETE to proxy to `/api/v1/community/posts/{id}`
- [x] T025 [P] [US3] Update `beldify-frontend/src/app/api/community/user-posts/route.ts` to proxy to `GET /api/v1/community/posts` (not `${NEXT_PUBLIC_API_URL}/community/posts`)
- [x] T026 [US3] Replace `beldify-frontend/src/app/api/community/responses/[id]/route.ts` CRUD calls with accept/reject pattern — proxy to `POST /api/v1/community/posts/{post}/responses/{response}/accept` and `/reject`
- [x] T027 [US3] Replace `beldify-frontend/src/app/api/community/responses/[id]/status/route.ts` status-change calls with accept/reject — or remove if redundant with T026

**Checkpoint**: Community posts and responses fully functional and testable independently

---

## Phase 6: User Story 4 — Wishlist Operations Are Aligned (Priority: P2)

**Goal**: Wishlist list/add/remove use correct backend endpoints

**Independent Test**: Add product to wishlist, list items, remove product — all calls succeed

### Implementation for User Story 4

- [x] T028 [US4] Update `beldify-frontend/src/services/api/wishlistService.ts` list to use `GET /wishlist` (not `GET /api/wishlist/items`)
- [x] T029 [US4] Update `beldify-frontend/src/services/api/wishlistService.ts` add to use `POST /wishlist` (not `POST /api/wishlist/items`)
- [x] T030 [US4] Update `beldify-frontend/src/services/api/wishlistService.ts` remove to use `DELETE /wishlist/{productId}` (not `DELETE /api/wishlist/items/{id}`)

**Checkpoint**: Wishlist fully functional and testable independently

---

## Phase 7: User Story 5 — Auth and Profile Endpoints Are Correct (Priority: P2)

**Goal**: Profile fetch uses correct backend endpoint; password reset handled gracefully

**Independent Test**: Log in, fetch profile — returns data from correct endpoint

### Implementation for User Story 5

- [x] T031 [US5] Update `beldify-frontend/src/services/api/authService.ts` profile fetch to use `GET /user/profile` (not `GET /api/auth/user`)
- [x] T032 [US5] Update `beldify-frontend/src/services/api/authService.ts` to remove or redirect `forgot-password` and `reset-password` API calls — redirect to web-based flow `/{locale}/password/reset`

**Checkpoint**: Auth profile and password reset flows work correctly

---

## Phase 8: User Story 6 — Reviews Use Product-Based Endpoints (Priority: P3)

**Goal**: All review operations use product-based backend endpoints

**Independent Test**: View product reviews, submit review, react to review — all succeed

### Implementation for User Story 6

- [x] T033 [P] [US6] Update `beldify-frontend/src/services/api.ts` review list to use `GET /api/products/{id}/reviews` (not `GET /reviews`)
- [x] T034 [P] [US6] Update `beldify-frontend/src/services/api.ts` review submit to use `POST /api/products/reviews` (not `POST /reviews`)
- [x] T035 [P] [US6] Update `beldify-frontend/src/services/api.ts` review react to use `POST /api/products/reviews/{reviewId}/reaction` (not `POST /reviews/{id}/react`)
- [x] T036 [US6] Remove order-specific review endpoints from `beldify-frontend/src/services/api.ts` (`/reviews/order`, `/orders/{id}/review-status`) — backend does not expose these

**Checkpoint**: Reviews fully functional and testable independently

---

## Phase 9: User Story 7 — Seller and Community Messaging Use Correct Domains (Priority: P2)

**Goal**: Seller messaging routes to `/api/v1/frontend/messages/*`, community messaging routes to `/api/v1/community/messages/*`, no cross-domain fallback

**Independent Test**: Send message as seller → hits seller endpoint; send as community user → hits community endpoint

### Implementation for User Story 7

- [x] T037 [US7] Update `beldify-frontend/src/services/communityService.ts` send-message to use `POST /api/v1/community/messages/users/{userId}` (not `POST /api/v1/messages/send`)
- [x] T038 [US7] Update `beldify-frontend/src/services/communityService.ts` conversation fetch to use `GET /api/v1/community/messages/users/{userId}` (not `GET /api/v1/messages/conversation/{userId}`)
- [x] T039 [US7] Verify seller messaging in `beldify-frontend/src/app/api/messages/` routes proxy to `/api/v1/frontend/messages/*` — update any route still targeting buyer or community domain
- [x] T040 [US7] Verify no remaining cross-domain fallback in any messaging proxy route or service file

**Checkpoint**: All three messaging domains correctly isolated

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Replace all remaining hardcoded URLs and validate

- [x] T041 [P] Search and replace all remaining `pro.beldify.com` references across `beldify-frontend/src/app/api/` proxy routes with centralized `API_BASE_URL`
- [x] T042 [P] Search and replace all remaining `pro.beldify.com` references in `beldify-frontend/src/components/`, `beldify-frontend/src/contexts/`, and page files
- [x] T043 [P] Search and replace all remaining `pro.beldify.com` references in i18n locale files and config files
- [x] T044 Run `cd beldify-frontend && npm run lint` and fix any linting errors
- [x] T045 Run `cd beldify-frontend && npm run build` and fix any build errors
- [x] T046 Update `docs/api/frontend-backend-alignment.md` to mark resolved gaps and document deferred items (merge-guest, checkout, buyer message check)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Phase 2 completion
  - US1 (Phase 3) and US2 (Phase 4) are both P1 — can run in parallel
  - US3-US7 (Phases 5-9) are P2/P3 — can run in parallel after Phase 2
- **Polish (Phase 10)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (Buyer Messaging)**: After Phase 2 — no dependencies on other stories
- **US2 (Cart)**: After Phase 2 — no dependencies on other stories
- **US3 (Community Posts)**: After Phase 2 — no dependencies on other stories
- **US4 (Wishlist)**: After Phase 2 — no dependencies on other stories
- **US5 (Auth)**: After Phase 2 — no dependencies on other stories
- **US6 (Reviews)**: After Phase 2 — no dependencies on other stories
- **US7 (Seller/Community Messaging)**: After Phase 2 — depends on T004/T005 (fallback removal) being complete

### Within Each User Story

- Proxy route updates before service file updates (where both exist)
- Core path corrections before removal of stale endpoints

### Parallel Opportunities

- T006, T007, T008 (Phase 2) — different files, can run in parallel
- T023, T024, T025 (US3) — different route files, can run in parallel
- T033, T034, T035 (US6) — same file but different functions, can run in parallel
- T041, T042, T043 (Polish) — different directory scopes, can run in parallel
- All user stories (Phases 3-9) can run in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# These tasks modify different route files and can be launched together:
Task: "T009 - Update messages/route.ts GET to proxy to buyer/messages/shops"
Task: "T010 - Update messages/unread/route.ts to proxy to unread-count"
Task: "T011 - Update messages/send/route.ts to proxy to buyer/messages/send"
Task: "T014 - Update messages/shops/[shopId]/route.ts"

# These depend on understanding the above but modify different files:
Task: "T012 - Update messages/[shopId]/route.ts GET"
Task: "T013 - Update messages/[shopId]/route.ts PUT mark-read"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 — Buyer Messaging (T009-T015)
4. **STOP and VALIDATE**: Test buyer messaging end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → URL config centralized, fallback removed
2. Add US1 (Buyer Messaging) → Test → Deploy (MVP!)
3. Add US2 (Cart) → Test → Deploy
4. Add US3-US7 → Test each independently → Deploy
5. Polish → Final lint/build/doc validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Phase 2 is done:
   - Developer A: US1 (Buyer Messaging) + US7 (Seller/Community Messaging)
   - Developer B: US2 (Cart) + US4 (Wishlist)
   - Developer C: US3 (Community Posts) + US5 (Auth) + US6 (Reviews)
3. All converge for Phase 10: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All changes are frontend-only — no backend modifications
- Deferred items (merge-guest, checkout, buyer message check) tracked as TODO comments
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently

