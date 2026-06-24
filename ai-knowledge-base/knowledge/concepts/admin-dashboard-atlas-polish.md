---
name: Admin Dashboard Atlas Polish (2026-05-31)
description: Impeccable pass on the Beldify admin dashboard — i18n eyebrow/subtitle, MAD currency, Atlas chart palette, leaking placeholder keys fixed; seller blank icons fixed simultaneously
type: concept
sources: [daily/2026-05-31.md]
created: 2026-05-31
updated: 2026-05-31
---

# Admin Dashboard Atlas Polish (2026-05-31)

## Overview
An `/impeccable` session on `http://localhost:7895/ar/admin/dashboard` identified and fixed four categories of issues: hardcoded English strings, `DH` currency instead of MAD, off-brand random chart palette (blue/purple/green), and leaking `messages.*` raw placeholder strings. The seller dashboard was also improved in the same session by fixing blank KPI icons caused by a dead CDN.

## Key Points
- **English eyebrow leak**: `<x-v3.page-header eyebrow="Overview"` was a hardcoded string, not `__('messages.overview')` — corrected with new `overview` + `admin_dashboard_subtitle` keys in en/ar/fr
- **Currency `DH` → `formatMoney()`**: the global `formatMoney()` helper uses `Currency::getCurrencySymbol()` and was already used by the seller dashboard; admin was using hardcoded `DH` in PHP (KPI values) and JS (chart tooltips) — both updated
- **Leaking placeholder keys**: `placeholder="messages.search_orders"` and `placeholder="messages.filter_by_status"` were **literal strings** (missing `__()` wrapper), not absent lang keys. Root cause confirmed by reading the form components: they already call `__($placeholder)` internally, so the fix was adding the missing keys to the lang files
- **Chart palette → Atlas**: all 6 admin charts (revenue distribution donut, top categories, user growth, order status, etc.) repainted from random `indigo-400`/`blue`/`purple`/`green` to **Atlas Indigo `#4338CA` + Saffron Amber `#F59E0B`** + permitted supporting tones (emerald/teal)
- **Table header leak**: "CREATED AT" and "ITEMS" were in English on Arabic pages — these used `{{ __($label) }}` in the header component, so adding `created_at_label` and `items` to `ar/messages.php` resolved them

## Details

### Key distinction: missing keys vs missing `__()` wrapper
The form components (`x-tables.header`, input components) already call `__()` internally. The placeholders showed raw `messages.search_orders` because the **key was missing from all lang files**, not because the wrapper was absent. This distinction matters: the fix is in the lang files, not the Blade templates. Only the `<x-v3.page-header eyebrow="Overview">` was a true missing-wrapper case.

### Opcache and sync procedure
After syncing via `sync-local.sh`, translations still showed raw keys because PHP-FPM opcache pinned the old `ar/messages.php` in shared memory. `validate_timestamps = On` was set but `docker cp` can backdate mtime. Fix: `docker restart beldify-local-app`. After restart, all translations resolved: `نظرة عامة | تصفية حسب الحالة | تحليلات...`

### PRODUCT.md created (impeccable init)
The `/impeccable` skill requires a `PRODUCT.md` at the project root. One was created during this session with:
- Register: `product` (seller/admin tools are the default surface; storefront is a per-task `brand` exception)
- Three-sided audience: artisan sellers, admins, in-country + diaspora shoppers
- A11y bar: WCAG 2.1 AA + full Arabic RTL parity + low-end-mobile/slow-network primary constraint
- Anti-references: no generic SaaS purple gradients, no western marketplace aesthetics

### Blade ParseError: seller/community/show.blade.php
Discovered during the session: navigating to a community post crashed with `syntax error, unexpected end of file, expecting "elseif" or "else" or "endif"` at line 95. Root cause: `@if($sellerResponse)` opened at line 35 had no `@endif` — the block was never closed. Fixed by inserting the missing `@endif` after the seller-response card closes. Also fixed hardcoded `DH` price in product offers to use `formatMoney()`.

## Related Concepts
- [[concepts/admin-atlas-migration]] — broader admin migration context this polish belongs to
- [[concepts/atlas-design-system]] — the design tokens applied to the charts
- [[concepts/beldify-local-volume-sync]] — the sync + opcache restart procedure used to verify fixes
- [[concepts/php-opcache-deployment-pitfall]] — opcache behavior that required container restart

## Sources
- [[daily/2026-05-31.md]] — `/impeccable` session on admin dashboard; PRODUCT.md created; all 4 issue categories fixed; seller blank icons fixed; community/show ParseError found and fixed; verified in browser screenshots
