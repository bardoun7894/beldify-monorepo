---
name: pixinvent-rtl-data-textdirection
description: PixInvent sets data-textdirection="rtl" on <body>, NOT dir="rtl" on <html> — CSS selectors must match this non-standard attribute
type: concept
---

# PixInvent RTL — `data-textdirection` vs `dir` Attribute

## Problem

Standard CSS practice for RTL styling is to test the `dir` attribute on `<html>`:

```css
[dir="rtl"] .sidebar { padding-right: 1rem; }
html[dir="rtl"] .content { margin-right: 260px; }
```

PixInvent (the Bootstrap admin template used by Beldify's legacy admin) does **not** set `dir="rtl"` on `<html>`. Instead it sets a custom data attribute on `<body>`:

```html
<body data-textdirection="rtl" ...>
```

CSS rules using `[dir="rtl"]` silently never match, causing RTL layout failures even when the Arabic locale is active.

## Fix

Replace `[dir="rtl"]` with `[data-textdirection="rtl"]` in all admin CSS that targets RTL layout:

```css
/* WRONG — never matches PixInvent admin */
[dir="rtl"] .sidebar-inner { left: auto; right: 0; }

/* CORRECT — matches PixInvent's non-standard attribute */
[data-textdirection="rtl"] .sidebar-inner { left: auto; right: 0; }
```

## Scope in Beldify (2026-05-28)

- **18 CSS selectors** updated in `sidebar-v3.css` and `header-v3.css`
- Symptom: Arabic admin pages had content overlapping sidebar by ~25% (content gutter was zero on RTL)
- `sidebar-v3.css` cache-bust bumped to `?v=15`

## Related

This interacts with [[concepts/css-rtl-override-physical-properties]] — both articles address RTL in the PixInvent context. That article covers using physical CSS properties to override cascade conflicts; this article covers the selector root cause.

## Detection

```bash
grep -n '\[dir="rtl"\]' public/css/sidebar-v3.css public/css/header-v3.css
```

Any hits in PixInvent-adjacent CSS need replacement.

## Sources
- [[sources/daily/2026-05-28]] — session 6d18f0a6, RTL sidebar/content overlap debugging
