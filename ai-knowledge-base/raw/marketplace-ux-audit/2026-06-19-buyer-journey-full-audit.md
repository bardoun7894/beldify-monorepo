# Beldify — Marketplace Buyer-Experience UX Audit

**Date:** 2026-06-19
**Auditor:** Senior Product Designer / UX Auditor / e-commerce Conversion Expert (marketplace-ux-audit skill)
**Method:** Orchestrated fan-out — 5 parallel `frontend-engineer` specialists (each loading the FE skill set: frontend-design, adapt, harden, optimize, audit, clarify, normalize) across the full buyer journey, plus an advisor cross-verification pass (Codex; Gemini CLI was attempted but its auth is revoked — see §Advisor).
**Target market (assumed, per KB):** Morocco · Arabic/Darija RTL primary (7 locales) · MAD currency · COD-dominant · guest checkout.

### Scope & assumptions (stated, not guessed)
- **Platforms present in the repo:** ONE buyer-facing codebase — the **Next.js 15 / React 19 web storefront** (`beldify-frontend/`), which ships as an **installable PWA with web push** (serwist). There is **no separate native mobile app** in this repo. Therefore "mobile app" findings below = the **mobile-web / PWA experience**; any true native-app gaps are out of scope and labelled `ASSUMED`.
- **No live screenshots or Figma were provided.** This audit is grounded in the **shipped code** (file:line cited). UI-rendering findings that would benefit from a live screenshot are labelled `VERIFY-LIVE`. Recommended next step: a `dogfood` pass on the running app to attach repro screenshots.
- **KB-grounded.** Findings reconcile against prior decisions: guest checkout/cart/wishlist, multi-seller order splitting (feature 014), payment-gateway state (backend complete, FE activates COD only), WhatsApp-never-checkout, Atlas design tokens. See `[[beldify-guest-checkout]]`, `[[beldify-guest-cart-unblocked]]`, `[[beldify-payment-gateway-state]]`, `[[beldify-design-tokens]]`, `[[beldify-tailwind-atlas-token-collision]]`.

---

## 1. Product verdict

Beldify's storefront is a **well-engineered, visually mature single-brand-feeling boutique that has not yet finished becoming a marketplace.** The craft is real: thorough RTL with logical properties, an installable PWA, multi-seller order splitting that degrades cleanly, indigo-tinted Atlas shadows, reduced-motion support, and genuinely good component structure. But the experience leaks **trust and conversion at every marketplace-defining moment.** A buyer cannot tell **who they are buying from** (no seller name/rating on cards or — adequately — on the PDP), the **trust badges are hardcoded fictions** ("Free returns", "Ships in 3 days", a fake shipping calculator), **shipping/delivery cost is hidden until the final step**, **guest checkout is silently blocked by an auth guard** despite the guest infrastructure being built, and **all toast feedback is disabled in production**. None of these are aesthetic problems — each maps to a measurable abandonment or distrust mechanism. The good news: the hardest parts (architecture, RTL, multi-seller plumbing, guest infra) are done. Most of the highest-impact fixes are **surfacing data that already exists** or **deleting a guard**, not new systems.

| Dimension | Score (1–10) | One-line justification |
|---|---|---|
| **UX clarity** | 6 | Clear typography and layout, but silent feedback (toasts off), broken review/anchor links, and a noisy home page below the fold. |
| **Trust** | **4** | Fake/static trust badges, no seller identity, no buyer-protection or refund SLA visible before buying — the weakest pillar. |
| **Conversion** | **4** | Guest checkout blocked, hidden shipping, COD-limit surprise at the end, silent add-to-cart — multiple compounding abandonment drivers. |
| **Mobile UX** | 6 | Strong RTL + sticky bars + safe-area; undermined by sub-44px targets, hover-only wishlist (dead on touch), and pinch-zoom disabled. |
| **Web UX** | 6 | Solid structure and componentization; held back by perf debt (Swiper/i18n in main bundle), nested `<main>` landmarks, `'use client'` overuse. |
| **Marketplace readiness** | **4** | Seller identity, seller-quality filters, and review trustworthiness — the three things that make a marketplace — are missing or weak. |

**Overall: 5/10 — functional but leaking conversion and trust; not yet "I'd confidently spend my own money here on mobile, first try."** The path to 8/10 is short and mostly about surfacing existing data + removing self-inflicted blockers.

---

## 2. Top strengths

1. **Multi-seller order splitting is architecturally sound.** Per-seller grouping in cart, per-seller quote breakdown at checkout, and per-seller order cards on confirmation all degrade correctly to single-seller mode (feature 014). This is the hard part of a marketplace and it's done well.
2. **RTL/i18n discipline is well above a typical Next.js project.** Logical CSS props (`ps-`/`pe-`, `start`/`end`), `rtl:rotate-180` on directional arrows, a dedicated `.currency-mad` LTR bidi boundary so MAD codes don't reverse inside Arabic text, and a graceful `fallbackLng` chain.
3. **The guest infrastructure exists end-to-end** — `localStorage` guest token → `X-Guest-Token` header → server-side merge-on-login, plus client-side guest wishlist with merge. The bugs are small (scope/guards), not architectural.
4. **PWA + Web Push, safe-area-aware sticky bars**, `env(safe-area-inset-bottom)` on cart/buy bars, and a 5-tab bottom nav that follows the AliExpress/Noon marketplace pattern.
5. **Thoughtful trust touches where they exist:** the "كيفاش نشري؟" (How to Buy) Darija sheet explaining COD with no card needed, WhatsApp support at the payment step (a strong Moroccan-market trust signal), and a confident "Buyer Guarantee" block on the order-confirmation page.

---

## 3. Top issues

> Severity reflects buyer impact (trust + abandonment), not code size. `P0` = fix immediately.

| # | Title | Platform | Area | Severity | Why it matters / buyer pain |
|---|---|---|---|---|---|
| **I1** | **Guest cart checkout is blocked by an auth guard** — `/checkout` is in `protectedRoutes`; unauthenticated users are redirected to `/login` despite the guest checkout code path existing | Web + Mobile-web | Checkout / Guest | **Critical (P0)** | The entire guest segment (the point of COD + guest infra) is bounced to a login wall. Direct, total conversion loss for first-time buyers. `AuthContext.tsx:830` + `:239–242`. |
| **I2** | **All toast feedback is disabled in production** — `<Toaster/>` is gated behind `isDebuggingEnabled()` which returns `false` in prod | Web + Mobile-web | Global a11y/UX | **Critical (P0)** | 190 `toast.*` calls (add-to-cart, login, errors) render nothing in prod. Buyers tap "Add to bag" and see no confirmation → repeat taps, doubt, abandonment. `layout-client.tsx:64`, `debugMode.ts:10`. |
| **I3** | **No seller identity on product cards (or home rails)** — cards show price/rating/stock but never the seller name, rating, or badge | Web + Mobile-web | Cards / Discovery | **Critical (P0)** | In a multi-seller market the buyer can't answer "who am I buying from?" The store reads as single-brand; atelier-reputation buyers leave for Instagram/WhatsApp. `ProductCard.tsx:57–73`, `FeaturedSections.tsx:9–33`. |
| **I4** | **Trust badges are hardcoded fictions** — "Free returns" + "Ships in 3 days" on every PDP regardless of seller; a fake cart "shipping calculator" with invented city rates | Web + Mobile-web | PDP / Cart trust | **Critical (P0)** | "Free returns" is a promise no seller has agreed to (return_policy is null) → disputes land on Beldify. The fake estimator contradicts the real checkout quote → buyer feels deceived. `products/[id]/page.tsx:2028–2040`, `ShippingCalculator.tsx:12–19`. |
| **I5** | **Filter options are hardcoded static arrays** — colors/sizes/fabrics don't reflect real inventory | Web + Mobile-web | Filters | **High** | Buyer filters "Silk" → 0 results (no seller tagged "Silk") → concludes the site has none and leaves. A false signal that manufactures abandonment. `ProductFilters.tsx:103–113`. |
| **I6** | **Shipping cost & delivery date are hidden until checkout** — absent on cards and PDP; "calculated at checkout" in cart | Web + Mobile-web | Cards / PDP / Cart | **High** | Unknown shipping cost is the #1 global cart-abandonment cause; for COD Morocco, "when does it arrive / what does delivery cost" is decisive. Surfaced only at the last step = surprise drop-off. |
| **I7** | **No seller-quality filters** — no "min seller rating", no "verified sellers only", no city/location, no delivery-time | Web + Mobile-web | Filters | **High** | The primary way to compare on a marketplace (seller quality, locality, speed) is impossible. Buyers burned before have no tool to avoid low-quality sellers. `ProductFilters.tsx`. |
| **I8** | **COD-limit surprise** — COD is silently disabled over 500 MAD, revealed only as a greyed-out option at the payment step | Web + Mobile-web | Payment | **High** | A buyer planning to pay cash discovers at the final step they can't, and must restart with a bank transfer they didn't prepare. Late-stage abandonment in the most COD-dependent market. `checkout/page.tsx:376–383`. |
| **I9** | **Pinch-to-zoom disabled** — `userScalable:false` / `maximumScale:1` | Web + Mobile-web | Global a11y | **High (P0-a11y)** | WCAG 1.4.4 violation; low-vision and older buyers (a real Moroccan demographic) cannot enlarge text/price/specs. `layout.tsx:106`. |
| **I10** | **No "Message Seller" or self-service return from the order** — post-sale support routes only to platform WhatsApp; guests can't return at all | Web + Mobile-web | Post-purchase | **High** | Buyer with a delayed/wrong made-to-order item can't reach the seller in-app; guests who paid COD have zero self-service return path → chargebacks + WhatsApp flooding. `orders/[orderNumber]/page.tsx:480`, `returns/page.tsx:124–148`. |
| **I11** | **Reviews aren't trustworthy** — any logged-in user can review without a purchase; no seller replies; the PDP star link scrolls to a hidden tab | Web + Mobile-web | Reviews | **High** | Fake-review exposure erodes the "Verified buyer" badge's meaning; the broken star→reviews anchor kills social-proof seekers at the moment of intent. `types/review.ts:1–17`, `products/[id]/page.tsx:1603`. |
| **I12** | **Online gateway methods (PayPal/Card) shown as functional but don't charge** | Web + Mobile-web | Payment | **High** | Buyer "pays" by card, gets a confirmation, card is never charged, then ignores the transfer step → unpaid orders + confusion. `checkout/page.tsx:346–354, 597–604`. |
| **I13** | **Mobile wishlist is hover-only (dead on touch); several touch targets < 44px** | Mobile-web | Cards / Nav | **Medium-High** | Browse-mode buyers can't save items on mobile (lost re-engagement); 36–38px targets cause mis-taps on the primary add-to-cart and navbar icons. `ProductCard.tsx:234–255, 311`, `Navbar.tsx:544–579`. |
| **I14** | **Dark mode is broken & DESIGN.md is not enforced** — 525 raw `gray-*` utilities bypass Atlas tokens; `font-heading` defined but unused (175 inline Playfair styles) | Web + Mobile-web | Theming | **Medium** | Dark-mode text/borders render invisible or flash; design drift makes future re-theming a 175-site manual edit. `Navbar.tsx:271`, `globals.css:374`, DESIGN.md §Typography. |
| **I15** | **Performance debt on the LCP path** — Swiper + all 7 locale JSONs + framer-motion in the main bundle; spinner (not skeleton) Suspense fallbacks cause CLS | Web + Mobile-web | Perf | **Medium** | Slower first paint on 3G (the realistic Moroccan mobile network), layout shift on the homepage. `HeroSection.tsx:6`, `i18n/config.ts:13–19`, `HomeContent.tsx:348`. |

---

## 4. Improvement recommendations

| # | Title | Platform | Issue | Exact UI/UX change | Why it lifts conversion/trust | Effort | Impact | Priority |
|---|---|---|---|---|---|---|---|---|
| R1 | Unblock guest checkout | Web+MW | I1 | Remove `'/checkout'` from `protectedRoutes` (`AuthContext.tsx:830`); the checkout page already handles unauthenticated users. Broaden `X-Guest-Token` to `/api/orders*` (`api.ts:53`). Add guest-cart merge after **register** (not just login). | Recovers the entire guest segment — the reason guest infra + COD exist. | **Low** | **High** | **P0** |
| R2 | Turn the Toaster back on | Web+MW | I2 | Render `<Toaster/>` unconditionally (RTL-aware position); drop the `isDebuggingEnabled()` gate. | Restores add-to-cart / error / login feedback → fewer repeat taps and abandonments. | **Low** | **High** | **P0** |
| R3 | Put the seller on every card | Web+MW | I3 | Add `shop_name`/`shop_slug`/`shop_rating` to the product shape; render a tappable seller chip + mini-stars under the product name on `ProductCard` and all `FeaturedSections` rails. (Needs API to include the fields.) | Establishes "who am I buying from" at the first comparison surface — the core marketplace trust anchor. | **Med** | **High** | **P0** |
| R4 | Make trust signals real | Web+MW | I4 | Replace hardcoded PDP pills with `shop.profile.return_policy`/`shipping_policy` (or a neutral "See shop policy" link when null). Delete the fake `ShippingCalculator`; replace with the real `/api/orders/quote` value or a "from X MAD · confirmed at checkout" label. | Removes a legal/financial liability and a deception that breaks trust at the decision moment. | **Low–Med** | **High** | **P0** |
| R5 | Wire filters to real facets + add seller-quality filters | Web+MW | I5,I7 | Replace hardcoded color/size/fabric arrays with API facet values; add "Min seller rating", "Verified sellers only", "City/Region", and "Delivery time" filters. | Stops false-zero abandonment; gives buyers the marketplace comparison tools they expect. | **Med** | **High** | **P1** |
| R6 | Surface shipping + delivery early | Web+MW | I6 | Add a delivery line to cards ("Free delivery" / "Delivery 30–50 MAD" / "Made to order · 2–4 wk"); show shipping + ETA on the PDP and per-seller in the cart (call the quote on cart load). | Kills the #1 abandonment cause (shipping surprise) and sets COD expectations. | **Med** | **High** | **P1** |
| R7 | Warn about the COD limit early | Web+MW | I8 | In the cart `OrderSummaryCard`, when total > COD max, show "Over 500 MAD — cash on delivery unavailable; bank transfer required." Use the backend `cod_max`, not a hardcoded 500. | Prevents the late-stage "I can't pay cash" restart. | **Low** | **Med-High** | **P1** |
| R8 | Restore pinch-zoom | Web+MW | I9 | Remove `maximumScale`/`userScalable` from `generateViewport()` in `layout.tsx`. | WCAG 1.4.4 compliance; serves low-vision + older buyers. | **Low** | **Med** | **P1** |
| R9 | Open a post-sale seller channel + self-service returns | Web+MW | I10 | Add a per-sub-order "Message [Seller]" button (carry `order_ref`); add a guest return path (order # + email); make returns **item-level**; show a real refund SLA + method. | Retains buyers, cuts chargebacks/WhatsApp load, protects the COD guest segment. | **Med-High** | **High** | **P1** |
| R10 | Make reviews trustworthy | Web+MW | I11 | Gate "Write a review" behind a completed order (`orderId` required); add seller replies; fix the star link to `setActiveTab('reviews')` + scroll. | Protects social proof — the single biggest on-site conversion lever for unfamiliar sellers. | **Med** | **High** | **P1** |
| R11 | Fix/hide non-charging payment methods | Web+MW | I12 | Hide PayPal/Card until live, or badge them "Online payment coming soon — order placed as awaiting payment." | Stops unpaid-order confusion. | **Low** | **Med** | **P1** |
| R12 | Mobile wishlist always visible + 44px targets | MW | I13 | Show the wishlist heart persistently on mobile cards; bump add-to-cart and navbar icons to `min 44×44px`. | Recovers mobile save-for-later re-engagement; fewer mis-taps. | **Low** | **Med** | **P1** |
| R13 | Theme/token normalization sweep | Web+MW | I14 | Replace readable `text-gray-*`/`bg-gray-*` with `text-foreground`/`bg-muted` etc.; replace 175 inline Playfair styles with `font-heading`. | Unbreaks dark mode; makes the Atlas system enforceable. | **Med** | **Med** | **P2** |
| R14 | LCP/bundle trims | Web+MW | I15 | Dynamic-import Swiper; lazy-load locale JSON via the already-installed `i18next-http-backend`; replace spinner Suspense fallbacks with shape-correct skeletons. | Faster first paint on 3G, less CLS → lower bounce. | **Med** | **Med** | **P2** |

---

## 5. Quick wins (fast, high-impact)

1. **Delete `'/checkout'` from `protectedRoutes`** — one line, unblocks all guest checkout (I1).
2. **Remove the `isDebuggingEnabled()` gate on `<Toaster/>`** — one line, restores all buyer feedback (I2).
3. **Remove `userScalable:false`** — one line, WCAG pinch-zoom fix (I9).
4. **Pre-fill the WhatsApp support link** with `?text=Order%20%23{orderNumber}:%20` — instant support friction drop.
5. **Make the tracking number a carrier deep-link** instead of un-tappable mono text.
6. **Delete "Free returns" pill** (or swap for "See return policy") — removes a false promise/liability today.
7. **Fix the PDP star link** to open the Reviews tab (`setActiveTab('reviews')`) instead of scrolling to a hidden panel.
8. **Add `rtl:rotate-180`** to the `CartMobileBar` arrow (currently points the wrong way in Arabic).
9. **Add the missing 5 German i18n keys** (checkout/order-confirmation) so DE buyers don't see English mid-checkout.
10. **Bump `ProductCard` add-to-cart + mobile navbar icons to 44×44px** — fewer mis-taps on the primary CTA.

---

## 6. Deep improvements (strategic, marketplace-quality)

1. **Seller-identity layer end-to-end** — seller chip + rating + verified badge on cards, PDP, cart, and checkout, all reading one consistent source. The backbone of marketplace trust.
2. **Real shipping & delivery engine surfaced everywhere** — per-seller quote on cards/PDP/cart, ETA with carrier, so cost/timing is never a checkout surprise.
3. **Seller-quality comparison tools** — min-rating filter, verified-only, city/region, delivery-time, plus a category "N verified sellers · price range" header.
4. **Trustworthy review system** — verified-purchase gating, seller replies, photo reviews, "12 days left to review" prompts, and prominent AI-summary disclosure.
5. **Self-service post-sale** — order-scoped seller messaging, item-level + guest returns, a structured dispute/escalation flow with a ticket reference and refund SLA.
6. **Order tracking that tells the truth** — real-time status (push-invalidate the 5-min cache), carrier links, per-seller sub-order status (stop the `any`-cast default-to-pending).
7. **Retention loop activation** — wishlist price-drop / back-in-stock toggles (the API + notification types already exist but have no UI), and a post-order "enable notifications" prompt at the permission sweet spot.
8. **Trust strip above the fold** — move buyer-protection/returns/COD reassurance from the page bottom to just under the hero.
9. **Dark-mode + token enforcement** — migrate gray utilities to Atlas semantic tokens; adopt `font-heading`; add a lint rule so drift can't return.
10. **Performance budget** — RSC-ify static content pages, dynamic-import heavy client deps (Swiper/framer), lazy locale loading; target measurable LCP/CLS/INP (confirm with a Lighthouse pass — hand to `optimize` / `vercel-react-best-practices`).

---

## 7. Marketplace trust review

- **Seller badges / identity:** ❌ **Absent on cards and home rails**; ⚠️ thin on PDP (name + unexplained "Verified" check, **no rating/sales/response-time**). Inconsistent: shop page computes a rating the PDP never shows. This is the audit's #1 theme.
- **Ratings & reviews:** ⚠️ Product rating shows; **distribution + verified-purchase + photos exist** but **anyone can post without buying**, **sellers can't reply**, and the **star→reviews link is broken**. Trust scaffolding present but undermined.
- **Refund / return visibility:** ❌ **Not findable before buying.** PDP "Free returns" is fake; the returns page has placeholder copy with **no SLA, no method, no item-level flow**, and is **blocked for guests**.
- **Secure-checkout reassurance:** ⚠️ COD is well-explained in a sheet (2 taps away) but **invisible above the fold**; no "secure payment" signal staged for when card payments activate; **toasts that would confirm actions are off in prod**.
- **Delivery clarity:** ❌ **No cost or date** on cards/PDP; **fake estimator** in cart; ETA only if the API happens to return it (no fallback).
- **Dispute / help access:** ⚠️ Generic contact form (**no order-number field**) + platform WhatsApp only; **no seller contact from the order**, **no structured dispute flow**, **no ticket reference**.

**Net:** the marketplace *looks* trustworthy (badges, guarantees, polish) but several of those signals are **decorative or false**, which is worse than absent once a buyer is burned once.

---

## 8. Conversion review (where the funnel leaks)

- **Discovery:** Home buries shoppable product rails under ~3 editorial sections; seller-anonymous cards prevent fast comparison; mobile search is hidden behind an icon tap. → buyers can't quickly find or trust what to compare.
- **Product comparison:** No seller, no shipping, no delivery on cards; hardcoded filters return false-zeros; no seller-quality/location/speed filters. → comparison is effortful and sometimes misleading, so buyers bounce to PDPs one-by-one or leave.
- **Cart:** Fake shipping estimator vs. real quote mismatch; per-seller shipping unknown; a 500-error silently shows an **empty cart**; COD-limit not flagged here. → uncertainty + "did my cart just vanish?" abandonment.
- **Checkout:** **Guest users redirected to login (the biggest leak)**; "Full name" single field silently fails last-name validation; submit-time errors fire as **3-second toasts that are off in prod** (so the form looks broken with no message); shipping/ETA surprise; non-charging gateway methods. → high drop-off precisely where intent is highest.
- **Likely top abandonment causes (ranked):** (1) guest login wall; (2) silent feedback (toasts off) making actions feel broken; (3) shipping/delivery + COD-limit surprises; (4) "who am I buying from?" trust gap; (5) false-zero filters.

---

## 9. Platform consistency review

- **Only one buyer codebase exists** (Next.js web + PWA), so "app vs web" parity is **not** the issue — **internal consistency** is.
- **Stronger areas:** order-confirmation (trust copy, multi-seller cards), the How-to-Buy COD sheet, RTL handling, sticky mobile bars.
- **Weaker / inconsistent areas:** seller info differs by surface (absent on cards, partial on PDP, computed-but-unshown on shop page); **two filtering implementations** (`/products` uses SWR + URL state; `/categories/[slug]` does a full axios reload that blanks the grid); **two validation systems** in checkout (inline `validateField` vs toast-only `validateShippingInfo`); **two token systems** (raw gray/indigo utilities vs Atlas CSS vars).
- **What to standardize:** (1) one product-card component that always renders seller + shipping; (2) one filtering/data pattern (SWR + `keepPreviousData`, never blank the grid); (3) one form-validation path (inline errors on submit); (4) one token layer (Atlas semantic tokens + `font-heading`); (5) one trust-signal source (real seller policy data, never hardcoded).

---

## 10. Final action plan

### P0 — fix immediately (this week; mostly one-liners or surfacing existing data)
- **R1** Remove `/checkout` from `protectedRoutes` + broaden guest token + merge-on-register. *(I1)*
- **R2** Un-gate `<Toaster/>` so buyer feedback renders in prod. *(I2)*
- **R3** Add seller name + rating to product cards & home rails (FE render; needs API fields). *(I3)*
- **R4** Replace hardcoded PDP trust pills + fake cart shipping estimator with real data / honest labels. *(I4)*
- **R8** Remove `userScalable:false`. *(I9)*
- Quick wins **#4–#8** (WhatsApp prefill, tracking deep-link, delete "Free returns", fix star→reviews link, RTL cart arrow).

### P1 — next sprint
- **R5** Real facet filters + seller-rating/verified/city/delivery-time filters. *(I5,I7)*
- **R6** Shipping cost + delivery ETA on cards/PDP/cart. *(I6)*
- **R7** Early COD-limit warning in the cart (from backend `cod_max`). *(I8)*
- **R9** Post-sale seller messaging + guest + item-level returns + refund SLA. *(I10)*
- **R10** Verified-purchase review gating + seller replies. *(I11)*
- **R11** Hide/label non-charging gateway methods. *(I12)*
- **R12** Mobile-persistent wishlist + 44px targets. *(I13)*
- Fix "Full name"→first/last; unify checkout validation to inline errors; add missing DE i18n keys; add category breadcrumb + "N sellers · price range".

### P2 — later
- **R13** Token/dark-mode normalization sweep + `font-heading` adoption. *(I14)*
- **R14** LCP/bundle trims (dynamic Swiper, lazy locales, skeleton fallbacks). *(I15)*
- RSC-ify static content pages; mobile-persistent search input; subcategory images + slug URLs; receipt-upload size/format hints + progress; profile "My Orders" entry; reorder reprice warning.

---

## Advisor cross-verification

Two external advisors were attempted and **both CLIs were unavailable**, so a reliable **internal `reviewer` agent** performed the adversarial verification against ground-truth files:
- **Gemini CLI: dead** — auth revoked (`IneligibleTierError: client no longer supported for Gemini Code Assist for individuals`).
- **Codex CLI: no usable output** — `codex exec` blocked reading stdin and returned empty.
- **`reviewer` agent (used): all five flagged claims CONFIRMED**, with nuances that tighten two findings and one **new buyer-blocking bug** the fan-out missed.

### Verdicts (cold read of the cited files)

| Claim | Verdict | Evidence | Nuance |
|---|---|---|---|
| **I1** Guest checkout blocked | ✅ **CONFIRMED** | `AuthContext.tsx:830` (`'/checkout'` in `protectedRoutes`) + `:239–242` (redirect to `/login`) | The redirect fires from `handleAuthError`, which runs for a **stale/expired token** — a **true first-time guest (no token) is NOT redirected here** (no-token branch `:117–122` skips it), so the `/checkout` page's **own** guard is the blocker for them. Either way the guest path is broken/fragile. No `?buyNow=` bypass in this file. |
| **I2** Toasts off in prod | ✅ **CONFIRMED** | `layout-client.tsx:64` gate + `debugMode.ts:15` (`NODE_ENV==='production' → false`) + domain guard `:21` | Even `?debug=1` can't re-enable it in a prod build (the `NODE_ENV` check returns before the URL-param escape hatch). All `toast.*` are swallowed. |
| **I3** No seller on cards | ✅ **CONFIRMED** | `ProductCard.tsx:57–73` destructure has no shop/seller field; JSX `:158–348` renders zero seller attribution | `shop_name` *may* exist on the `Product` type but is neither destructured nor rendered. |
| **I5** Hardcoded filters | ✅ **CONFIRMED** | `ProductFilters.tsx:103–113` static arrays; only `facets.stores`/`facets.verticals` are read, never `facets.colors/sizes/fabrics` | Structural root cause: those facet fields are typed `unknown[]` (`:33–35`), so there's no typed shape to iterate — fix requires typing them like `FacetStore`/`FacetVertical`. |
| **I9** Pinch-zoom disabled | ✅ **CONFIRMED** | `layout.tsx:100–108` sets both `maximumScale:1` **and** `userScalable:false` | Exact match; WCAG 1.4.4. |

### New / refined findings from the advisor

- **🆕 I16 (High) — "Add to cart" can give fake success with no cart mutation.** In `ProductCard.tsx:111–119`, when **no `onAddToCart` prop** is passed, the fallback shows `toast.success('addedToCart')` after a 600 ms timeout **without any API call or cart dispatch** — the buyer is told it worked, but the item is never added. (Compounds I2: in prod the toast is also invisible, so the buyer gets *neither* feedback *nor* a cart change.) **Fix:** make `onAddToCart` required, or wire a real default cart dispatch. **P1.**
- **🆕 I17 (Medium, privacy) — PII in debug toasts.** `AuthContext.tsx:249,383,…` call `toast.debug("...email: ${email}...")`. On any non-prod/staging build that mounts the Toaster, a user's email is shown in a visible toast. **Fix:** strip PII from `toast.debug` strings. **P2.**
- **Refinement to I1:** verify the `/checkout` page's own `isAuthenticated` guard (not just `protectedRoutes`); the cleanest fix removes `/checkout` from `protectedRoutes` **and** ensures the page renders the guest flow instead of self-redirecting.
- **Refinement to I5:** add `FacetColor/FacetSize/FacetFabric` interfaces (replace `unknown[]`) so the facet data can actually be wired — the typing is *why* it was left hardcoded.

**Confidence:** the five highest-severity findings are verified against current code — none were false positives. The audit's P0 list stands.

---

### Provenance
Produced by `marketplace-ux-audit` via orchestrated fan-out of 5 `frontend-engineer` specialists (Discovery, PDP/Seller-trust, Cart/Checkout, Post-purchase, Cross-cutting-technical) + Codex advisor. All file:line references are from `beldify-frontend/` at commit on branch `main` (2026-06-19). Read-only audit — no product code was modified.

**Next:** run `/kb-ingest` to promote this to a queryable KB source. To implement, route storefront changes through `beldify-ecommerce-ui` → orchestrator (Atlas tokens, RTL, MAD) — this audit stops at the report.
