---
name: Seller No-Store Gating
description: "EnsureSellerHasStore middleware gates the seller route group — sellers without an approved store are redirected to store.request.create instead of reaching Products, Open Souk, or Messages"
type: concept
tags: [laravel, php, blade, middleware, request, route, model, seller, auth, atlas]
sources: [daily/2026-06-01.md]
created: "2026-06-01"
updated: "2026-06-01"
---
# Seller No-Store Gating

## Overview
Sellers who have registered but not yet had a store approved were able to navigate to Products (`/ar/seller/products`), Open Souk (`/ar/seller/community`), and Messages (`/ar/seller/messages`) — all of which require a valid store to function. The fix is a dedicated `EnsureSellerHasStore` middleware applied to the seller route group, which redirects store-less sellers to the store-creation request page.

## Key Points
- **New middleware**: `app/Http/Middleware/EnsureSellerHasStore.php` — registered as `'seller.store'` in `$routeMiddleware`.
- **Applied to**: the entire seller route group in `routes/seller.php` (excludes `seller.dashboard` which lives in `web.php` and renders a dedicated no-store view).
- **Bypass for super-admins**: super-admin users pass through unconditionally (they manage seller routes for inspection purposes).
- **Dashboard special-case**: `DashboardController@index` renders `seller/no-store.blade.php` instead of redirecting — a redirect to `seller.dashboard` was itself the loop, so it must render a view.
- **Pre-existing loop fixed**: Before this change, `DashboardController@index` called `redirect()->route('seller.dashboard')` when no store existed, creating an infinite redirect loop. Fixed by restoring the `seller.no-store` view render (per `DashboardController.php.bak`).

## Implementation

### Middleware — `EnsureSellerHasStore.php`
```php
namespace App\Http\Middleware;

use App\Models\Store;
use Closure;
use Illuminate\Http\Request;

class EnsureSellerHasStore
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if ($user && ! $user->hasRole('super-admin')) {
            $hasStore = Store::where('user_id', $user->id)->exists();

            if (! $hasStore) {
                return redirect()->route('store.request.create')
                    ->with('info', __('messages.create_store_first'));
            }
        }

        return $next($request);
    }
}
```

### Kernel registration — `app/Http/Kernel.php`
```php
protected $routeMiddleware = [
    // ...
    'seller.store' => \App\Http\Middleware\EnsureSellerHasStore::class,
];
```

### Route group — `routes/seller.php`
```php
Route::middleware(['auth', 'role:seller', 'seller.store'])
    ->prefix('{locale}/seller')
    ->group(function () {
        Route::get('/products', [ProductController::class, 'index'])->name('seller.products.index');
        Route::get('/community', [CommunityController::class, 'index'])->name('seller.community.index');
        Route::get('/messages', [MessageController::class, 'index'])->name('seller.messages.index');
        // ...
    });
```

### No-store view — `resources/views/seller/no-store.blade.php`
The CTA button routes to `store.request.create` (not `seller.storeProfiles.edit`, which is gated by the same middleware):
```blade
<a href="{{ route('store.request.create') }}" class="btn-atlas-primary">
    {{ __('messages.create_store_first') }}
</a>
```

### i18n keys added
Both `en/messages.php` and `ar/messages.php` received `create_store_first`. Arabic also received `create_store` (was missing).

## Redirect Flow
```
Seller (no store) → GET /ar/seller/products
  → EnsureSellerHasStore middleware → redirect to /ar/store-requests/create
  → Flash: "Please create a store first"

Seller (no store) → GET /ar/seller/dashboard
  → DashboardController@index → render seller.no-store view (no redirect)
  → CTA: "Create Store" → /ar/store-requests/create
```

## Related Concepts
- [[concepts/laravel-route-model-binding-null-param]] — The store-profile crash that motivated this gating work
- [[concepts/seller-shell-layout]] — The shell whose nav links (Products, Open Souk, Messages) are now properly gated
- [[concepts/open-souk-feature]] — One of the three routes gated behind this middleware

## Sources
- [[daily/2026-06-01.md]] — Session 25023e79: user request "if no store found shouldn't open products and open souk and messages"; middleware implemented; infinite redirect loop in DashboardController fixed
