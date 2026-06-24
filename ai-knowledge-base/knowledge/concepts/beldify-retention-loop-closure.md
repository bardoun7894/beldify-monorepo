---
name: Beldify Retention Loop Closure (Hooked Model)
description: Closing the marketplace return loop ethically — re-aimed web push, contextual opt-ins, follow-a-shop, and reorder shipped 2026-06-09; the loop stays inert until VAPID keys, a queue worker, and the hourly cron run in prod
type: concept
sources: [raw/hooked/2026-06-09-opensouk-marketplace-loop.md, raw/2026-06-10-admin-audit-sellers-jewelry-deploy.md, raw/hooked/2026-06-19-marketplace-loop-delta.md]
created: 2026-06-10
updated: 2026-06-19
---

# Beldify Retention Loop Closure (Hooked Model)

## Overview
A Hooked-model audit (Trigger → Action → Variable Reward → Investment) found Beldify to be a strong transaction machine with a weak return loop: every surface needed to complete one purchase exists, but the mechanics that pull a one-time buyer back were missing or switched off. The design thesis is explicitly ethical — retention built on real value (a restock, a genuine price drop, a trusted atelier's new piece, effortless reorder), with seven dark patterns banned and one hard rule: **never send a push without a real underlying event.**

## The corrected diagnosis
The audit initially claimed the back-in-stock and price-drop backends were missing. Implementation recon proved that wrong: the backend Web Push engine was already fully built on `feat/web-push-notifications` — push_subscriptions table, `POST /api/push/subscribe`, `laravel-notification-channels/webpush`, BackInStock/PriceDrop/OrderStatus/CartRecovery notifications with `WebPushChannel` in `via()`, hourly `SendWishlistNotifications` and `ProcessAbandonedCarts` commands, and follow-shop endpoints. The real gap was **frontend activation**: push opt-in buried in Profile→Preferences, the wishlist hardcoding `notify_*` flags to false, and the PWA install banner hard-disabled in `EnhancedPWAContext.tsx`. Push budget was also mis-aimed at confirmations (cart-add, checkout) instead of return-driving events.

## What shipped (2026-06-09, branch feat/hooked-loop-closure)
Five packets via orchestrator fan-out (3× frontend-engineer + 1× backend-engineer):
1. **Contextual push opt-in** — `NotifyMeButton.tsx` on the PDP ("notify me when back in stock / price drops"); wishlist forwards notify flags + target_price and ensures a push subscription.
2. **Post-order push prompt** — `PostOrderPushPrompt.tsx` dismissible card on order confirmation (authed); guests get a soft account nudge.
3. **PWA install triggers re-enabled** — `checkOptimalTiming()` implemented; 24h dismiss guard kept.
4. **Follow-a-shop** — `FollowShopButton.tsx` wired to the existing `store_followers` endpoints; the biggest missing investment surface.
5. **Reorder** — new `POST /api/orders/{orderNumber}/reorder` (owner-scoped, current price/stock, skips out-of-stock) with "Buy it again" buttons on order list and detail.

All packets passed the ethics check; ESLint 0 errors; scoped Vitest + PHPUnit green (+5 passing, 0 regressions against the pre-existing failing baseline).

## Production prerequisites — the loop is inert without all three
1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` at Next.js **build time** plus the backend VAPID private key (the SW only exists in `docker-compose.prod.yml` builds — see [[concepts/serwist-service-worker-pitfalls]]).
2. A running Laravel queue worker (`QUEUE_CONNECTION=redis`) — notifications are queued.
3. The hourly `SendWishlistNotifications` cron scheduled — the opt-in flags are inert without it.

**Scheduler status (2026-06-10 admin audit)**: prerequisite 3 is now partially live but on a different cadence than designed — `wishlist:send-notifications` (covering price-drop + back-in-stock) runs **daily at 10:00**, not hourly, and `carts:process-abandoned` runs hourly 09–21 ([[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]). Note also that prod email remains entirely dead on an SMTP auth 535, so any mail-channel fallbacks stay inert.

## Known debt
i18n keys are hardcoded AR+EN in the new components (no `notify_me.*`/`shop.follow.*`/`orders.reorder.*` locale keys yet); `CartController.php:729` hardcodes `0.15` tax ignoring `config('cart.tax_rate')` and reorder mirrors it for cart-total parity; `vitest.config.mts` (ESM) wins precedence over `.ts` — CI pickup unconfirmed. Open Souk (post brief → ateliers bid → return to accept) is the strongest existing loop and the model to lean into — see [[concepts/open-souk-feature]].

## Delta status (2026-06-19 re-audit)
A delta audit ten days later found the loop **half-closed but leaking at the activation seams**
([[sources/hooked-2026-06-19-marketplace-loop-delta]]). Of the 06-09 packets, six survive and work,
but four defects had crept in or were never closed, all fixed this pass (commit `19e13cb`, branch
`feat/hooked-2026-06-19-loop-delta`):
- **P0 regression** — the PWA install modal was switched off again behind a dev-only `?pwa=install`
  query gate; the scoring engine ran but never surfaced the modal. Gate + `explicitOptIn` guard
  removed; 24h-dismiss / adaptive-threshold / isInstalled / scroll-disabled guards kept.
- **P1 silent bug** — the guest→auth wishlist merge in `AuthContext` hardcoded `notify_*: false`,
  killing the back-in-stock / price-drop trigger for guests who opted in pre-login; now forwards the
  stored flags + `target_price` (and `guestWishlist.ts` persists them).
- **i18n correctness** — `PostOrderPushPrompt` rendered Arabic-only to all locales, and the reorder
  label used `i18n.language` ternaries; both moved to `t()` keys (`post_order_push.*`,
  `orders.actions.buy_again`) across all 7 locales.

**Still the weakest layer (deferred to a follow-up full-stack packet):** a followed-shops *feed* and
a recently-viewed shelf — both are investment actions that currently dead-end with no return loop —
plus the dormant MegaOffer countdown chip ([[concepts/beldify-dormant-features-activation]]). A
cross-session `git add -A` collision swept this run's locale keys into another session's commit
(`4c3b2af`) with no loss — see [[concepts/beldify-dormant-features-activation]] and the
parallel-tree hazard guidance.

## See also
- [[sources/hooked-2026-06-09-opensouk-marketplace-loop]]
- [[sources/hooked-2026-06-19-marketplace-loop-delta]]
- [[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]
- [[concepts/open-souk-feature]]
- [[concepts/serwist-service-worker-pitfalls]]
- [[concepts/multi-seller-ecommerce]]
