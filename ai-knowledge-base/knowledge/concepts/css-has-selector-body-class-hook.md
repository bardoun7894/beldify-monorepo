---
name: css-has-selector-body-class-hook
description: CSS :has() pseudo-class is unreliable in some browsers for scoping admin skin — use plain body class hook instead
type: concept
---

# CSS `:has()` Selector — Body Class Hook Pattern

## Problem

Beldify's Atlas admin skin (v3-pages.css) originally scoped all design-token overrides using the `:has()` pseudo-class:

```css
/* FRAGILE — :has() support is incomplete in some browsers */
body:has(.bdv3) {
  background-color: #FAF6EE; /* Atlas parchment */
  font-family: 'Inter', sans-serif;
}
```

This worked in dev but silently failed in the user's browser (even current Chrome/Safari on some configurations), leaving admin pages with a white Bootstrap background instead of the Atlas parchment skin.

## Fix: Plain Body Class

Add a dedicated class to the `<body>` tag in every layout that should receive the Atlas skin:

```blade
{{-- dashboard.blade.php --}}
<body class="... bdv3-shell">
```

Then scope all CSS rules to that class:

```css
/* STABLE — plain class selector, universal support */
body.bdv3-shell {
  background-color: #FAF6EE;
  font-family: 'Inter', sans-serif;
}

/* Exempt v1 admin from the skin */
html:not(.bdv3-shell),
body:not(.bdv3-shell) {
  background-color: #ffffff !important;
}
```

## Scope in Beldify (2026-05-28)

- **29 CSS rules** in `v3-pages.css` changed from `body:has(.bdv3)` → `body.bdv3-shell`
- **`sidebar-v3.css`** and **`header-v3.css`** — same selector swap
- **`light-mode-fixes.css`** — scoped `!important` white background to `body:not(.bdv3-shell)` so Atlas parchment wins on v3 pages
- **Layouts patched**: `admin/dashboard.blade.php`, `layouts/seller_dashboard.blade.php`

## Compound Blocker: Opcache

Even after fixing the selectors and bumping cache-bust versions, the Atlas skin didn't appear until the container was restarted. PHP opcache held compiled blade views that didn't include the `bdv3-shell` body class — `view:clear` alone was insufficient; `docker restart <app-container>` was required.

## CSS Cache-Busting Sequence

```html
<link rel="stylesheet" href="{{ asset('css/v3-pages.css') }}?v=4">
```

Version was bumped from `?v=1` → `?v=4` across four debug iterations.

## Sources
- [[sources/daily/2026-05-28]] — session 6d18f0a6, Atlas body skin debugging
