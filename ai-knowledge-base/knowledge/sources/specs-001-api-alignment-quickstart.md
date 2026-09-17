---
name: specs/001-api-alignment/quickstart.md
description: Auto-synced from specs/001-api-alignment/quickstart.md
type: source
sync_origin: specs/001-api-alignment/quickstart.md
sync_hash: ba332b7d45c3f087
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/001-api-alignment/quickstart.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Quickstart: Frontend-Backend API Alignment

**Feature**: 001-api-alignment | **Date**: 2026-01-31

## Prerequisites

- Node.js 18+ and npm
- Access to `beldify-frontend` codebase
- `NEXT_PUBLIC_API_URL` environment variable set (e.g., `https://pro.beldify.com`)
- Backend running and accessible at the configured API URL

## Development Setup

1. Check out the feature branch:
   ```bash
   git checkout 001-api-alignment
   ```

2. Ensure `.env.local` has the correct API URL:
   ```
   NEXT_PUBLIC_API_URL=https://pro.beldify.com
   ```

3. Install dependencies:
   ```bash
   cd beldify-frontend && npm install
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

## Implementation Order

Work through changes in this sequence to minimize breakage:

1. **Centralize API base URL** — Fix `src/config/constants.ts` and `src/constants/api.ts` to use `NEXT_PUBLIC_API_URL` everywhere. Update `src/services/axiosInstance.ts`.

2. **Fix messaging proxy routes** — Update each file in `src/app/api/messages/` to target the correct backend path. Remove cross-domain fallback in `messages/route.ts` and `messagingService.ts`.

3. **Fix cart service** — Update `src/services/api/cartService.ts` and `src/services/api.ts` to use `/cart/items`, `/cart/apply-coupon`, `/cart/remove-coupon`.

4. **Fix wishlist service** — Update `src/services/api/wishlistService.ts` to use `/wishlist` and `/wishlist/{productId}`.

5. **Fix auth service** — Update `src/services/api/authService.ts` to use `/user/profile`. Remove or redirect password reset calls.

6. **Fix review endpoints** — Update `src/services/api.ts` review calls to use `/api/products/{id}/reviews`, `/api/products/reviews`, `/api/products/reviews/{reviewId}/reaction`.

7. **Fix community endpoints** — Update proxy routes and `communityService.ts` to use versioned `/api/v1/community/*` paths and accept/reject for responses.

8. **Replace all remaining hardcoded URLs** — Search for `pro.beldify.com` across all files and replace with the centralized constant.

## Verification

After each domain change, verify:

```bash
# Lint check
cd beldify-frontend && npm run lint

# Build check
npm run build
```

Manual verification per domain:
- **Messaging**: Log in as buyer, open messages, send a message, check unread count
- **Cart**: Add item, apply coupon, remove coupon
- **Wishlist**: Add product, remove product
- **Auth**: Fetch profile after login
- **Reviews**: View product reviews, submit a reaction
- **Community**: Create post, accept a response

## Key Files

| Domain | Primary Files to Modify |
|--------|------------------------|
| URL Config | `src/config/constants.ts`, `src/constants/api.ts`, `src/services/axiosInstance.ts` |
| Messaging | `src/app/api/messages/**/*.ts`, `src/services/messagingService.ts` |
| Cart | `src/services/api/cartService.ts`, `src/services/api.ts` |
| Wishlist | `src/services/api/wishlistService.ts` |
| Auth | `src/services/api/authService.ts` |
| Reviews | `src/services/api.ts` |
| Community | `src/app/api/community/**/*.ts`, `src/services/communityService.ts` |

## Contracts

OpenAPI contract definitions are in `specs/001-api-alignment/contracts/`:
- `messaging.yaml` — Buyer, seller, and community messaging endpoints
- `cart-wishlist.yaml` — Cart and wishlist endpoints
- `auth-reviews-community.yaml` — Auth, reviews, and community post endpoints

