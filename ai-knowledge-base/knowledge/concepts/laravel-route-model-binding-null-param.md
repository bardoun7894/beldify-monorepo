---
name: Laravel Route Model Binding — No URL Segment Injects Empty Model
description: When a controller type-hints Store $store but the route has no {store} segment, Laravel injects an unsaved empty model (exists=false, id=null), not null — any route() call using $store->id throws UrlGenerationException
type: concept
sources: [daily/2026-06-01.md]
created: 2026-06-01
updated: 2026-06-01
---

# Laravel Route Model Binding — No URL Segment Injects Empty Model

## Overview
If a controller method declares a type-hinted model parameter (e.g. `Store $store`) but the route definition has no matching `{store}` URL segment, Laravel's implicit binding does not inject `null` — it constructs a fresh, unsaved model instance (`$store->exists === false`, `$store->id === null`). Any code that then passes this instance to `route('…', ['store' => $store])` throws `UrlGenerationException: missing required parameter [store]`.

## Key Points
- **Empty model, not null**: `$store->exists` is `false`; `$store->id` is `null`; `$store->getKey()` returns `null`.
- **Triggered by legacy routes**: Often surfaces when a route is refactored to remove the `{store}` slug but the controller signature is not updated, or when a new controller method is mapped onto an old route that never had a slug.
- **Symptom**: `Symfony\Component\Routing\Exception\InvalidParameterException` / `Illuminate\Routing\Exceptions\UrlGenerationException` with message *"missing required parameter [store]"* thrown from inside a Blade template calling `route()`.
- **Guard pattern**: Check `$store->exists` before using the model, or resolve the authenticated user's own store explicitly.

## Beldify Context — `Admin\StoreProfileController@edit`

The legacy seller route `/ar/store/profile` mapped to `StoreProfileController@edit(Store $store)` with no `{store}` segment. Laravel injected an empty `Store` instance. The view called:
```blade
<form action="{{ route('admin.storeProfiles.update', ['store' => $store]) }}">
```
…which threw `UrlGenerationException` because `$store->id` was `null`.

### Fix — `resolveOwnStore()` helper
```php
private function resolveOwnStore(Store $store): Store
{
    if ($store->exists) {
        return $store;
    }
    /** @var \App\Models\User $user */
    $user = auth()->user();
    return $user->store ?? $user->stores()->first() ?? new Store(); // caller must check ->exists
}

public function edit(Store $store): View|RedirectResponse
{
    $store = $this->resolveOwnStore($store);

    if (! $store->exists) {
        return redirect()->route('seller.dashboard')
            ->with('error', __('messages.no_store_found'));
    }

    return view('admin.store-profiles.edit', compact('store'));
}
```

The `resolveOwnStore()` guard is added to every method (`edit`, `update`, `show`) that could be reached via the slug-less route.

## General Recipe
```php
// In any controller that may receive an empty binding:
if (! $model->exists) {
    // Option A: resolve from auth context
    $model = auth()->user()->store ?? abort(404);
    // Option B: redirect with error
    return redirect()->route('fallback.route')
        ->with('error', 'Resource not found.');
}
```

## Diagnostic Checklist
1. Confirm the route has a `{model}` segment: `php artisan route:list | grep store-profiles`.
2. Add `dd($store->exists, $store->id)` before the view — if both are falsy, you hit this pitfall.
3. Check whether the route was refactored to remove the slug without updating the controller.

## Related Concepts
- [[concepts/seller-no-store-gating]] — Middleware that catches the store-less seller earlier, preventing this controller from even being reached in the seller flow
- [[concepts/laravel-optional-typehint-pitfall]] — Related: `optional()` returns an `Optional` wrapper, not `null` either

## Sources
- [[daily/2026-06-01.md]] — Session 25023e79: `UrlGenerationException` on `/ar/store/profile`; `resolveOwnStore()` fix applied to `StoreProfileController`
