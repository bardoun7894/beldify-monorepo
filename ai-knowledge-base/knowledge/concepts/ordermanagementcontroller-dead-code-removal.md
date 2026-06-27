---
name: OrderManagementController Dead Code Removal
description: Removed dead OrderManagementController whose routes were silently overwritten by Admin\OrderController prefix group
type: concept
tags: [laravel, route, controller, dead-code, admin, order, refactor]
sources: [sources/backend-claude]
created: "2026-06-27"
updated: "2026-06-27"
---
# OrderManagementController Dead Code Removal

## Discovery

Dead code found in Laravel backend routing:

1. **Dead routes** at `routes/web.php` lines ~190-200: 6 routes using `OrderManagementController` (orders.index, orders.pending, orders.in-progress, orders.shipped, orders.completed, orders.cancelled)
2. **Route overwriting**: `Route::prefix('orders')->name('orders.')` group at lines ~203-218 using `Admin\OrderController` defined the same route names, silently overwriting OrderManagementController routes.
3. **Dead controller**: `app/Http/Controllers/Admin/OrderManagementController.php` — no data queries, effectively dead code.

## The Fix

1. Removed the `use` import for OrderManagementController
2. Deleted 6 dead route definitions
3. Deleted the entire controller file
4. Verified Admin\OrderController has 17 live routes handling all order operations

## Verification

- `php artisan route:list` confirmed no remaining references to OrderManagementController

## See also

- [[concepts/cart-table-null-safe-guest-fix]]
- [[sources/backend-claude]]
