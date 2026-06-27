---
name: Seller JS Layout Scope — Scripts in Page Templates vs Shell
description: "Including seller-dashboard.js only in dashboard.blade.php meant the Simple/Advanced toggle was absent on all other seller pages — fix is to include shared JS in the shell layout, not individual page templates"
type: concept
tags: [php, blade, seller, ui, search]
sources: [daily/2026-06-01.md]
created: "2026-06-01"
updated: "2026-06-01"
---
# Seller JS Layout Scope — Scripts in Page Templates vs Shell

## Overview
The Simple/Advanced dashboard toggle (`seller-dashboard.js`) was included in `@section('scripts')` inside `seller/dashboard.blade.php`. Because Blade `@yield('scripts')` is resolved per-page, this script was only present when the dashboard page rendered. Navigating to any other seller page (Products, Orders, Messages) unloaded the script entirely — the toggle button silently failed on those pages.

## Key Points
- **Root cause**: `<script src="{{ asset('js/seller-dashboard.js') }}">` lived in `seller/dashboard.blade.php`'s `@section('scripts')`, not in the shared `layouts/seller_shell.blade.php`.
- **Symptom**: Toggle button present in DOM (it's in the shell header) but JS init never fired on non-dashboard pages; browser console showed `jsInit: false, scriptTag: false`.
- **Fix**: Move the `<script>` tag to `seller_shell.blade.php` (before `</body>`) and remove the now-redundant include from `dashboard.blade.php`.
- **General rule**: Any JS that needs to run on every page sharing a layout must live in that layout's template, not in individual page `@section('scripts')` blocks.

## Implementation

### Before — `seller/dashboard.blade.php` (wrong)
```blade
@section('scripts')
    <script src="{{ asset('js/seller-dashboard.js') }}"></script>
@endsection
```

### After — `layouts/seller_shell.blade.php` (correct)
```blade
    {{-- ... rest of shell ... --}}
    @yield('scripts')
    <script src="{{ asset('js/seller-dashboard.js') }}"></script>
</body>
```

`dashboard.blade.php`'s `@section('scripts')` block is removed entirely (or left empty).

## Diagnosis Pattern
When a UI element that is rendered by the shell (header, nav, toggle) stops working on a page that is not the "home" page:

1. Open browser DevTools → Sources. Search for the script filename. If it's absent on the failing page but present on the working page, the script is scoped to a page template.
2. Check the layout file (`seller_shell.blade.php`) for `<script>` tags. If the script is only found inside a child template's `@section`, that's the bug.
3. Move the `<script>` to the layout's `</body>` close, outside any `@yield`.

## Scope Rules — Blade Layout Hierarchy
| Location | Loaded on |
|----------|-----------|
| `layouts/seller_shell.blade.php` — direct `<script>` | Every page using this layout |
| `layouts/seller_shell.blade.php` — `@yield('scripts')` | Nothing until a child injects content |
| `seller/dashboard.blade.php` — `@section('scripts')` | Only when `seller/dashboard.blade.php` renders |
| `seller/products.blade.php` — `@section('scripts')` | Only when `seller/products.blade.php` renders |

## Related Concepts
- [[concepts/seller-shell-layout]] — The layout file where the script now lives; documents the full shell structure
- [[concepts/seller-no-store-gating]] — Companion fix from the same session

## Sources
- [[daily/2026-06-01.md]] — Session 25023e79: Simple/Advanced toggle dead on `/ar/seller/products`; console `jsInit: false`; script moved from dashboard template to shell
