---
name: Beldify Admin V3 Sidebar
description: "Clean V3 sidebar for the Beldify Laravel admin — indigo gradient surface, collapse rail, Cmd+K palette, dynamic badge counts, simplified 17-item menu; no PixInvent conflicts"
type: concept
tags: [php, blade, migration, notification, route, css, html, component, hook, state]
sources: [daily/2026-05-23.md, daily/2026-05-24.md, daily/2026-05-28.md]
created: "2026-05-23"
updated: "2026-05-28"
---
# Beldify Admin V3 Sidebar

## Overview
The Beldify admin sidebar went through three versions. V1 was the original PixInvent/AdminLTE Bootstrap 4 sidebar. V2 was a glass-morphism overlay that conflicted with PixInvent's menu accordion JS and collapse state management. V3 is a complete fresh implementation with no shared classes with V1/V2, an indigo gradient surface matching the Atlas brand, and robust toggle/collapse behavior. On 2026-05-24 V3 was further refined: the surface shifted from parchment to an indigo gradient (v7→v10 CSS assets), the menu was simplified from 50 to 17 items with a marketplace focus, section labels were fully translated, and dynamic badge counts were wired via [[concepts/sidebar-badge-service]].

## Key Points
- **Surface (current)**: indigo gradient (`from-indigo-900 to-indigo-800`), white text — unified with Atlas page-header gradient
- **Surface (v1)**: parchment `#FFFBEB` (amber-50), indigo-900 text — superseded 2026-05-24
- **Width states**: 272px (expanded) → 72px icon rail (collapsed)
- **All classes prefixed `bdv3-`** to prevent any collision with PixInvent's `.main-menu`, `.nav-link`, `.menu-collapsed` etc.
- **Submenu toggle**: `max-height: 0 → 32rem` (NOT `grid-template-rows` which fails with multiple `<li>` children — see [[concepts/css-accordion-max-height-pattern]])
- **Collapse state**: persisted in `localStorage` as `beldify:sb:v3:collapsed`; `\` keyboard shortcut toggles; JS clears all old `beldify:sb:*` keys on init to prevent stuck state from V1/V2
- **Cmd+K command palette**: all sidebar items indexed; fuzzy scoring; amber substring highlight; keyboard nav (`↑↓` + `↵`); grouped by section
- **Menu simplification**: 50 items → 17 items; marketplace-focused; removed internal-ops items irrelevant to seller workflow
- **Dynamic badge counts**: 5 badge keys (pending sales, purchases, orders, abandoned carts, store requests) via [[concepts/sidebar-badge-service]]
- **Section label translations**: all 8 section headers fully translated EN/AR/FR/MA

## Critical fix: V3 never wired to layouts (2026-05-28)

Despite `sidebar-v3.blade.php` existing since 2026-05-23, neither admin layout included it. Both layouts still hardcoded the legacy v1 sidebar:

```blade
{{-- dashboard.blade.php (and seller_dashboard.blade.php) — WRONG until 2026-05-28 --}}
@include('admin.includes.sidebar')   {{-- v1 legacy --}}
@include('admin.includes.header')    {{-- v1 legacy --}}
```

The fix was a direct include swap (bypassing the `sidebar-switch.blade.php` router entirely for the main layouts):

```blade
@include('admin.includes.sidebar-v3')
@include('admin.includes.header-v3')
```

The version-switch router (`?sidebar=v1`) still exists for the admin's own settings page.

## Details
V2 was abandoned because it was wedged into the PixInvent layout without isolation: the legacy menu accordion JS stepped on V2's chevron state, and `localStorage` keys from collapsed/expanded interactions persisted across page loads with no version namespace. Every rebuild of V2 introduced new conflicts.

V3 design decisions:

### Isolation strategy — body class (updated 2026-05-28)
Original isolation used `:has()` pseudo-class; this failed in the user's browser. Replaced with a plain body class `bdv3-shell` added to both layout files:

```html
<body class="... bdv3-shell">
```

```css
/* V3 hides the PixInvent sidebar entirely when active */
body.bdv3-shell .main-menu:not([class*="bdv3"]) {
    display: none !important;
}
/* Override PixInvent's content margin with physical properties (not logical) */
[data-textdirection="rtl"] body.bdv3-shell .dash-content {
    margin-right: 272px !important;
    margin-left: 0 !important;
}
```

All V3 class names use the `bdv3-` prefix. No Bootstrap or PixInvent class is reused. The legacy sidebar is hidden via the body class when V3 is active.

### RTL selector: `[data-textdirection="rtl"]` not `[dir="rtl"]` (2026-05-28)
See [[concepts/pixinvent-rtl-data-textdirection]]. PixInvent sets `data-textdirection="rtl"` on `<body>`, not `dir="rtl"` on `<html>`. All 18 RTL selectors in `sidebar-v3.css` and `header-v3.css` were corrected. Failure mode: Arabic admin had content overlapping the sidebar by ~25%.

### Section icons
8 section headers each have a Line Awesome icon rendered in Saffron Amber `#F59E0B`:
- OVERVIEW → `la la-home`
- COMMERCE → `la la-shopping-bag`
- CATALOG → `la la-cubes`
- SERVICES → `la la-cut`
- MARKETPLACE → `la la-store`
- FINANCE → `la la-coins`
- COMMUNITY → `la la-users`
- SETTINGS → `la la-cogs`

### Collapsed (72px) icon rail
When collapsed:
- Logo becomes "B" initial
- Menu labels hidden
- Hovering an icon shows the label as a glass tooltip (`position: absolute`, `backdrop-filter: blur(8px)`)
- All submenus auto-close (`is-open` class stripped from all parents on collapse)
- Content area reflows: `margin-right: 72px` in RTL, `1368px` wide (verified via Chrome DevTools)

### Cmd+K command palette
The palette is an `<aside id="bdv3-palette">` injected into the blade. JS builds an index from the sidebar's `data-label`, `data-href`, and `data-section` attributes at initialization — no hardcoded route list. Fuzzy scoring algorithm:
1. Exact match → score 100
2. Starts-with → score 80
3. Contains → score 60
4. Character subsequence match → score 20–40

Results are rendered grouped by section with the matched substring wrapped in `<mark class="bdv3-hl">` (styled amber). `↵` navigates to the item's `href`.

### Header V3
White surface (`#FFFFFF`) beside the sidebar:
- 60px tall, sticky, `z-index: 40`
- Notifications bell (pulls from `$notificationCounts` via `NotificationServiceProvider`)
- Language switcher (EN / FR / AR) — vanilla popovers, no jQuery
- User menu with avatar initial + name + email
- Hamburger only on mobile (`< 768px`)

### Version switch
`sidebar-switch.blade.php` and `header-switch.blade.php` read a `?sidebar=v1|v2` query parameter (session-sticky) to opt into legacy versions. Default is V3. This allows rollback without a deploy.

### File inventory
| File | Bytes (approx) | Purpose |
|------|---------------|---------|
| `resources/views/admin/includes/sidebar-v3.blade.php` | 18,743 | Sidebar blade with all menu items |
| `resources/views/admin/includes/header-v3.blade.php` | 9,796 | Header blade |
| `resources/views/admin/includes/sidebar-switch.blade.php` | 702 | Version router (default V3) |
| `resources/views/admin/includes/header-switch.blade.php` | 570 | Version router (default V3) |
| `public/css/sidebar-v3.css` | ~12,400 | Sidebar styles + RTL override |
| `public/css/header-v3.css` | ~8,678 | Header styles |
| `public/js/sidebar-v3.js` | ~6,820 | Toggle + collapse + search + Cmd+K |
| `public/js/header-v3.js` | ~2,397 | Notification popover + user menu |

All assets served via `?v=10` cache-bust suffix (v8: indigo gradient; v9: amber active-item glow; v10: badge count styles).

## Related Concepts
- [[concepts/css-accordion-max-height-pattern]] — Submenu toggle implementation used in V3
- [[concepts/css-rtl-override-physical-properties]] — RTL layout override pattern discovered during V3 layout work
- [[concepts/pixinvent-rtl-data-textdirection]] — PixInvent's non-standard `data-textdirection` attribute; 18 selectors fixed in this sidebar
- [[concepts/css-has-selector-body-class-hook]] — Why `:has()` was replaced with `body.bdv3-shell` class hook
- [[concepts/admin-atlas-migration]] — Broader migration context; V3 sidebar is a prerequisite for the rest
- [[concepts/atlas-design-system]] — Design tokens (Atlas Indigo, Saffron Amber) used throughout V3
- [[concepts/beldify-admin-v3-component-library]] — Component library that works alongside the V3 sidebar
- [[concepts/sidebar-badge-service]] — Service providing dynamic badge counts to the sidebar

## Sources
- [[daily/2026-05-23.md]] — Full V3 sidebar/header design and implementation; toggle fix; collapse rail; Cmd+K palette; RTL layout bugs resolved; section icons added; all deployed and verified via Chrome DevTools
- [[daily/2026-05-24.md]] — Surface restyle from parchment to indigo gradient (v8→v10); 50→17 item simplification; marketplace focus; section label translations; Messages item added; SidebarBadgeService dynamic badge counts wired
- [[daily/2026-05-28.md]] — Critical wiring fix: both admin layouts hardcoded v1 sidebar include; direct v3 swap applied; `:has()` → `body.bdv3-shell` body class fix; 18 RTL selectors corrected to `[data-textdirection="rtl"]`; sidebar-v3.css bumped to `?v=15`
