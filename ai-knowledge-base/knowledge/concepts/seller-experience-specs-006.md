---
name: Seller Experience Spec Suite (006)
description: "Five-slice professional spec for the Beldify seller experience — register wizard, products CRUD, order detail v3, analytics/reports, storefront preview; Slice C implemented 2026-05-24"
type: concept
tags: [php, blade, middleware, migration, route, controller, seller, order, product, auth]
sources: [daily/2026-05-24.md]
created: "2026-05-24"
updated: "2026-05-24"
---
# Seller Experience Spec Suite (006)

## Overview

A dedicated spec suite for the seller-facing dashboard, separated from the main admin V3 migration. Created 2026-05-24 in `specs/006-seller-experience/` after the decision to give sellers a focused shell (`seller_shell.blade.php`) instead of the 17-item admin sidebar.

## Spec Files

```
specs/006-seller-experience/
├── README.md       — overview + slice summary table
├── spec.md         — full requirements (all 5 slices)
├── plan.md         — implementation approach + routing decisions
├── research.md     — KB prior art references
└── tasks.md        — per-slice task breakdown
```

## Slices

| Slice | Feature | Status (as of 2026-05-24) |
|-------|---------|--------------------------|
| A | Products CRUD (Blade views, `Seller\ProductController`) | Spec ✓, not implemented — Products tab currently broken (bound to API controller returning JSON) |
| B | Order Detail v3 + Store Profile Edit | Spec ✓, not implemented |
| **C** | **Register Wizard + Store Setup** | **Implemented 2026-05-24** |
| D | Analytics / Reports | Spec ✓, not implemented |
| E | Storefront Preview | Spec ✓, not implemented |

## Slice C — Implemented Details

The register wizard and store-setup flow were the first slice delivered. Key changes:

- `Seller\OnboardingController` ← replaced legacy controller
- New views: `seller/onboarding/register.blade.php` (196 lines) + `seller/onboarding/store-setup.blade.php` (152 lines)
- Replaced: 569-line `register.blade.php` + 624-line `store-setup.blade.php` originals
- Layout: uses `seller_shell.blade.php` throughout (no admin PixInvent dependency)

## Architecture Decisions

- **Separate layout**: `layouts/seller_shell.blade.php` — mobile-first 5-tab bottom nav (`bdvs-` prefix), desktop pill nav, RTL-aware, iOS safe-area. Sellers never see the 17-item admin sidebar.
- **Separate controller namespace**: `App\Http\Controllers\Seller\*` — no API/JSON responses, Blade-only
- **Route group**: `seller.*` prefix, `auth` + `role:seller` middleware

## Related Articles

- [[concepts/seller-shell-layout]] — the dedicated mobile-first shell
- [[concepts/admin-atlas-migration]] — admin V3 context
- [[concepts/atlas-frontend-migration]] — Next.js Atlas migration (parallel effort)

## Next Steps (Phase 2026-05-24+)

1. Slice A: build `Seller\ProductController` + 4 product views (index, create, edit, show)
2. Slice B: port `seller/orders/show` + `seller/storeProfiles/edit` to seller shell
3. Slice D: analytics dashboard with Chart.js or Recharts
4. Slice E: iframe/preview of public storefront with overlay controls
