---
name: Multi-Seller Order Implementation (Spec 014)
description: Complete status report — OrderService::createCheckoutOrder() groups by store_id, per-seller orders/shipping/COD/notifications, 32/32 tests pass
type: concept
tags: [laravel, order, multi-seller, seller, checkout, OrderService, OrderGroup]
sources: [sources/backend-claude]
created: "2026-06-27"
updated: "2026-06-27"
---
# Multi-Seller Order Implementation (Spec 014)

## Status: COMPLETE (29/31 tasks, 32/32 tests passing)

## Architecture

`OrderService::createCheckoutOrder()` groups cart items by `store_id`:

- 1 `OrderGroup` per checkout (tracks overall status)
- N `Orders` per checkout (one per seller/store)
- Per-seller: independent shipping, COD, notifications
- `OrderGroup::markPaid()` marks group as paid

## Frontend Integration (T024-T027 all done)

- Cart grouping by store, checkout quote per seller, confirmation with per-seller breakdown, history with per-seller entries

## Remaining: T029 (docs) + T031 (review)

## See also

- [[concepts/multi-seller-ecommerce]]
- [[concepts/beldify-commission-system]]
- [[sources/backend-claude]]
