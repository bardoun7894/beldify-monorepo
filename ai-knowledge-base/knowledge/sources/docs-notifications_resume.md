---
name: docs/NOTIFICATIONS_RESUME.md
description: Auto-synced from docs/NOTIFICATIONS_RESUME.md
type: source
sync_origin: docs/NOTIFICATIONS_RESUME.md
sync_hash: 2599a1fbd0eb635a
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from docs/NOTIFICATIONS_RESUME.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Notifications — Resume Doc (workflow `fix-notifications-fullstack`)

Generated after the workflow's backend implementer + both verify agents stalled.
**Frontend is DONE and in the working tree. Backend is NOT — do this next.**

## State

- ✅ Frontend implemented: `notificationService.ts`, `NotificationContext.tsx`,
  `components/notifications/NotificationBell.tsx`, `app/notifications/page.tsx`,
  `Navbar.tsx` (bell), `RealtimeChatContext.tsx` (`notification-created` binding),
  `DeferredProviders.tsx` (provider mount), 5 locale files, 1 test file. 47 TDD tests pass.
- ❌ Backend NOT implemented (stalled). Frontend calls `/api/v1/notifications*` which does NOT exist yet.
- ❌ Verification never ran (php -l / route:list / npm lint / tsc).

## Root cause (most important)

`.env` has `QUEUE_CONNECTION=redis` and the notification classes `implement ShouldQueue`.
With no queue worker running, DB notification rows are **never written** → bell stays empty.
**Fix: drop `ShouldQueue` from every notification class below (write to `database` channel in-request).**

## Backend work items (13)

1. **EDIT** `app/Notifications/NewMessageNotification.php` — remove `ShouldQueue`; replace
   `$sender->name ?? 'Someone'` with `$sender->display_name ?? $sender->username` (users have no `name` col).
2. **EDIT** `app/Http/Controllers/Seller/MessageController.php` (~L191) — after broadcast, add
   `$recipient->notify(new \App\Notifications\NewMessageNotification($message));` + set `sender_type='seller'`.
3. **CREATE** `app/Notifications/OrderPlacedNotification.php` — not ShouldQueue; `via=['database',fcm?]`;
   data `{type:'order_placed',order_id,order_number,total,store_id,message}`; → SELLER.
4. **EDIT** `app/Services/OrderService.php` — `createCheckoutOrder()` (~L122) notify seller
   `optional($order->store->owner)->notify(new OrderPlacedNotification($order))`;
   `cancelOrder()` (~L277-294) notify buyer+seller with OrderStatusNotification(cancelled).
5. **CREATE** `app/Notifications/OrderStatusNotification.php` — ctor Order+status; `via=['database',fcm?]`;
   data `{type:'order_status',order_id,order_number,status,message}`; → BUYER.
6. **EDIT** `app/Http/Controllers/Seller/SellerOrderController.php` `updateStatus()` (~L133) — after broadcast,
   `optional($order->customer?->user)->notify(new OrderStatusNotification($order,$order->status))`.
7. **CREATE** `app/Notifications/NewResponseNotification.php` — ctor PostResponse; data
   `{type:'community_response',post_id,response_id,responder_name,message}`; → post author.
8. **EDIT** `app/Http/Controllers/Api/PostResponseController.php` (~L102-160) — with self-notify guard
   `if ($post->user_id && $post->user_id !== $request->user()->id) { optional($post->user)->notify(...); }`.
   Same in `Seller/CommunityController.php` (~L128-170) and `Api/Seller/SellerCommunityController.php::storeResponse` (~L272).
9. **CREATE** `app/Notifications/TailoringBookingNotification.php` — ctor Booking; data
   `{type:'tailoring_booking',booking_id,customer_name,message}`; → tailor's user.
10. **EDIT** `app/Http/Controllers/Api/TailorController.php` (~L150-157) + `TailoringOrderController.php` (~L66-94)
    — notify tailor's owning user after booking create.
11. **EDIT** `app/Http/Controllers/API/Mobile/NotificationController.php` — add
    `unreadCount(): JsonResponse` → `{success:true,data:{unread_count: $user->unreadNotifications()->count()}}`.
12. **EDIT** `routes/api.php` — inside the authed `/api/v1` group (`auth:sanctum`), reuse the Mobile
    NotificationController:
    - `GET  /v1/notifications` → index
    - `GET  /v1/notifications/unread-count` → unreadCount
    - `POST /v1/notifications/mark-read/{id}` → markAsRead
    - `POST /v1/notifications/mark-all-read` → markAllAsRead
    - `DELETE /v1/notifications/{id}` → destroy
13. **CREATE (optional)** `app/Events/NotificationCreated.php` — `ShouldBroadcastNow`,
    `PrivateChannel('user.'.$userId)`, `broadcastAs('notification-created')`,
    `broadcastWith({type,message,unread_count})`. Skip if no Reverb/soketi server runs (poll covers correctness).

## API contract the frontend already expects (must match item 12)

`GET /api/v1/notifications` · `GET /api/v1/notifications/unread-count` ({unread_count}) ·
`POST /api/v1/notifications/mark-read/{id}` · `POST /api/v1/notifications/mark-all-read` ·
`DELETE /api/v1/notifications/{id}`. Single source to change if paths differ: `src/services/notificationService.ts`.

## Risks / gotchas

- ShouldQueue + no worker = silent failure (the real bug). Drop ShouldQueue.
- `BROADCAST_DRIVER=null` by default; L10 can't run Reverb directly (soketi). Realtime = enhancement only; 30s poll is source of truth.
- No `name` column → use `display_name`/`username` everywhere.
- Self-notify guards required (author↔own post, seller↔own thread).
- Chat will show in BOTH the message badge and the bell — intentional this pass.
- `device_type`/`device_id` have no migration; FCMNotificationService uses dead legacy endpoint (only `toFcm` v1 works) — out of scope for in-app bell.

## Verify (never ran)

- Backend: `php -l` changed files; `php artisan route:list | grep notification`; `php artisan test --filter Notification`.
- Frontend: `cd beldify-frontend && npm run lint && npx tsc --noEmit`.

Full workflow result: `/private/tmp/claude-501/-Users-mohamedbardouni-projects-beldify/024a0304-5c1c-4d19-90a7-1633587734e0/tasks/wdxn2cmhk.output`

