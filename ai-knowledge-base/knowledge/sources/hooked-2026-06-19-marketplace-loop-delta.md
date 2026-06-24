---
name: Hooked Audit (Delta) — Beldify Marketplace Loop, 2026-06-19
description: Delta Hooked audit ten days after the 06-09 pass — 6 packets survived, the PWA install modal regressed (P0), the wishlist merge silently dropped notify flags (P1), and two i18n correctness bugs; all four fixed and committed (19e13cb)
type: source
sources: [raw/hooked/2026-06-19-marketplace-loop-delta.md]
created: 2026-06-19
updated: 2026-06-19
---

# Hooked Audit (Delta) — Beldify Marketplace Loop, 2026-06-19

## Summary
A delta Hooked-model audit re-checked Beldify's marketplace return loop against `main` ten days
after the 2026-06-09 pass. The loop is **half-closed**: of the 06-09 fan-out's five packets, six
surfaces survive and work, but the activation seams leak. The audit found one P0 regression (the
PWA install modal switched off again behind a dev-only `?pwa=install` gate), one P1 silent bug (the
wishlist guest→auth merge hardcoded the back-in-stock / price-drop notify flags to false), and two
i18n correctness defects (`PostOrderPushPrompt` rendered Arabic-only to every locale; the reorder
label used `i18n.language` ternaries). All four were fixed, verified, and committed as `19e13cb` on
branch `feat/hooked-2026-06-19-loop-delta`. The ethical thesis is unchanged: never push without a
real event; ethical engagement is the conversion engine.

## Key points
- **Survived from 06-09**: web push correctly re-aimed (no client-side confirmation spam), contextual
  PDP opt-in (`NotifyMeButton` forwards notify flags + target_price), follow-a-shop wiring, reorder,
  wishlist + notify, review photos + verified-buyer badge, auth address prefill.
- **P0 regression — fixed**: `PWAProviderWrapper`/`ModernInstallPrompt` gated the install modal behind
  a `?pwa=install` query param so it never rendered in production; the scoring engine ran for nothing.
  Fix removed the gate and the `explicitOptIn` short-circuit while keeping the 24h-dismiss,
  adaptive-threshold, isInstalled, and scroll-disabled guards.
- **P1 bug — fixed**: `AuthContext` guest→auth wishlist merge sent `notify_price_drop: false` /
  `notify_back_in_stock: false`, silently killing the trigger for guests who opted in pre-login; now
  forwards the stored `item.notify_* ?? false` and `target_price ?? null` (and `guestWishlist.ts`
  persists those fields).
- **i18n — fixed**: added `post_order_push.*` (×7 locales) and `orders.actions.buy_again` (×7 locales);
  replaced 7 hardcoded Arabic strings and 6 language-ternaries with `t()` calls.
- **Still the weakest layer (deferred)**: followed-shops feed and recently-viewed shelf — both are
  investment actions with no return loop. MegaOffer countdown chip remains dormant (needs backend
  per-product `ends_at`).
- **Process note**: a concurrent Claude session committed an unrelated task (`4c3b2af`) onto the same
  branch + shared working tree via a blanket `git add -A`, sweeping this run's locale-key additions
  into its commit — no work lost; reinforces commit-the-deliverable-on-return discipline.
- **Verification**: scoped `hooked-loop-delta-2026-06-19.test.ts` 91/91 green, ESLint clean, ethics
  grep clear, added copy calm/value-framed.

## See also
- [[sources/hooked-2026-06-09-opensouk-marketplace-loop]]
- [[concepts/beldify-retention-loop-closure]]
- [[concepts/beldify-dormant-features-activation]]
