---
name: CSS Accordion Max-Height Pattern
description: The grid-template-rows 0fr trick only works with a single direct child — use max-height for accordions with multiple children
type: concept
tags: [migration, tailwind, javascript, css, html, pattern, atlas]
sources: [daily/2026-05-23.md]
created: "2026-05-23"
updated: "2026-05-23"
---
# CSS Accordion Max-Height Pattern

## Overview
A common CSS accordion pattern uses `grid-template-rows: 0fr` (closed) → `1fr` (open) for smooth height transitions. This pattern is elegant and avoids JavaScript, but has a critical constraint: it only collapses correctly when the grid container has **exactly one direct child**. When multiple children are present, the browser creates implicit grid rows for each child, and all rows remain full-height regardless of the `0fr` row template — the collapse never happens.

## Key Points
- `grid-template-rows: 0fr` collapses a grid track to zero height — but only the explicit row defined by the template
- When a `<ul>` has multiple `<li>` children, the browser auto-creates implicit rows for items 2, 3, 4… — these implicit rows are NOT affected by `grid-template-rows: 0fr`
- The symptom: toggling `is-open` class flips correctly in JavaScript, but the submenu visually stays expanded because the implicit rows hold the content open
- `max-height: 0` with `overflow: hidden` is bulletproof regardless of child count
- The `max-height` animation is slightly less smooth than the grid trick (linear vs cubic-bezier growth) but actually works

## Details
During the 2026-05-23 admin sidebar V3 work, the first submenu implementation used `grid-template-rows`:

```css
/* The broken pattern */
.bdv3__submenu {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 0.25s ease;
}
.bdv3__item.is-open > .bdv3__submenu {
    grid-template-rows: 1fr;
}
.bdv3__submenu > * {
    min-height: 0;  /* Required wrapper for the 0fr trick */
}
```

This worked in test cases with a single child. When applied to a `<ul>` with 4–9 `<li>` children (the actual sidebar submenus), Chrome computed `gridTemplateRows: "1.75px 34.3px 34.3px 34.3px"` — four rows, all full height, even when the parent had `is-open: false`. The grid treated `0fr` as applying only to the first explicit row, then auto-sized the rest.

### Correct implementation: max-height
```css
/* The bulletproof pattern */
.bdv3__submenu {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.25s ease;
}
.bdv3__item.is-open > .bdv3__submenu {
    max-height: 32rem;   /* 512px — large enough for any realistic submenu */
}
```

The `max-height` value should be set to a generous upper bound. If set too small, tall submenus get clipped. If set too large, the closing animation has a visible "pause" at the top because the transition starts from the large value even though content is already 0. A value of `32rem` (512px) works well for navigation submenus with up to ~15 items.

### Single-child use case (grid trick still valid)
When the accordion content is a single wrapper element (e.g., a `<div>` wrapping all the items), the grid trick works correctly and produces a buttery animation:

```html
<!-- This works with grid-template-rows: 0fr → 1fr -->
<ul class="bdv3__submenu">
    <div class="bdv3__submenu-inner">  <!-- single direct child -->
        <li>Item 1</li>
        <li>Item 2</li>
    </div>
</ul>
```

The key is that the grid container has one direct child. The items inside that wrapper are not grid items.

### Debugging the grid-rows issue
When a submenu appears stuck open, inspect with DevTools:
```js
// Paste in DevTools console
const submenu = document.querySelector('.bdv3__submenu');
console.log('gridTemplateRows:', getComputedStyle(submenu).gridTemplateRows);
// If you see "0px 34px 34px 34px" when it should be fully collapsed → multiple implicit rows
```

## Related Concepts
- [[concepts/beldify-admin-v3-sidebar]] — The sidebar where this fix was applied
- [[concepts/tailwind-jit-dynamic-class-pitfalls]] — Other CSS pitfalls in the Beldify admin codebase
- [[concepts/admin-atlas-migration]] — Broader admin redesign context

## Sources
- [[daily/2026-05-23.md]] — Grid-rows trick caused stuck submenus in the V3 sidebar; discovered via Chrome DevTools inspection of computed `gridTemplateRows`; fixed by switching to `max-height: 0 → 32rem`
