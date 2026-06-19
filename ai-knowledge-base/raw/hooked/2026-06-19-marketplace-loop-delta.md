---
title: Hooked Audit (Delta) — Beldify Marketplace Loop, 2026-06-19
date: 2026-06-19
type: hooked-audit
surface: e-commerce marketplace (Next.js storefront)
supersedes_partial: raw/hooked/2026-06-09-opensouk-marketplace-loop.md
tags: [hooked, retention, conversion, web-push, recently-viewed, follow-shop, i18n]
---

# Hooked Audit (Delta) — Beldify Marketplace, 2026-06-19

> This is a **delta** audit. The full Hooked strategy, personas, ethics stance, and roadmap
> live in [[sources/hooked-2026-06-09-opensouk-marketplace-loop]]. Ten days and several
> shipping sessions later (multi-seller orders, home redesign, current `main`), this pass
> re-checks the four loop stages against today's code and reports **what shipped, what
> regressed, and what is still open**. Same ethical thesis: ethical engagement *is* the
> conversion engine; the 7 dark patterns stay banned; **never push without a real event.**

---

## 1. Strategy summary (unchanged thesis, new status)

The 06-09 verdict — *"strong transaction machine, weak return loop"* — is now **half-closed**.
The 06-09 fan-out shipped 5 packets (re-aimed push, contextual back-in-stock/price-drop opt-in,
follow-a-shop, reorder, PWA install re-enable). Most of that **survives in `main` today** and is
correctly built. But two things happened since: (a) the **PWA install modal regressed** behind a
dev-only `?pwa=install` query gate — the single highest-ROI re-engagement channel is switched off
again; and (b) several investment surfaces the user *can* perform (follow a shop, opt-in as guest)
**dead-end** — the action is recorded but never produces a return trigger. The loop is built; it is
leaking at the activation seams.

---

## 2. Loop-stage status board (delta vs 06-09)

| Stage | Surface | 06-09 | Today (2026-06-19) | Evidence |
|---|---|---|---|---|
| **Trigger** | Web Push event-aiming | mis-aimed at confirmations | ✅ **FIXED** — payload is backend-driven; no client-side confirmation push; subscribe only on return-driving moments | `src/utils/webPush.ts`, `src/hooks/useWebPush.ts:59`, `src/app/sw.ts:128` |
| **Trigger** | PWA install banner | re-enabled | ❌ **REGRESSED** — `ModernInstallPrompt` + `PWAReminderBanner` gated behind `?pwa=install`; scoring engine runs but modal never renders | `src/providers/PWAProviderWrapper.tsx:17`, `src/components/pwa/ModernInstallPrompt.tsx:58-62` |
| **Trigger** | Contextual opt-in (PDP) | shipped | ✅ **LIVE** — `NotifyMeButton` on PDP forwards `notify_back_in_stock`/`notify_price_drop`/`target_price`; i18n'd | `src/components/products/NotifyMeButton.tsx:86-88`, PDP `:1999` |
| **Trigger** | Post-order push prompt | shipped | ⚠️ **LIVE but AR-only** — all 7 strings hardcoded Arabic, no `t()`, renders Arabic to EN/FR/ES/NL/DE users | `src/components/pwa/PostOrderPushPrompt.tsx:89-152` |
| **Trigger** | Opt-in discoverability | buried in Profile | ⚠️ **PARTIAL** — Profile toggle + post-order prompt; nothing on `/notifications` inbox (highest-intent surface) | `src/app/profile/components/PreferencesSettings.tsx:106` |
| **Action** | Guest COD Buy Now | strong | ✅ unchanged | — |
| **Reward** | Back-in-stock / price-drop | UI ready, no event | ✅ backend wired; cron `wishlist:send-notifications` **daily 10:00** (designed hourly) | KB [[concepts/beldify-retention-loop-closure]] |
| **Reward** | MegaOffer countdown chip | dormant | ❌ still dormant — needs per-product `ends_at` | KB [[concepts/beldify-dormant-features-activation]] |
| **Investment** | Wishlist (+notify flags) | exists, not wired | ✅ wired; guest localStorage + merge-on-login | `src/contexts/WishlistContext.tsx:153-198` |
| **Investment** | Wishlist guest→auth merge | n/a | ❌ **BUG** — merge drops `notify_*` + `target_price` (hardcodes false), silently killing the trigger for guests who opted in | `src/contexts/AuthContext.tsx:367-372` |
| **Investment** | Follow-a-shop | shipped | ⚠️ **DEAD-END** — follow/unfollow wired, but no followed-shops feed / new-drop rail anywhere → investment yields no return loop | `src/app/shops/[name]/FollowShopButton.tsx`, no feed |
| **Investment** | Reorder / Buy-it-again | shipped | ✅ on order list + detail; ⚠️ label is `i18n.language==='ar'?…:…` ternary, key `orders.actions.buy_again` missing | `src/app/orders/page.tsx:519-531`, `:[orderNumber]/page.tsx:779-793` |
| **Investment** | Recently-viewed | missing | ❌ still **zero code** — no tracking, no shelf | confirmed grep, whole `src/` |
| **Investment** | Save-for-later in cart | missing | ❌ still missing | `src/app/cart/page.tsx` |
| **Investment** | Saved address / express | missing | ✅ **PARTIAL** — auth users get default-address prefill; guests re-enter every time, no localStorage memory | `src/app/checkout/page.tsx:984-1005` |
| **Investment** | Review photos + verified badge | missing | ✅ **SHIPPED** — `ReviewForm` 5 photos + verified-buyer badge; ⚠️ order-detail inline review panel has no photo upload | `src/components/reviews/ReviewForm.tsx:21`, `ReviewCard.tsx:110` |

Net: of the 06-09 punch list, **6 items shipped and survive**, **1 regressed** (PWA modal), **2 ship
but with a correctness defect** (post-order i18n, reorder i18n), **1 has a silent data-loss bug**
(merge drops notify flags), and the **investment return-loops** (followed-shops feed, recently-viewed)
are still the weakest layer.

---

## 3. §6 Conversion / loop-closure punch list (this pass)

| Pri | Finding | Fix | Owner | Citation |
|---|---|---|---|---|
| **P0** | PWA install modal regressed behind `?pwa=install` dev gate — highest-ROI re-engagement channel off | Drop the query-param gate; let the (already-built) scoring engine + post-purchase trigger render the modal; keep 24h-dismiss + adaptive-threshold guards | frontend-engineer | `src/providers/PWAProviderWrapper.tsx:17-19`, `src/components/pwa/ModernInstallPrompt.tsx:58-62` |
| **P1** | Wishlist guest→auth merge drops `notify_*` + `target_price` → back-in-stock/price-drop trigger silently dies for guests who opted in | Forward the stored notify flags + target_price in the merge POST | frontend-engineer | `src/contexts/AuthContext.tsx:367-372`, `src/utils/guestWishlist.ts` |
| **P1** | `PostOrderPushPrompt` renders Arabic-only to all locales (7 hardcoded strings) | Add `post_order_push.*` keys ×7 locales; replace hardcoded JSX with `t()` | frontend-engineer | `src/components/pwa/PostOrderPushPrompt.tsx:89-152` |
| **P2** | Reorder label uses `i18n.language==='ar'` ternary; key `orders.actions.buy_again` missing | Add `orders.actions.buy_again` ×7 locales; replace ternary with `t()` | frontend-engineer | `src/app/orders/page.tsx:530`, `:[orderNumber]/page.tsx:793` |
| **P1** | Follow-a-shop is a dead-end investment (no followed-shops feed / new-drop rail) | Add followed-shops feed (home rail + `/profile/followed-shops`) off existing follow endpoints | full-stack | needs `GET /api/me/followed-shops/feed` |
| **P1/P2** | Recently-viewed: zero code; no personalization shelf | localStorage tracking on PDP + shelf on home + PDP "you viewed" | frontend-engineer | net-new |
| **P2** | MegaOffer countdown chip dormant | propagate per-product `ends_at` in offer responses | backend-engineer | KB [[concepts/beldify-dormant-features-activation]] |
| **P2** | Order-detail inline review panel has no photo upload (primary post-purchase touch point) | surface photo upload in the order-detail review path | frontend-engineer | `src/app/orders/[orderNumber]/page.tsx:271-308` |
| **P2** | Guest address not remembered between sessions | localStorage address memory for guests | frontend-engineer | `src/app/checkout/page.tsx` |
| **P3** | Push opt-in absent on `/notifications` inbox (highest-intent surface) | add a calm opt-in nudge there | frontend-engineer | `src/app/profile/components/PreferencesSettings.tsx` |

---

## 4. Implementation scope — this run (FE-only, surgical)

Selected for implementation now: the **P0 regression + P1 correctness bugs** — all edits to
existing files, no backend deploy needed, tractable verification. Net-new features (followed-shops
feed, recently-viewed) and backend-dependent items (MegaOffer countdown) are staged for a
follow-up full-stack packet to keep this run low-risk.

1. **[P0]** Re-enable PWA install modal (remove `?pwa=install` gate; keep guards).
2. **[P1]** Fix wishlist guest→auth merge to preserve notify flags + target_price.
3. **[P1]** i18n `PostOrderPushPrompt` (×7 locales).
4. **[P2]** i18n reorder "Buy it again" (`orders.actions.buy_again` ×7 locales).

Decision: implemented via a **single frontend-engineer dispatch (serialized in one tree)** rather
than parallel fan-out — items 3 & 4 both edit the 7 locale files, and parallel agents in a shared
tree risk the `git stash` revert hazard ([[memory: parallel-agents-shared-tree-stash-hazard]]).
Verification uses **scoped vitest only** (full-suite runs trip the 600s watchdog —
[[memory: orchestrator-stall-full-suite]]).

---

## 5. Ethics self-check (this pass)

```
[x] No shame language — post-order prompt is value-framed ("shipping updates")
[x] No fake urgency/scarcity — back-in-stock/price-drop remain real-event-gated
[x] PWA re-enable keeps 24h dismiss guard + adaptive threshold (no nag loop)
[x] No paywall on core habit — guest COD untouched
[x] Merge-flag fix RESTORES user intent (opposite of a dark pattern)
[x] Unsubscribe/mute remains one-tap per channel
[x] i18n fixes are correctness only — no new prompts, no added frequency
```

**Verdict: PASS** — every change either restores a regressed honest channel, fixes a silent
breakage of user-set intent, or corrects locale rendering. No new pressure mechanics introduced.

---

## Implementation log — 2026-06-19

Dispatched a single `frontend-engineer` (serialized, one tree) for the 4-item P0/P1 packet.

| Item | Pri | File:line | What changed | Ethics | Tests |
|---|---|---|---|---|---|
| 1. PWA install modal re-enabled | P0 | `providers/PWAProviderWrapper.tsx`, `components/pwa/ModernInstallPrompt.tsx:56` | Removed the `?pwa=install` dev-gate + `explicitOptIn` short-circuit; modal now surfaces via the scoring engine. Kept 24h-dismiss + adaptive-threshold + isInstalled + scroll-disabled guards (documented in JSDoc) | PASS | ✓ |
| 2. Wishlist guest→auth merge | P1 | `contexts/AuthContext.tsx:372-374`, `utils/guestWishlist.ts:39-46` | Merge now forwards `item.notify_back_in_stock / notify_price_drop / target_price` instead of hardcoding false — restores opt-in intent for guests | PASS (restores user intent) | ✓ |
| 3. PostOrderPushPrompt i18n | P1 | `components/pwa/PostOrderPushPrompt.tsx` | Added `useTranslation`; replaced 7 hardcoded Arabic strings with `t('post_order_push.*')` (×7 locales) | PASS (calm, value-framed) | ✓ |
| 4. Reorder label i18n | P2 | `app/orders/page.tsx`, `app/orders/[orderNumber]/page.tsx` | Replaced 6 `i18n.language==='ar'` ternaries with `t('orders.actions.buy_again')` (×7 locales) | PASS | ✓ |

**Verification:** scoped `hooked-loop-delta-2026-06-19.test.ts` 91/91 green; ESLint clean on all 7 changed files; §8.4 ethics grep clear; added copy reviewed (no shame/urgency/exclamation).

### Cross-session collision (resolved)
A concurrent Claude session committed an unrelated task (`4c3b2af` "marketplace FE+AI review P1 wave-1") onto this same branch + shared working tree via a blanket `git add -A`, sweeping this run's **locale-key additions** (`post_order_push.*`, `orders.actions.buy_again`) into *its* commit. No work was lost: locale keys live in `4c3b2af` (HEAD); the component edits that consume them were committed separately here. Lesson reinforced: [[parallel-agents-shared-tree-stash-hazard]] — never `git add -A` on a shared tree; stage explicit paths.

### Deferred (roadmap — not this run)
Followed-shops feed (P1, biggest remaining loop gap), recently-viewed shelf (P1), MegaOffer countdown activation (P2, needs backend per-product `ends_at`), order-detail photo review (P2), guest address memory (P2). See §3 punch list.
