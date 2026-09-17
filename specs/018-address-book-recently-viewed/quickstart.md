# Quickstart: Buyer Address Book & Recently-Viewed Shelf

This feature is a gap-closing pass over already-shipped code. Steps to verify and implement:

## 1. Verify current state (before making changes)

```bash
# Backend — confirm existing address CRUD is green
cd beldify-backend && docker-compose -f docker-compose.dev.yml exec backend php artisan test --filter=AddressBookTest

# Frontend — confirm existing recently-viewed + checkout-address tests are green
cd beldify-frontend && npm test -- recentlyViewed recently-viewed-rail checkout-shipping-address
```

## 2. Close the gaps (in order)

1. **Address cap (backend)**: add a count guard to `AddressController::store` and `Mobile/AddressController::store` (10 max, FR-006). Write the failing test first (`AddressBookTest::user_cannot_create_11th_address`), then implement.
2. **Recently-viewed cap (frontend)**: bump `MAX_ITEMS` in `src/utils/recentlyViewed.ts` from 12 to 20 (FR-007). Update `recentlyViewed.test.ts` assertions that assume 12.
3. **Recently-viewed availability filter (frontend)**: add a render-time filter in `RecentlyViewedRail.tsx` that drops entries for products no longer available. Confirm the cheapest existing product endpoint that returns availability for a batch of IDs before adding any new one.
4. **Default-deletion edge case (backend)**: add a test confirming deleting the default address leaves no default (no code change expected — `Address::boot()` already handles this correctly by omission).

## 3. Re-run full verification

```bash
cd beldify-backend && docker-compose -f docker-compose.dev.yml exec backend php artisan test --filter=AddressBookTest
cd beldify-frontend && npm run lint && npm test -- recentlyViewed recently-viewed-rail checkout-shipping-address addressService
```

## 4. Manual smoke test (per CLAUDE.md UI verification rule)

- Log in as a buyer with 10 saved addresses, attempt to add an 11th → see the rejection message.
- View 21 distinct products, confirm the homepage rail shows the most recent 20.
- View a product, then have it marked out of stock/deleted (admin side), confirm it disappears from the rail.
