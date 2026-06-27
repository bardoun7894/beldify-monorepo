---
name: Cart Table Null-Safe Guest Fix
description: Fixed two bugs in admin cart Blade views — null-safe $cart->user access for guest carts and incorrect route names causing dead links
type: concept
tags: [laravel, blade, cart, guest, admin, route, null-safety]
sources: [sources/backend-claude]
created: "2026-06-27"
updated: "2026-06-27"
---
# Cart Table Null-Safe Guest Fix

## The Bugs

1. **Null-safe access failure**: `cart_table.blade.php` accessed `$cart->user->name` directly, crashing when `$cart->user` was null (guest carts with no registered user). Beldify supports guest checkout via `guest_token` on the Cart model.
2. **Incorrect route names**: `abandoned.blade.php` referenced `carts.send-recovery` (dead route) and `carts.show` (should be `admin.carts.show`).

## The Fix

- cart_table.blade.php: Wrapped `$cart->user` access in null-safe check: `$cart->user ? $cart->user->name : 'Guest'`
- Fixed route from `carts.show` to `admin.carts.show`
- abandoned.blade.php: Removed dead `carts.send-recovery` route, fixed `carts.show` → `admin.carts.show`

## Context

- Cart model supports `guest_token` — carts can exist without a registered user
- Admin CartController::index() shows all carts (guest + user)
- These bugs caused broken links and crashes in admin panel

## See also

- [[concepts/multi-seller-ecommerce]]
- [[sources/backend-claude]]
