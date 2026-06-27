---
name: SQLite Migration Driver Guard
description: "Pattern for making Laravel migrations compatible with both SQLite test and MySQL production environments by wrapping DDL operations in DB::getDriverName() checks"
type: concept
tags: [laravel, php, migration, seeder, mysql, service-repository, repository, pattern, atlas]
sources: [daily/2026-05-24.md]
created: "2026-05-25"
updated: "2026-05-25"
---
# SQLite Migration Driver Guard

Laravel's `Schema` builder silently delegates DDL to the underlying driver. SQLite does not support dropping foreign keys or named indexes — attempting these operations throws a fatal error and halts the entire test suite before a single test runs.

## The Pattern

Wrap any SQLite-incompatible DDL in a driver check:

```php
use Illuminate\Support\Facades\DB;

Schema::table('orders', function (Blueprint $table) {
    if (DB::getDriverName() !== 'sqlite') {
        $table->dropForeign(['store_id']);
        $table->dropIndex('orders_status_index');
    }
    $table->dropColumn('store_id');
    // dropColumn is fine on both drivers
});
```

The `dropColumn` call itself works on SQLite; only the FK/index drops fail. Always drop FKs and indexes before their columns, and place the guard only around the FK/index lines.

## Beldify Application (2026-05-24)

During Atlas frontend migration QA, the backend test suite produced zero results — the runner was crashing on migration setup. Root cause: 17 migrations contained bare `dropForeign` or `dropIndex` calls.

After patching all 17 with the guard, the cascade of unblocked test layers was:

| Layer | Failure | Fix |
|---|---|---|
| Migration setup | `dropForeign` on SQLite | Driver guard |
| UserFactory | bcrypt faker call too slow | `Hash::fake()` in `setUp` |
| StoreFactory | Unique slug collision | `$this->faker->unique()->slug()` |
| Seeder | `verification_level` column missing | Schema sync |
| Feature test | `store_owner` role missing | Role seeder ordering |

Result: test suite went from **0 passing / 0 run** to **12 passing**.

## When to Apply

- Any `down()` method that drops a foreign key or index
- Any `up()` that conditionally drops before re-adding (e.g., changing FK target)
- Any migration shared between a SQLite test DB and a MySQL/PostgreSQL production DB

## Related

- [[entities/mysql]] — production driver
- [[concepts/service-repository-pattern]] — where most FK-bearing tables are defined
