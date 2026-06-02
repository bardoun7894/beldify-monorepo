---
name: Multi-seller E-commerce
description: E-commerce platform allowing multiple vendors to sell products
type: concept
sources: [sources/backend-claude]
created: 2026-05-08
updated: 2026-05-08
---

# Multi-seller E-commerce

## Overview
Beldify is a multi-seller e-commerce platform that allows multiple vendors (stores) to sell products through a single marketplace. Similar to Etsy or Amazon Marketplace.

## Key Features
- **Store Management**: Each seller has their own store with profile
- **Product Catalog**: Multiple sellers list products in the marketplace
- **Order Handling**: Orders can span multiple sellers
- **Commission System**: Platform takes a commission on each sale via CommissionService
- **Tailoring Services**: Special handling for custom tailoring orders with measurements

## Domain Models
| Model | Purpose |
|-------|---------|
| `Store` | Seller's store entity |
| `StoreProfile` | Store settings and details |
| `Commission` | Platform commission configuration |
| `Product` | Items for sale |
| `Order` | Customer orders |
| `Tailor`, `TailoringOrder`, `Measurements` | Tailoring-specific data |

## Middleware
- `CheckStoreDetailsMiddleware`: Verifies store ownership
- `CustomRoleMiddleware`: Role-based access control

## See also
- [[sources/backend-claude]]
- [[entities/beldify]]
- [[entities/laravel]]
- [[concepts/service-repository-pattern]]