---
name: CSS RTL Override with Physical Properties
description: When overriding RTL-aware third-party CSS (e.g. PixInvent), logical properties (margin-inline-*) lose the cascade — use matching physical properties to win cleanly
type: concept
sources: [daily/2026-05-23.md, daily/2026-05-28.md]
created: 2026-05-23
updated: 2026-05-28
---

# CSS RTL Override with Physical Properties

## Overview
CSS logical properties (`margin-inline-start`, `margin-inline-end`, `padding-block`, etc.) are the modern, direction-aware alternative to physical properties. However, when overriding CSS from a third-party library that already uses physical properties (`margin-left`, `margin-right`) with direction-specific selectors (`[dir="rtl"]`), mixing logical and physical properties in your override can cause unexpected cascade resolution — even with `!important`. The safest approach is to match the physical property names the library uses and override them directly per direction.

## Key Points
- CSS logical properties and physical properties are **separate properties** in the cascade — `margin-inline-start: 272px !important` does NOT override `margin-right: 260px !important` in an RTL context; they are different property names
- PixInvent (Beldify's legacy admin library) uses `[dir="rtl"] .dash-content { margin-right: 260px }` — an explicit physical property under a direction attribute selector
- An override using `margin-inline-start: 272px !important` is computed separately from `margin-right` — the browser applies both, and whichever resolves last or has higher specificity on the physical property wins
- Solution: use the same physical property names (`margin-right` for RTL, `margin-left` for LTR) in your override rule

## Details
During the 2026-05-23 sidebar V3 layout work, the admin page content was overlapping with the 272px sidebar. The override CSS initially used logical properties:

```css
/* BROKEN — logical property doesn't override PixInvent's physical margin-right */
body:has(.bdv3) .dash-content {
    margin-inline-start: 272px !important;
    margin-inline-end: 0 !important;
}
```

Even though `!important` was present, the content still had `marginRight: 0` in the inspector. The computed value showed PixInvent's `[dir="rtl"] .dash-content { margin-right: 260px }` was winning.

The fix:

```css
/* CORRECT — physical properties matching what PixInvent uses */
/* LTR default */
body:has(.bdv3) .dash-content {
    margin-left: 272px !important;
    margin-right: 0 !important;
}
/* RTL override */
[dir="rtl"] body:has(.bdv3) .dash-content {
    margin-right: 272px !important;
    margin-left: 0 !important;
}
```

After this change, the computed `marginRight` showed `272px` and content width was `1168px` (1440 − 272), with no sidebar overlap.

### The `[dir="rtl"]` selector placement gotcha
A second bug in the same session: the RTL selector was written as `body.bdv3-collapsed[dir="rtl"]` but `dir` is set on the `<html>` element, not `<body>`. This means the selector never matches.

```css
/* WRONG — dir attribute is on <html>, not <body> */
body.bdv3-collapsed[dir="rtl"] .dash-content {
    margin-right: 72px !important;
}

/* CORRECT */
[dir="rtl"] body.bdv3-collapsed .dash-content {
    margin-right: 72px !important;
}
```

### When logical properties ARE appropriate
Logical properties are correct and preferred when:
- Writing greenfield CSS that won't coexist with physical-property third-party styles
- Adding RTL support to your own components (not overriding others)
- The target element has no competing physical margin rules

They are problematic specifically when used as **overrides** on top of a library that uses physical properties — the logical and physical rules don't compete with each other in the cascade; the physical property can always win.

### Debugging tip
When an override with `!important` appears to have no effect, check the computed styles panel for the EXACT property name. If the library is setting `margin-right` and your rule sets `margin-inline-start`, you'll see both values in computed styles — not a conflict, just two separate properties being applied.

## PixInvent's non-standard RTL trigger (2026-05-28)

A related but deeper root cause discovered on 2026-05-28: PixInvent does not set `dir="rtl"` on `<html>` at all. It sets `data-textdirection="rtl"` on `<body>`. This means any CSS selector using `[dir="rtl"]` **never matches** in a PixInvent admin — not just doesn't override, but genuinely doesn't apply.

```css
/* NEVER FIRES in PixInvent admin — dir attribute is not set on any element */
[dir="rtl"] .dash-content { margin-right: 260px; }

/* CORRECT — matches PixInvent's custom attribute */
[data-textdirection="rtl"] .dash-content { margin-right: 260px; }
```

18 selectors in `sidebar-v3.css` and `header-v3.css` were corrected. The symptom was Arabic admin content overlapping the sidebar by ~25% width. See [[concepts/pixinvent-rtl-data-textdirection]] for full details.

## Related Concepts
- [[concepts/beldify-admin-v3-sidebar]] — The sidebar V3 layout work where both RTL bugs were encountered
- [[concepts/pixinvent-rtl-data-textdirection]] — PixInvent's `data-textdirection` attribute (non-standard `dir` replacement)
- [[concepts/admin-atlas-migration]] — The broader migration where PixInvent's CSS is being incrementally replaced
- [[concepts/tailwind-jit-dynamic-class-pitfalls]] — Other CSS correctness bugs in the Beldify admin

## Sources
- [[daily/2026-05-23.md]] — Content overlapping sidebar despite `!important`; traced to logical vs physical property cascade; fixed by switching to matching physical properties per direction; `[dir=rtl]` on `<html>` not `<body>` also fixed in the same session
- [[daily/2026-05-28.md]] — Deeper discovery: PixInvent uses `data-textdirection="rtl"` not `dir="rtl"`; 18 CSS selectors corrected; Arabic content overlap resolved
