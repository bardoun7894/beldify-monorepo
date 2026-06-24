---
title: Hooked Audit — Beldify / OpenSouk Marketplace Loop & Conversion
date: 2026-06-09
type: hooked-audit
surface: e-commerce marketplace (Next.js storefront + Laravel backend)
tags: [hooked, retention, conversion, web-push, loyalty, marketplace]
---

# Hooked Audit — Beldify / OpenSouk Marketplace

> Adapted from the coaching-app surface table to **e-commerce marketplace** surfaces.
> The user's brief: *"make it addicted."* This audit delivers a **genuinely habit-forming**
> loop — people return because the marketplace is useful and rewarding — while refusing the
> 7 banned dark patterns (§11). For a marketplace, ethical engagement **is** the conversion
> engine: trust drives repeat purchase, manipulation drives chargebacks and 1-star reviews.

---

## 1. Hooked strategy summary

Beldify today is a **strong transaction machine with a weak return loop**. Every surface a
shopper needs to *complete one purchase* exists and works (home → PDP → cart → guest COD
checkout → order confirmation → in-app notification bell). What is almost entirely missing is
**loop closure** — the mechanics that pull a one-time buyer back next week. The single highest-
leverage fact: native Web Push (VAPID) shipped and works, but the **PWA install banner is
hard-disabled** (`EnhancedPWAContext.tsx`, all three triggers suppressed) and push only fires
on actions the user *just took* (cart-add, checkout, order-complete) instead of on events that
*bring them back* (back-in-stock, price-drop, order-shipped, abandoned-cart, new-drop-from-
followed-shop). The ethical thesis: **make the marketplace the place a Moroccan shopper checks
when they want to discover, track, and re-buy from artisans they trust** — Trigger (a back-in-
stock or shipped push) → Action (one-tap reorder / view) → Variable Reward (a real find: the
caftan restocked, the atelier dropped a new piece, points earned) → Investment (follow a shop,
save a wishlist, leave a review) that loads the next loop. Close the loop and "addiction"
becomes retention, not a dark pattern.

---

## 2. Core user personas and internal triggers

| Persona | Who | Internal trigger (emotion/situation that opens the loop) | The moment they reach for Beldify |
|---|---|---|---|
| **Aïcha — the occasion buyer** | 28, Casablanca, buys caftans/jewelry for weddings & Eid | Anticipation + social pressure ("I need an outfit for Saturday") | Evening scroll after seeing a WhatsApp invite |
| **Khadija — the repeat artisan-fan** | 40, Rabat, loves a specific tailor/atelier | Loyalty + discovery ("what did my favorite atelier make this week?") | Idle moments; wants *newness* from a trusted source |
| **Youssef — the WhatsApp-link clicker** | 33, lands cold from a shared product link | Curiosity + price-checking ("is this legit, is it cheap") | One-shot intent; needs trust fast or bounces |
| **Salma — the made-to-order commissioner** | 35, wants a custom piece via Open Souk | Control + creative desire ("I want it *my* way") | Posts a brief, then returns to see ateliers bid |
| **Driss — the deal hunter** | 45, price-sensitive, COD-only | Loss-of-missing-out on a *real* deal (not fake urgency) | Checks for genuine price drops & restocks |

**Internal triggers that should map to surfaces:** *I need an outfit by date X* (occasion),
*show me something new from someone I trust* (discovery), *did the thing I wanted come back /
drop in price* (tracking), *I want to re-buy what worked* (reorder).

---

## 3. External triggers (ethical) — the re-engagement channel that's switched off

Web Push exists but is mis-aimed. Recommended trigger set (all opt-in, frequency-capped, deep-linked):

| Trigger | Channel | Time-of-day | Frequency cap | Opt-out | Status today |
|---|---|---|---|---|---|
| **Order shipped / out for delivery** | Web Push + in-app Bell | event-driven | per-order | notification prefs | ⚠️ Bell type exists (`order_status`), push not wired |
| **Back-in-stock** (item user wishlisted/watched) | Web Push | event-driven, daytime | 1/item | per-item | ⚠️ `back_in_stock` TYPE_CONFIG ready, **no backend event** |
| **Price-drop** on wishlisted item | Web Push | event-driven, daytime | 1/item/drop | per-item | ⚠️ `price_drop` TYPE_CONFIG ready, **no price-tracking service** |
| **Abandoned cart** (gentle, value-framed) | Web Push + email | +4h, then +24h | max 2/cart | global toggle | ❌ Admin *visibility* only, no automated flow |
| **New drop from a followed shop** | Web Push | morning batch, Riyadh/Casablanca TZ | 1/shop/day | per-shop | ❌ Follow-shop doesn't exist yet |
| **Open Souk: an atelier bid on your brief** | Web Push + Bell | event-driven | per-brief | per-brief | ✅ Bell type exists (`tailoring_booking`/`community_response`) |
| **PWA install prompt** | In-app banner | returning visitor, post-purchase | 1/30 days | dismiss = silence | ❌ **Hard-disabled** in `EnhancedPWAContext.tsx` |

**Anti-pattern to avoid:** pushing the user right after they add to cart / check out (what fires
today). Those are confirmations, not re-engagement — keep them as in-app toasts, move the *push*
budget to events that genuinely bring value when the user is *away*.

---

## 4. Easiest first action per trigger (≤1 tap / ≤30s)

| Trigger | First action it leads to |
|---|---|
| Order shipped push | Tap → order tracking page (already exists, `orders/[orderNumber]`) |
| Back-in-stock push | Tap → PDP with size pre-selected → Buy Now (guest COD path already built) |
| Price-drop push | Tap → PDP showing old→new price → add to cart |
| Abandoned-cart push | Tap → cart restored (cart already persists) → checkout |
| Followed-shop drop | Tap → shop page filtered to "new" |
| Atelier bid push | Tap → Open Souk brief → accept/compare proposals |
| Install prompt | Tap "Add to Home Screen" → next visit is 1 tap from the home icon |

---

## 5. Variable rewards that feel meaningful (Tribe / Hunt / Self)

| Surface | Reward kind | Concrete reward | Maps to (SDT) |
|---|---|---|---|
| **Back-in-stock / price-drop** | Hunt | "The caftan you wanted is back" — a *real* find, not manufactured | Competence (smart shopper) |
| **Followed-shop new drop** | Tribe + Hunt | First look at a trusted artisan's new piece | Relatedness |
| **Open Souk bids** | Tribe | Ateliers competing *for you* — being courted | Relatedness + Autonomy |
| **Reorder / "buy it again"** | Self | Effortless re-acquisition of what worked | Competence |
| **Reviews "helpful" reactions** | Tribe | Your review helped N shoppers | Relatedness |
| **Points / first-order reward (new)** | Self | Visible progress to next reward; *real* MAD value | Competence |

**No gimmicks:** no confetti without a payoff, no badges-for-badges. Every reward must deliver
actual shopper value (a find, a saving, a trusted recommendation, recognition).

---

## 6. Investment actions (the missing layer that loads the next loop)

Investment is where Beldify is weakest — these are the actions a user takes *after* a reward that
make tomorrow's loop better and raise switching cost **ethically** (more value, not lock-in):

| Investment action | Loads into next loop | Status |
|---|---|---|
| **Wishlist an item** | Powers back-in-stock + price-drop triggers | ✅ exists, but **not wired to push** |
| **Follow a shop** | Powers new-drop trigger; builds a personal feed | ❌ missing entirely |
| **Save-for-later in cart** | Re-engagement without losing the item | ❌ missing |
| **Leave a review (+ photo)** | Social proof + recognition reward | ✅ reviews exist, no photos |
| **Reorder a past order** | One-tap repeat purchase | ⚠️ verify in `orders/[orderNumber]` |
| **Recently-viewed history** | Personalized home shelf | ❌ no tracking at all |
| **Saved address at checkout** | Express checkout next time | ❌ 10 friction points every time |

---

## 7. Loops

- **Visit loop (daily/weekly):** push or app-icon (Trigger) → land on personalized home with
  *recently-viewed* + *followed-shop drops* (Action) → find something new/restocked (Reward) →
  wishlist / follow / add-to-cart (Investment). **Blocked today** by: no personalization shelf,
  no follow, disabled install banner.
- **Purchase loop:** PDP → Buy Now guest COD (✅ strong) → order confirmation → **shipped push** →
  delivery → **review prompt** → **reorder** later. **Broken at:** shipped push not wired, weak
  post-purchase prompts, reorder unverified.
- **Comeback loop (no shame, ever):**
  - D3 silent (no nag).
  - D7: *value* push — "New from {followed shop}" or "{wishlisted item} restocked" (only if a real
    event exists; otherwise stay silent).
  - D14: different angle — "This week's top artisan pieces" digest.
  - D30: a *genuine* first-time-back incentive (e.g. free delivery), framed as welcome not guilt.
  - **Never** "we miss you / you're missing out / don't lose…".
- **Open Souk loop (already the strongest):** post brief → ateliers bid (reward) → return to
  accept (investment) → commission → review. Lean into this — it's the native habit engine.

---

## 8. Feature ideas (ranked by loop impact)

1. **Re-enable + re-aim Web Push** — turn on install banner (post-purchase, 1/30d), move push
   budget from confirmations to back-in-stock / price-drop / shipped / abandoned-cart. *(Highest ROI — channel already built, just switched off + mis-pointed.)*
2. **Wire back-in-stock & price-drop events** — the Bell UI + types already exist; add the Laravel
   events + `product_watchers` table keyed off wishlist. *(Cheapest "real reward" win.)*
3. **Follow-a-shop** — the single biggest missing *investment* surface; creates a personal feed and
   a recurring "new drop" trigger. Marketplace-defining.
4. **Reorder / "Buy it again"** — one-tap repeat from order history + a home shelf.
5. **Recently-viewed shelf** — lightweight localStorage/cookie tracking → home + PDP.
6. **Loyalty points (real MAD value)** — earn on delivered orders, redeem as discount. Calm,
   transparent, no expiry-anxiety. Pairs with COD economics.
7. **Referral program** — `affiliate` role already in schema; give shoppers a share link with a
   real reward both sides. Fuels the WhatsApp-in funnel that's already locked-in by product rule.
8. **Saved address / express checkout** — kills 10-point friction on repeat buyers.

---

## 9. Notification strategy (event · time · copy · metric · anti-pattern)

| Event | Time | GOOD copy (≤12 words, no "!") | Success metric | Anti-pattern (banned) |
|---|---|---|---|---|
| Order shipped | event | `Your order is on its way. Track it here.` | tap→track CTR | "Finally shipped!!!" |
| Out for delivery | event, daytime | `Arriving today. Have your COD ready.` | delivery-success % | guilt if missed |
| Back-in-stock | event, daytime | `The {item} you saved is back in stock.` | tap→purchase | "Only 2 left, hurry!" (fake scarcity) |
| Price-drop | event, daytime | `{item} dropped to {price} MAD.` | tap→add-to-cart | countdown that resets |
| Abandoned cart | +4h | `Your cart is saved. Pick up where you left off.` | recovery rate | "Don't lose your items!" (loss-aversion) |
| Followed-shop drop | morning batch | `{Shop} just added a new piece.` | tap→shop CTR | spamming every listing |
| Atelier bid (Open Souk) | event | `An atelier sent a proposal for your brief.` | accept rate | pressure to accept fast |
| Review request | +2d post-delivery | `How was {item}? One tap to rate.` | review-completion % | nagging repeatedly |

Every row: opt-in, frequency-capped, timezone-aware (Casablanca), deep-linked, one-tap mute.

---

## 10. UX copy examples by Hooked stage

- **Trigger (push):** `The caftan you saved is back in stock.` / `Your order is on its way.`
- **Action (PDP CTA):** `Buy now — pay on delivery` (already the strength; keep it loud).
- **Reward (back-in-stock landing):** `Back in your size. Ready to ship from {city}.`
- **Investment (follow):** `Follow {shop} to see new pieces first.`
- **Investment (review):** `Help other shoppers — rate {item} in one tap.`
- **Loyalty:** `You earned {N} points. {M} more for {reward}.`
- **Comeback (D30, no guilt):** `Welcome back — free delivery on your next order.`
- **Cancel/unsubscribe:** `Done. You won't get {type} alerts anymore.` (one tap, no retention wall)

Voice: second person, present tense, ≤12 words for push, no exclamation marks, no shame, specific
over generic. Arabic/Darija-first (RTL) — mirror the existing storefront locale.

---

## 11. Risks of manipulation / burnout — and mitigations

The brief said "addicted" — here is the line we hold. The 7 banned patterns and how this design
avoids each:

1. **Shame language** → comeback loop never uses "we miss you / you missed". Welcome-framed only.
2. **Fake urgency / scarcity** → back-in-stock & price-drop are *real* events; no reset countdowns,
   no "only 2 left" unless stock is genuinely 2 (use the real hybrid-stock contract).
3. **Infinite scroll / autoplay** → product feed stays paginated (already is); no bottomless feed.
4. **Loss-aversion overuse** → loyalty points have **no expiry anxiety**; abandoned-cart is
   "saved for you", never "don't lose it".
5. **Sunk-cost guilt** → no "you've come so far" in any flow.
6. **Paywall walls** → N/A (no subscription); the *core habit* (browse, buy COD) is always free.
   Never gate checkout behind account creation — guest COD must stay.
7. **Dark-pattern unsubscribe** → notification prefs are one-tap per channel; no retention wall.

Additional mitigations: per-channel + per-item frequency caps, global mute, Casablanca-TZ quiet
hours, and a hard rule — **never push without a real underlying event**. Silence beats a fabricated
reason.

---

## 12. Roadmap (MVP / V2 / V3) + metrics

**MVP (loop closure — 1 sprint, highest ROI):**
- Re-enable PWA install banner (post-purchase trigger, 30-day cap). *frontend-engineer*
- Re-aim Web Push: wire **order-shipped** + **abandoned-cart** push events. *backend-engineer + frontend*
- Wire **back-in-stock** + **price-drop** events off the existing wishlist + Bell types. *backend-engineer*
- Verify/ship **reorder** button on order detail. *frontend-engineer*
- Expected lift: D7 retention +5–10pp, abandoned-cart recovery 5–15% of carts.

**V2 (investment surfaces):**
- **Follow-a-shop** + followed-shop feed + new-drop push. *full-stack*
- **Recently-viewed** shelf (home + PDP). *frontend-engineer*
- **Save-for-later** in cart; **saved address** express checkout. *full-stack*
- Review **photos** + verified-purchase badge. *full-stack*
- Expected lift: repeat-purchase rate +, session depth +.

**V3 (variable-reward economy):**
- **Loyalty points** (earn on delivered, redeem as MAD discount, no expiry). *full-stack + DB*
- **Referral** program on the `affiliate` role + WhatsApp share link. *full-stack*
- Personalized "For You" home shelf. *backend + ML-lite*
- Expected lift: LTV +, organic acquisition via referral.

**Metrics to track:**
- Activation: first wishlist/follow within first session; first repeat visit within 7d.
- Retention: D1 / D7 / D30.
- Push: opt-in rate, CTR by event type, mute rate (watch for fatigue).
- Conversion: PDP→cart→checkout funnel; **guest-COD completion %**; abandoned-cart recovery %.
- Loop health: % buyers who return within 30d; reorder rate; follow-count distribution.
- Open Souk: brief→bid→accept funnel (already the strongest loop — instrument it).

---

## §6 Conversion gap analysis — P0/P1/P2 punch list

| Pri | Finding | Fix | Owner | Citation |
|---|---|---|---|---|
| **P0** | PWA install banner hard-disabled — strongest re-engagement channel is off | Re-enable with post-purchase + 30-day-cap trigger | frontend-engineer | `src/contexts/EnhancedPWAContext.tsx`, `src/hooks/usePWATriggers.ts` |
| **P0** | Push fires on cart-add/checkout/order-complete (confirmations), not on return-driving events | Move push budget to back-in-stock / price-drop / shipped / abandoned-cart | backend + frontend | `src/utils/webPush.ts`, `src/hooks/usePWATriggers.ts` |
| **P0** | Back-in-stock UI ready, **no backend event** | Add `product_watchers` (keyed off wishlist) + restock event → push | backend-engineer | `src/components/notifications/NotificationBell.tsx:67`, `src/app/wishlist/page.tsx` |
| **P0** | Price-drop UI ready, **no price-tracking service** | Add price-change observer on products → push wishlisters | backend-engineer | `NotificationBell.tsx:74` |
| **P1** | Abandoned cart: admin visibility only, no automated win-back | Wire +4h/+24h push+email off existing cart persistence | backend-engineer | KB `[[concepts/sidebar-badge-service]]`, `src/app/cart/page.tsx` |
| **P1** | No follow-a-shop — biggest missing investment surface | Add follow model + shop feed + new-drop trigger | full-stack | `src/app/shops/[name]/page.tsx` |
| **P1** | Reorder button presence unverified | Confirm/ship "Buy it again" on order detail + home shelf | frontend-engineer | `src/app/orders/[orderNumber]/page.tsx` |
| **P1** | 10 checkout friction points every time (no saved address) | Saved address → express checkout for returning buyers | full-stack | `src/app/checkout/page.tsx:1076-1387` |
| **P2** | No recently-viewed tracking anywhere | localStorage shelf on home + PDP | frontend-engineer | `src/app/page.tsx`, `src/app/products/[id]/page.tsx` |
| **P2** | No loyalty/points/referral despite `affiliate` role in schema | V3 points + referral economy | full-stack | KB `[[concepts/admin-atlas-migration]]` |
| **P2** | Reviews have no photos / verified-purchase badge | Add photo upload + verified flag | full-stack | `src/components/reviews/ReviewsSection.tsx` |
| **P2** | Newsletter opt-in UI has no backend integration | Wire email capture → list + win-back digest | backend-engineer | `src/components/Newsletter.tsx` |

---

## Ethics self-check

```
[x] No shame language in any copy example
[x] No fake urgency / scarcity (back-in-stock & price-drop are REAL events)
[x] No infinite-scroll recommendations (feed stays paginated)
[x] No loss-aversion-as-primary-mechanic (cart "saved", points no-expiry)
[x] No sunk-cost guilt in cancel/unsubscribe flow
[x] No paywall on the core habit (guest COD checkout stays free, never gated)
[x] Unsubscribe / mute path is one tap, per-channel
[x] Every reward maps to autonomy, competence, or relatedness (SDT)
[x] Every notification has time-of-day, frequency cap, opt-out
[x] Comeback loop after D7 uses value/welcome, never guilt
```

**Verdict: PASS** — the "addictive" loop is built on real value (restocks, trusted-shop drops,
genuine savings, effortless reorder), not manufactured pressure. The one hard rule that keeps it
ethical: **never send a push without a real underlying event.**

---

### Next step
Run `/kb-ingest` to promote this to a queryable KB source page.

---

## Implementation log — 2026-06-09

**Key discovery during recon:** the backend Web Push engine was already fully built on
`feat/web-push-notifications` (push_subscriptions table, `POST /api/push/subscribe`,
`laravel-notification-channels/webpush`, BackInStock/PriceDrop/OrderStatus/CartRecovery
notifications with `WebPushChannel` in `via()`, hourly `SendWishlistNotifications` +
`ProcessAbandonedCarts` commands, follow-shop endpoints). The audit's "missing backend" was wrong
— the real gap was **frontend activation**: push opt-in buried in Profile→Preferences, wishlist
hardcoding `notify_*` flags to false, and the disabled install banner. Scope pivoted accordingly.

Branch: `feat/hooked-loop-closure` (frontend) · backend reorder on nested `feat/web-push-notifications`.
Dispatched via orchestrator decomposition → 4 parallel workers (3× frontend-engineer + 1× backend-engineer).

| Packet | What shipped | Files | Path | Ethics | Tests |
|---|---|---|---|---|---|
| P1 Contextual push opt-in | "Notify me when back in stock / price drops" on PDP; wishlist now forwards notify flags + target_price; ensures push subscription | `NotifyMeButton.tsx` (new), `WishlistContext.tsx`, `products/[id]/page.tsx` | B/Agent | PASS | 5 ✓ |
| P2 Post-order push prompt | "Get shipping updates" dismissible card on order confirmation (authed); guest → soft account nudge | `PostOrderPushPrompt.tsx` (new), `order-confirmation/page.tsx` | B/Agent | PASS | 9 ✓ |
| P5 Re-enable PWA install triggers | `void shouldTrigger` → `setShowInstallPrompt(true)`; `checkOptimalTiming()` implemented; 24h dismiss guard kept | `EnhancedPWAContext.tsx` | B/Agent | PASS | 4 ✓ |
| P3 Follow-a-shop | Follow/Following toggle on shop page wired to existing `store_followers` endpoints | `FollowShopButton.tsx` (new), `shops/[name]/page.tsx` | B/Agent | PASS | 21 ✓ |
| P4 Reorder / "Buy it again" | New `POST /api/orders/{orderNumber}/reorder` (owner-scoped, current price/stock, skips OOS); buttons on order list + detail | `OrderController.php`, `routes/api.php`, `ReorderApiTest.php` (new), `orderService.ts`, `orders/page.tsx`, `orders/[orderNumber]/page.tsx` | B/Agent | PASS | 6 ✓ |

**Verification:** ESLint 0 errors (6 pre-existing warnings); §8.4 ethics grep clean both repos;
scoped Vitest + PHPUnit green. Net frontend suite +5 passing, 0 regressions (148 failing is a
pre-existing baseline).

**Prod-delivery prerequisites (NOT yet satisfied — the loop is inert without all three):**
1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` set at Next.js **build time** + backend VAPID private key — push won't subscribe/deliver otherwise. SW only exists in `docker-compose.prod.yml` builds (dev has none — see [[beldify-pwa-webpush]]).
2. A running **Laravel queue worker** (`QUEUE_CONNECTION=redis`) — notifications are queued; no worker = no delivery.
3. The **hourly `SendWishlistNotifications` cron** must be scheduled and running — P1's flags are inert without it.

**Follow-ups / known debt:**
- i18n keys hardcoded AR+EN in new components (no `notify_me.*`/`shop.follow.*`/`orders.reorder.*`
  locale keys yet) — needs a locale-file pass.
- Pre-existing: `CartController.php:729` hardcodes `0.15` tax, ignoring `config('cart.tax_rate')`
  (default 0). Reorder faithfully mirrors it for cart-total parity; the real fix is in CartController, out of scope here.
- `vitest.config.mts` added (ESM + `@vitejs/plugin-react`) for JSX-in-tests; `.mts` wins precedence over `.ts` — confirm CI picks it up.
- 3 files (`order-confirmation/page.tsx`, `products/[id]/page.tsx`, `orderService.ts`) carry BOTH
  this feature's changes and in-flight web-push refinements — could not be cleanly separated at commit.
