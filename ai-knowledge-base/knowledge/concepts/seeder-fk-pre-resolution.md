---
name: Seeder NOT NULL FK pre-resolution
description: "When a Laravel seeder fails on NOT NULL foreign-key columns, pre-resolve the referenced IDs and inject them explicitly into each row before insert"
type: concept
tags: [laravel, php, artisan, seeder, state, fetch, docker, auth, pattern]
sources: [sources/sessions-2026-05-14-7f3c17d0]
created: "2026-05-21"
updated: "2026-05-21"
---
# Seeder NOT NULL FK pre-resolution

## Summary
A pattern for Laravel seeders that target tables with NOT NULL foreign-key columns. Instead of relying on default values or `firstOrCreate` to backfill, the seeder pre-fetches the canonical referenced rows (super-admin user, first company, first branch) and injects their IDs into every row being inserted. Prevents `SQLSTATE[23000] Integrity constraint violation: 1452 Cannot add or update a child row` failures during partial seeder runs.

## When it applies
- A new seeder is being added that writes to a table with multiple required FK columns (`user_id`, `company_id`, `branch_id`, `created_by`, etc.)
- The seeder cannot assume the FK target rows exist with predictable IDs — earlier seeders may have created them with auto-increment IDs that differ between environments
- A previous seeder run failed mid-flight, leaving the database in a state where downstream seeders will hit unique-constraint or FK violations on retry

## Pattern
```php
public function run(): void
{
    // Pre-resolve the canonical FK targets BEFORE the insert loop.
    $superAdmin = User::where('email', 'beldify@gmail.com')->firstOrFail();
    $company    = Company::orderBy('id')->firstOrFail();
    $branch     = Branch::where('company_id', $company->id)->orderBy('id')->firstOrFail();

    foreach ($this->rows() as $row) {
        AccountSubControl::firstOrCreate(
            ['name' => $row['name']],
            array_merge($row, [
                'user_id'    => $superAdmin->id,
                'company_id' => $company->id,
                'branch_id'  => $branch->id,
            ])
        );
    }
}
```

The `firstOrCreate` pattern ensures idempotency. The explicit ID injection ensures every row meets NOT NULL constraints regardless of what state the target tables are in.

## Anti-pattern to avoid
Don't rely on `Auth::id()` inside a seeder — there is no authenticated user during `artisan db:seed`. Always pre-fetch.

## Related Concepts
- [[concepts/production-db-reset]]
- [[concepts/docker-deployment]]

## Sources
- [[sources/sessions-2026-05-14-7f3c17d0]]
