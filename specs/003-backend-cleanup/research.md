# Research: Laravel Backend Cleanup

**Feature**: 003-backend-cleanup
**Date**: 2026-01-26

## Security Research

### 1. Command Injection Vulnerability

**Location**: `app/Console/Commands/SafeProductionSeed.php`

**Current Code** (Vulnerable):
```php
exec('echo "" > '.storage_path('logs/laravel.log'));
$command = 'mysqldump -h '.config('database.connections.mysql.host').' -u '.$username.' -p'.$password;
exec($command);
```

**Issue**: Direct shell execution with concatenated strings allows command injection.

**Decision**: Use Laravel Process facade
**Rationale**:
- Process facade escapes arguments automatically
- Provides timeout handling
- Better error handling and output capture
- Testable

**Solution**:
```php
use Illuminate\Support\Facades\Process;

// Clear log file
Process::run(['truncate', '-s', '0', storage_path('logs/laravel.log')]);

// Database backup (use Laravel backup package instead)
// Or use proper escaping:
Process::run([
    'mysqldump',
    '-h', config('database.connections.mysql.host'),
    '-u', $username,
    '-p'.$password, // Password must be attached to -p
    $database
])->throw();
```

**Alternatives Considered**:
- Laravel Backup Package: Better for production, but more setup
- Queued jobs: Good for async, but doesn't solve escaping

---

### 2. Mass Assignment Prevention

**Issue**: 20+ controllers use `$request->all()` directly

**Current Pattern** (Vulnerable):
```php
$product = Product::create($request->all());
```

**Decision**: Mandatory Form Request validation
**Rationale**:
- Centralized validation rules
- Automatic 422 responses
- Reusable across controllers
- Self-documenting API inputs

**Solution**:
```php
// app/Http/Requests/CreateProductRequest.php
class CreateProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            // Only allow specific fields
        ];
    }
}

// Controller
public function store(CreateProductRequest $request)
{
    $product = Product::create($request->validated());
}
```

**Alternatives Considered**:
- Inline validation: Rejected due to duplication
- Model `$fillable`: Rejected as insufficient (doesn't validate)

---

### 3. Authorization Strategy

**Issue**: Many API endpoints lack proper authorization checks

**Decision**: Use Spatie Permission middleware consistently
**Rationale**: Already integrated in project, comprehensive RBAC

**Solution**:
```php
// routes/api.php
Route::middleware(['auth:sanctum', 'permission:manage products'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
});

// Or in controller
public function __construct()
{
    $this->middleware('permission:manage products')->only(['store', 'update', 'destroy']);
}
```

---

## Refactoring Research

### 1. Controller Extraction Pattern

**Decision**: Service + Repository pattern
**Rationale**:
- Matches existing partial implementation
- Clear separation of concerns
- Testable layers
- Reusable business logic

**Pattern**:
```
HTTP Request
    ↓
Controller (thin, HTTP concerns only)
    ↓
Service (business logic, validation, orchestration)
    ↓
Repository (data access, queries)
    ↓
Model (entity definition, relationships)
```

**Example Extraction**:

Before (ProductController, 300+ line method):
```php
public function index(Request $request)
{
    $query = Stock::with(['product', 'store', ...])
        ->whereHas('product', fn($q) => $q->where('status', 'active'));

    if ($request->category_id) {
        $query->whereHas('product', fn($q) => ...);
    }
    // ... 200 more lines of filtering

    $results = $query->paginate(20);

    // ... 50 lines of mapping/transformation

    return response()->json($results);
}
```

After:
```php
// Controller (thin)
public function index(ProductIndexRequest $request, ProductService $service)
{
    return $service->getFilteredProducts($request->validated());
}

// Service (business logic)
class ProductService
{
    public function __construct(
        private ProductRepository $repository,
        private ProductCacheService $cache
    ) {}

    public function getFilteredProducts(array $filters): LengthAwarePaginator
    {
        $cacheKey = $this->cache->generateKey($filters);

        return $this->cache->remember($cacheKey, function () use ($filters) {
            return $this->repository->paginateWithFilters($filters);
        });
    }
}

// Repository (data access)
class ProductRepository
{
    public function paginateWithFilters(array $filters): LengthAwarePaginator
    {
        return (new ProductQueryBuilder(Stock::query()))
            ->applyFilters($filters)
            ->with($this->defaultRelations())
            ->paginate($filters['per_page'] ?? 20);
    }
}
```

---

### 2. Query Builder Pattern

**Decision**: Dedicated QueryBuilder classes for complex filtering
**Rationale**: Reusable, testable, single responsibility

**Example**:
```php
class ProductQueryBuilder
{
    public function __construct(private Builder $query) {}

    public function applyFilters(array $filters): self
    {
        return $this
            ->filterByCategory($filters['category_id'] ?? null)
            ->filterByStore($filters['store_id'] ?? null)
            ->filterByColors($filters['colors'] ?? [])
            ->filterByPriceRange($filters['min_price'] ?? null, $filters['max_price'] ?? null)
            ->applySorting($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc');
    }

    private function filterByColors(?array $colors): self
    {
        if (empty($colors)) return $this;

        $this->query->whereHas('variants', function ($q) use ($colors) {
            $q->whereIn('color_id', $colors);
        });

        return $this;
    }

    // ... other filter methods
}
```

---

### 3. Caching Strategy

**Decision**: Service-level caching with Redis tags
**Rationale**:
- Centralized cache logic
- Tag-based invalidation
- Consistent TTLs
- Testable

**Implementation**:
```php
class ProductCacheService
{
    private const TTL = 900; // 15 minutes
    private const TAG = 'products';

    public function remember(string $key, Closure $callback): mixed
    {
        return Cache::tags([self::TAG])->remember($key, self::TTL, $callback);
    }

    public function invalidateProduct(int $productId): void
    {
        Cache::tags([self::TAG])->flush();
        // Or more granular:
        // Cache::tags(["product:{$productId}"])->flush();
    }

    public function generateKey(array $filters): string
    {
        return 'products:list:' . md5(json_encode($filters));
    }
}
```

---

## Testing Research

### 1. Test Framework Choice

**Decision**: PHPUnit with Pest syntax
**Rationale**:
- Pest provides cleaner, more expressive syntax
- Full PHPUnit compatibility
- Easy migration path
- Better assertions

**Setup**:
```bash
composer require pestphp/pest --dev
composer require pestphp/pest-plugin-laravel --dev
./vendor/bin/pest --init
```

**Example Test**:
```php
// tests/Unit/Services/ProductServiceTest.php
use App\Services\ProductService;

describe('ProductService', function () {
    beforeEach(function () {
        $this->repository = Mockery::mock(ProductRepository::class);
        $this->cache = Mockery::mock(ProductCacheService::class);
        $this->service = new ProductService($this->repository, $this->cache);
    });

    it('returns cached products when available', function () {
        $cachedProducts = collect([/* ... */]);

        $this->cache->shouldReceive('remember')
            ->once()
            ->andReturn($cachedProducts);

        $result = $this->service->getFilteredProducts(['category_id' => 1]);

        expect($result)->toBe($cachedProducts);
    });
});
```

---

### 2. Database Testing Strategy

**Decision**: RefreshDatabase with factories
**Rationale**: Isolated tests, reproducible state

**Factory Example**:
```php
// database/factories/ProductFactory.php
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'name_ar' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'category_id' => Category::factory(),
            'store_id' => Store::factory(),
            'price' => fake()->randomFloat(2, 10, 1000),
            'status' => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
```

---

### 3. API Contract Testing

**Decision**: Laravel HTTP tests with JSON assertions
**Rationale**: Built-in, fast, validates response structure

**Example**:
```php
// tests/Feature/API/ProductApiTest.php
test('list products returns paginated response', function () {
    Product::factory()->count(25)->create();

    $response = $this->getJson('/api/products');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'price', 'category', 'store']
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            'links'
        ]);
});

test('create product requires authentication', function () {
    $this->postJson('/api/products', [
        'name' => 'Test Product',
        'price' => 99.99
    ])->assertUnauthorized();
});

test('create product validates required fields', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/products', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'price', 'category_id']);
});
```

---

## Performance Research

### 1. Index Strategy

**Analysis**: Only 4 explicit indexes in 170 migrations

**Priority Indexes**:

| Table | Column(s) | Reason |
|-------|-----------|--------|
| orders | user_id | User order history queries |
| orders | store_id | Store order listing |
| orders | status | Status filtering |
| orders | created_at | Date range queries |
| products | category_id | Category browsing |
| products | store_id, status | Store product listing |
| stocks | product_id | Product inventory |
| messages | conversation_id | Message threads |
| messages | created_at | Message ordering |

**Migration Example**:
```php
// database/migrations/2026_01_26_add_performance_indexes.php
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->index('user_id');
        $table->index('store_id');
        $table->index('status');
        $table->index('created_at');
        $table->index(['store_id', 'status']); // Composite
    });
}
```

---

### 2. N+1 Query Elimination

**Issue**: Stock model `$appends` causes N+1
```php
// Current (problematic)
protected $appends = ['total_quantity'];

public function getTotalQuantityAttribute()
{
    return $this->variants->sum('quantity'); // N+1!
}
```

**Decision**: Lazy loading with explicit loading when needed
**Solution**:
```php
// Remove from $appends
// protected $appends = ['total_quantity']; // REMOVED

// Add scope for when needed
public function scopeWithTotalQuantity(Builder $query): Builder
{
    return $query->withSum('variants', 'quantity');
}

// Usage
$stocks = Stock::withTotalQuantity()->get();
$stocks->each->total_quantity; // No N+1
```

---

### 3. Query Optimization

**Before** (ProductController):
```php
$products = $query->get()->map(function($stock) {
    // Processing...
}); // Loads ALL records, then paginates in memory
```

**After**:
```php
$products = $query
    ->with(['product', 'store', 'primaryImage'])
    ->paginate(20)
    ->through(function ($stock) {
        // Processing on paginated subset only
    });
```

---

## Code Quality Research

### 1. PHPStan Configuration

**Decision**: Level 5 with baseline for existing code
**Rationale**: Balance between strictness and practicality

**Configuration**:
```neon
# phpstan.neon
parameters:
    level: 5
    paths:
        - app
    excludePaths:
        - app/Console/Commands/Legacy
    ignoreErrors:
        # Baseline for existing issues
    reportUnmatchedIgnoredErrors: false

includes:
    - vendor/nunomaduro/larastan/extension.neon
```

---

### 2. PHP CS Fixer Configuration

**Decision**: PSR-12 with Laravel-specific rules

```php
// .php-cs-fixer.php
return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        'array_syntax' => ['syntax' => 'short'],
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
        'trailing_comma_in_multiline' => true,
        'phpdoc_scalar' => true,
        'unary_operator_spaces' => true,
        'binary_operator_spaces' => true,
        'blank_line_before_statement' => [
            'statements' => ['return', 'throw', 'try'],
        ],
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__ . '/app')
            ->in(__DIR__ . '/tests')
    );
```

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Command execution | Laravel Process facade | Automatic escaping, testable |
| Input validation | Form Requests for all | Centralized, reusable, automatic responses |
| Authorization | Spatie Permission middleware | Already integrated, comprehensive |
| Controller pattern | Service + Repository | Testable, single responsibility |
| Complex queries | QueryBuilder classes | Reusable, isolated complexity |
| Caching | Service-level with Redis tags | Centralized, tag-based invalidation |
| Testing | PHPUnit with Pest | Clean syntax, PHPUnit compatible |
| Static analysis | PHPStan level 5 + baseline | Balance strictness and practicality |
| Code style | PHP CS Fixer PSR-12 | Industry standard, automated |
