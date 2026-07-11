---
name: specs/003-backend-cleanup/data-model.md
description: Auto-synced from specs/003-backend-cleanup/data-model.md
type: source
sync_origin: specs/003-backend-cleanup/data-model.md
sync_hash: d9518c1d1b433fef
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/003-backend-cleanup/data-model.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Data Model: Laravel Backend Cleanup

**Feature**: 003-backend-cleanup
**Date**: 2026-01-26

## Overview

This document defines the refactoring targets, new class structures, and relationships for the Laravel backend cleanup sprint. The focus is on extracting services and repositories from large controllers.

## Current State Analysis

### Controller Size Distribution

| Controller | Lines | Category | Action |
|------------|-------|----------|--------|
| ProductController.php | 1,591 | Critical | Full refactor |
| PurchaseInvoiceController.php | 1,164 | Critical | Full refactor |
| CustomerInvoiceController.php | 1,094 | Critical | Full refactor |
| API/MessageController.php | 1,050 | Critical | Full refactor |
| OrderController.php | 941 | High | Partial refactor |
| CartController.php | 933 | High | Partial refactor |
| ProductImageController.php | 864 | High | Partial refactor |
| BannerController.php | 720 | Medium | Extract services |
| API/BuyerMessageController.php | 651 | Medium | Consolidate |
| SellerMessageController.php | 655 | Medium | Consolidate |

### Model Complexity

| Model | Lines | Issues | Action |
|-------|-------|--------|--------|
| User.php | 539 | Business logic in model | Extract to services |
| VariantSize.php | 386 | Excessive fillable | Review and clean |
| Stock.php | 371 | N+1 via $appends | Remove appends |
| Store.php | 354 | Mixed concerns | Extract services |
| Commission.php | 318 | Complex calculations | Extract to service |

## Target Architecture

### New Service Classes

```
app/Services/
├── Product/
│   ├── ProductService.php           # Business logic orchestration
│   ├── ProductFilterService.php     # Complex filtering logic
│   ├── ProductCacheService.php      # Caching management
│   └── ColorQueryBuilder.php        # Color filtering queries
├── Order/
│   ├── OrderService.php             # Order business logic
│   └── OrderQueryService.php        # Complex order queries
├── Message/
│   ├── MessageService.php           # Message business logic
│   └── ConversationService.php      # Conversation management
├── Invoice/
│   ├── InvoiceService.php           # Invoice generation
│   └── InvoiceCalculationService.php # Calculations
├── Cart/
│   └── CartService.php              # Cart business logic
└── User/
    ├── AuthService.php              # Authentication logic
    └── ProfileService.php           # Profile management
```

### New Repository Classes

```
app/Repositories/
├── Contracts/
│   ├── ProductRepositoryInterface.php
│   ├── OrderRepositoryInterface.php
│   ├── MessageRepositoryInterface.php
│   └── UserRepositoryInterface.php
├── ProductRepository.php            # Product data access
├── OrderRepository.php              # Order data access
├── MessageRepository.php            # Message data access
├── UserRepository.php               # User data access
├── StoreRepository.php              # Store data access
└── InvoiceRepository.php            # Invoice data access
```

### New Form Requests

```
app/Http/Requests/
├── Auth/
│   ├── LoginRequest.php
│   ├── RegisterRequest.php
│   └── ResetPasswordRequest.php
├── Product/
│   ├── CreateProductRequest.php
│   ├── UpdateProductRequest.php
│   └── ProductFilterRequest.php
├── Order/
│   ├── CreateOrderRequest.php
│   ├── UpdateOrderRequest.php
│   └── OrderFilterRequest.php
├── Cart/
│   ├── AddToCartRequest.php
│   └── UpdateCartRequest.php
├── Message/
│   ├── SendMessageRequest.php
│   └── MessageFilterRequest.php
└── Store/
    ├── CreateStoreRequest.php
    └── UpdateStoreRequest.php
```

## Detailed Class Specifications

### ProductService

**Purpose**: Orchestrate product-related business logic

**Dependencies**:
- ProductRepository
- ProductCacheService
- ProductFilterService

**Methods**:

```php
class ProductService
{
    public function __construct(
        private ProductRepository $repository,
        private ProductCacheService $cache,
        private ProductFilterService $filter
    ) {}

    // List products with filtering and caching
    public function getFilteredProducts(array $filters): LengthAwarePaginator;

    // Get single product with relations
    public function getProduct(int $id): ?Product;

    // Create new product
    public function createProduct(array $data): Product;

    // Update existing product
    public function updateProduct(int $id, array $data): Product;

    // Delete product
    public function deleteProduct(int $id): bool;

    // Get products by store
    public function getStoreProducts(int $storeId, array $filters): LengthAwarePaginator;
}
```

### ProductFilterService

**Purpose**: Handle complex product filtering logic

**Methods**:

```php
class ProductFilterService
{
    // Apply all filters to query
    public function applyFilters(Builder $query, array $filters): Builder;

    // Filter by category hierarchy
    public function filterByCategory(Builder $query, ?int $categoryId): Builder;

    // Filter by color variants
    public function filterByColors(Builder $query, array $colors): Builder;

    // Filter by size variants
    public function filterBySizes(Builder $query, array $sizes): Builder;

    // Filter by price range
    public function filterByPriceRange(Builder $query, ?float $min, ?float $max): Builder;

    // Filter by store
    public function filterByStore(Builder $query, ?int $storeId): Builder;

    // Apply sorting
    public function applySorting(Builder $query, string $field, string $direction): Builder;
}
```

### ProductRepository

**Purpose**: Data access layer for products

**Methods**:

```php
class ProductRepository implements ProductRepositoryInterface
{
    // Find by ID with optional relations
    public function find(int $id, array $relations = []): ?Product;

    // Find by ID or fail
    public function findOrFail(int $id, array $relations = []): Product;

    // Paginate with filters already applied
    public function paginate(Builder $query, int $perPage = 20): LengthAwarePaginator;

    // Create product
    public function create(array $data): Product;

    // Update product
    public function update(int $id, array $data): Product;

    // Delete product
    public function delete(int $id): bool;

    // Get base query with default relations
    public function query(): Builder;

    // Default relations to load
    protected function defaultRelations(): array;
}
```

### ProductCacheService

**Purpose**: Manage product-related caching

**Methods**:

```php
class ProductCacheService
{
    private const TTL = 900; // 15 minutes
    private const TAG = 'products';

    // Cache with callback
    public function remember(string $key, Closure $callback): mixed;

    // Generate cache key from filters
    public function generateKey(array $filters): string;

    // Invalidate product cache
    public function invalidateProduct(int $productId): void;

    // Invalidate all product caches
    public function invalidateAll(): void;

    // Invalidate store products
    public function invalidateStore(int $storeId): void;
}
```

### OrderRepository

**Purpose**: Data access layer for orders

**Methods**:

```php
class OrderRepository implements OrderRepositoryInterface
{
    // Find order by ID
    public function find(int $id, array $relations = []): ?Order;

    // Get user orders (multi-guard support)
    public function getUserOrders(int $userId, string $guard, array $filters = []): LengthAwarePaginator;

    // Get store orders
    public function getStoreOrders(int $storeId, array $filters = []): LengthAwarePaginator;

    // Create order
    public function create(array $data): Order;

    // Update order status
    public function updateStatus(int $id, string $status): Order;

    // Get order statistics
    public function getStatistics(int $storeId, array $dateRange = []): array;
}
```

### MessageRepository

**Purpose**: Unified message data access (replaces 3 controllers)

**Methods**:

```php
class MessageRepository implements MessageRepositoryInterface
{
    // Get conversations for user
    public function getConversations(int $userId, string $userType): Collection;

    // Get messages in conversation
    public function getMessages(int $conversationId, int $page = 1): LengthAwarePaginator;

    // Send message
    public function createMessage(array $data): Message;

    // Mark as read
    public function markAsRead(int $conversationId, int $userId): void;

    // Get unread count
    public function getUnreadCount(int $userId, string $userType): int;

    // Search messages
    public function search(int $userId, string $query): Collection;
}
```

## Database Schema Changes

### New Indexes

```sql
-- Orders table
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);

-- Products table
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_store_status ON products(store_id, status);

-- Stocks table
CREATE INDEX idx_stocks_product_id ON stocks(product_id);
CREATE INDEX idx_stocks_store_id ON stocks(store_id);

-- Messages table
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Variants table
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_color_id ON variants(color_id);
CREATE INDEX idx_variants_size_id ON variants(size_id);
```

### Model Changes

#### Stock Model

**Before**:
```php
protected $appends = ['total_quantity']; // Causes N+1

public function getTotalQuantityAttribute()
{
    return $this->variants->sum('quantity'); // N+1 query
}
```

**After**:
```php
// Remove $appends

// Add scope for explicit loading
public function scopeWithTotalQuantity(Builder $query): Builder
{
    return $query->withSum('variants', 'quantity');
}

// Keep accessor for when loaded
public function getTotalQuantityAttribute(): int
{
    return $this->variants_sum_quantity ?? 0;
}
```

#### User Model

**Before**: 539 lines with business logic

**After**: ~200 lines (relationships and scopes only)

**Extracted to**:
- `AuthService`: Login, logout, token management
- `ProfileService`: Profile updates, preferences
- `PermissionService`: Role and permission checks

## Form Request Specifications

### CreateProductRequest

```php
class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'description_ar' => 'nullable|string|max:5000',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0|gt:price',
            'sku' => 'nullable|string|unique:products,sku',
            'quantity' => 'required|integer|min:0',
            'status' => 'required|in:active,inactive,draft',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|mimes:jpeg,png,webp|max:2048',
            'variants' => 'nullable|array',
            'variants.*.color_id' => 'required_with:variants|exists:colors,id',
            'variants.*.size_id' => 'required_with:variants|exists:sizes,id',
            'variants.*.quantity' => 'required_with:variants|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required',
            'category_id.exists' => 'Selected category does not exist',
            'compare_price.gt' => 'Compare price must be greater than price',
        ];
    }
}
```

### OrderFilterRequest

```php
class OrderFilterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => 'nullable|in:pending,processing,shipped,delivered,cancelled',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'store_id' => 'nullable|exists:stores,id',
            'customer_id' => 'nullable|exists:users,id',
            'min_total' => 'nullable|numeric|min:0',
            'max_total' => 'nullable|numeric|min:0|gte:min_total',
            'sort' => 'nullable|in:created_at,total,status',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }
}
```

## Test Structure

### Unit Tests

```
tests/Unit/
├── Services/
│   ├── ProductServiceTest.php
│   ├── ProductFilterServiceTest.php
│   ├── ProductCacheServiceTest.php
│   ├── OrderServiceTest.php
│   └── MessageServiceTest.php
├── Repositories/
│   ├── ProductRepositoryTest.php
│   ├── OrderRepositoryTest.php
│   └── MessageRepositoryTest.php
└── QueryBuilders/
    └── ColorQueryBuilderTest.php
```

### Feature Tests

```
tests/Feature/
├── API/
│   ├── ProductApiTest.php
│   ├── OrderApiTest.php
│   ├── CartApiTest.php
│   └── MessageApiTest.php
├── Auth/
│   ├── LoginTest.php
│   ├── RegisterTest.php
│   └── PermissionTest.php
└── Integration/
    ├── OrderWorkflowTest.php
    └── CheckoutFlowTest.php
```

## Migration Plan

### Phase 1: Foundation

1. Create new directory structures
2. Add interfaces for repositories
3. Create base service and repository classes
4. Add database indexes

### Phase 2: Product Refactoring

1. Create ProductRepository
2. Create ProductFilterService
3. Create ProductCacheService
4. Refactor ProductController
5. Add tests for all new classes

### Phase 3: Order Refactoring

1. Create OrderRepository
2. Create OrderService
3. Refactor OrderController
4. Add tests

### Phase 4: Message Consolidation

1. Create MessageRepository
2. Create MessageService
3. Consolidate 3 message controllers
4. Add tests

### Phase 5: Remaining Controllers

1. Refactor InvoiceControllers
2. Refactor CartController
3. Add remaining Form Requests
4. Complete test coverage

## Dependency Injection Configuration

```php
// app/Providers/RepositoryServiceProvider.php
class RepositoryServiceProvider extends ServiceProvider
{
    public array $bindings = [
        ProductRepositoryInterface::class => ProductRepository::class,
        OrderRepositoryInterface::class => OrderRepository::class,
        MessageRepositoryInterface::class => MessageRepository::class,
        UserRepositoryInterface::class => UserRepository::class,
    ];
}
```

## Validation

### Pre-Refactoring Checklist

- [ ] Write characterization tests for current behavior
- [ ] Document current API response formats
- [ ] Benchmark current performance
- [ ] Identify all calling code

### Post-Refactoring Checklist

- [ ] All characterization tests pass
- [ ] API responses unchanged
- [ ] Performance improved or unchanged
- [ ] New code has 80% coverage
- [ ] PHPStan passes

