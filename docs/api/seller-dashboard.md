# Seller Dashboard

## Overview

The seller dashboard is a Laravel Blade-based interface for sellers to manage their stores, products, orders, revenue, and community engagement. It is served from the backend at `/seller/*` routes.

## Prerequisites

- Authenticated user with `seller` role
- Store created and linked to the user account
- Appropriate permissions assigned (view_dashboard, manage_orders, manage_profile, view_reports, view_seller_community)

## Routes

| Route | Method | Controller | Permission | Description |
|-------|--------|------------|------------|-------------|
| `/seller/dashboard` | GET | `DashboardController@index` | view_dashboard | Main dashboard with stats, revenue charts, onboarding |
| `/seller/dashboard/revenue-data` | GET | `DashboardController@getRevenueData` | view_dashboard | AJAX endpoint for revenue chart data |
| `/seller/dashboard/export-orders` | GET | `DashboardController@exportOrders` | view_dashboard | CSV export of orders with commission details |
| `/seller/orders` | GET | `SellerOrderController@index` | manage_orders | List all orders with pagination |
| `/seller/orders/{id}` | GET | `SellerOrderController@show` | manage_orders | Order detail with items and commission |
| `/seller/orders/{id}` | PUT | `SellerOrderController@update` | manage_orders | Update order status |
| `/seller/reports` | GET | `SellerReportController@index` | view_reports | Sales reports with date filtering |
| `/seller/storeProfiles/edit` | GET | `StoreProfileController@edit` | manage_profile | Edit store profile |
| `/seller/storeProfiles/update` | PUT | `StoreProfileController@update` | manage_profile | Update store profile |
| `/seller/community` | GET | `CommunityController@index` | view_seller_community | Community posts list |
| `/seller/community/posts/{post}` | GET | `CommunityController@show` | view_seller_community | View community post |
| `/seller/community/posts/{post}/respond` | GET/POST | `CommunityController` | view_seller_community | Respond to community post |
| `/seller/messages` | GET | `MessageController@index` | view_seller_community | Message conversations |
| `/seller/messages/{userId}` | GET | `MessageController@show` | view_seller_community | View conversation |
| `/seller/messages/{userId}/send` | POST | `MessageController@send` | view_seller_community | Send message |

## Dashboard Features

### Main Dashboard (`/seller/dashboard`)

The dashboard provides:

- **Onboarding guidance**: Shown when store needs products or profile completion (< 90%)
- **Stats cards**: Total orders, pending orders, completed orders, net revenue, commission, average order value
- **Revenue chart**: Daily/monthly revenue with period selection (week/month/year)
- **Revenue by category**: Breakdown of sales by product category
- **Recent orders**: Last 10 orders with commission details
- **Store completion**: Percentage indicator for profile completeness

### Reports (`/seller/reports`)

Reports support date range filtering and display:

- **Sales summary**: Total sales, order count, average order value, total commission
- **Order statistics**: Breakdown by status (pending, processing, shipped, completed, delivered, cancelled)
- **Product performance**: Top 10 products by revenue with units sold
- **Revenue trends**: Daily revenue chart with order count overlay (Chart.js)

### Orders

- Paginated list view (15 per page)
- Detail view with line items, customer info, shipping details
- Status management (pending, processing, completed, cancelled, refunded)
- Commission tracking per order
- Order status change broadcasts via WebSocket events

## Configuration

### Currency

Currency symbol is fetched via `Currency::getCurrencySymbol()`, defaulting to `DH` (Moroccan Dirham).

### Commission

Commission rates are configured per store via the `CommissionRate` model (polymorphic). Default commission rate is 10%.

### Store Profile Completion

Profile completion is calculated based on these required fields:
- `store_name`, `description`, `contact_email`, `contact_phone`
- `store_logo`, `store_banner`, `store_locations`

## Troubleshooting

### "No store found" page

If a seller sees the no-store page, they need to:
1. Complete their user profile
2. Apply for a seller account
3. Have an admin approve their store

### Dashboard shows no data

Verify that:
- The store has `is_active = true`
- Orders exist in the `orders` table with the correct `store_id`
- Revenue records exist in `store_revenues` table

## Related

- [Frontend-Backend Alignment](./frontend-backend-alignment.md)
- [Backend CLAUDE.md](../../beldify-backend/CLAUDE.md)
