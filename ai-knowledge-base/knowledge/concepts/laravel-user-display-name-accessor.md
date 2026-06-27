---
name: Laravel User Display Name Accessor (Beldify)
description: "Beldify users table has no name column — $user->name is always null; locale-aware display_name accessor with mb_ multibyte safety for Arabic initials is the correct pattern"
type: concept
tags: [laravel, php, eloquent, blade, migration, controller, model, html, component, query]
sources: [daily/2026-05-29.md]
created: "2026-05-29"
updated: "2026-05-29"
---
# Laravel User Display Name Accessor (Beldify)

## Overview
The Beldify `users` table stores human names in `full_name_ar` and `full_name_en` columns, not in a generic `name` column. Any code that references `$user->name` returns `null` silently (Laravel returns null for missing attributes). This caused blank avatar initials and empty author names throughout the admin and seller interfaces. The fix is a locale-aware `getDisplayNameAttribute()` accessor on the `User` model, paired with `mb_strtoupper()` / `mb_substr()` for multibyte-safe initial extraction.

## Key Points
- **`$user->name` is always null**: The `users` table schema has no `name` column. Laravel's model does not throw an error — it returns `null` silently via `__get`. Blade `{{ $user->name }}` renders blank; `strtoupper(substr(null, 0, 1))` renders blank.
- **Two locale groups**: Arabic initial on `ar` and `ma` (Moroccan Arabic/Darija) locales; English otherwise.
- **Fallback chain**: `full_name_ar` (ar/ma) → `full_name_en` (others) → `username` → first segment of `email` → `'unknown'`.
- **`mb_strtoupper()` required**: Plain `strtoupper()` only handles ASCII; Arabic characters passed through it return garbled bytes. PHP's `mb_strtoupper()` handles the full Unicode range correctly.
- **Column reference**: `contact_number` (not `phone`), `full_name_en` (not `name`), `address_en` (not `address`) — these are the real column names; several controllers were writing to the wrong columns before the session.

## Details

### The accessor implementation
Added to `app/Models/User.php`:

```php
public function getDisplayNameAttribute(): string
{
    $locale = app()->getLocale();

    if (in_array($locale, ['ar', 'ma']) && !empty($this->full_name_ar)) {
        return $this->full_name_ar;
    }

    return $this->full_name_en
        ?? $this->username
        ?? explode('@', $this->email)[0]
        ?? 'unknown';
}
```

Usage in Blade:
```blade
{{ $user->display_name }}

{{-- Avatar initial --}}
{{ mb_strtoupper(mb_substr($user->display_name, 0, 1)) }}
```

### Why `mb_substr` + `mb_strtoupper`
PHP's `substr()` and `strtoupper()` operate on bytes, not characters. An Arabic character like `م` is encoded as 2 bytes in UTF-8. `substr($name, 0, 1)` returns only the first byte — a partial, invalid UTF-8 sequence that renders as `?` or a replacement character in HTML. `strtoupper()` only maps ASCII a–z to A–Z; it passes non-ASCII bytes through unchanged, producing garbage for Arabic.

```php
// Wrong — corrupts Arabic
strtoupper(substr('محمد', 0, 1))   // returns "?" or garbled bytes

// Correct
mb_strtoupper(mb_substr('محمد', 0, 1), 'UTF-8')   // returns "م"
```

### Columns that don't exist
Several admin and seller controllers discovered during the session were writing to phantom columns:

| Wrong column | Real column | Controller |
|---|---|---|
| `name` | `full_name_en` | `SellerProfileController::update` |
| `phone` | `contact_number` | `SellerProfileController::update` |
| `address` | `address_en` | `SellerProfileController::update` |

Laravel's `update()` silently ignores columns not in the `$fillable` array, so these writes fail without any error. The fix is to match the real schema column names.

### Related i18n pattern — locale-aware display
The accessor's locale detection (`app()->getLocale()`) integrates with Beldify's `/{locale}/` URL routing. On Arabic pages (`/ar/...`, `/ma/...`), Arabic full names are preferred; on all other locales the English variant is used. This ensures consistent language matching without any template-side conditionals.

### Top Contributors blank — the presenting symptom
The first visible bug from this pattern was the "Top Contributors" widget on the admin community index page. A query grouped community posts by user and joined the `users` table; the display loop rendered `{{ $user->name }}` (null) as the contributor name. After adding the `display_name` accessor, all contributor names appeared correctly in the locale-appropriate language.

## Related Concepts
- [[concepts/admin-atlas-migration]] — Admin community pages where blank names were first noticed (2026-05-29 session)
- [[entities/laravel]] — Eloquent model accessor system used here
- [[concepts/beldify-admin-v3-component-library]] — Avatar component uses `display_name` + `mb_strtoupper` for initials

## Sources
- [[daily/2026-05-29.md]] — Blank author names and avatar initials discovered on community admin and index pages; `getDisplayNameAttribute()` accessor added; mb_strtoupper fix applied; SellerProfileController column names corrected
