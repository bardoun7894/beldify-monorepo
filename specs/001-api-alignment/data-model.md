# Data Model: Frontend-Backend API Alignment

**Feature**: 001-api-alignment | **Date**: 2026-01-31

## Overview

This feature does not introduce new data entities or modify database schemas. It corrects frontend API call paths to match existing backend routes. The data model below documents the **routing configuration** that drives the alignment.

## Entity: API Route Map

The central artifact is a mapping from frontend caller → correct backend endpoint. This is not a database entity but a configuration concern embedded in code.

### Messaging Domain Routes

| Domain | Operation | Frontend Proxy Path | Backend Target |
|--------|-----------|-------------------|----------------|
| Buyer | List conversations | `/api/messages/buyer/conversations` | `GET /api/v1/buyer/messages/shops` |
| Buyer | Get conversation | `/api/messages/buyer/shops/{shopId}` | `GET /api/v1/buyer/messages/shops/{shopId}` |
| Buyer | Send message | `/api/messages/buyer/send` | `POST /api/v1/buyer/messages/send` |
| Buyer | Unread count | `/api/messages/buyer/unread-count` | `GET /api/v1/buyer/messages/unread-count` |
| Buyer | Mark read | `/api/messages/buyer/mark-read/{messageId}` | `PUT /api/v1/frontend/messages/mark-read/{messageId}` |
| Seller | Conversations | `/api/messages/seller/conversations` | `GET /api/v1/frontend/messages/conversations` |
| Seller | Get conversation | `/api/messages/seller/conversations/{shopId}` | `GET /api/v1/frontend/messages/conversations/{shopId}` |
| Seller | Send message | `/api/messages/seller/send` | `POST /api/v1/frontend/messages/send` |
| Seller | Mark read | `/api/messages/seller/mark-read/{messageId}` | `PUT /api/v1/frontend/messages/mark-read/{messageId}` |
| Seller | Unread count | `/api/messages/seller/unread-count` | `GET /api/v1/frontend/messages/unread-count` |
| Community | List conversations | `/api/messages/community/conversations` | `GET /api/v1/community/messages/conversations` |
| Community | User messages | `/api/messages/community/users/{userId}` | `GET /api/v1/community/messages/users/{userId}` |
| Community | Send to user | `/api/messages/community/users/{userId}/send` | `POST /api/v1/community/messages/users/{userId}` |
| Community | Mark read | `/api/messages/community/users/{userId}/read` | `POST /api/v1/community/messages/users/{userId}/read` |
| Community | Shop messages | `/api/messages/community/shops/{shopId}` | `GET /api/v1/community/messages/shops/{shopId}` |

### Cart Routes

| Operation | Frontend Proxy Path | Backend Target |
|-----------|-------------------|----------------|
| Get cart | `/api/cart` | `GET /cart` |
| Add item | `/api/cart/items` | `POST /cart/items` |
| Update item | `/api/cart/items/{id}` | `PUT /cart/items/{id}` |
| Remove item | `/api/cart/items/{id}` | `DELETE /cart/items/{id}` |
| Clear cart | `/api/cart` | `DELETE /cart` |
| Apply coupon | `/api/cart/apply-coupon` | `POST /cart/apply-coupon` |
| Remove coupon | `/api/cart/remove-coupon` | `POST /cart/remove-coupon` |

### Wishlist Routes

| Operation | Frontend Proxy Path | Backend Target |
|-----------|-------------------|----------------|
| List | `/api/wishlist` | `GET /wishlist` |
| Add | `/api/wishlist` | `POST /wishlist` |
| Remove | `/api/wishlist/{productId}` | `DELETE /wishlist/{productId}` |

### Auth Routes

| Operation | Frontend Proxy Path | Backend Target |
|-----------|-------------------|----------------|
| Get profile | `/api/user/profile` | `GET /user/profile` |
| Update profile | `/api/user/profile` | `POST /user/profile` |
| Login | `/api/auth/login` | `POST /auth/login` |
| Register | `/api/auth/register` | `POST /auth/register` |
| Logout | `/api/auth/logout` | `POST /auth/logout` |

### Review Routes

| Operation | Frontend Proxy Path | Backend Target |
|-----------|-------------------|----------------|
| List for product | `/api/products/{id}/reviews` | `GET /api/products/{id}/reviews` |
| Submit review | `/api/products/reviews` | `POST /api/products/reviews` |
| React to review | `/api/products/reviews/{reviewId}/reaction` | `POST /api/products/reviews/{reviewId}/reaction` |

### Community Post Routes

| Operation | Frontend Proxy Path | Backend Target |
|-----------|-------------------|----------------|
| List posts | `/api/community/posts` | `GET /api/v1/community/posts` |
| Get post | `/api/community/posts/{id}` | `GET /api/v1/community/posts/{post}` |
| Create post | `/api/community/posts` | `POST /api/v1/community/posts` |
| Update post | `/api/community/posts/{id}` | `PUT /api/v1/community/posts/{post}` |
| Delete post | `/api/community/posts/{id}` | `DELETE /api/v1/community/posts/{post}` |
| Get responses | `/api/community/posts/{id}/responses` | `GET /api/v1/community/posts/{post}/responses` |
| Accept response | `/api/community/posts/{id}/responses/{responseId}/accept` | `POST /api/v1/community/posts/{post}/responses/{response}/accept` |
| Reject response | `/api/community/posts/{id}/responses/{responseId}/reject` | `POST /api/v1/community/posts/{post}/responses/{response}/reject` |

## State Transitions

N/A — no entity state changes. This is a routing correction.

## Validation Rules

- All frontend proxy routes MUST forward the `Authorization` header (Bearer token from Sanctum)
- All frontend proxy routes MUST forward cookies for CSRF validation
- Environment variable `NEXT_PUBLIC_API_URL` MUST be set in all environments
