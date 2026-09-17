---
name: specs/003-backend-cleanup/quickstart.md
description: Auto-synced from specs/003-backend-cleanup/quickstart.md
type: source
sync_origin: specs/003-backend-cleanup/quickstart.md
sync_hash: 3c2520d3655d2f79
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/003-backend-cleanup/quickstart.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Quickstart: Laravel Backend Cleanup

**Feature**: 003-backend-cleanup
**Date**: 2026-01-26

## Prerequisites

- PHP 8.1+
- Composer 2.x
- MySQL 8.0+
- Redis (for caching)
- Node.js 18+ (for frontend asset compilation if needed)

## Initial Setup

### 1. Clone and Install

```bash
cd beldify-backend
composer install
cp .env.example .env
php artisan key:generate
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE beldify_backend;"

# Run migrations
php artisan migrate

# Seed development data (optional)
php artisan db:seed
```

### 3. Install New Development Dependencies

```bash
# Testing tools
composer require --dev pestphp/pest
composer require --dev pestphp/pest-plugin-laravel
./vendor/bin/pest --init

# Static analysis
composer require --dev nunomaduro/larastan
composer require --dev phpstan/phpstan

# Code style
composer require --dev friendsofphp/php-cs-fixer
```

### 4. Configure Environment

```env
# .env additions for development
APP_DEBUG=true
LOG_LEVEL=debug

# Cache driver
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Queue for background jobs
QUEUE_CONNECTION=redis
```

## Running Tests

### Full Test Suite

```bash
# Run all tests
./vendor/bin/pest

# With coverage
./vendor/bin/pest --coverage

# Coverage with HTML report
./vendor/bin/pest --coverage --coverage-html=coverage
```

### Specific Test Categories

```bash
# Unit tests only
./vendor/bin/pest tests/Unit

# Feature tests only
./vendor/bin/pest tests/Feature

# Specific test file
./vendor/bin/pest tests/Unit/Services/ProductServiceTest.php

# Filter by test name
./vendor/bin/pest --filter="should return cached products"
```

### Test with Database

```bash
# Use in-memory SQLite for faster tests
# phpunit.xml already configured

# Or use MySQL test database
php artisan migrate --env=testing
./vendor/bin/pest --env=testing
```

## Code Quality Commands

### Static Analysis

```bash
# Run PHPStan
./vendor/bin/phpstan analyse

# Generate baseline (first time)
./vendor/bin/phpstan analyse --generate-baseline

# Check specific path
./vendor/bin/phpstan analyse app/Services
```

### Code Style

```bash
# Check code style
./vendor/bin/php-cs-fixer fix --dry-run --diff

# Fix code style
./vendor/bin/php-cs-fixer fix

# Check specific directory
./vendor/bin/php-cs-fixer fix app/Services --dry-run
```

### Combined Quality Check

```bash
# Add to composer.json scripts
"scripts": {
    "test": "./vendor/bin/pest",
    "test:coverage": "./vendor/bin/pest --coverage",
    "analyse": "./vendor/bin/phpstan analyse",
    "format": "./vendor/bin/php-cs-fixer fix",
    "format:check": "./vendor/bin/php-cs-fixer fix --dry-run --diff",
    "quality": [
        "@format:check",
        "@analyse",
        "@test"
    ]
}

# Run all quality checks
composer quality
```

## Development Workflow

### 1. Before Starting Work

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
composer install

# Run migrations
php artisan migrate

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### 2. Creating New Service/Repository

```bash
# Create service
php artisan make:class Services/ProductFilterService

# Create repository
php artisan make:class Repositories/ProductRepository

# Create Form Request
php artisan make:request CreateProductRequest

# Create test
php artisan pest:test Unit/Services/ProductFilterServiceTest
```

### 3. Before Committing

```bash
# Run quality checks
composer quality

# Or individually:
./vendor/bin/php-cs-fixer fix
./vendor/bin/phpstan analyse
./vendor/bin/pest
```

### 4. Pre-commit Hook (Optional)

```bash
# .git/hooks/pre-commit
#!/bin/sh
composer format:check || exit 1
composer analyse || exit 1
composer test || exit 1
```

## Test Scenarios

### Security Tests

```bash
# Test authentication required
./vendor/bin/pest --filter="requires authentication"

# Test authorization
./vendor/bin/pest --filter="permission"

# Test input validation
./vendor/bin/pest --filter="validation"
```

### Performance Tests

```bash
# Enable query logging in tests
# Add to test setUp():
DB::enableQueryLog();

# After test:
$queries = DB::getQueryLog();
$this->assertLessThan(10, count($queries), 'Too many queries');
```

### API Contract Tests

```bash
# Run API tests
./vendor/bin/pest tests/Feature/API

# Test specific endpoint
./vendor/bin/pest --filter="ProductApiTest"
```

## Debugging

### Query Debugging

```php
// In controller or service
DB::enableQueryLog();

// Your code here

dd(DB::getQueryLog());
```

### Cache Debugging

```bash
# View cache contents
php artisan tinker
>>> Cache::get('products:list:...')

# Clear specific cache
>>> Cache::tags(['products'])->flush()

# Clear all cache
php artisan cache:clear
```

### Performance Profiling

```bash
# Install Laravel Debugbar for development
composer require --dev barryvdh/laravel-debugbar

# Or use Clockwork
composer require --dev itsgoingd/clockwork
```

## Common Tasks

### Adding a New Index

```bash
# Create migration
php artisan make:migration add_index_to_orders_table

# Migration content:
Schema::table('orders', function (Blueprint $table) {
    $table->index('user_id');
});

# Run migration
php artisan migrate
```

### Creating a Form Request

```bash
php artisan make:request CreateProductRequest

# Add validation rules:
public function rules(): array
{
    return [
        'name' => 'required|string|max:255',
        'price' => 'required|numeric|min:0',
        'category_id' => 'required|exists:categories,id',
    ];
}
```

### Creating a Test Factory

```bash
php artisan make:factory ProductFactory

# Define attributes:
public function definition(): array
{
    return [
        'name' => fake()->words(3, true),
        'price' => fake()->randomFloat(2, 10, 1000),
        'category_id' => Category::factory(),
    ];
}
```

## Verification Checklist

### After Each Refactoring

- [ ] All existing tests pass
- [ ] New code has tests (80% coverage minimum)
- [ ] PHPStan passes
- [ ] Code style passes
- [ ] No N+1 queries (check query log)
- [ ] API responses unchanged (contract tests)

### Before PR

- [ ] `composer quality` passes
- [ ] Coverage meets threshold
- [ ] Documentation updated (if needed)
- [ ] Migration tested forward and backward

## Troubleshooting

### Tests Failing After Pull

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
composer dump-autoload

# Re-run migrations
php artisan migrate:fresh --seed --env=testing
```

### PHPStan Errors on New Code

```bash
# Check specific file
./vendor/bin/phpstan analyse app/Services/NewService.php

# Common fixes:
# - Add return type declarations
# - Add property type declarations
# - Handle null checks explicitly
```

### Cache Issues

```bash
# Redis not running
sudo service redis-server start

# Cache driver mismatch
# Check .env CACHE_DRIVER matches config/cache.php

# Clear and rebuild
php artisan cache:clear
php artisan config:cache
```

## Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Pest Testing](https://pestphp.com/docs)
- [PHPStan Documentation](https://phpstan.org/user-guide)
- [PHP CS Fixer Rules](https://cs.symfony.com/doc/rules/)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)

