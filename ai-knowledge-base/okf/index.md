# Beldify OKF — Agent-Ready Surface Layer

## Quick Reference

| Key | Value |
|---|---|
| Stack | Laravel 11 (PHP 8.2+) + Next.js 14 (TypeScript) |
| DB | PostgreSQL 15 / MySQL 8.0 |
| Cache | Redis 7+ |
| Auth | Laravel Sanctum + Spatie Roles |
| Roles | super-admin, admin, store_owner, seller, customer |
| Frontend | Next.js App Router, Tailwind CSS, Framer Motion, GSAP |
| Admin | Custom Blade v3 (Atlas design system) |
| Deploy | Docker + MyContabo VPS, Surian Deploy via GHA |

## Architecture Map

```
beldify/
├── beldify-frontend/     # Next.js 14 (TypeScript, App Router)
│   ├── src/app/          # Pages: /, /products, /cart, /checkout, /orders, /profile, /seller/*
│   ├── src/components/   # Shared React components
│   ├── src/services/     # API service layer (axios → Laravel)
│   ├── src/hooks/        # Custom hooks (useAuth, useCart, etc.)
│   └── src/types/        # TypeScript type definitions
├── beldify-backend/      # Laravel 11 API + Blade admin
│   ├── app/Http/Controllers/  # API, Seller, Admin, Frontend controllers
│   ├── app/Models/        # 70+ Eloquent models
│   ├── app/Services/      # OrderService, StorageService
│   ├── routes/            # api.php (1111 lines), seller.php, admin.php, web.php
│   ├── database/migrations/  # All schema changes
│   └── resources/views/   # Blade admin + seller dashboard views
├── specs/                 # Feature specs (001-016)
├── docs/                  # Architecture, API, guides, changelog
└── ai-knowledge-base/     # KB concepts, sources, QA, daily logs
```

## Key Data Flow

### Buyer Checkout Flow
```
Frontend Cart → orderService.getQuote() → POST /api/orders/quote
  → OrderCheckoutController::quote() → OrderService::computeTotals()
    → Returns: { subtotal, sellers[], per_seller[], cod_allowed }

Frontend Checkout → orderService.checkout() → POST /api/orders/checkout
  → OrderCheckoutController::checkout() → OrderService::createCheckoutOrder()
    → 1 OrderGroup + N Orders (per seller) inside DB::transaction()
    → Returns: { id, order_number, group_number, group_id, orders[] }
```

### Seller Dashboard Flow
```
Frontend /seller → sellerDashboardService.getSellerEarnings()
  → GET /api/seller/earnings → SellerEarningsController
    → StoreRevenue aggregate + Order counts

Frontend /seller/orders → sellerDashboardService.getSellerOrders()
  → GET /api/seller/orders → SellerOrderApiController
    → Order::where('store_id', $store->id)->latest()
```

### Dual-Role (Buyer + Seller)
```
User has both 'customer' and 'store_owner' Spatie roles
  → AuthController::profile() returns is_seller: true
  → Frontend Navbar shows seller dashboard link
  → Profile page shows amber shortcut card
  → i18n keys in 7 locale files (010 feature)
```

## Active Feature Specs

| Spec | Status | Description |
|---|---|---|
| 014-multi-seller-orders | ✅ 29/31 done | Multi-seller basket splitting into per-seller orders |
| 016-deployment-drift-fix | ⚠️ 22/27 | Server deployment fix to main branch |
| 005-seller-verticals-jewelry | ⚠️ 45/47 | Jewelry vertical for sellers |
| 010-search-fixes | ⚠️ 3/13 | Search improvements |
| 010-dual-role-seller-i18n | ✅ 13/13 | Seller navigation i18n across 7 locales |
| 011-checkout-integrity | ✅ 7/7 | Checkout fixes |
| 011-darija-shopping-assistant | ✅ | Darija AI shopping assistant |
| 012-ai-listing-intelligence | ✅ 7/7 | AI listing tools |
| 013-opensouk-matchmaker | ✅ 7/7 | Open Souk AI matchmaker |
| 015-personalization | ❌ 0/26 | Personalization features |

## Known Gaps

- T029 (014): Order docs not written yet
- T031 (014): Code review pending
- 014-multi-seller-orders: 29/31 tasks done (T029 docs + T031 review remain)
- Backend tests: 32 multi-seller tests pass; 24 pre-existing failures in unrelated suites
- Frontend tests: 3495/3500 pass (5 flaky tests)
- TypeScript: 22 pre-existing errors (ignoreBuildErrors: true in next.config)
