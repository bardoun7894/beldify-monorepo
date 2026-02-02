# Frontend-Backend Alignment Plan

This document defines the API alignment plan to close gaps between the Next.js frontend
and Laravel backend. The backend routes are the source of truth unless explicitly noted
as an alias for backward compatibility.

## Goals

- Make messaging domains explicit: buyer, seller, community.
- Standardize API routing through Next.js proxies where possible.
- Align frontend paths, methods, and payloads to backend routes.
- Reduce hardcoded production URLs and use environment-based routing.
- Document deprecations and transitional aliases.

## Messaging Domains

We support three distinct messaging domains. Each UI surface must select the correct
domain explicitly. No cross-domain fallback behavior should remain in the frontend.

- Buyer messaging: `/api/v1/buyer/messages/*`
- Seller messaging: `/api/v1/frontend/messages/*`
- Community messaging: `/api/v1/community/messages/*`

### Canonical Messaging Endpoints

All domains should expose consistent endpoint shapes. If a backend domain lacks a
canonical endpoint, add a backend alias or update frontend calls to existing routes.

- `GET /conversations`
- `GET /shops/{shopId}` (or `GET /conversations/{id}` if that is the existing pattern)
- `POST /send`
- `POST /mark-read/{messageId}` (chosen canonical pattern)
- `GET /unread-count`

## Alignment Strategy

1) Use backend routes as source of truth.
2) Update frontend services and proxies to match backend paths and methods.
3) Add temporary backend aliases only if required for legacy clients.
4) Remove cross-domain message endpoint fallback logic in frontend proxies.

## Gap Matrix (Summary)

Each item lists the frontend caller and the backend route mismatch.

### Messaging (Buyer)

- Frontend uses `/api/v1/buyer/messages/unread` in
  `beldify-frontend/src/app/api/messages/unread/route.ts`.
  Backend uses `/api/v1/buyer/messages/unread-count`.
- Frontend uses `/api/v1/buyer/messages/conversations` in
  `beldify-frontend/src/app/api/messages/route.ts`.
  Backend uses `/api/v1/buyer/messages/shops` (no `conversations`).
- Frontend uses `/api/v1/buyer/messages/shops/{shopId}/check` in
  `beldify-frontend/src/app/api/messages/[shopId]/check/route.ts`.
  Backend only has community check: `/api/v1/community/messages/shops/{shopId}/check`.
- Frontend uses `PUT /api/v1/buyer/messages/shops/{shopId}/read` in
  `beldify-frontend/src/app/api/messages/[shopId]/route.ts`.
  Backend uses `POST /api/v1/frontend/messages/mark-read/{messageId}` and
  `POST /api/v1/community/messages/users/{userId}/read` (no buyer read route).
- Frontend uses `/api/messages/shops/{shopId}` in
  `beldify-frontend/src/app/api/messages/shops/[shopId]/route.ts`.
  Backend only exposes namespaced routes under `/api/v1/*`.

### Messaging (Community and Seller)

- Frontend uses `/api/v1/messages/send` and
  `/api/v1/messages/conversation/{userId}` in
  `beldify-frontend/src/services/communityService.ts`.
  Backend uses `/api/v1/community/messages/users/{userId}` and
  `/api/v1/community/messages/shops/{shopId}`.

### Community

- Frontend POST uses `/api/community/posts` in
  `beldify-frontend/src/app/api/community/posts/route.ts`.
  Backend uses `/api/v1/community/posts`.
- Frontend PUT/DELETE use `/community/posts/{id}` in
  `beldify-frontend/src/app/api/community/posts/[id]/route.ts`.
  Backend uses `/api/v1/community/posts/{id}`.
- Frontend user posts proxy uses `${NEXT_PUBLIC_API_URL}/community/posts` in
  `beldify-frontend/src/app/api/community/user-posts/route.ts`.
  Backend uses `/api/v1/community/posts`.
- Frontend uses `/api/v1/community/responses/{id}` and
  `/api/v1/community/responses/{id}/status` in
  `beldify-frontend/src/app/api/community/responses/[id]/route.ts` and
  `beldify-frontend/src/app/api/community/responses/[id]/status/route.ts`.
  Backend only exposes accept/reject endpoints under
  `/api/v1/community/posts/{post}/responses/{response}/accept|reject`.

### Cart (Buyer)

- Frontend uses `/api/cart/coupon` (POST/DELETE) in
  `beldify-frontend/src/services/api/cartService.ts` and
  `beldify-frontend/src/services/api.ts`.
  Backend uses `/api/cart/apply-coupon` and `/api/cart/remove-coupon` (POST/POST).
- Frontend uses `/api/cart/merge-guest` in
  `beldify-frontend/src/services/api/cartService.ts`.
  Backend route missing.
- Frontend uses `POST /cart/checkout` in
  `beldify-frontend/src/services/api.ts`.
  Backend route missing.
- Frontend uses `POST /api/cart` in `beldify-frontend/src/app/wishlist/page.tsx`.
  Backend expects `POST /api/cart/items` with stock/variant details.

### Wishlist

- Frontend uses `/api/wishlist/items` and `/api/wishlist/items/{id}` in
  `beldify-frontend/src/services/api/wishlistService.ts`.
  Backend uses `/api/wishlist` (GET/POST) and `/api/wishlist/{productId}` (DELETE).

### Auth (Buyer)

- Frontend uses `/api/auth/user` in
  `beldify-frontend/src/services/api/authService.ts`.
  Backend uses `/api/auth/profile` or `/api/user/profile` (no `/api/auth/user`).
- Frontend uses `/api/auth/forgot-password` and `/api/auth/reset-password` in
  `beldify-frontend/src/services/api/authService.ts`.
  Backend does not expose API routes for these (web flows only).

### Reviews (Buyer)

- Frontend uses `/reviews`, `/reviews/{id}`, `/reviews/{id}/react`,
  `/reviews/order`, `/orders/{id}/review-status` in
  `beldify-frontend/src/services/api.ts`.
  Backend uses `/products/{id}/reviews`, `/products/reviews`, and
  `/products/reviews/{reviewId}/reaction`.

## Change Plan

### Messaging (All Domains)

- Implement domain-specific proxies:
  - `/api/messages/buyer/*`
  - `/api/messages/seller/*`
  - `/api/messages/community/*`
- Update all messaging callers to use the correct proxy domain.
- Remove multi-endpoint fallback logic in `beldify-frontend/src/app/api/messages/route.ts`.
- Align unread/check/read endpoints to backend routes or add backend aliases.
- Use `POST /mark-read/{messageId}` everywhere.

### Community

- Standardize all community CRUD routes to `/api/v1/community/*`.
- Replace response CRUD/status calls with accept/reject endpoints, or add backend
  CRUD/status endpoints if required.
- Remove or implement `/api/v1/community/upload`.

### Cart and Wishlist

- Align coupon endpoints to `/api/cart/apply-coupon` and `/api/cart/remove-coupon`.
- Replace `/api/cart` POST with `/api/cart/items`.
- Remove or implement `/api/cart/merge-guest` and `/cart/checkout`.
- Align wishlist endpoints to `/api/wishlist` and `/api/wishlist/{productId}`.

### Auth

- Align user profile fetch to `/api/user/profile` or `/api/auth/profile`.
- Decide on API routes for password reset or remove frontend calls.
- Normalize CSRF usage to a single route (proxy or backend).

### Reviews

- Align to product-based review endpoints:
  - `GET /api/products/{id}/reviews`
  - `POST /api/products/reviews`
  - `POST /api/products/reviews/{reviewId}/reaction`
- Remove or implement order-specific review endpoints.

### Base URL Normalization

- Replace hardcoded `https://pro.beldify.com` with `NEXT_PUBLIC_API_URL`.
- Favor Next.js proxies for browser calls to avoid CORS and mixed auth behavior.

## Deprecation Policy

- Any legacy endpoints used by clients should be added as temporary aliases.
- Each alias must be documented with a removal timeline.

## Verification Plan

- Buyer: login, cart add/update, coupon apply/remove, wishlist add/remove,
  messages list/send/unread-count, reviews list/react, orders list/detail.
- Seller: messages list/send/mark-read.
- Community: posts list/create/update/delete, responses accept/reject,
  community messages list/send.

## Implementation Status (Branch: 001-api-alignment)

All gaps listed above have been resolved in the frontend. Summary:

### Resolved

- **Messaging (Buyer)**: All proxy routes aligned to backend endpoints. Cross-domain fallback removed.
- **Messaging (Community/Seller)**: Domain-specific endpoints used. No cross-domain fallback.
- **Community**: All CRUD routes use `/api/v1/community/*`. Response accept/reject pattern implemented.
- **Cart**: Coupon endpoints aligned to `apply-coupon`/`remove-coupon`. Cart add uses `/api/cart/items`.
- **Wishlist**: Aligned to `GET/POST /wishlist` and `DELETE /wishlist/{productId}`.
- **Auth**: Profile fetch uses `GET /user/profile`. Password reset redirects to web flow.
- **Reviews**: Aligned to product-based endpoints. Order-specific review endpoints stubbed.
- **Base URL**: All hardcoded `pro.beldify.com` replaced with `NEXT_PUBLIC_API_URL` (except i18n locale display strings).

### Deferred (Backend Routes Missing)

- `POST /api/cart/merge-guest` — frontend stubbed with TODO
- `POST /cart/checkout` — frontend stubbed with TODO
- `GET /api/v1/buyer/messages/shops/{shopId}/check` — frontend returns 501 with TODO
- Order-specific review endpoints (`/reviews/order`, `/orders/{id}/review-status`) — frontend stubbed with TODO

## Open Decisions

- Buyer message check endpoint: add backend `/api/v1/buyer/messages/shops/{shopId}/check`
  or replace with `unread-count` logic.
- Community response CRUD/status endpoints: resolved — using accept/reject only.
