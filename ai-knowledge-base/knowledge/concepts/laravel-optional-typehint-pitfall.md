---
name: Laravel optional() Type-Hint Pitfall
description: optional($model) returns Illuminate\Support\Optional, not null — rejected by ?Model strict type hints; fix is to drop optional() since the service already null-guards internally
type: concept
sources: [daily/2026-05-24.md]
created: 2026-05-24
updated: 2026-05-24
---

# Laravel optional() Type-Hint Pitfall

## The Bug

`LanguageService::resolveTranslation(?Model $model)` uses a strict PHP nullable type hint. Callers passing `optional($category->user)` trigger a `TypeError` in production because `optional()` returns `Illuminate\Support\Optional`, not `null` — so PHP's type check fails.

```php
// WRONG — optional() wraps the value in Illuminate\Support\Optional
translateField(optional($category->user), 'name');

// CORRECT — pass the raw relation; the service already guards against null
translateField($category->user, 'name');
```

## Root Cause

`optional()` is designed for **accessor chains** (`optional($rel)->field`), where it swallows `null` dereferences. It is NOT appropriate for method arguments declared as `?Model` — PHP sees an `Optional` object, not `null`, and throws a `TypeError`.

## Fix Pattern

Remove the `optional()` wrapper. If the receiving method needs null-safety, add a guard inside it:

```php
// Inside LanguageService::resolveTranslation
public function resolveTranslation(?Model $model, string $field): string
{
    if (is_null($model)) return '';
    // ...
}
```

The V3 admin port already added this guard. All callers can drop `optional()` safely.

## Affected Files (2026-05-24)

- `resources/views/admin/v3/categories/partials/categories_table.blade.php` — category `user` field
- `resources/views/admin/v3/stock/partials/stock_table.blade.php` — category + user fields

## Rule

> Use `optional()` only for property/method access chains on potentially null objects, never as a method argument where the parameter declares a nullable type.
