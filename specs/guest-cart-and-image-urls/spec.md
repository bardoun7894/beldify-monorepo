# Spec — Guest cart not shown + category images broken on <www.beldify.com>

## Problems

1. **Guest cart empty after add** — `CartController::show()` resolves guest cart by `guest_token` without `status='active'` and without `latest('id')`. `addItem()` writes into the active cart. A stale abandoned cart with the same token is returned by `show()` → frontend renders empty.
2. **Category images blocked on prod** — `beldify-backend/.env` on MyContabo has `APP_URL=http://91.230.110.187:7894`. `ImageService::getContaboUrl()` returns `Storage::disk('public')->url($path)` which resolves to `http://91.230.110.187:7894/storage/categories/…`. On `https://www.beldify.com` these are (a) mixed-content-blocked and (b) rejected by `next/image` (400) because the HTTP IP origin is not in `next.config.prod.js remotePatterns`.
3. **Stray `localhost:7895` API call from sw.js** — a service-worker precache entry references the dev API origin. Browser blocks loopback fetch from public origin.

## Fixes

### Backend (CartController.php)

```php
// show() — replace the cart lookup block:
if ($userId) {
    $cart = Cart::where('user_id', $userId)->where('status', 'active')->latest('id')->first();
} elseif ($guestToken) {
    $cart = Cart::where('guest_token', $guestToken)->where('status', 'active')->latest('id')->first();
} else {
    $cart = null;
}
```

### Production env (server only — `beldify-backend/.env` on MyContabo)

```
APP_URL=https://www.beldify.com
```

Then `php artisan config:clear`. Makes `Storage::disk('public')->url()` emit `https://www.beldify.com/storage/categories/…` → mixed-content + next/image 400 both resolved (assuming nginx already serves `/storage` on the www vhost, which it does — that's how the 400 from `/_next/image` reached Next).

### Frontend (next.config.prod.js)

Add the public storage host to `images.remotePatterns`:

```js
{ protocol: 'https', hostname: 'www.beldify.com' },  // already present
{ protocol: 'http', hostname: '91.230.110.187' },   // add as safety net if APP_URL stays IP-based
```

`www.beldify.com` is already allowlisted — the only blocker is the backend emitting HTTP URLs. So the env change is the real fix; the next.config entry is defense-in-depth.

### Service worker (sw.js / src/app/sw.ts)

Find and remove any precache entry or runtime route that points at `http://localhost:7895/api/...`. This is a dev-origin URL leaking into the prod SW precache list.

## Acceptance

- Guest add → `GET /api/cart` returns the item with the same `X-Guest-Token`.
- `www.beldify.com` category grid renders images over HTTPS (no mixed-content, no 400 from `/_next/image`).
- `sw.js` registration does not attempt `localhost:7895` fetches from the prod origin.
- PHPUnit `--filter=Cart` green; existing frontend cart/image tests green.

## Done

All three verified on prod after `git pull` + `cache:clear` + frontend rebuild + nginx reload.
