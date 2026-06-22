---
name: Hooked audit — Beldify/OpenSouk marketplace loop and conversion (2026-06-09)
description: Nir Eyal Hooked-model audit of the marketplace return loop (triggers, actions, variable rewards, investment) plus the same-day implementation log — 5 packets shipped on feat/hooked-loop-closure
type: source
sources: [raw/hooked/2026-06-09-opensouk-marketplace-loop.md]
created: 2026-06-10
updated: 2026-06-10
---

# Hooked audit — Beldify/OpenSouk marketplace loop and conversion (2026-06-09)

## Summary
A Hooked-model (Trigger → Action → Variable Reward → Investment) audit of the Beldify marketplace, adapted from the coaching-app surface table to e-commerce. Diagnosis: Beldify is a strong transaction machine with a weak return loop — every surface to complete one purchase exists, but loop-closure mechanics that pull a buyer back are largely missing or switched off. The document includes five personas, an ethical external-trigger set, ranked feature ideas, a notification strategy, an ethics self-check (PASS), and a same-day implementation log of five shipped packets.

## Key points
- **Highest-leverage finding**: native Web Push (VAPID) shipped and works, but the PWA install banner was hard-disabled (`EnhancedPWAContext.tsx`, all three triggers suppressed) and push only fired on actions the user just took (cart-add, checkout, order-complete) instead of return-driving events (back-in-stock, price-drop, order-shipped, abandoned-cart, new-drop-from-followed-shop).
- **Personas**: Aïcha (occasion buyer), Khadija (repeat artisan-fan), Youssef (WhatsApp-link clicker), Salma (Open Souk commissioner), Driss (deal hunter) — each mapped to an internal trigger.
- **Key correction discovered during implementation recon**: the backend Web Push engine was ALREADY fully built on `feat/web-push-notifications` (push_subscriptions table, `POST /api/push/subscribe`, `laravel-notification-channels/webpush`, BackInStock/PriceDrop/OrderStatus/CartRecovery notifications with `WebPushChannel`, hourly `SendWishlistNotifications` + `ProcessAbandonedCarts` commands, follow-shop endpoints). The audit's "missing backend" claims were wrong — the real gap was frontend activation (push opt-in buried in Profile→Preferences, wishlist hardcoding `notify_*` flags to false, disabled install banner). Scope pivoted accordingly.
- **Shipped 2026-06-09** (branch `feat/hooked-loop-closure`, 4 parallel workers): P1 contextual push opt-in on PDP (`NotifyMeButton.tsx`, wishlist forwards notify flags + target_price); P2 post-order push prompt (`PostOrderPushPrompt.tsx` on order confirmation, guest → soft account nudge); P5 PWA install triggers re-enabled (`checkOptimalTiming()` implemented, 24h dismiss guard kept); P3 follow-a-shop (`FollowShopButton.tsx` wired to existing `store_followers` endpoints); P4 reorder (`POST /api/orders/{orderNumber}/reorder`, owner-scoped, current price/stock, skips OOS, buttons on order list + detail). ESLint 0 errors; ethics grep clean; scoped Vitest + PHPUnit green (+5 passing, 0 regressions).
- **Prod-delivery prerequisites (NOT yet satisfied — loop inert without all three)**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` at Next.js build time + backend VAPID private key; a running Laravel queue worker (`QUEUE_CONNECTION=redis`); the hourly `SendWishlistNotifications` cron scheduled.
- **Ethics rules**: 7 banned dark patterns (shame language, fake urgency/scarcity, infinite scroll/autoplay, loss-aversion overuse, sunk-cost guilt, paywall walls, dark-pattern unsubscribe); hard rule — never push without a real underlying event; comeback loop is welcome-framed, never guilt ("we miss you" banned); guest COD checkout must never be gated behind account creation.
- **Ranked feature ideas**: 1 re-enable + re-aim Web Push, 2 wire back-in-stock/price-drop events, 3 follow-a-shop, 4 reorder, 5 recently-viewed shelf, 6 loyalty points (real MAD value, no expiry), 7 referral on the existing `affiliate` role, 8 saved address/express checkout.
- **Known debt**: i18n keys hardcoded AR+EN in the new components; pre-existing `CartController.php:729` hardcodes `0.15` tax ignoring `config('cart.tax_rate')` (reorder mirrors it for parity); `vitest.config.mts` added (`.mts` wins precedence over `.ts`); 3 files carry both this feature's changes and in-flight web-push refinements.
- **Open Souk** identified as the strongest existing loop (post brief → ateliers bid → return to accept → commission → review) — lean into it as the native habit engine.

## See also
- [[sources/hooked-2026-06-19-marketplace-loop-delta]] — the 10-day-later delta re-audit
- [[concepts/beldify-retention-loop-closure]]
- [[concepts/open-souk-feature]]
- [[concepts/multi-seller-ecommerce]]
