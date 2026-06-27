---
name: Dual-Mode Seller Dashboard (Simple/Advanced)
description: "Binance Lite-vs-Pro progressive disclosure pattern adapted for the Beldify seller dashboard — Simple mode shows essentials (Products, Orders, Messages), Advanced reveals analytics and power tools"
type: concept
tags: [php, blade, migration, css, html, seller, shop, checkout, order, product]
sources: [daily/2026-05-31.md]
created: "2026-05-31"
updated: "2026-05-31"
---
# Dual-Mode Seller Dashboard (Simple/Advanced)

## Overview
The Beldify seller dashboard implements a dual-mode experience modeled on the Binance Lite vs Pro pattern, adapted for non-technical shop owners. Sellers default to **Simple** (beginner-friendly, mobile-first, no charts, daily-task focused). Sellers can switch to **Advanced** (analytics, filters, inventory insights, returns/refunds, exports). The switch is persisted via `localStorage('beldify_seller_dash_mode')` and applied before paint via an inline script in `seller_shell.blade.php` so there is no flash. Super Admin always gets Heavy mode and never sees a toggle.

## Key Points
- **Default**: Simple for sellers, Heavy for admin — never reversed automatically
- **Mechanism**: `[data-dash-section="complex"]` hidden by default; CSS reveals when `html.dash-mode--complex` class is present; applied pre-paint via inline localStorage script
- **Switch UI**: a labeled dropdown in the `seller_shell` topbar (`▤ Simple mode ▾` → menu: Simple / Advanced / "What's the difference?") — replaces the earlier two-pill segmented control
- **No dark patterns**: Simple→Advanced shows a one-time explainer dialog ("nothing is removed — switch back anytime"); Advanced→Simple is instant with only a toast
- **Settings page**: `seller/profile/edit.php` has a `#dashboard-view` anchor with two selectable mode cards explaining each mode
- **Permission divide**: the toggle lives only in `seller_shell`; admin layouts are untouched; no seller-facing toggle in admin chrome

## Details

### Architecture
The entire density mechanism is CSS + vanilla JS — no Alpine, no jQuery. Key files:
- `resources/views/layouts/seller_shell.blade.php` — toggle dropdown markup + pre-paint inline script
- `public/js/seller-dashboard.js` — toggle click handlers, explainer dialog logic, toast, `localStorage` persistence, MutationObserver for lazy-loaded Chart.js
- `public/css/seller-shell.css` — density CSS (hides/shows `[data-dash-section="complex"]`)

Chart.js is lazy-loaded **only in Advanced mode** — Simple never loads the charting bundle, keeping the page fast for mobile.

### Simple mode content (priority order)
1. Greeting + verification badge + "Add product" CTA
2. Today snapshot (3 plain KPI tiles: Total Orders, Net Revenue, Pending)
3. My Products awareness card
4. Carts & checkout awareness (read-only)
5. Orders to handle (top 3 pending, each with View CTA)
6. Messages inbox awareness (unread count + Reply)
7. Mobile FAB (+ button, links to `seller.products.create`)

### Advanced mode additions (`data-dash-section="complex"`)
- 4 more KPI tiles with deltas (Gross Revenue, Commission, Completed, Avg Order Value)
- Revenue breakdown donut chart (Atlas Indigo + Saffron Amber)
- Revenue by category donut
- Daily revenue line/area chart (30-day, lazy-loaded)
- Community requests grid
- Recent orders full data-table

### Migration history
The seller dashboard was previously on `layouts.seller_dashboard` (Bootstrap grid + Chart.js) — migrated to `seller_shell` as part of the 2026-05-31 impeccable pass. All 18 seller views now extend `seller_shell`.

### KPI grid (2026-05-31 polish)
A focused polish pass changed:
- KPI strip from 3 tiles (mobile) → **2×2 grid** (mobile), 4-up desktop
- Currency from `DH`-jammed to MAD locale-aware (`4,250 درهم` in Arabic, `MAD 4,250` otherwise)
- Active Products added as 4th tile (real data from `$store->product_count`)
- Onboarding banner purple stop (`#5046E5`) removed (DESIGN.md bans purple gradients)

## Related Concepts
- [[concepts/seller-shell-layout]] — the shell layout that hosts the toggle and all seller screens
- [[concepts/atlas-design-system]] — Atlas Indigo + Saffron Amber tokens used throughout
- [[concepts/admin-atlas-migration]] — admin Heavy mode; the seller toggle is not exposed there

## Sources
- [[daily/2026-05-31.md]] — Full dual-mode design spec created (10-agent workflow); all 18 seller views migrated to `seller_shell`; toggle dropdown replaces two-pill; light layer polish (2×2 KPI grid, MAD currency, no purple gradient); verified live in browser

## See also
- [[sources/gemini-2026-05-31-seller-dual-mode-reference-apply]]
