---
name: Production Database Reset
description: Safe workflow for wiping and reseeding the Beldify production MySQL database
type: concept
tags: [laravel, php, migration, seeder, state, docker, mysql, seller, pattern, multi-seller]
sources: [daily/2026-05-14.md]
created: "2026-05-15"
updated: "2026-05-15"
---
# Production Database Reset

## Overview
The Beldify production database can be fully reset using Laravel's `migrate:fresh --seed --force` command. This destroys all data, re-runs every migration from zero, and repopulates seed fixtures. It is a destructive, irreversible operation that requires a backup and explicit confirmation before execution.

## Key Points
- Always take a MySQL dump backup before running `migrate:fresh --seed --force`
- Back up with `docker exec beldify-mysql mysqldump -u beldify_user -pBeldify7894 beldify > backup.sql`
- Restore from backup with `docker exec -i beldify-mysql mysql ... < backup.sql`
- The seeder chain that runs after a fresh migration includes: SuperAdminRole, Company, Currency, AccountHead/Control/SubControl, Warehouse, Store, StoreProfile, Tailor, Stock, Banner
- After a fresh seed, confirm login end-to-end: `POST /ar/login → 302 → /ar/admin/dashboard`

## Details
On 2026-05-14, a full production database reset was performed on the Beldify MyContabo server. A 224 KB dump (136 tables) was taken before the wipe as a safety net. The `migrate:fresh --seed --force` command ran inside the `beldify-backend` Docker container.

Several migrations failed during this reset because they referenced columns that did not yet exist on their target tables. The pattern `2025_07_17_001354_add_performance_indexes_to_orders_table` tried to index `cart_id` on `orders`, but that column was absent. The fix applied was a column-existence guard: each `Schema::table` call was wrapped in an `if (Schema::hasColumn(...))` check before creating the index. The same pattern was applied to `2025_07_17_002336_add_performance_indexes_to_additional_tables` and `2026_02_06_000001_add_performance_indexes`.

After migrations completed cleanly, all seeders ran. The final seeded state included 18 categories, 6 stocks (real Moroccan-themed products — Brocade Fassi Fabric, Soie de Fès Silk, etc.), 5 banners, 5 users, 5 companies, 2 stores, and all account ledger tables populated.

## Migration Guard Pattern
```php
// Before adding an index, guard on column existence
if (Schema::hasColumn('orders', 'cart_id')) {
    $table->index('cart_id', 'idx_orders_cart');
}
```

## Related Concepts
- [[concepts/docker-deployment]] — Container context where commands are executed
- [[concepts/multi-seller-ecommerce]] — Domain models populated by seeders
- [[entities/mysql]] — The database being reset
- [[entities/laravel]] — Framework providing `migrate:fresh` and seeder infrastructure

## Sources
- [[daily/2026-05-14.md]] — Full reset performed; migration guards discovered and applied; seeder chain documented
