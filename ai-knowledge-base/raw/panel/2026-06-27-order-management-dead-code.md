---
source: panel
reviewers: [claude]
date: 2026-06-27
target: beldify-backend/routes/web.php + OrderManagementController.php
scope: review
---

# Panel verdict — OrderManagementController dead code removal

## Decision rationale

Trivial dead-code removal. OrderManagementController's 6 routes (orders.index, .pending, .processing, .completed, .cancelled, .settings) are overwritten by Admin\OrderController's prefix('orders') group later in web.php, making all 6 routes unreachable. The controller has no data queries — each method only returns a view. No blast radius.

## Consensus — act on these

- Remove `use App\Http\Controllers\Admin\OrderManagementController;` from web.php line 14 [signal: 5]
- Remove dead route group (lines 190-200) referencing OrderManagementController [signal: 5]
- Delete `app/Http/Controllers/Admin/OrderManagementController.php` [signal: 5]
- Verify `docker exec beldify-local-app php artisan route:list | grep orders` shows only the real OrderController routes [signal: 5]
- Commit nested beldify-backend repo separately from monorepo [signal: 5]
- Deploy to MyContabo production [signal: 5]

## Final plan

1. Edit web.php (remove import + dead routes)
2. Delete controller file
3. Verify routes
4. Git commit × 2 (backend + monorepo)
5. Push
6. Deploy
