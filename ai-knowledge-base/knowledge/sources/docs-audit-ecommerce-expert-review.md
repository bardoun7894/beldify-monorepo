---
name: docs/audit/ecommerce-expert-review.md
description: Auto-synced from docs/audit/ecommerce-expert-review.md
type: source
sync_origin: docs/audit/ecommerce-expert-review.md
sync_hash: 9dd84bc32cd0d219
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from docs/audit/ecommerce-expert-review.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Beldify Backend — E-Commerce Expert Audit

> Read-only senior marketplace (Amazon-grade) audit of the Laravel backend. 5 domain reviewers, file:line evidence. Generated from workflow `wf_6b28b389-042`. **No code was modified by this audit.**

**Severity totals:** P0: 12 · P1: 25 · P2: 30 · P3: 11 · **78 issues total**


## Priority issue queue (all areas, by severity)

| # | Sev | Area | Issue | Effort |
|---|-----|------|-------|--------|
| 1 | **P0** | Catalog & Inventory | Seller-deleted products served publicly — missing is_deleted filter on public API | S |
| 2 | **P0** | Catalog & Inventory | Variant quantity never decremented on order — variant-level oversell guaranteed | M |
| 3 | **P0** | Orders, Fulfillment & Returns | Payment layer is entirely mocked — no real money is ever captured or tracked | L |
| 4 | **P0** | Orders, Fulfillment & Returns | Mobile OrderController queries dropped user_id column on orders — all mobile order reads/writes produce 500s | M |
| 5 | **P0** | Orders, Fulfillment & Returns | Stock oversell race condition — Mobile checkout has no pessimistic lock | S |
| 6 | **P0** | Orders, Fulfillment & Returns | OrderService::createOrder writes fields not in Order::$fillable — tax always stored as 0 | S |
| 7 | **P0** | Orders, Fulfillment & Returns | Commission rate silently dropped — 'rate' is not in Commission::$fillable | S |
| 8 | **P0** | Sellers, Commissions & Payouts | StoreRevenue::recordRevenue() does not exist — all payout record creation crashes at runtime | S |
| 9 | **P0** | Sellers, Commissions & Payouts | Commission model references columns absent from the commissions table schema — financial data silently lost | S |
| 10 | **P0** | Search, Discovery, Trust & Customer Experience | Mobile search and review controllers are entirely stubbed — 100% fabricated data served to real users | L |
| 11 | **P0** | Platform Health: Security, Data Integrity, Performance, API | Production secrets committed to git and file is still tracked | M |
| 12 | **P0** | Platform Health: Security, Data Integrity, Performance, API | Admin API routes have no role/permission gate — any authenticated buyer can access admin CRUD | S |
| 13 | **P1** | Catalog & Inventory | MegaOffer pivot column mismatch — all offer discounts silently zero on storefront | S |
| 14 | **P1** | Catalog & Inventory | VariantInventoryController::bulkUpdate — IDOR allows updating any variant's quantity/price | S |
| 15 | **P1** | Catalog & Inventory | Fixed-amount mega-offer discount not validated against product price — negative prices possible | S |
| 16 | **P1** | Catalog & Inventory | Dual soft-delete mechanism — is_deleted boolean and Eloquent SoftDeletes coexist without coordination | M |
| 17 | **P1** | Orders, Fulfillment & Returns | Order cancellation/refund never reverses commission or StoreRevenue | M |
| 18 | **P1** | Orders, Fulfillment & Returns | Mobile returnRequest calls $order->returns() on a non-existent relationship and table | L |
| 19 | **P1** | Orders, Fulfillment & Returns | Order status cache never invalidated on status changes — customers see stale order state | M |
| 20 | **P1** | Orders, Fulfillment & Returns | No order state machine — illegal transitions allowed (e.g. delivered→pending, cancelled→processing) | M |
| 21 | **P1** | Orders, Fulfillment & Returns | No checkout idempotency — double-tap creates duplicate orders and double-decrements stock | M |
| 22 | **P1** | Orders, Fulfillment & Returns | Cart::updateItem does not re-validate stock availability — silent oversell on quantity increase | S |
| 23 | **P1** | Sellers, Commissions & Payouts | CommissionPaymentController uses non-existent $commission->remaining_amount — overpayment possible, any payment marks commission fully paid | S |
| 24 | **P1** | Sellers, Commissions & Payouts | Commission management routes use overly permissive 'admin' middleware — community moderators can approve/reject/mark-paid payouts | S |
| 25 | **P1** | Sellers, Commissions & Payouts | CommissionService accounting entries silently fail inside DB::transaction — commission row commits while ledger entry is lost | M |
| 26 | **P1** | Sellers, Commissions & Payouts | CommissionService::createOrderCommission uses $order->total but the orders table column is total_amount — commission calculation uses null base | S |
| 27 | **P1** | Sellers, Commissions & Payouts | No idempotency guard on commission creation — duplicate commissions on retry or status transition replay | S |
| 28 | **P1** | Sellers, Commissions & Payouts | Admin\StoreRequestController::reconsider uses undefined local variable $storeService — fatal 500 on reconsider action | S |
| 29 | **P1** | Search, Discovery, Trust & Customer Experience | Frontend ReviewController silently returns fake reviews to production clients on any DB error or missing product | M |
| 30 | **P1** | Search, Discovery, Trust & Customer Experience | FCM push notifications use the deprecated legacy API — all message push notifications are silently dead | M |
| 31 | **P1** | Search, Discovery, Trust & Customer Experience | CommunityPostController::index discards computed cache key — all filters/pages share one stale cache entry | S |
| 32 | **P1** | Search, Discovery, Trust & Customer Experience | Review submission has no verified-purchase gate — any user can review any product without buying it | M |
| 33 | **P1** | Platform Health: Security, Data Integrity, Performance, API | Review endpoint silently serves synthetic mock data on any DB error, returning HTTP 200 | S |
| 34 | **P1** | Platform Health: Security, Data Integrity, Performance, API | Cart addItem has no transaction wrapping the stock availability check and cart creation | M |
| 35 | **P1** | Platform Health: Security, Data Integrity, Performance, API | Active debug Cache::forget on every order list request defeats caching | S |
| 36 | **P1** | Platform Health: Security, Data Integrity, Performance, API | Unwhitelisted user-controlled column passed directly to orderBy() — potential data probe / error leakage | S |
| 37 | **P1** | Platform Health: Security, Data Integrity, Performance, API | Review eager-load requests non-existent columns on users table, silently falling to mock data | S |
| 38 | **P2** | Catalog & Inventory | ProductPolicy references non-existent seller_id column — authorization always denies | S |
| 39 | **P2** | Catalog & Inventory | N+1 per-row DB queries from appended virtual attributes on Stock listings | M |
| 40 | **P2** | Catalog & Inventory | Slug uniqueness not validated on create — race condition allows duplicate slugs | S |
| 41 | **P2** | Catalog & Inventory | ProductRepository::getBestSellers uses is_featured as proxy for sales rank | L |
| 42 | **P2** | Catalog & Inventory | MegaOffersController reads image path as ->path instead of ->image_path | S |
| 43 | **P2** | Catalog & Inventory | StockController::store contains hardcoded production URL | S |
| 44 | **P2** | Orders, Fulfillment & Returns | Tax rate is hardcoded differently in three places — inconsistent totals across web and mobile | S |
| 45 | **P2** | Orders, Fulfillment & Returns | CartController::addItem assigns any cart to Store::first() — wrong seller in multi-store scenario | M |
| 46 | **P2** | Orders, Fulfillment & Returns | CartRecoveryService::processAbandonedCarts ignores the hours/days options passed from the command | S |
| 47 | **P2** | Orders, Fulfillment & Returns | OrderRepository::bulkUpdateStatus has no store-scoping — latent IDOR for seller bulk operations | S |
| 48 | **P2** | Sellers, Commissions & Payouts | CommissionBatchController::process marks commissions paid without accounting entries or payment reference | M |
| 49 | **P2** | Sellers, Commissions & Payouts | Commission::calculateCommission always returns a raw float, not the array shape expected by callers — type contract violation | S |
| 50 | **P2** | Sellers, Commissions & Payouts | Commission calculation uses only first order item's category for entire multi-item order — wrong rate applied to mixed-category orders | M |
| 51 | **P2** | Sellers, Commissions & Payouts | Commission arithmetic uses native PHP float — precision loss on MAD currency amounts | M |
| 52 | **P2** | Sellers, Commissions & Payouts | Dual accounting implementation creates divergence — CommissionAccountingService is never called from any live path | M |
| 53 | **P2** | Search, Discovery, Trust & Customer Experience | Review helpfulness reactions have no per-user tracking — unlimited ballot-stuffing allowed | M |
| 54 | **P2** | Search, Discovery, Trust & Customer Experience | Review sort column passed directly to orderBy without an allow-list — fragile and triggers silent mock fallback | S |
| 55 | **P2** | Search, Discovery, Trust & Customer Experience | Review cache invalidation uses a literal `*` wildcard key — cache is never actually cleared | S |
| 56 | **P2** | Search, Discovery, Trust & Customer Experience | BuyerMessageController::getConversations has severe N+1 queries — one DB round-trip per conversation | M |
| 57 | **P2** | Search, Discovery, Trust & Customer Experience | Category product listing recursively queries DB per subcategory level — unbounded for deep trees | M |
| 58 | **P2** | Search, Discovery, Trust & Customer Experience | getMensProducts always busts its own cache before recomputing — effective cache TTL is zero | S |
| 59 | **P2** | Search, Discovery, Trust & Customer Experience | ProductRecommendation::updateFrequency confidence_score subquery divides by total order count globally — formula is wrong | S |
| 60 | **P2** | Search, Discovery, Trust & Customer Experience | RecommendedController returns hardcoded mock sellers and tailors — recommendation engine never executes | L |
| 61 | **P2** | Platform Health: Security, Data Integrity, Performance, API | Cache invalidation key mismatch: order list cache never cleared after order creation | S |
| 62 | **P2** | Platform Health: Security, Data Integrity, Performance, API | Redis KEYS wildcard command used in production cache invalidation | M |
| 63 | **P2** | Platform Health: Security, Data Integrity, Performance, API | OrderService accepts caller-supplied unit_price — no server-side price enforcement in service layer | S |
| 64 | **P2** | Platform Health: Security, Data Integrity, Performance, API | Cart assigns Store::first() as the default store for every cart, ignoring multi-seller architecture | L |
| 65 | **P2** | Platform Health: Security, Data Integrity, Performance, API | Open-proxy script (api_proxy.php) present in repository root — latent SSRF | S |
| 66 | **P2** | Platform Health: Security, Data Integrity, Performance, API | Missing Content-Security-Policy header — XSS escalation path wide open | M |
| 67 | **P2** | Platform Health: Security, Data Integrity, Performance, API | Duplicate auth routes with inconsistent middleware and method verbs | M |
| 68 | **P3** | Catalog & Inventory | Category model lacks SoftDeletes — hard-delete cascades break product category_id FK | S |
| 69 | **P3** | Catalog & Inventory | InventoryService::updateStockProduct is a raw increment with no transaction or variant sync | M |
| 70 | **P3** | Orders, Fulfillment & Returns | OrderController::index calls Cache::forget on every read — cache provides zero benefit | S |
| 71 | **P3** | Orders, Fulfillment & Returns | web OrderController::show reads non-existent columns shipping_fee, discount, shipping_address | S |
| 72 | **P3** | Sellers, Commissions & Payouts | Commission::getDisplayDetails has unsafe $this->user->name and $this->store->name calls | S |
| 73 | **P3** | Sellers, Commissions & Payouts | SellerOrderController::show runs N+1 queries for order items fallback and queries StoreRevenue with wrong column name | S |
| 74 | **P3** | Search, Discovery, Trust & Customer Experience | SellerCommunityController::index query is executed twice per cache miss — double DB hit | S |
| 75 | **P3** | Search, Discovery, Trust & Customer Experience | BuyerMessageController::getConversationMessages logs full formatted message array at INFO level in production | S |
| 76 | **P3** | Platform Health: Security, Data Integrity, Performance, API | GET /api/user returns raw Eloquent model — potential field leakage | S |
| 77 | **P3** | Platform Health: Security, Data Integrity, Performance, API | Password reset routes on mobile have no rate limiting — brute-force of OTP/reset token possible | S |
| 78 | **P3** | Platform Health: Security, Data Integrity, Performance, API | AuthController::register always sets isActive=1 for all users including non-Google registrations | M |

---
## Detailed findings by domain


### Catalog & Inventory

Beldify's catalog and inventory layer carries significant structural debt from being built as a traditional ERP (single-stock, branch-scoped) and then extended for a multi-seller marketplace. The most consequential pattern is a dual visibility/deletion system: the `stocks` table has both Eloquent `SoftDeletes` (`deleted_at`) and a manual `is_deleted` boolean, but the primary public API endpoints (`ProductController::index`, `getDetails`, `newArrivals`) filter only on `is_active` and miss `is_deleted=0` entirely, meaning soft-deleted products from the seller dashboard are still served to customers. Inventory integrity has an architectural split: two separate order paths exist (`OrderService` and `Cart::convertToOrder`) and both correctly use `lockForUpdate()` on `Stock` but neither decrements at the variant level, while availability checks (`checkAvailability`) and the `total_quantity` appended attribute both read from `SUM(variants.quantity)`. This means variants go oversold while `Stock.quantity` drifts to zero, creating inconsistent stock signals across the platform. The MegaOffer subsystem has a schema mismatch: the original migration created `discount_percentage/discount_amount/special_price` columns, a second migration replaced them with `discount_type/discount_value`, but the frontend controller (`MegaOffersController`) still reads the old column names (`special_price`, `discount_percentage`, `discount_amount`) via the pivot — causing all offer discounts to silently resolve to zero on the storefront. Authorization in the admin inventory paths is incomplete: `VariantInventoryController::bulkUpdate` accepts arbitrary variant IDs with only `exists:product_variants,id` validation and no cross-check that the variant belongs to the route's stock, and these routes have no `role:admin` guard — only the top-level `auth` middleware. Quick wins include a global `Product`/`Stock` scope for `is_deleted`, fixing the pivot field names in `MegaOffersController`, and adding a fixed-discount ceiling validation.


#### P0 — Seller-deleted products served publicly — missing is_deleted filter on public API  _(effort: S)_
- **Evidence:** Seller\ProductController::destroy (line 510-512) sets is_deleted=true, is_active=0. ProductController::index (line 34+), newArrivals (line 522), and getDetails (line 663+) apply no is_deleted filter. Eloquent SoftDeletes only excludes rows where deleted_at IS NOT NULL. Stock::scopeActive() checks status='active' (Stock.php:236), Product::scopeActive() checks is_active=1 (Product.php:136), but neither includes is_deleted=false.
- **Impact:** Deleted products continue to appear in all public catalog listings. Customers can view, add to cart, and attempt to order products the seller has explicitly removed. A seller competitor could delete a product and have it still indexed in search.
- **Fix:** Add a global scope on Stock/Product that always appends WHERE is_deleted = 0 OR deleted_at IS NULL, or consolidate to use only Eloquent SoftDeletes and replace all is_deleted=true writes with $model->delete().

#### P0 — Variant quantity never decremented on order — variant-level oversell guaranteed  _(effort: M)_
- **Evidence:** OrderService::processOrderItem (OrderService.php:66-85) calls lockForUpdate() on Stock and decrements stock.quantity but ignores variants entirely. Cart::convertToOrder (Cart.php:159-192) does the same. checkAvailability (StockController.php:499-508) computes availableQuantity from SUM(variants.quantity) via getTotalQuantityAttribute. So availability is read from variants but writes go to stock. ProductController::index passes variants to cart with their individual quantities; OrderItem stores variant_id but stock-level decrement means variants can be decremented to 0 only at the stock aggregate level, not at individual variant level.
- **Impact:** Two concurrent orders for different variants of the same product each check the stock aggregate and both pass. Individual variant quantities never go negative in DB but the real sellable units per color/size are never decremented. A 'Red L / Blue L' product with quantity 1 each can be oversold 2x if Stock.quantity starts at 2.
- **Fix:** When variant_id is present, call ProductVariant::lockForUpdate()->findOrFail($variantId) inside the transaction, validate and decrement variant.quantity, then recompute and update stock.quantity as SUM of remaining variant quantities.

#### P1 — MegaOffer pivot column mismatch — all offer discounts silently zero on storefront  _(effort: S)_
- **Evidence:** Migration 2025_06_05_001000_update_mega_offer_products_table.php lines 16-20 dropped discount_percentage/discount_amount/special_price and replaced with discount_type/discount_value. MegaOffer::products() uses withPivot('discount_type','discount_value') (MegaOffer.php:46). Admin attaches with discount_type/discount_value keys (MegaOfferController.php:161-163). MegaOffersController::formatProductsData (MegaOffersController.php:158-160) reads $product->pivot->special_price, $product->pivot->discount_percentage, $product->pivot->discount_amount — all of which no longer exist. The $finalPrice calculation (line 165-169) falls through to null, returning originalPrice as both price and discount_price.
- **Impact:** Every product inside a MegaOffer displays full price with no discount on the customer-facing storefront. Offer campaigns are completely ineffective at driving sales. Admin team believes discounts are active.
- **Fix:** Update MegaOffersController::formatProductsData to read pivot->discount_type and pivot->discount_value, then branch on type to compute finalPrice — matching the data model written by the admin controller.

#### P1 — VariantInventoryController::bulkUpdate — IDOR allows updating any variant's quantity/price  _(effort: S)_
- **Evidence:** VariantInventoryController::bulkUpdate (lines 188-229) validates variants.*.id only with exists:product_variants,id. The inner update is ProductVariant::where('id', $variantData['id'])->update([...]). No WHERE stock_id = $stock->id is applied. Routes are at web.php:740-744 inside the global auth+IsActive middleware only — no role:admin or permission: sub-guard.
- **Impact:** Any authenticated user can POST to /admin/products/{any_stock_id}/inventory/bulk-update with arbitrary variant IDs belonging to other sellers, overwriting their stock quantities and prices. This is a cross-tenant inventory manipulation vulnerability.
- **Fix:** Add ->where('stock_id', $stock->id) to the ProductVariant update query, and add a role:super-admin or permission:view_inventory middleware to the admin/products prefix group.

#### P1 — Fixed-amount mega-offer discount not validated against product price — negative prices possible  _(effort: S)_
- **Evidence:** MegaOfferController::store/update validates percentage <= 100 (lines 146, 270, 513) but applies no upper bound to fixed discount_value. MegaOffersController::formatProductsData line 169 computes finalPrice = originalPrice - discountAmount with no max(0, ...) guard. A fixed discount of 5000 on a 100 MAD product yields -4900.
- **Impact:** Negative prices are serialized to the API response and displayed on the storefront. Cart subtotals and order totals would be computed with negative line items, potentially allowing zero-cost or negative-total orders depending on cart logic.
- **Fix:** Add validation rule max:{current_sale_unit_price} for fixed discount_value (requires passing price to validator or validating in service layer), and add max(0, $finalPrice) in formatProductsData.

#### P1 — Dual soft-delete mechanism — is_deleted boolean and Eloquent SoftDeletes coexist without coordination  _(effort: M)_
- **Evidence:** Stock uses SoftDeletes (Stock.php:10,16), migration adds is_deleted boolean (2021_12_09_094825_create_stocks_table.php:37). Seller\ProductController::destroy sets is_deleted=true but does NOT call $product->delete() so deleted_at stays NULL. Admin StockController::deleteStock (line 311) calls $stock->delete() and sets deleted_at but does not set is_deleted=true. Product visibility filters are inconsistent across controllers (some check is_deleted=false, some check deleted_at via SoftDeletes, some check only is_active).
- **Impact:** A product deleted via admin UI (delete() called) still passes is_deleted=false filters. A product deleted via seller UI (is_deleted=true) still passes Eloquent's SoftDeletes scope. Catalog integrity cannot be reliably guaranteed from either path alone.
- **Fix:** Consolidate to a single mechanism: use Eloquent SoftDeletes exclusively, remove the is_deleted column (or keep for UI convention but always keep in sync via a model observer that also calls delete()/restore()), and add a global scope that consistently enforces both.

#### P2 — ProductPolicy references non-existent seller_id column — authorization always denies  _(effort: S)_
- **Evidence:** ProductPolicy::view/update/delete (ProductPolicy.php lines 21, 32, 39) checks $product->seller_id === $user->id. The Stock/$fillable has no seller_id — ownership is via store_id and user_id. $product->seller_id will always be null, so the policy always returns false. Seller\ProductController does not use authorize() and enforces ownership manually via store_id scoping.
- **Impact:** The policy is dead but broken: if it were ever wired up via $this->authorize() it would silently block all seller product access. Future developers may call authorize('update', $product) trusting it works. The manually-scoped enforcement in the controller is correct but unsupported by the policy layer.
- **Fix:** Fix ProductPolicy to check $product->store_id === $user->store->id (or $product->user_id === $user->id), register the policy for the Stock model as well, and use $this->authorize() in the seller controller.

#### P2 — N+1 per-row DB queries from appended virtual attributes on Stock listings  _(effort: M)_
- **Evidence:** Stock::$appends includes total_quantity (Stock.php:84) which runs variants()->sum('quantity') per row when variants are not eager-loaded (Stock.php:358-368). Product::$appends adds average_rating, reviews_count, main_image (Product.php:22). Admin\StockController::index (lines 66-78) eager-loads category/user/productImages but not variants, so every row in the paginated admin stock list fires one extra SUM query for total_quantity.
- **Impact:** With 1000 products on the admin list, pagination of 10 items fires 10 extra SUM queries per page. Scales linearly. Under load this saturates the DB connection pool.
- **Fix:** Either remove total_quantity from $appends (make it opt-in via withTotalQuantity scope that adds a selectRaw subquery), or always eager-load variants in every query that touches the admin list. Same pattern for review aggregates.

#### P2 — Slug uniqueness not validated on create — race condition allows duplicate slugs  _(effort: S)_
- **Evidence:** Seller\ProductController::store (line 150) generates slug as Str::slug($name).'-'.Str::random(6) with no uniqueness check. The DB has a unique index on stocks.slug (migration 2024_11_26_000001_add_missing_columns_to_stocks.php:16) so a collision throws a QueryException caught by the generic catch block and surfaced as 'something went wrong'.
- **Impact:** Concurrent product creation by the same seller can produce a duplicate-slug 500 error rather than a clean validation message. The slug is used for SEO URLs and Next.js revalidation; non-unique slugs break canonical product pages.
- **Fix:** Add a uniqueness loop (similar to VariantWriteService::generateUniqueSku) or validate uniqueness before insert with a Rule::unique('stocks','slug') rule.

#### P2 — ProductRepository::getBestSellers uses is_featured as proxy for sales rank  _(effort: L)_
- **Evidence:** ProductRepository.php lines 185-199 returns featured() products as best sellers with comment 'Using featured as proxy for best sellers'. This method is called from API endpoints surfaced to customers.
- **Impact:** Best-seller rankings reflect manual curation, not actual purchase volume. Manipulable by admin toggling is_featured. Customers making purchase decisions based on 'Best Sellers' see incorrect data, harming discovery and trust.
- **Fix:** Implement a real best-sellers query joining order_items (SUM qty, grouped by stock_id, filtered to delivered orders in a trailing window), cached via CacheService with a daily refresh.

#### P2 — MegaOffersController reads image path as ->path instead of ->image_path  _(effort: S)_
- **Evidence:** MegaOffersController::formatProductsData (lines 204-207) accesses $mainImage->path and $image->path. ProductImage model and migration use image_path as the column name (ProductImage.php:16, migration 2024_11_26_000002_create_product_related_tables.php:15). There is an accessor on ProductImage that exposes image_path, but no path property or accessor.
- **Impact:** All product images in MegaOffer API responses resolve to null. Customers see no images for any product featured in offers.
- **Fix:** Replace $mainImage->path with $mainImage->image_path (and $image->path with $image->image_path) throughout formatProductsData.

#### P2 — StockController::store contains hardcoded production URL  _(effort: S)_
- **Evidence:** StockController.php line 200: 'redirect_url' => 'https://pro.beldify.com/en/admin/products/' . $stock->id . '/images'
- **Impact:** In staging, local, or other environments this returns a URL pointing to production, causing admin to be redirected to the wrong environment after product creation. Could cause accidental production data edits from staging.
- **Fix:** Replace with route('admin.product-images.index', $stock->id) or url('/en/admin/products/'.$stock->id.'/images').

#### P3 — Category model lacks SoftDeletes — hard-delete cascades break product category_id FK  _(effort: S)_
- **Evidence:** Category.php has no SoftDeletes trait. Admin CategoryController can call delete() directly. stocks.category_id has no onDelete action specified in migration 2021_12_09_094825_create_stocks_table.php, defaulting to RESTRICT in MySQL, but only if a FK constraint was created. Products in deleted categories would have orphaned category_id or be blocked from deletion.
- **Impact:** Deleting an active category with products either throws a FK violation (blocking the delete with a 500 error) or leaves products with a null/invalid category reference, breaking category-scoped browse pages.
- **Fix:** Add SoftDeletes to Category and add a check in CategoryController to prevent deletion if active products remain (or bulk-reassign them to a parent/uncategorized category first).

#### P3 — InventoryService::updateStockProduct is a raw increment with no transaction or variant sync  _(effort: M)_
- **Evidence:** InventoryService.php lines 9-16: finds stock, increments quantity, updates prices directly with save(). No DB::transaction(), no variant quantity reconciliation, no StockMovement record written.
- **Impact:** Purchase receipt stock additions are not atomic. If save() fails mid-way, price and quantity updates diverge. No audit trail entry is written for the purchase-receipt increment, unlike initial stock via addInitialStock in StockController.
- **Fix:** Wrap in DB::transaction(), create a StockMovement record for traceability, and update variant quantities proportionally if variants exist.

**Gaps vs best-in-class:**
- No reservation/hold system: inventory is not reserved at add-to-cart time, only decremented at order placement. High-demand products can show in-stock to 100 concurrent carts and all 100 attempt checkout.
- No atomic variant-level stock check with lock: even with lockForUpdate on Stock, the variant quantity check (OrderController::processOrderItem line 340) reads from an already-loaded collection, not a locked row — the live path (OrderService) skips variants entirely.
- No per-variant SKU uniqueness enforcement at API level: VariantWriteService generates unique SKUs but the DB unique index only applies to product_variants, not enforced globally across all products from all sellers.
- No search indexing (Elasticsearch/Algolia/Meilisearch): all search is LIKE '%term%' full-table scans (ProductRepository.php:162, ProductController.php:66). No tokenization, no relevance scoring, no Arabic stemming despite bilingual catalog.
- No stock reservation TTL: abandoned carts never release held quantities (carts are soft-deleted but Stock.quantity is never restored on cart expiry).
- No price history / audit log: current_sale_unit_price is updated in place with no history table. Cannot reconstruct what a product cost on a given date for dispute resolution or analytics.
- No category tree integrity check: parent_id allows circular references (Category can set parent_id to a child), causing infinite recursion in getEffectiveCommissionRateAttribute (Category.php:107) — the depth guard at line 108 is a mitigation but not a fix.
- No image CDN optimization pipeline: images are stored as-is with only optional WebP conversion (StockController.php:167-170). No responsive size generation (thumbnails, medium, large), no lazy-load URL variants.
- No product approval/moderation workflow for seller-submitted products: is_active defaults to 1 on creation (Seller ProductController.php:152), meaning new seller products go live immediately with no admin review.
- No bulk catalog import (CSV/XLSX): sellers must create products one at a time through the UI. Amazon/Shopify-grade marketplaces require bulk upload with validation and error reporting.
- Best-sellers is faked with is_featured flag (ProductRepository.php:189) rather than computed from order volume.
- No faceted search with inventory-aware counts: filter options (color, size) do not exclude out-of-stock variants from the count, leading to zero-result filter selections.
- No product bundling or kit SKU support.
- No multi-warehouse routing: StockLocation model exists but is unused in any order or availability path.

**Quick wins:**
- Fix MegaOffersController::formatProductsData: change ->path to ->image_path (3 lines) and read pivot->discount_type / pivot->discount_value instead of the dropped column names — restores images and discounts for all offer campaigns immediately.
- Add ->where('is_deleted', false) to ProductController::index, newArrivals, getDetails, and details — prevents deleted products from appearing in the storefront (one line per query).
- Add ->where('stock_id', $stock->id) to VariantInventoryController::bulkUpdate's update query — closes the cross-tenant IDOR with a single line.
- Replace the hardcoded 'https://pro.beldify.com/...' URL in StockController.php:200 with a route() helper call.
- Add max(0, $finalPrice) in MegaOffersController::formatProductsData line 169 to prevent negative prices from fixed discount_amount exceeding product price.
- Add DB::transaction() to InventoryService::updateStockProduct to make purchase-receipt stock increments atomic.


### Orders, Fulfillment & Returns

The Beldify order domain is in an early-but-fragmented state. Three mutually inconsistent checkout implementations exist simultaneously — `OrderService::createOrder` (routed at POST /api/v1/orders), `Cart::convertToOrder` (not yet routed), and Mobile `OrderController::create` (routed at POST /api/mobile/v1/orders/create) — with none of them correct end-to-end. The most critical problem is that the payment layer is entirely mocked (PaymentController returns fabricated transaction IDs, never updates payment_status, never persists a payment record), which means the OrderObserver's commission creation never fires in practice since it gates on payment_status='paid'. When orders are cancelled, commissions and StoreRevenue records are never reversed — stock is restored but the financial ledger is not. The schema has diverged across multiple partial migrations: the orders table dropped user_id and replaced it with customer_id, but the Mobile OrderController still queries user_id on every read and write, producing 500s or empty results for all mobile order operations. Order state transitions carry no enforcement: any status can jump to any other without guards. The refund pathway is a stub that returns hardcoded data and does not interact with the database. Given that money handling, fulfillment, and the return flow are all either broken or mocked, this domain requires significant remediation before it can serve real customers.


#### P0 — Payment layer is entirely mocked — no real money is ever captured or tracked  _(effort: L)_
- **Evidence:** app/Http/Controllers/Api/Mobile/PaymentController.php:149-168 — processPayment() calls mockPaymentProcessing() and returns a fabricated array; no Payment record is persisted. getPaymentStatus():200-213 returns hardcoded data including 'txn_'.uniqid(). refundPayment():265-275 returns a stub. routes/api.php:622-626 wires these mock methods to live endpoints.
- **Impact:** 100% of mobile payment calls succeed without charging anyone. payment_status on orders is never set to 'paid', so OrderObserver::createCommissions() (which gates on payment_status='paid') never fires, commissions are never recorded, and StoreRevenue is never written. The entire financial pipeline downstream of payment is inert.
- **Fix:** Integrate a real payment gateway (Stripe/CMI/HPS for Morocco) before launch. Replace the mock with an actual gateway client, persist payment records to the payments table, and update order.payment_status on webhook confirmation.

#### P0 — Mobile OrderController queries dropped user_id column on orders — all mobile order reads/writes produce 500s  _(effort: M)_
- **Evidence:** database/migrations/2024_12_11_213700_add_customer_id_to_orders_table.php drops user_id from orders and adds customer_id. app/Http/Controllers/Api/Mobile/OrderController.php:29,120,187,218,272,324,350 — every query uses where('user_id', ...) and create(['user_id' => ...]). These hit a non-existent column.
- **Impact:** All mobile order listing, order detail, cancel, track, and return-request endpoints throw a database error for every authenticated user. No mobile customer can view or manage orders.
- **Fix:** Replace all user_id references in Mobile OrderController with customer_id lookups via Customer::where('user_id', $user->id)->value('id'), mirroring the pattern already used in the web OrderController.

#### P0 — Stock oversell race condition — Mobile checkout has no pessimistic lock  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Mobile/OrderController.php:99-106 reads stock->quantity without a lock, then at line 147 decrements it in a separate statement outside any SELECT...FOR UPDATE. Concurrent requests between the availability check (line 100) and decrement (line 147) can each pass the check and both succeed, overselling the item.
- **Impact:** Concurrent mobile checkouts for a low-stock item will oversell. Both customers receive a confirmed order but only one unit exists. Requires manual reconciliation and seller/buyer disputes.
- **Fix:** Inside the DB::beginTransaction block, replace Stock quantity reads with Stock::lockForUpdate()->find($item->stock_id) and move the availability check after the lock, matching the pattern in OrderService::processOrderItem:66.

#### P0 — OrderService::createOrder writes fields not in Order::$fillable — tax always stored as 0  _(effort: S)_
- **Evidence:** app/Services/OrderService.php:32-33 writes 'tax' and 'shipping_cost'; app/Services/OrderService.php:53 writes 'tax' => $tax. app/Models/Order.php:16-36 fillable list contains 'tax_amount' and 'shipping_amount' — not 'tax' or 'shipping_cost'. Mass-assignment silently drops them. The order is created with tax=0 and shipping=0 regardless of the calculated values.
- **Impact:** Every order created via POST /api/v1/orders (the primary non-mobile checkout route) is stored with incorrect totals. Revenue reporting, commission calculation based on subtotal, and customer invoices are all wrong.
- **Fix:** Align OrderService::createOrder to use the correct column names: 'tax_amount' instead of 'tax', 'shipping_amount' instead of 'shipping_cost'. Verify Order::$fillable is the authoritative list and add any missing fields.

#### P0 — Commission rate silently dropped — 'rate' is not in Commission::$fillable  _(effort: S)_
- **Evidence:** app/Observers/OrderObserver.php:41-46,63-67,79-83 creates Commission records with 'rate' => $storeCommissionRate. app/Models/Commission.php:34-46 fillable list is: user_id, store_id, order_id, amount, commission_amount, commission_rate_id, type, status, paid_at, notes, metadata — 'rate' is absent. The column exists in the DB (migration line 19) but is mass-assignment guarded.
- **Impact:** All commission records are created with rate=NULL. Commission rate auditing and retrospective reconciliation are impossible. The store commission rate_id is also not recorded (observer doesn't populate commission_rate_id), making the CommissionRate relationship useless.
- **Fix:** Add 'rate' to Commission::$fillable, or use $commission->forceFill(['rate' => ...]) intentionally. Also populate 'commission_rate_id' from the applicable CommissionRate record.

#### P1 — Order cancellation/refund never reverses commission or StoreRevenue  _(effort: M)_
- **Evidence:** app/Services/OrderService.php:101-119 — cancelOrder() restores stock inventory but makes no mention of Commission or StoreRevenue. app/Http/Controllers/Api/Mobile/OrderController.php:230-244 — mobile cancel also only restores stock. app/Observers/OrderObserver.php creates Commission and StoreRevenue records on payment. No listener or observer handles the cancelled or refunded status transition to reverse them.
- **Impact:** When an order is cancelled after payment, the seller retains a pending commission and an inflated StoreRevenue entry. Platform financial reports overstate revenue. Seller payouts can include amounts for orders that were refunded.
- **Fix:** Add an 'updated' observer branch (or a dedicated CancelOrder service method) that calls $commission->cancel() and reverses or soft-deletes the StoreRevenue record whenever order status transitions to 'cancelled' or 'refunded'.

#### P1 — Mobile returnRequest calls $order->returns() on a non-existent relationship and table  _(effort: L)_
- **Evidence:** app/Http/Controllers/Api/Mobile/OrderController.php:349 — $returnRequest = $order->returns()->create([...]). app/Models/Order.php has no returns() relationship defined (lines 1-179). No migration for an order_returns or return_requests table exists in database/migrations/. routes/api.php:608 wires this endpoint live.
- **Impact:** Every POST to /api/mobile/v1/orders/{id}/return throws a fatal BadMethodCallException. The entire return flow is completely non-functional for mobile users.
- **Fix:** Create an OrderReturn model, migration (order_returns table with order_id, user_id, status, reason, items), and add a returns() HasMany relationship to Order. Implement the actual return workflow including status tracking.

#### P1 — Order status cache never invalidated on status changes — customers see stale order state  _(effort: M)_
- **Evidence:** app/Http/Controllers/OrderController.php:48 — Cache::forget($cacheKey) is called with key 'user:{$userId}:orders:list:{$guard}' on every read (not just on mutation — this is for testing). The private clearOrderCache() method at line:255 forgets 'user:{$userId}:orders:list' (missing the :{guard} suffix), and is never called from any write path. Order status updates in SellerOrderController and Admin OrderController dispatch OrderStatusChanged but never call clearOrderCache.
- **Impact:** After a seller marks an order as shipped/delivered, the customer's order list API continues to return the old status for up to 1 hour (TTL=3600s). Payment status cached incorrectly can also mislead customers about unpaid orders.
- **Fix:** Add cache invalidation in SellerOrderController::update, Admin OrderController::updateStatus, and OrderService::cancelOrder. Call Cache::forget with all relevant key variants (list + specific order, all guards) whenever order status or payment_status changes.

#### P1 — No order state machine — illegal transitions allowed (e.g. delivered→pending, cancelled→processing)  _(effort: M)_
- **Evidence:** app/Http/Controllers/Admin/OrderController.php:149 — updateStatus validates 'in:pending,processing,completed,cancelled' with no check on previous state. app/Http/Controllers/Seller/SellerOrderController.php:126 — validates 'in:pending,processing,completed,cancelled,refunded' with no guard on previousStatus transitions. No transition matrix exists anywhere in the codebase.
- **Impact:** A seller can move a delivered order back to pending, or mark a cancelled order as completed to fraudulently trigger commission creation. Order history becomes meaningless. Automated processes (abandoned cart timeout, auto-complete) can race with manual updates.
- **Fix:** Implement an allowed-transitions map on the Order model (e.g. const TRANSITIONS = ['pending'=>['confirmed','cancelled'],...]) and validate in a dedicated OrderStatusService before persisting. Throw a 422 on illegal transitions.

#### P1 — No checkout idempotency — double-tap creates duplicate orders and double-decrements stock  _(effort: M)_
- **Evidence:** app/Services/OrderService.php:93-96 — generateOrderNumber() returns 'ORD-'.date('Ymd').'-'.Str::random(6) with no uniqueness check before creating the order. app/Http/Controllers/Api/Mobile/OrderController.php:444-450 — generateOrderNumber() loops until unique but the create at line:119 is not inside a unique constraint transaction guard. No idempotency key header is read or stored. A network timeout causing a client retry will submit the same cart twice.
- **Impact:** Double order placement charges (or COD-commits) the customer twice, decrements stock twice, creates duplicate commissions, and is extremely hard to reconcile post-facto.
- **Fix:** Accept an Idempotency-Key header on the checkout endpoint. Cache it with the response for 24 hours (using Redis). Check the key before processing and return the cached response on replay. OrderService should also add a unique database constraint check before order creation.

#### P1 — Cart::updateItem does not re-validate stock availability — silent oversell on quantity increase  _(effort: S)_
- **Evidence:** app/Http/Controllers/CartController.php:410-467 — updateItem() validates quantity min:1 but never checks if the new quantity exceeds available stock before updating the cart item. The stock availability check happens at checkout but by then multiple carts may hold more than stock allows.
- **Impact:** A customer can set cart quantity to 999 for a 1-unit item. At checkout time the stock check fires, but multiple concurrent carts holding oversized quantities can all pass an under-concurrent-load check window.
- **Fix:** In CartController::updateItem (and addItem for quantity increases), fetch the stock with a share lock and verify available_quantity >= new_quantity before persisting the cart item.

#### P2 — Tax rate is hardcoded differently in three places — inconsistent totals across web and mobile  _(effort: S)_
- **Evidence:** app/Models/Cart.php:97 uses config('cart.tax_rate', 0.15) (15%). app/Http/Controllers/CartController.php:723 hardcodes 0.15 (15%). app/Http/Controllers/Api/Mobile/CartController.php:474 hardcodes 0.10 (10%). app/Http/Controllers/Api/Mobile/OrderController.php:474 hardcodes 0.10 (10%). Cart summary shown to web customer (15%) differs from mobile summary (10%) for the same basket.
- **Impact:** Customer sees different totals on web vs mobile checkout. One of the two is wrong for Morocco VAT compliance. Commission is calculated on subtotal not net-of-VAT which may also be incorrect.
- **Fix:** Centralize all tax logic in a TaxService. Respect the config('cart.tax_rate') value everywhere. Remove all hardcoded 0.10/0.15 literals.

#### P2 — CartController::addItem assigns any cart to Store::first() — wrong seller in multi-store scenario  _(effort: M)_
- **Evidence:** app/Http/Controllers/CartController.php:44,166 — when no cart exists, it assigns store_id to Store::first() (arbitrary first row). In a multi-seller marketplace, a buyer browsing seller B's product gets their cart stamped with seller A's store_id. Order inherits this store_id (Cart::convertToOrder line:168 copies store_id).
- **Impact:** Commission, StoreRevenue, and seller dashboards are attributed to the wrong seller. Seller A sees orders from Seller B's customers.
- **Fix:** Derive store_id from the product/stock being added (stock->store_id), not from Store::first(). Multi-store carts need a per-store cart or a cart-item-level store_id (the migration at 2025_06_13 added store_id to cart_items — use it).

#### P2 — CartRecoveryService::processAbandonedCarts ignores the hours/days options passed from the command  _(effort: S)_
- **Evidence:** app/Console/Commands/ProcessAbandonedCarts.php:28-31 passes $this->option('hours') and $this->option('days') to processAbandonedCarts(). app/Services/CartRecoveryService.php:72 — method signature is processAbandonedCarts(): array with no parameters; uses the default values from findAbandonedCartsQuery() ignoring the CLI arguments entirely.
- **Impact:** The --hours and --days flags advertised in the command signature are silently ignored. Operators cannot tune recovery timing without modifying source code.
- **Fix:** Update CartRecoveryService::processAbandonedCarts(int $olderThanHours = 1, int $newerThanDays = 7) to accept and forward those parameters to findAbandonedCartsQuery().

#### P2 — OrderRepository::bulkUpdateStatus has no store-scoping — latent IDOR for seller bulk operations  _(effort: S)_
- **Evidence:** app/Repositories/OrderRepository.php:332-335 — bulkUpdateStatus(array $ids, string $status) does whereIn('id', $ids)->update() with zero authorization check. No caller currently routes this to a seller-facing endpoint, but the interface is public and any future wiring risks allowing a seller to update another seller's orders.
- **Impact:** Latent: if exposed to sellers via an API endpoint, any seller could escalate any order on the platform to 'completed', triggering commission payouts for orders they didn't fulfill.
- **Fix:** Add a mandatory $storeId parameter that is applied as an additional WHERE clause before the status update runs. Never call this method without scoping.

#### P3 — OrderController::index calls Cache::forget on every read — cache provides zero benefit  _(effort: S)_
- **Evidence:** app/Http/Controllers/OrderController.php:48 — Cache::forget($cacheKey) is executed unconditionally inside the index() method before Cache::remember(). This was labeled '// Clear cache for testing' but remains in production code.
- **Impact:** The orders list is re-fetched from the database on every request, negating the Cache::remember. Under load this adds unnecessary DB queries.
- **Fix:** Remove the Cache::forget line from the read path. Implement proper invalidation only on write operations (status change, new order).

#### P3 — web OrderController::show reads non-existent columns shipping_fee, discount, shipping_address  _(effort: S)_
- **Evidence:** app/Http/Controllers/OrderController.php:183-185 reads $order->shipping_fee, $order->tax, $order->discount. The orders table has shipping_amount, tax_amount, discount_amount (migration 2024_03_15). 'shipping_fee' and 'discount' don't exist, returning null silently.
- **Impact:** Order detail API response returns null for shipping fee and discount amounts. Frontend shows MAD 0.00 for these fields even for paid shipping orders.
- **Fix:** Correct column names to match the schema: shipping_amount, tax_amount, discount_amount.

**Gaps vs best-in-class:**
- No real payment gateway integration (Stripe, CMI, HPS for Morocco) — entire payment stack is a mock returning fake transaction IDs
- No order state machine with enforced valid transitions (Amazon enforces pending→confirmed→shipped→delivered with no backward hops)
- No idempotency key support on checkout — double-submit creates duplicate orders
- No marketplace return/refund workflow — the return endpoint calls a relationship that doesn't exist; no return model, table, or approval flow
- Commission reversal not wired to order cancellation or refund — financial ledger is not self-consistent on cancels
- No partial order fulfillment — single-line status on an order with multi-item contents; seller cannot mark individual items as shipped
- No seller-side order acceptance/rejection step — orders go directly to the seller's queue with no confirmation gate
- No buyer-initiated dispute or A-to-Z claim pathway beyond a stub support ticket
- No delivery confirmation or proof-of-delivery flow — delivered_at timestamp on Shipping table but no mechanism to record it from seller or courier
- No carrier integration or shipping label generation — tracking_number is a free-text field with no API connectivity
- Tax calculation is hardcoded and inconsistent; no VAT/TVA compliance for Moroccan fiscal requirements (20% standard rate)
- No order-level price lock: cart item price can change between add-to-cart and checkout since unit_price is re-read from stock at order time without a price snapshot mechanism
- No abandoned cart re-engagement email sent — CartRecoveryService creates tokens but CartRecoveryMail is unused in the service flow
- No SLA or auto-escalation for unfulfilled orders — order_auto_cancel_hours setting exists in DB but no cron or observer enforces it
- No multi-currency support — currency field on payments table is USD-defaulted but Morocco uses MAD

**Quick wins:**
- Fix Mobile OrderController to use customer_id instead of user_id (5 line changes, unblocks all mobile order operations — P0)
- Add 'rate' to Commission::$fillable in app/Models/Commission.php:34 (1 line, fixes silent rate data loss — P0)
- Rename 'tax'→'tax_amount' and 'shipping_cost'→'shipping_amount' in OrderService::createOrder at lines 32-33 and 51-53 (2 line changes, fixes silent zero-tax on web checkout — P0)
- Add Stock::lockForUpdate() in Mobile OrderController::create before the availability check at line 100 (2 line changes, closes the oversell race — P0)
- Remove Cache::forget at OrderController.php:48 (1 line deletion, restores cache effectiveness — P3)
- Fix clearOrderCache() key to match the actual stored key 'orders:list:{guard}' and call it from all write paths (5 line changes, fixes stale order status — P1)
- Fix CartRecoveryService::processAbandonedCarts method signature to accept (int $olderThanHours, int $newerThanDays) parameters (1 line change, fixes ignored CLI flags — P2)
- Fix OrderController::show column names: shipping_fee→shipping_amount, discount→discount_amount (2 line changes, fixes null display — P3)


### Sellers, Commissions & Payouts

The Sellers, Commissions & Payouts domain has serious structural integrity problems that would cause production failures and financial inconsistencies. The most critical defect is that `StoreRevenue::recordRevenue()` — the static method called from both `OrderObserver` and `TailoringOrderObserver` — does not exist on the `StoreRevenue` model, making every payout record write a guaranteed `BadMethodCallException` at runtime. Compounding this, the observer also writes `Commission` records using columns (`commission_amount`, `commission_rate_id`, `paid_at`, `notes`) that do not exist in the `commissions` table schema; those writes silently succeed but the data lands nowhere, meaning all subsequent payout reads return 0 or null. The `CommissionPaymentController` uses `$commission->remaining_amount` — a non-existent attribute — which evaluates as `null <= 0` === `true`, allowing any payment amount to mark a commission as fully paid and making the `max:` payment-amount validation permanently inert. Authorization on financial operations is structurally too broad: commission management routes (approve/reject/mark-paid) sit under the `admin` middleware alias (`CheckAdminAccess`), which grants passage to any user with the `manage_community` permission — a community moderator role can financially adjudicate payouts. There is no dedicated Payout/Withdrawal model, no payout scheduling, no commission clawback on order cancellation or refund, no idempotency guard on commission creation, and the parallel `CommissionService`/`CommissionAccountingService` architecture (richer, used by `CommissionController` admin UI) coexists with the simpler `OrderObserver` path without either path being complete or calling the other. The result is a fundamentally unreliable financial pipeline: sellers cannot trust payout figures, the ledger is not synchronized with commission events, and the multi-model commission schema (Commission, CommissionTransaction, StoreRevenue, CommissionPayment) diverges in both schema and runtime behavior.


#### P0 — StoreRevenue::recordRevenue() does not exist — all payout record creation crashes at runtime  _(effort: S)_
- **Evidence:** app/Observers/OrderObserver.php:52 calls `StoreRevenue::recordRevenue(...)` and app/Observers/TailoringOrderObserver.php:39 calls the same; app/Models/StoreRevenue.php has no static `recordRevenue` method — only instance methods `markAsPaid`, `markAsPending`, `markAsCancelled` and scopes. No such method exists anywhere in the codebase.
- **Impact:** Every time an order transitions to payment_status=paid or a tailoring order becomes is_paid, the observer crashes with BadMethodCallException before the StoreRevenue row is created. Sellers accumulate zero payout records. The exception is unhandled within the observer, meaning it propagates and also prevents the Commission rows written earlier in the same observer call from being committed cleanly.
- **Fix:** Add a static `recordRevenue(Store $store, float $amount, Model $source, float $commissionRate): self` factory method to StoreRevenue, or rewrite the observer to use `StoreRevenue::create([...])` directly; add unit tests covering the paid transition.

#### P0 — Commission model references columns absent from the commissions table schema — financial data silently lost  _(effort: S)_
- **Evidence:** app/Models/Commission.php:39-40 declares `commission_amount` and `commission_rate_id` in `$fillable`; line 50 casts `commission_amount`; lines 233-234 read `$this->user->name` / `$this->store->name` assuming these are present; lines 56,66 in app/Http/Controllers/Admin/CommissionController.php write `approved_at` and `approved_by`. None of these columns exist in the `commissions` table schema (database/migrations/2024_03_09_000000_create_commissions_table.php — columns are: id, user_id, store_id, commissionable_type/id, amount, rate, flat_fee, status, type, metadata). app/Http/Controllers/Seller/SellerOrderController.php:94-95 reads `$commission->commission_amount` and `$commission->commission_rate` — always returns null, showing sellers 0 commission on their orders.
- **Impact:** Commission approval writes `approved_at`/`approved_by` silently discarded. Seller order detail view always shows commission = 0 and commission_rate = 0. Any code path that depends on `commission_amount` returns null rather than the correct figure. Financial audit via the Commission model is unreliable.
- **Fix:** Create a migration adding `commission_amount decimal(10,2)`, `commission_rate_id unsignedBigInteger nullable`, `commission_rate decimal(5,2) nullable`, `approved_at timestamp nullable`, `approved_by unsignedBigInteger nullable`, `rejected_at timestamp nullable`, `rejected_by unsignedBigInteger nullable`, `paid_at timestamp nullable`, `notes text nullable` to the commissions table.

#### P1 — CommissionPaymentController uses non-existent $commission->remaining_amount — overpayment possible, any payment marks commission fully paid  _(effort: S)_
- **Evidence:** app/Http/Controllers/Admin/CommissionPaymentController.php:34 uses `'max:'.$commission->remaining_amount` as a validation rule; line 55 checks `if ($commission->remaining_amount <= 0)`. The `Commission` model has no `remaining_amount` attribute or accessor; the property evaluates to `null`. PHP evaluates `null <= 0` as `true`, so every payment immediately marks the commission paid regardless of amount. The `max:` validation rule receives `null`, making it a no-op — any arbitrary amount passes.
- **Impact:** Admins can enter any payment amount for a commission (e.g., 10x the actual owed amount) and it will pass validation. Every CommissionPayment immediately sets commission status to paid, even for the first partial payment. Sellers could be overpaid with no system guard.
- **Fix:** Add a `getRemainingAmountAttribute()` accessor to Commission that sums `commissionPayments()->where('status','completed')->sum('amount')` and subtracts from `commission_amount`; guard against null `commission_amount`.

#### P1 — Commission management routes use overly permissive 'admin' middleware — community moderators can approve/reject/mark-paid payouts  _(effort: S)_
- **Evidence:** routes/web.php:779 registers commission/settlement/mark-paid routes under `middleware(['auth', 'admin'])`. The 'admin' alias resolves to `CheckAdminAccess` (app/Http/Middleware/CheckAdminAccess.php:28) which grants access if the user `hasRole('super-admin') OR can('manage_community')`. Any user with the `manage_community` permission (a community moderation permission) can approve/reject/export/mark-paid financial commission records. The stricter `role:super-admin` middleware used on other admin routes (web.php:392) is not applied here.
- **Impact:** Financial segregation of duties broken: a community moderator role can approve commission payouts, export commission data, and mark transactions as paid. This violates PCI-DSS-aligned financial control requirements and is exploitable by any over-privileged community account.
- **Fix:** Change the commission/settlement route group middleware to `['auth', 'role:super-admin']` (matching the stricter pattern used at web.php:392), or introduce a dedicated `finance-manager` permission and check it explicitly.

#### P1 — CommissionService accounting entries silently fail inside DB::transaction — commission row commits while ledger entry is lost  _(effort: M)_
- **Evidence:** app/Services/CommissionService.php:81-88: after creating the CommissionTransaction (inside a DB::transaction), `createAccountingEntry()` is called. Inside that method (lines 96-140), each ledger insert is wrapped in a bare try/catch that only calls `\Log::warning()` on failure. The config keys used (`accounting.commission_payable_head_id`) differ in casing from CommissionAccountingService which uses `accounting.COMMISSION_PAYABLE_HEAD_ID` — if config keys are missing, the `if ($headId && $financeYearId)` guard silently skips the insert. The outer transaction commits even though the accounting entry was never written.
- **Impact:** Commission rows are committed to the DB with no corresponding ledger debit/credit. The accounting ledger diverges from commission reality on every order where config keys are absent or the DB insert fails. This is undetectable until a financial reconciliation, at which point the discrepancy cannot be automatically resolved.
- **Fix:** Remove the try/catch from inside the DB::transaction so ledger failures roll back the commission row as well; move accounting entry creation to CommissionAccountingService exclusively; add a post-commit consistency check via a queued job.

#### P1 — CommissionService::createOrderCommission uses $order->total but the orders table column is total_amount — commission calculation uses null base  _(effort: S)_
- **Evidence:** app/Services/CommissionService.php:50 calls `$rate->calculateCommission($order->total)` and line 68 stores `'base_amount' => $order->total`. The orders table has no `total` column (database/migrations/2024_03_15_000001_create_orders_table.php:21 defines `total_amount`). `$order->total` returns null. `CommissionRate::calculateCommission(null)` computes `null * (rate/100)` = 0 commission for every order processed through this code path.
- **Impact:** All commission transactions created via CommissionService have commission_amount = 0 and net_amount = 0, meaning the richer CommissionTransaction audit trail is financially worthless even when the observer path is fixed.
- **Fix:** Change both references in CommissionService.php lines 50 and 68 from `$order->total` to `$order->total_amount`.

#### P1 — No idempotency guard on commission creation — duplicate commissions on retry or status transition replay  _(effort: S)_
- **Evidence:** app/Observers/OrderObserver.php:29-30 creates commissions when payment_status transitions to 'paid'. There is no `firstOrCreate` or `exists()` check. Any retry, admin status reset-and-re-transition, or race between two simultaneous update calls (e.g., payment webhook + admin action) will create duplicate Commission rows for the same order. No unique index on `(order_id, type)` exists in database/migrations/2024_03_09_000000_create_commissions_table.php.
- **Impact:** Sellers are double- or triple-credited, platform collects incorrect commission sums, payout totals are inflated. In a marketplace with webhook-based payment confirmation this is a near-certainty.
- **Fix:** Add a unique index on `commissions(order_id, type)` and change `Commission::create(...)` calls in the observer to `Commission::firstOrCreate(['order_id' => ..., 'type' => ...], [... other fields])`. Also add the same guard for StoreRevenue writes.

#### P1 — Admin\StoreRequestController::reconsider uses undefined local variable $storeService — fatal 500 on reconsider action  _(effort: S)_
- **Evidence:** app/Http/Controllers/Admin/StoreRequestController.php:140 calls `$storeService->reconsiderStoreRequest($store)` but the controller's dependency is injected as `$this->storeService` (property set in constructor lines 24-27). The local `$storeService` variable is never defined in the `reconsider` method, yielding a PHP undefined variable fatal error.
- **Impact:** Any attempt to reconsider a rejected store application crashes with a 500. Rejected store owners cannot be re-queued for review without direct DB intervention. Seller onboarding is blocked.
- **Fix:** Change line 140 from `$storeService->reconsiderStoreRequest($store)` to `$this->storeService->reconsiderStoreRequest($store)`.

#### P2 — CommissionBatchController::process marks commissions paid without accounting entries or payment reference  _(effort: M)_
- **Evidence:** app/Http/Controllers/Admin/CommissionBatchController.php:54-58: `$batch->commissions()->update(['status' => 'paid'])` does a mass-update that skips `paid_at` timestamp, payment reference, and any accounting settlement entry. No CommissionPayment record is created. CommissionAccountingService::createSettlementEntry() is never called from this path.
- **Impact:** Batch payouts appear as 'paid' in the UI but the accounting ledger has no settlement entry and CommissionPayment has no row. Financial audit trail is broken for all batch-processed payouts.
- **Fix:** Replace the mass-update with a loop that calls `$commission->markAsPaid($reference)` and creates a `CommissionPayment` record and accounting settlement entry per commission; require `payment_reference` input in the batch process form.

#### P2 — Commission::calculateCommission always returns a raw float, not the array shape expected by callers — type contract violation  _(effort: S)_
- **Evidence:** app/Models/Commission.php:98-104: `calculateCommissionAmount()` calls `$this->commissionRate->calculateCommission($this->amount)`. `CommissionRate::calculateCommission()` (CommissionRate.php:97-109) returns `array{commission, flat_fee, total, net_amount}`. The caller at Commission.php:104 returns this array as a `float` return type, which PHP will not coerce — callers that treat this as a float will receive an array.
- **Impact:** Any code that calls `$commission->calculateCommissionAmount()` and treats it as a numeric payout figure will get a type error or wrong arithmetic result. The return type annotation `float` is also misleading.
- **Fix:** Change `calculateCommissionAmount()` to return `$this->commissionRate->calculateCommission($this->amount)['total']` and keep the `float` return type, or change the return type to `array` and update callers.

#### P2 — Commission calculation uses only first order item's category for entire multi-item order — wrong rate applied to mixed-category orders  _(effort: M)_
- **Evidence:** app/Services/CommissionService.php:24 uses `$order->items->first()` to determine the category-based commission rate, then applies that single rate to `$order->total` (all items). A cart with one jewelry item (high commission) and ten clothing items (low commission) charges the jewelry rate on 100% of the order value.
- **Impact:** Systematic over- or under-collection of platform commission on mixed-category orders. Sellers in lower-commission categories subsidize higher-category rates when they sell cross-category products.
- **Fix:** Iterate over all order items, look up each item's category commission rate, and compute a weighted commission based on each item's subtotal; fall back to the store rate for items without a category-specific rate.

#### P2 — Commission arithmetic uses native PHP float — precision loss on MAD currency amounts  _(effort: M)_
- **Evidence:** app/Models/CommissionRate.php:99: `$commission = $amount * ($this->rate / 100)`. Both operands are PHP `float`. The `$casts` declaration ('rate' => 'decimal:2') returns a string from Eloquent but is then passed directly as a float argument in calculateCommission(). No `round()` or `bcmul()` is used.
- **Impact:** Commission amounts on orders like 333.33 MAD at 15% produce floating-point artifacts (49.9995...) that accumulate across thousands of transactions. Monthly payout summaries will have unexplained penny discrepancies that are difficult to reconcile.
- **Fix:** Use `bcmul` / `bcdiv` with precision 4, then `round` to 2 decimal places at the final total step; or adopt the `brick/money` library for all monetary arithmetic.

#### P2 — Dual accounting implementation creates divergence — CommissionAccountingService is never called from any live path  _(effort: M)_
- **Evidence:** grep for `CommissionAccountingService` across app/ returns only the class definition itself (app/Services/CommissionAccountingService.php) — no controller, observer, or service injects or calls it. The live path in CommissionService.php (lines 95-141) uses raw `DB::table('transactions')->insert()` with hard-coded config keys. CommissionAccountingService uses the Transaction Eloquent model with different config key casing (UPPER_CASE vs lower_case in CommissionService).
- **Impact:** Two accounting implementations exist with different config conventions; only the raw-insert version is wired. CommissionAccountingService (which correctly links payable_transaction_id/expense_transaction_id on the CommissionTransaction) is dead code. Future developers may wire the wrong one.
- **Fix:** Delete CommissionService::createAccountingEntry and CommissionService::createSettlementAccountingEntry; inject CommissionAccountingService into CommissionService and call it; standardize config key casing.

#### P3 — Commission::getDisplayDetails has unsafe $this->user->name and $this->store->name calls  _(effort: S)_
- **Evidence:** app/Models/Commission.php:233-234 calls `$this->user->name` and `$this->store->name` without null safety. The Commission model's `user_id` is a constrained FK with `cascadeOnDelete`, so orphan commissions shouldn't exist, but the Commission fillable includes `store_id` and `user_id` without eager-loading guards. Also, a project memory note confirms `$user->name` returns null in this project (beldify-user-no-name-column memory entry).
- **Impact:** Calling `getDisplayDetails()` on a commission where the user has a null name (all users based on project notes) throws a string coercion notice; accessing a missing eager-loaded relation throws a null-pointer exception.
- **Fix:** Change to `optional($this->user)->name ?? 'N/A'` and `optional($this->store)->name ?? 'N/A'`; load the commission with `['user','store']` in contexts that call this method.

#### P3 — SellerOrderController::show runs N+1 queries for order items fallback and queries StoreRevenue with wrong column name  _(effort: S)_
- **Evidence:** app/Http/Controllers/Seller/SellerOrderController.php:63-81 loads order with eager loading, then also directly queries `OrderItem::where('order_id', ...)` unconditionally on line 70. Line 89 queries `StoreRevenue::where('source_id', ...)` but the `store_revenues` table schema (migration 2024_12_14_002714) has no `source_id` column — it uses separate `order_id` and `tailoring_order_id` columns — so this query always returns null.
- **Impact:** The seller order detail view always shows net_amount = order->total_amount (no commission deducted) because the StoreRevenue lookup always misses. Two queries are run where one suffices.
- **Fix:** Fix the StoreRevenue lookup to `StoreRevenue::where('order_id', $order->id)->where('store_id', $store->id)->first()`; remove the redundant direct OrderItem query.

**Gaps vs best-in-class:**
- No Payout/Withdrawal model: there is no first-class Withdrawal entity with seller bank details, payout threshold, disbursement schedule, or approval workflow. Amazon/Noon withhold earnings in a seller balance and release on a fixed cycle; here 'payout' is just a status flag flip on StoreRevenue.
- No commission clawback on order cancellation or refund: SellerOrderController::update allows status transitions to 'cancelled'/'refunded' with no matching commission reversal. OrderObserver has no deleted/cancelled hook. Sellers keep commission on refunded orders.
- No payout hold period / reserve: top marketplaces hold funds for 7-14 days post-delivery before releasing to seller wallets. No such hold is modeled.
- No multi-seller order splitting: the orders table has a single store_id (NOT NULL), preventing a single buyer cart from containing items from multiple sellers. There is no sub-order or order-split mechanism.
- No tax/VAT handling on commissions: Morocco applies TVA to marketplace commissions. There is no VAT calculation, no VAT line on commission invoices, and no seller tax document generation.
- No seller wallet / earnings ledger: Amazon has a detailed seller account balance with pending/available/disbursed tiers. Here there is only a StoreRevenue table with a status flag — no running balance, no transaction history from the seller's perspective.
- No idempotency keys on payment webhooks: the commission creation observer fires on any payment_status update; no external payment idempotency token is stored, making double-charge from payment gateway retries financially dangerous.
- No payout bank account verification: StoreProfile has a `bank_details` JSON column but no verification workflow (micro-deposit, IBAN validation, third-party verification). Payouts could be dispatched to unverified accounts.
- No commission dispute / chargeback workflow: there is no mechanism for a seller to contest a commission deduction or for the platform to record a chargeback event against a commission.
- No real-time seller earnings dashboard API: seller earnings are computed inline in Blade controllers; there is no dedicated API endpoint returning paginated earning events with statuses, suitable for a mobile app or Next.js frontend.

**Quick wins:**
- Fix the undefined variable bug in Admin\StoreRequestController::reconsider line 140 ($storeService -> $this->storeService) — one character change, unblocks all rejected-store reconsideration flows.
- Add StoreRevenue::recordRevenue() static factory method or rewrite the two observer calls to use StoreRevenue::create() directly — fixes the P0 runtime crash on every paid order transition.
- Change CommissionService.php lines 50 and 68 from $order->total to $order->total_amount — fixes zero-commission bug on the CommissionTransaction path with a one-word edit.
- Add a unique index on commissions(order_id, type) via a one-line migration and wrap observer Commission creates in firstOrCreate — eliminates duplicate-commission data corruption.
- Fix SellerOrderController::show line 89 StoreRevenue query from 'source_id' to 'order_id' — sellers immediately see correct net-amount (commission deducted) on their order detail pages.
- Change the commission route group middleware from 'admin' to 'role:super-admin' in web.php line 779 — eliminates the community-moderator financial over-grant with a single string change.
- Add a getRemainingAmountAttribute() accessor to the Commission model — fixes the null->overpayment bug in CommissionPaymentController and makes the max: validation rule functional.


### Search, Discovery, Trust & Customer Experience

The Search, Discovery, Trust, and Customer Experience domain of Beldify's Laravel 10 backend is in a pre-production prototype state with multiple subsystems serving fabricated data to real clients. The most critical problem is a pervasive "mock-data-as-real" anti-pattern: the Frontend ReviewController silently falls back to MockReviewService (which generates fake names, biased ratings, and a fabricated is_verified=true on ~70% of records) on any DB error or missing product, returning `success:true` with a leaking `source:'mock'` field that real clients receive. The Mobile ReviewController and SearchController are 100% stubbed with hardcoded iPhone results, Apple Store shops, and always-true verified_purchase flags, making the entire mobile search and review subsystem non-functional as a marketplace feature. The FCM notification service uses the Firebase legacy API (`/fcm/send` with `key=` auth header) which Google deprecated and shut down in mid-2024, meaning push notifications for new messages are silently dead. The community RFQ listing endpoint (`CommunityPostController::index`) computes a per-filter cache key but discards it, passing the literal string `'community_posts'` to the cache layer — every page/filter/search shares one cached response, causing every user to see the first requester's result set. Review helpfulness reactions have no per-user tracking (explicitly noted as a TODO), allowing unlimited ballot-stuffing. The product search and recommendation layers are LIKE `%term%` only with no full-text index, and the recommendation engine (`RecommendedController`) returns static mock sellers/tailors while `ProductRecommendation::updateFrequency` has a subquery bug that divides by total order count rather than per-product co-purchase count. These gaps collectively prevent launch at any serious marketplace scale.


#### P0 — Mobile search and review controllers are entirely stubbed — 100% fabricated data served to real users  _(effort: L)_
- **Evidence:** app/Http/Controllers/Api/Mobile/SearchController.php:46-365 — all methods return hardcoded iPhone/Apple Store/Black Friday data; app/Http/Controllers/Api/Mobile/ReviewController.php:41-82 store() at line 157 (`$existingReview = false`) never queries DB, creates no real record, sets `verified_purchase: true` unconditionally (line 183), and returns a `rand(1000,9999)` ID
- **Impact:** Mobile app users cannot search or submit real reviews. All results are static placeholder data. Any review submitted via mobile is silently discarded — the user believes it succeeded but nothing is persisted.
- **Fix:** Replace all mock implementations with real Eloquent queries mirroring the Frontend ReviewController pattern; delete the static arrays and connect to the existing `stocks`, `reviews`, and `search`-capable queries in ProductController.

#### P1 — Frontend ReviewController silently returns fake reviews to production clients on any DB error or missing product  _(effort: M)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:44-60 (stock not found → MockReviewService), :118-138 (DB exception → MockReviewService), :148-162 (outer exception → MockReviewService); MockReviewService generates random names, biased ratings (rand(3,5) with 70% is_verified=true) and returns `source:'mock'` in the JSON body
- **Impact:** Buyers see fabricated reviews with high verification rates, directly damaging review trustworthiness — a core marketplace trust signal. The `source` field leaks implementation details. A competitor or journalist with a network tab can expose this.
- **Fix:** Remove all MockReviewService fallbacks from the review read path. Return a 503 with a clear error message on DB failure instead of fabricated data. Keep MockReviewService only in test fixtures.

#### P1 — FCM push notifications use the deprecated legacy API — all message push notifications are silently dead  _(effort: M)_
- **Evidence:** app/Services/FCMNotificationService.php:211-214 — `Http::post('https://fcm.googleapis.com/fcm/send', [...])` with `'Authorization' => 'key='.$this->serverKey`; the docstring at line 29 claims 'HTTP v1 API' but the endpoint and auth scheme are the legacy API shut down by Google in June 2024
- **Impact:** FCM notifications for new messages (NewMessageNotification fired in BuyerMessageController:377 and SellerMessageController:258) are silently dropped. Sellers and buyers never receive push notifications for incoming messages, destroying real-time UX and the messaging feature's value.
- **Fix:** Migrate to the FCM HTTP v1 API (`https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`) with OAuth 2.0 service-account authentication. Remove the `serverKey` config key and add a service-account JSON credential.

#### P1 — CommunityPostController::index discards computed cache key — all filters/pages share one stale cache entry  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/CommunityPostController.php:65-73 — `$cacheKey` is computed on line 65 from filters/pagination, but line 73 passes the hardcoded literal `'community_posts'` to `CacheService::remember()`. The variable `$cacheKey` is computed but never used.
- **Impact:** The first request populates one cache entry for all users. Subsequent requests with different categories, search terms, or page numbers receive the same result set until TTL expiry. Buyers see wrong listings, breaking the Open Souk RFQ discovery flow.
- **Fix:** Pass `$cacheKey` (not the literal string) as the first argument to `CacheService::remember()` on line 73.

#### P1 — Review submission has no verified-purchase gate — any user can review any product without buying it  _(effort: M)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:210-243 — only checks for duplicate review (`Review::where('stock_id')->where('user_id')->first()`), no order/purchase check; the `is_verified_purchase` column exists on the Review model (app/Models/Review.php:26) but is never set based on actual purchase data; app/Http/Controllers/Api/Mobile/ReviewController.php:183 hardcodes `'verified_purchase' => true`
- **Impact:** Sellers can self-review, competitors can write negative reviews, and the 'verified purchase' badge carries no meaning. This is the primary review-authenticity failure mode in marketplace fraud.
- **Fix:** Before creating a review, query OrderItems joined to Orders to verify the authenticated user has a delivered/completed order containing the `stock_id`. Set `is_verified_purchase` from the result.

#### P2 — Review helpfulness reactions have no per-user tracking — unlimited ballot-stuffing allowed  _(effort: M)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:327-343 — the TODO comment explicitly states 'we would track user reactions in a separate table to prevent multiple reactions from the same user. For simplicity, we're just incrementing/decrementing the counters here.' Any user can POST the reaction endpoint repeatedly to inflate likes to arbitrary values.
- **Impact:** Review helpfulness scores are manipulable, degrading their signal value for buyers and enabling sellers to game review sorting.
- **Fix:** Create a `review_reactions` pivot table (review_id, user_id, reaction type, unique key). On reaction, upsert the pivot record and recount from the table rather than incrementing in place.

#### P2 — Review sort column passed directly to orderBy without an allow-list — fragile and triggers silent mock fallback  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:30-31, :70 — `$sortBy = $request->input('sort_by', 'created_at')` and `$sortOrder = $request->input('sort_order', 'desc')` are passed without validation directly to `->orderBy($sortBy, $sortOrder)`. Invalid column/direction throws a QueryException caught at line 118, which silently returns fabricated mock data.
- **Impact:** An invalid `sort_by` value causes the DB exception handler to serve mock reviews, masking the error. Any future SQL grammar change could turn this into actual injection. The allowed set is small and known.
- **Fix:** Validate `sort_by` with `in:created_at,rating,likes` and `sort_order` with `in:asc,desc` via FormRequest or inline validator before using the values in the query.

#### P2 — Review cache invalidation uses a literal `*` wildcard key — cache is never actually cleared  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:246 — `app(CacheService::class)->forget('product_reviews_{$request->stock_id}_*')` and :349 — `app(CacheService::class)->forget('product_reviews_{$productId}_*')`. Cache drivers do not treat `*` as a glob — this deletes the literal key `product_reviews_5_*`, not the family of paginated keys.
- **Impact:** After a new review is submitted or a reaction updated, clients see up to 30 minutes of stale review data, degrading review freshness and making the approval workflow invisible to buyers.
- **Fix:** Use a cache tag group (e.g., `Cache::tags(['product_reviews_'.$id])->flush()`) or maintain an explicit list of paginated keys and iterate, or use the cache key pattern from CacheService with a version counter.

#### P2 — BuyerMessageController::getConversations has severe N+1 queries — one DB round-trip per conversation  _(effort: M)_
- **Evidence:** app/Http/Controllers/Api/Frontend/BuyerMessageController.php:36-88 — inside a `.map()` over every distinct message row, three separate queries execute: `Store::where('user_id', $otherUserId)->first()` (line 41), `Message::where(...)->first()` for latest message (lines 48-58), and `Message::where(...)->count()` for unread count (lines 61-64). With N conversation partners this is 3N+1 queries.
- **Impact:** A buyer with 20 conversations triggers 61 DB queries per conversations-list load. Under concurrent load this causes connection pool exhaustion.
- **Fix:** Restructure using the pattern already implemented in MessageService::getSellerConversations — batch-load stores and users with `whereIn`, pre-aggregate latest messages and unread counts in two queries grouped by partner, then join in PHP.

#### P2 — Category product listing recursively queries DB per subcategory level — unbounded for deep trees  _(effort: M)_
- **Evidence:** app/Http/Controllers/Api/Frontend/CategoryProductsController.php:526-545 — `getAllSubcategoryIds` recursively calls `Category::where('parent_id', $category->id)->get()` for each subcategory level, then calls itself. For a 3-level tree this is 1+K+K² queries before the product query runs.
- **Impact:** Performance degrades proportionally with category tree depth. A misconfigured deep tree can cause a request to issue dozens of queries before retrieving any products.
- **Fix:** Load the full category tree once with `Category::all()->toTree()` (using `kalnoy/nestedset` already common in Laravel) or use a single recursive CTE query; cache the result for the session.

#### P2 — getMensProducts always busts its own cache before recomputing — effective cache TTL is zero  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/CategoryProductsController.php:28 — `app(CacheService::class)->forget($cacheKey)` is called unconditionally before `->remember(...)` on line 30. getWomensProducts and getChildrensProducts do not have this line, suggesting it was debug code never removed from getMensProducts.
- **Impact:** Every request to the Men's category page hits the database, negating all caching benefit and multiplying DB load by the number of concurrent users on that page.
- **Fix:** Remove line 28 (`forget($cacheKey)`) from getMensProducts; it has no counterpart in the other methods and defeats the surrounding cache logic.

#### P2 — ProductRecommendation::updateFrequency confidence_score subquery divides by total order count globally — formula is wrong  _(effort: S)_
- **Evidence:** app/Models/ProductRecommendation.php:41 — `'confidence_score' => DB::raw('(frequency + 1) / (SELECT COUNT(*) FROM orders)')`. This divides co-purchase frequency by the total number of all orders in the platform, not the count of orders containing the source product, producing a score that approaches zero as the platform grows.
- **Impact:** Recommendations become less meaningful over time (confidence_score → 0). The existing `ProductRecommendation` data is mathematically unusable for surfacing relevant products.
- **Fix:** Replace the denominator with `(SELECT COUNT(DISTINCT order_id) FROM order_items WHERE stock_id = product_recommendations.product_id)` to compute actual co-purchase confidence per product pair.

#### P2 — RecommendedController returns hardcoded mock sellers and tailors — recommendation engine never executes  _(effort: L)_
- **Evidence:** app/Http/Controllers/RecommendedController.php:13-95 — both getRecommendedSellers() and getRecommendedTailors() return static PHP arrays with fixed ids (1-4), fixed names ('Premium Fashion Store'), fixed ratings, and placeholder image paths. No DB query is performed.
- **Impact:** Homepage/discovery recommendation carousels show the same four static entries to every user regardless of preferences, browsing history, or location, providing zero personalization value.
- **Fix:** Implement real queries using the existing ProductRecommendation model and Store ratings, starting with a simple 'top-rated stores with most recent orders' query before adding collaborative filtering.

#### P3 — SellerCommunityController::index query is executed twice per cache miss — double DB hit  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Seller/SellerCommunityController.php:191-197 — `$rawPosts = $query->get()` executes the full query for debug logging, then `$query->latest()->paginate()` on line 197 executes the same query again (with pagination). Also, multiple `\Log::info` calls with `$query->toSql()` and `json_encode` of full result sets are left in production code.
- **Impact:** Every cache miss triggers two full table scans. Verbose debug logging with full result set serialization adds latency and fills log storage in production.
- **Fix:** Remove the debug `$query->get()` call on line 191 and all debug `\Log::info` statements with SQL/result payload. Use one `paginate()` call.

#### P3 — BuyerMessageController::getConversationMessages logs full formatted message array at INFO level in production  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/BuyerMessageController.php:261 — `Log::info('Formatted messages: '.json_encode($formattedMessages))` and lines 262-283 log full `otherUser` object including email, phone, online status on every message-page load.
- **Impact:** Log storage exhausted rapidly at scale; PII (email, phone, online status) written to log files violates data minimization principles and may breach GDPR/Moroccan data protection law.
- **Fix:** Remove debug log lines 261-283. If tracing is needed, log only message count and IDs at DEBUG level, guarded by `if (app()->environment('local'))`.

**Gaps vs best-in-class:**
- No full-text search engine (Elasticsearch, Algolia, Meilisearch, or MySQL FULLTEXT index) — all search uses leading-wildcard LIKE (`%term%`) which cannot use a B-tree index, causing full table scans at scale
- No search-as-you-type autocomplete backed by real data — SearchController::suggestions() returns hardcoded Apple/iPhone strings regardless of query
- No search query logging or trending-searches analytics — SearchController::saveSearchHistory() and trending() are empty stubs; there is no search_queries table
- No real recommendation engine — RecommendedController returns static mock data; ProductRecommendation model has a broken confidence formula and is never queried for discovery
- No review moderation workflow or abuse-reporting UI — reviews go from 'pending' to 'approved' with no auditable admin action trail; no seller reply feature on product reviews (TailorReview has `reply` field but Product Review model does not)
- No message block / report / spam mechanism — any authenticated user can message any other user with no block list, report flag, or content moderation
- No search facet counts (result counts per filter combination) — filters are applied without returning how many products match each facet value
- No seller storefront search / within-store search — buyers cannot search within a specific seller's catalogue
- No price-drop or back-in-stock notifications — no model or notification type covers these high-conversion triggers
- No RFQ notification to matching sellers — when a buyer posts a CommunityPost, no push/email is sent to sellers whose category inventory matches the request
- FCM token registered on user model (single device) — a user who switches devices or logs in on multiple devices loses notifications; no token-per-device table exists
- No read-receipt or delivery-receipt confirmation in messaging — `is_read` is set server-side but there is no WebSocket presence to confirm delivery to client
- No conversation archiving, deletion, or export — users cannot remove their message history or exercise GDPR right-to-erasure for messages

**Quick wins:**
- Fix CommunityPostController::index line 73 — change `'community_posts'` to `$cacheKey` (one character change, fixes every RFQ listing filter/pagination)
- Remove CategoryProductsController::getMensProducts line 28 (`forget($cacheKey)`) — restores 60-minute caching on the highest-traffic product category page
- Add a 3-value allow-list to ReviewController sort_by validation: `in:created_at,rating,likes` — prevents the mock-fallback trap and hardens the column injection surface in one line
- Fix ProductRecommendation::updateFrequency confidence_score denominator from `COUNT(*) FROM orders` to per-product order count — fixes the math with a one-line SQL change
- Remove BuyerMessageController::getConversationMessages debug log lines 261-283 — stops PII from writing to logs in production immediately
- Remove SellerCommunityController::index debug `$query->get()` on line 191 — eliminates the double query-per-request on the seller RFQ page without any logic change


### Platform Health: Security, Data Integrity, Performance, API

The Beldify backend has a critical credential-exposure incident: real production secrets (DB password, Google OAuth client secret, two APP_KEYs) were committed to git and the file remains tracked. Combined with a category of broken access-control issues — several `Admin\*` controllers are reachable via the Sanctum-gated API routes with no role/permission guard in the controller constructor, meaning any registered buyer token can enumerate customers, read accounting ledgers, or destroy supplier records — this platform is not safe to run at scale. Below these two P0s, a cluster of P1/P2 issues erodes data integrity and trust: the reviews endpoint silently serves synthetic mock data with HTTP 200 on any DB error, cart availability checks race (no transaction wrapping the read+reserve), the production cache is cleared on every order-list request (a debug line left in), and user-controlled `sort_by` column passes directly into `orderBy()` without an allowlist. Positive notes: the new `OrderService` uses `lockForUpdate()` inside a DB transaction for stock decrement — the critical inventory path is correctly protected. Sanctum is wired correctly for stateful and token-mode consumers. Rate limiters are defined and named. The `SecurityHeaders` middleware is registered globally, though it lacks a Content-Security-Policy header. Test coverage exists (40 test files, ~10 KLOC) but is skewed toward admin UI flows rather than API authorization and money paths.


#### P0 — Production secrets committed to git and file is still tracked  _(effort: M)_
- **Evidence:** git -C beldify-backend log --all -- .env.production confirms a commit (4b6df7c5) added .env.production; git ls-files --error-unmatch .env.production exits 0 (file is tracked). The file contains APP_KEY=base64:mEuvaMTX…, DB_PASSWORD=Beldify7894, GOOGLE_CLIENT_SECRET=GOCSPX-_MWy331…. The .gitignore lists .env.production but cannot un-track an already-committed file.
- **Impact:** Any collaborator, CI runner, or repository clone has access to the live DB credentials and can impersonate the platform via OAuth. APP_KEY compromise allows forgery of all encrypted cookies and signed URLs.
- **Fix:** Immediately rotate DB_PASSWORD, GOOGLE_CLIENT_SECRET, and regenerate APP_KEY in production. Run `git rm --cached .env.production` + `git filter-repo --path .env.production --invert-paths` to purge history, then force-push. Invalidate all active Sanctum tokens.

#### P0 — Admin API routes have no role/permission gate — any authenticated buyer can access admin CRUD  _(effort: S)_
- **Evidence:** routes/api.php:303-447 places /api/customers (full CRUD), /api/suppliers, /api/stocks, /api/accounting/general-ledger, /api/accounting/trial-balance, /api/stores, /api/admin/products, /api/admin/stocks/{stock}/images under middleware ['auth:sanctum'] only, with no role middleware. Admin\CustomerController.__construct (line 25) has no $this->middleware() call; same for SupplierController (line 31) and StockController (line 45). AccountingController.__construct:16 does have role:admin|super-admin but the route group has no such gate, so any request that isn't caught by the controller constructor skips it on fatal error paths.
- **Impact:** Any registered buyer with a valid Sanctum token can GET /api/customers (list all customer PII), POST /api/suppliers, DELETE /api/stocks/{id} (destroy products), and GET /api/accounting/general-ledger (full financial data). Classic IDOR escalation into an admin function.
- **Fix:** Add `->middleware(['role:super-admin,admin'])` or Spatie PermissionMiddleware to each of these route groups, or add `$this->middleware('role:super-admin|admin')` in each affected controller constructor. Do not rely solely on the outer auth:sanctum guard.

#### P1 — Review endpoint silently serves synthetic mock data on any DB error, returning HTTP 200  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:40-139: on DB exception the code calls MockReviewService::getProductReviews() and returns HTTP 200 with 'source' => 'mock'. Same pattern in submitReview:262-276 — a DB error causes a fake review to be 'submitted' with success:true. Users cannot tell they are reading fabricated data or that their review was never persisted.
- **Impact:** Trust/integrity catastrophe for a marketplace: ratings are fictional, seller reputation scores are invalid, regulatory issues around misleading product data. Also masks DB infrastructure failures for hours.
- **Fix:** Remove mock data fallbacks from production code paths. Return HTTP 503 with a user-facing 'temporarily unavailable' message on DB errors. Keep MockReviewService for test fixtures only.

#### P1 — Cart addItem has no transaction wrapping the stock availability check and cart creation  _(effort: M)_
- **Evidence:** app/Http/Controllers/CartController.php:135-405: availability is checked at line 229-240 (stock.total_quantity vs request.quantity) and variant.quantity at 320-330, but no DB::transaction or lockForUpdate wraps the read-then-insert sequence. Two concurrent requests can pass the availability check simultaneously and both be added to cart, over-committing stock.
- **Impact:** Race condition leading to overselling — customers check out items that are already sold. Only partially mitigated by OrderService::lockForUpdate at order-creation time; customers can still add items to cart and proceed to checkout only to fail at the last step, degrading UX.
- **Fix:** Wrap CartController::addItem in a DB::transaction with Stock::lockForUpdate() before the availability check, mirroring the pattern already used in OrderService::processOrderItem:66.

#### P1 — Active debug Cache::forget on every order list request defeats caching  _(effort: S)_
- **Evidence:** app/Http/Controllers/OrderController.php:48: `Cache::forget($cacheKey); // Clear cache for testing` is called inside the `index()` method before `Cache::remember()`, making every GET /api/orders a fresh DB query for every user on every request.
- **Impact:** Eliminates the intended 1-hour order-list cache entirely. Under moderate load (hundreds of simultaneous buyers checking orders) this generates unbounded DB queries. Annotated 'for testing' — clearly a debug artifact left in production code.
- **Fix:** Remove line 48 (`Cache::forget($cacheKey)`) from OrderController::index().

#### P1 — Unwhitelisted user-controlled column passed directly to orderBy() — potential data probe / error leakage  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:30-31,70: `$sortBy = $request->input('sort_by', 'created_at')` and `$sortOrder = $request->input('sort_order', 'desc')` are passed directly to `$query->orderBy($sortBy, $sortOrder)` with no validation. Same pattern in app/Http/Controllers/Admin/MegaOfferController.php:411,434 (admin context). Although Laravel's grammar layer prevents classic SQL injection, arbitrary column names cause MySQL errors on non-existent columns that are logged verbosely, and `sort_order` is not validated to asc/desc only.
- **Impact:** Attackers can probe schema by cycling column names and observing 500 vs 200 responses. Error messages may leak table structure in non-production-mode deployments. `sort_order=DESC; DROP TABLE` will be sanitized by PDO, but verbose error responses leak DB schema.
- **Fix:** Validate sort_by against an explicit allowlist: `$sortBy = in_array($request->input('sort_by'), ['created_at', 'rating', 'likes']) ? $request->input('sort_by') : 'created_at'`. Validate sort_order to `in:asc,desc`.

#### P1 — Review eager-load requests non-existent columns on users table, silently falling to mock data  _(effort: S)_
- **Evidence:** app/Http/Controllers/Api/Frontend/ReviewController.php:63: `$stock->reviews()->with('user:id,name,profile_image')`. The users table migration (database/migrations/2014_10_12_000000_create_users_table.php) has no `name` or `profile_image` columns — the table uses `full_name_en`, `full_name_ar`, `username`. This SELECT fails with a DB column-not-found error, which triggers the MockReviewService fallback.
- **Impact:** Every real product review fetch silently serves mock data instead of actual reviews from the database, compounding the mock-data trust issue and hiding real reviews permanently.
- **Fix:** Change the eager-load to `with('user:id,full_name_en,full_name_ar,username,avatar_url')` and update the review transformer to use the correct column names.

#### P2 — Cache invalidation key mismatch: order list cache never cleared after order creation  _(effort: S)_
- **Evidence:** OrderController::index():45 stores the cache under key `user:{userId}:orders:list:{guard}` (with guard suffix). OrderController::clearOrderCache():258 forgets `user:{userId}:orders:list` (no guard suffix). The cache keys do not match, so creating an order never invalidates the list cache, and buyers see stale order lists for up to 1 hour.
- **Impact:** Buyers placing orders do not see their new order in the list without manual cache expiry. Creates confusion and support load; effectively broken order-confirmation UX.
- **Fix:** Align the cache key in `clearOrderCache()` to include the guard suffix, or use a stable key format throughout. Consider using tagged cache or a simpler user-specific key without the guard segment.

#### P2 — Redis KEYS wildcard command used in production cache invalidation  _(effort: M)_
- **Evidence:** app/Services/CacheService.php:359: `Cache::getRedis()->keys('seller_community_*')` inside `clearCommunityCaches()`. Also CacheService::scanKeys():491 calls `redis->keys($pattern)` with a configurable wildcard. The code itself notes 'WARNING: Redis KEYS command is O(N) and should not be used in production on large datasets'.
- **Impact:** Redis KEYS blocks the entire Redis server for the full scan duration under high key-count (thousands+ keys common in production). Triggers latency spikes across all Redis-dependent operations during community cache clears.
- **Fix:** Replace with Redis SCAN-based iteration or, better, adopt tagged cache invalidation by maintaining a tracked set of community-post cache keys and deleting them individually.

#### P2 — OrderService accepts caller-supplied unit_price — no server-side price enforcement in service layer  _(effort: S)_
- **Evidence:** app/Services/OrderService.php:74: `$unitPrice = $itemData['unit_price'] ?? $stock->current_sale_unit_price`. The active OrderController::store():268-275 does not include items.*.unit_price in $validated, so the fallback fires correctly for the web path. However, OrderService is a shared service; future callers (mobile API, internal tools) who pass unit_price in itemData will have their price trusted without validation.
- **Impact:** Defense-in-depth failure: the service boundary does not enforce canonical pricing. Any new endpoint that passes item data from user input could allow price manipulation. Not currently exploitable through the web endpoint.
- **Fix:** Remove `$itemData['unit_price']` from OrderService and always resolve price server-side: `$unitPrice = $stock->current_sale_unit_price`.

#### P2 — Cart assigns Store::first() as the default store for every cart, ignoring multi-seller architecture  _(effort: L)_
- **Evidence:** app/Http/Controllers/CartController.php:44-48 and 166-167: `$defaultStore = Store::first()` (or `Store::first()` on show). On a multi-seller marketplace, the cart is tied to whatever store happens to be first in DB row order. This means cart/order routing is non-deterministic across sellers.
- **Impact:** In a marketplace with multiple sellers, order attribution is wrong — all carts point to one arbitrary seller. Commission, fulfillment, and reporting are broken at the architecture level when more than one seller exists.
- **Fix:** Cart must be associated with the specific seller whose product is being added (derive store_id from Stock.store_id). Implement per-seller sub-carts or cart-item-level store tracking, as Amazon does.

#### P2 — Open-proxy script (api_proxy.php) present in repository root — latent SSRF  _(effort: S)_
- **Evidence:** api_proxy.php root-level: takes `$_GET['url']`, curls it with FOLLOWLOCATION and no URL allowlist, then relays the full response. File is not in public/ so it is not directly web-served via default nginx config. However it is in git and could be symlinked, moved, or exposed by a misconfigured nginx alias.
- **Impact:** If ever web-reachable (misconfiguration, symlink, nginx alias typo), becomes a full SSRF — attackers can use it to reach AWS metadata service, internal Redis, or internal services. Should not exist in the codebase.
- **Fix:** Remove api_proxy.php from the repository entirely. If proxy functionality is needed, implement it as a proper Laravel route with an explicit URL allowlist and auth:sanctum middleware.

#### P2 — Missing Content-Security-Policy header — XSS escalation path wide open  _(effort: M)_
- **Evidence:** app/Http/Middleware/SecurityHeaders.php:15-29: sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, and HSTS — no Content-Security-Policy header is set. The Blade admin panel and seller dashboard render user-controlled content (product names, store descriptions, community posts) without a CSP.
- **Impact:** Any stored XSS payload in user-controlled fields (product name, community post body) executes without restriction. Admin session cookies can be stolen, admin accounts fully compromised.
- **Fix:** Add a Content-Security-Policy header in SecurityHeaders.php. Start with `default-src 'self'; script-src 'self' 'nonce-{nonce}'` and tighten iteratively. Use Laravel's nonce helper for inline scripts.

#### P2 — Duplicate auth routes with inconsistent middleware and method verbs  _(effort: M)_
- **Evidence:** routes/api.php defines POST /api/auth/logout at line 122 (inside the public auth group, but gated by inner middleware auth:sanctum at 127) AND again at line 369 (inside the outer auth:sanctum group). GET/POST /api/auth/profile exists at line 319 (POST) and line 371 (GET) and also GET /api/user/:450. PUT vs POST mismatch: updateProfile is PUT at line 372 but POST at line 319.
- **Impact:** Unpredictable routing: one method version may bypass the other's middleware. Frontend/mobile clients cannot rely on a consistent API contract. Breaks Next.js and mobile consumers.
- **Fix:** Consolidate auth routes into a single group with consistent HTTP verbs (RESTful: GET profile, PUT profile, POST logout). Remove all duplicate route registrations.

#### P3 — GET /api/user returns raw Eloquent model — potential field leakage  _(effort: S)_
- **Evidence:** routes/api.php:450-452: `Route::get('/user', function (Request $request) { return $request->user(); })`. Returns the full Eloquent User model serialization. Although google_id and fcm_token are in $hidden (User.php:69), other fields like full_name_ar, user_type_id, isActive, company_id, branch_id are not hidden and are not needed by the frontend.
- **Impact:** Unnecessary PII/internal field exposure: company_id, branch_id, user_type_id, isActive status visible to clients. Any future addition of sensitive fields to User is immediately exposed without review.
- **Fix:** Replace the closure with a proper API Resource (UserResource) that explicitly declares which fields to expose. Remove the closure so route:cache can run.

#### P3 — Password reset routes on mobile have no rate limiting — brute-force of OTP/reset token possible  _(effort: S)_
- **Evidence:** routes/api.php:488-491: POST /mobile/v1/auth/forgot-password and POST /mobile/v1/auth/reset-password and POST /mobile/v1/auth/verify-otp are inside the `throttle:10,1` block at line 484, which is correct. However POST /mobile/v1/auth/resend-otp (line 491) shares that same 10/minute limit — an attacker can exhaust 10 OTPs per minute per IP, then switch IPs. No per-account throttle is evident.
- **Impact:** OTP/reset-token enumeration and brute-force. For a Moroccan marketplace with real user accounts and payment data, account takeover via reset brute-force is a realistic threat.
- **Fix:** Add per-account rate limiting (by email/phone) in addition to per-IP throttle for forgot-password and verify-otp endpoints. Use Laravel's RateLimiter::for with `$request->input('email')` as the key.

#### P3 — AuthController::register always sets isActive=1 for all users including non-Google registrations  _(effort: M)_
- **Evidence:** app/Http/Controllers/AuthController.php:69-71: comment says '// Inactive for regular registrations' but code sets `$user->isActive = 1` for both branches. Both Google and regular registrations are immediately active with no email verification step.
- **Impact:** Email addresses are not verified. Fake/spam accounts are immediately active. Combined with missing email verification, the platform cannot send order confirmations to trusted addresses.
- **Fix:** For non-Google registrations, set isActive=0, send a verification email (Laravel's built-in email verification), and only activate on link click. For Google, trust the verified_email claim from the payload.

**Gaps vs best-in-class:**
- No idempotency keys on order creation — duplicate POST /api/orders (network retry, double-tap) creates duplicate orders; Amazon uses client-side idempotency tokens on all write operations
- No webhook signature verification on payment callback routes — /mobile/v1/payment-webhook has no HMAC validation; any party can send arbitrary payment status changes
- No audit log for admin mutations — no record of which admin changed a product price, approved a store, or modified commission rates; required for dispute resolution in a marketplace
- No per-seller data isolation at the service layer — admin API routes operate platform-wide with no seller-scoped queries; Amazon sellers only see their own data through isolated IAM/permission boundaries
- No structured API versioning — /api/ and /api/v1/ coexist with no deprecation lifecycle; Next.js and mobile clients cannot safely evolve independently
- No Sanctum token expiry enforcement — tokens never expire (migration adding expires_at exists but expiry logic not wired); stolen tokens are valid indefinitely
- No inventory reservation step between cart and order — items are 'reserved' only at order submission time, not when added to cart; concurrent buyers can race to checkout the same last unit
- No idempotent coupon application — applyCoupon has no check for already-applied state; rapid double-submit can apply the same coupon twice
- Content-Security-Policy absent — standard on all marketplace frontends for XSS containment
- No structured error response format across the codebase — some routes return {status, message}, others {success, data}, others {error}; makes frontend/mobile SDK integration fragile
- No automated security testing — test suite focuses on unit/feature flows but has no OWASP-style auth bypass or authorization tests

**Quick wins:**
- Remove Cache::forget($cacheKey) debug line from OrderController::index():48 — one line deletion restores order-list caching
- Add ->middleware(['role:super-admin,admin']) to the /customers, /suppliers, /stocks, /vouchers, /accounting, and /admin/products route groups in routes/api.php — ~5 lines, closes the broken-authz P0
- Remove mock-data fallbacks from ReviewController::getProductReviews() and submitReview() — return 503 on DB error instead of HTTP 200 with fake data
- Fix the review eager-load: change 'user:id,name,profile_image' to 'user:id,full_name_en,username,avatar_url' in ReviewController.php:63 — fixes the column-not-found error causing all reviews to fall to mock data
- Remove api_proxy.php from the repository (git rm api_proxy.php) — eliminates latent SSRF artifact
- Fix clearOrderCache() key suffix: append ':{guard}' to match the key written in index() — restores cache invalidation after order creation
- Add Content-Security-Policy to SecurityHeaders.php — even a permissive initial policy (default-src 'self') is a significant XSS containment improvement
- Run git rm --cached .env.production and rotate all credentials immediately — the P0 secrets finding

