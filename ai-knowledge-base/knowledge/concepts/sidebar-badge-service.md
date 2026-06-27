---
name: Sidebar Badge Service
description: "Laravel service injecting live badge counts (pending sales, orders, carts, store requests) into the V3 admin sidebar via ViewComposer and Redis-per-user cache"
type: concept
tags: [laravel, php, blade, event, request, state, redis, cart, order, auth]
sources: [daily/2026-05-24.md]
created: "2026-05-24"
updated: "2026-05-24"
---
# Sidebar Badge Service

## Overview
When the Beldify V3 admin sidebar was simplified from 50 items to 17, five menu items were given dynamic badge counts (small red pill numerals) indicating pending work. Rather than embedding five raw DB queries in a Blade include, a dedicated `SidebarBadgeService` was introduced with per-user Redis caching and a `ViewComposer` to wire it cleanly.

## Key Points
- **Five badge keys**: `pending_sales`, `pending_purchases`, `pending_orders`, `abandoned_carts`, `store_requests`
- **Cache key pattern**: `sidebar:v3:badges:user:{id}` — per-user, 5-minute TTL
- **Cap**: count capped at 99 and displayed as `99+` to prevent layout overflow in the icon rail
- **Bust method**: `SidebarBadgeService::bust($userId)` deletes the Redis key; called by order/cart lifecycle events
- **ViewComposer**: `SidebarV3Composer` shares `$sidebarBadges` array into the sidebar blade; registered in `ViewServiceProvider`

## Details

### Service implementation
```php
// app/Services/SidebarBadgeService.php
class SidebarBadgeService
{
    public function getCounts(int $userId): array
    {
        $key = "sidebar:v3:badges:user:{$userId}";
        return Cache::remember($key, 300, function () {
            return [
                'pending_sales'    => Order::where('status', 'pending')->count(),
                'pending_purchases' => Purchase::where('status', 'pending')->count(),
                'pending_orders'   => Order::where('status', 'processing')->count(),
                'abandoned_carts'  => Cart::abandoned()->count(),
                'store_requests'   => StoreRequest::where('status', 'pending')->count(),
            ];
        });
    }

    public function bust(int $userId): void
    {
        Cache::forget("sidebar:v3:badges:user:{$userId}");
    }
}
```

### ViewComposer wiring
```php
// app/View/Composers/SidebarV3Composer.php
class SidebarV3Composer
{
    public function compose(View $view): void
    {
        $userId = auth()->id() ?? 0;
        $badges = app(SidebarBadgeService::class)->getCounts($userId);
        $view->with('sidebarBadges', $badges);
    }
}

// app/Providers/ViewServiceProvider.php
View::composer(
    'admin.includes.sidebar-v3',
    SidebarV3Composer::class
);
```

### Sidebar blade wiring
Each sidebar item that exposes a badge carries a `data-badge-key` attribute. A JS snippet reads `$sidebarBadges` from a `<script id="bdv3-badges">` JSON island and renders the pill:
```blade
@php $count = $sidebarBadges['pending_orders'] ?? 0; @endphp
@if($count > 0)
    <span class="bdv3-badge">{{ $count > 99 ? '99+' : $count }}</span>
@endif
```

### Cache invalidation
The 5-minute TTL is intentionally loose — badge staleness for 5 minutes is acceptable for an admin nav indicator. For critical state transitions (order accepted, store request approved), call `bust()` explicitly on the relevant event.

## Related Concepts
- [[concepts/beldify-admin-v3-sidebar]] — The sidebar this service feeds badge counts into
- [[concepts/caching-strategy]] — Broader Redis caching approach in the backend
- [[entities/redis]] — The cache backend used for badge counts
- [[entities/laravel]] — Framework; Cache facade, ViewComposer, ServiceProvider

## Sources
- [[daily/2026-05-24.md]] — SidebarBadgeService introduced alongside V3 sidebar simplification (50→17 items) and indigo gradient restyle; ViewComposer registered; badge counts wired into sidebar blade
