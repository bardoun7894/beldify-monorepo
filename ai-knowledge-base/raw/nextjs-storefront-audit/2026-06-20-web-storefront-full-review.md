---
title: Beldify Next.js Web Storefront — Frontend + CRO Audit
date: 2026-06-20
skill: nextjs-storefront-audit
scope: beldify-frontend/ (Next.js 15 App Router, React 19, SWR, Tailwind/Atlas, Arabic-RTL, MAD)
branch: feat/hooked-2026-06-19-loop-delta
method: code-grounded (3 Explore agents + direct recon + /kb-query); no live URL/screenshots supplied
assumptions: Market = Morocco / MAD / Arabic-first RTL; audience = mainstream mobile-first shoppers; audited SHIPPED code on the current branch, not staging
---

# Beldify Web Storefront — Frontend + CRO Audit (2026-06-20)

> Evidence basis: read of `beldify-frontend/src` (App Router). Every finding carries a `file:line`.
> No staging URL or screenshots were provided — visual-only judgments are marked `ASSUMED`. All
> code-level findings are verified against source on branch `feat/hooked-2026-06-19-loop-delta`.

---

## 1. Frontend verdict

Beldify's web storefront is a **well-engineered front end sitting on a leaky conversion funnel.** The craft is real: `next/image` is used almost everywhere (56 import sites vs 7 raw `<img>`, and those 7 are test mocks or blob-preview uploads), LCP images carry `priority`, RTL uses logical properties throughout, the homepage is a proper Server Component with ISR (`revalidate = 60`, `src/app/page.tsx:9`), mobile sticky buy-bars respect `safe-area-inset`, empty/error states are polished, and the Atlas design language is coherent. But the buyer-trust and conversion layers have holes that a real shopper hits in the first session: **checkout is currently blocked for guests by a validation for a "last name" field that the form never renders** (a confirmed P0), the **product grid shows no seller identity at all** (a core marketplace failure), and the homepage **stamps a hardcoded "Verified" badge on every atelier** regardless of any real flag (a deceptive trust signal). The build is modern and fast; the funnel is not yet safe to scale. Fix the P0 today and the trust gaps this sprint, and this jumps two bands.

| Dimension | Score | One-line basis |
|---|---|---|
| **Frontend quality** | **7 / 10** | Strong image/RTL/ISR engineering; held back by 3 forked product cards, dead code, spinner-only loading in places |
| **UX clarity** | **6 / 10** | Good PDP hierarchy & filters; but "Full name" field secretly needs a last name, mobile search has no typeahead |
| **Trust** | **5 / 10** | No seller identity on listing cards; fake hardcoded "Verified" on ateliers rail; PDP/cart/checkout pills are good |
| **Conversion readiness** | **4 / 10** | **P0 checkout blocker** + guest-coupon dead-end + stale cart totals + no sticky checkout CTA on mobile |
| **Responsiveness** | **8 / 10** | Genuine strength: mobile sticky bars, safe-area, min-44 targets, mobile filter drawer, snap rails |
| **Marketplace readiness** | **5 / 10** | Funnel mechanics (guest COD, returns, free-ship threshold) present; seller identity + comparison + honest badges missing |

---

## 2. Top strengths

1. **Image optimization is done right.** `next/image` with correct `fill`/`sizes`/`priority` across PDP gallery (`src/app/products/[id]/page.tsx:1443,1507`), product cards (`ProductCard.tsx:206-214`), homepage rails, and wishlist. LCP image is prioritized on hero (`HeroSection.tsx:87`, `ProductHeroSlides.tsx:189`). Only 7 raw `<img>` in the whole tree, all justified (blob previews / test mocks / one external Contabo illustration).
2. **RTL is largely first-class.** Logical properties (`ms-/me-/ps-/pe-/start-/end-`) used throughout; `rtl:rotate-180` on directional arrows; `dir="auto"` on description text (`page.tsx:1699`); `.currency-mad` keeps MAD prices LTR on PDP/cart/checkout. Only **2** physical-margin leaks remain in the core storefront components.
3. **Mobile conversion ergonomics.** Sticky `PdpBuyBar` and `CartMobileBar` are `fixed bottom-0` with `env(safe-area-inset-bottom)` and `min-h-[48px]` targets (`PdpBuyBar.tsx:51,77`; `CartMobileBar.tsx:32,57`); `MobileBottomNav` has 48px targets, safe-area padding, and `aria-current` (`MobileBottomNav.tsx:95,110,118`).
4. **Empty & error states are polished, not afterthoughts.** Atlas-styled `error.tsx` (retry + digest + support) and `not-found.tsx` (RTL-aware), plus genuinely good empty states for wishlist, orders, zero-filter orders, PLP zero-results (`NoSearchResults` with "did you mean" + popular chips + Open Souk cross-link), and returns.
5. **AI surfaces are honest and well-placed at the decision moment.** `SizeAdvisorSheet` sits directly under the size selector, shows a confidence label, and **never auto-selects** (`page.tsx:1829`; `SizeAdvisorSheet.tsx:91-102`); `AiReviewSummaryCard` returns null below threshold (no fabricated social proof); try-on is guest-accessible and throttled. This is ethical AI UX, not gimmickry.

---

## 3. Main frontend problems

### P0-A — Guest checkout is blocked by a missing "last name" field
- **Page/flow:** Checkout → delivery step → place order
- **Severity:** **Critical**
- **What is wrong:** The delivery form renders a single "Full name" input bound only to `firstName` (`src/app/checkout/page.tsx:1446-1465`). `handleShippingChange` just does `[name]: value` with **no full-name splitting** (`:287-292`). But submit-validation hard-requires `lastName.trim().length >= 2` (`:625-628`) and posts `last_name` (`:697`). There is **no `lastName` input anywhere** in the form.
- **Why it matters:** Guests start with `lastName: ''` (`:131`) → validation fails → `toast.error('last_name_required')` → order cannot be placed. Authenticated users only escape if `user.last_name` exists (`:266`); single-token names also fail (`:270`).
- **User frustration:** Sees an error about a "last name" with no last-name field on screen. Unfixable from the UI. Classic rage-quit.
- **Business impact:** Blocks the **primary documented funnel** (guest COD). Every guest order attempt with a one-word entry fails. Direct, total revenue loss on the affected segment.

### P1-B — Product listing cards show no seller identity
- **Page/flow:** PLP / category grid / homepage rails
- **Severity:** **High**
- **What is wrong:** `ProductCard.tsx` contains **zero** `shop`/`store`/`seller` references (grep count: 0). No shop name, no seller link, no verified badge on the card.
- **Why it matters:** On a multi-seller marketplace the buyer must know *who* they're buying from before they click. Beldify hides it until the PDP.
- **User frustration:** Can't compare sellers in the grid; can't tell a trusted atelier from an unknown one.
- **Business impact:** Suppresses seller differentiation and trust at the exact comparison moment; weakens the marketplace flywheel (good sellers can't stand out in listings). *(Note: the KB recorded this as "fixed 06-19" — that was a recommendation in the review doc, not shipped code on this branch.)*

### P1-C — Hardcoded "Verified" badge on every atelier
- **Page/flow:** Homepage → ateliers rail
- **Severity:** **High**
- **What is wrong:** `HomeContent.tsx:681-685` stamps `<BadgeCheck/> {t('shop.verified','Verified')}` on every atelier card with **no conditional** on any `a.verified` / `is_verified` flag.
- **Why it matters:** A verification badge that everyone gets is not a trust signal — it's a deceptive one. The 06-19 fix gated this on product cards/PDP but **missed the homepage rail.**
- **User frustration:** Erodes credibility the moment a buyer realizes the badge is meaningless (or worse, after a bad experience with a "Verified" seller).
- **Business impact:** Trust-signal inflation undermines the value of *real* verification; reputational and potentially consumer-protection risk.

### P1-D — Cart-path checkout uses stale client totals instead of a server quote
- **Page/flow:** Cart → checkout (authenticated cart path)
- **Severity:** **High**
- **What is wrong:** The buy-now path fetches a server quote (`:951-979`), but the cart path uses `cartState.total_amount` / `cartState.shipping_amount` directly (`:1030-1044`). If CartContext is stale, the displayed total diverges from the backend's computed order total.
- **Why it matters:** Price shown ≠ price charged is a trust and dispute landmine, and can surface as a confusing 422 at the last step.
- **User frustration:** "The total changed at the end."
- **Business impact:** Abandonment at the final step; chargeback/dispute exposure; support load.

### P1-E — No route-level `loading.tsx` anywhere; client-rendered conversion routes
- **Page/flow:** PDP, category, cart, checkout, wishlist, orders, profile
- **Severity:** **High**
- **What is wrong:** `find src/app -name loading.tsx` → **zero results.** And PDP, `category/[slug]`, cart, checkout, wishlist are all `'use client'`. Hard navigation to these routes shows a blank shell until JS hydrates and the client fetch resolves. No App Router Suspense streaming is used.
- **Why it matters:** First paint on the most-trafficked, most-indexable pages (PDP, category) is empty; perceived speed suffers and SEO leans on metadata only (and `category/[slug]` has **no `generateMetadata`** at all — content invisible to crawlers).
- **User frustration:** Tap a product → blank → pop. Feels slow even when the network is fine.
- **Business impact:** Higher bounce on PDP/category; weaker organic discovery for category landing pages (a primary acquisition surface).

### P2-F — Three forked product cards drifting apart
- **Page/flow:** Listings everywhere
- **Severity:** **Medium**
- **What is wrong:** `ProductCard`, `TraditionalProductCard`, `MegaOfferProductCard` are copy-pasted, not composed. `TraditionalProductCard` lacks the `onError` image fallback, uses a `<div>` not `<article>`, has a sub-44px add-to-cart target, and its quick-action slide has no `rtl:` variant (slides in from the wrong side). `MegaOfferProductCard` mutates `e.target.src` directly (hydration risk), omits `.currency-mad`, and has no `aria-label`. `showShopInfo` is a dead prop.
- **Why it matters:** Inconsistent trust signals (free-ship badge, rating, countdown appear on some cards, not others), inconsistent a11y, and triple maintenance.
- **User frustration:** Subtle inconsistency; broken images on traditional cards.
- **Business impact:** Slows every future card change ×3; inconsistent merchandising signals.

### P2-G — Jewelry PDPs show an inoperative Try-On button
- **Page/flow:** PDP (jewelry vertical)
- **Severity:** **Medium**
- **What is wrong:** `TryOnModal` is gated `!isJewelry` (`page.tsx:2397`) but `TryOnButton` is gated only on `tryOnHidden` (`:1975`). On a jewelry product the button renders but the modal never mounts.
- **Why it matters / frustration:** Buyer taps a prominent AI CTA and nothing happens.
- **Business impact:** Erodes confidence in the AI features generally.

### P2-H — Guest coupon failure is a silent dead-end
- **Page/flow:** Cart → apply coupon (guest)
- **Severity:** **Medium**
- **What is wrong:** `applyCoupon` POSTs without an auth pre-check (`CartContext.tsx:394`; `api.ts:314`); a guest 401 surfaces as the generic `t('cart.coupon.invalid')` toast (`CartContext.tsx:397-400`). No "sign in to use coupons" path.
- **Why it matters / frustration:** A valid code reads as "invalid"; the buyer blames the code or the store.
- **Business impact:** Promo friction; the buyer who came for a discount leaves.

### P2-I — No sticky mobile CTA on the checkout delivery step
- **Page/flow:** Checkout step 1, mobile
- **Severity:** **Medium**
- **What is wrong:** PDP and cart have sticky mobile bars; checkout does not (`page.tsx:2078-2088`). After 7 fields and the stacked summary, "Continue" is below the fold.
- **Why it matters / frustration:** Buyer fills the form, then has to scroll hunting for the button.
- **Business impact:** Drop-off on the highest-intent screen.

### P2-J — Store/vertical filter chips can't be removed individually
- **Page/flow:** PLP filters
- **Severity:** **Medium**
- **What is wrong:** `getFilterChips()` generates no chips for `store_ids`/`verticals` (`products/page.tsx:332-365`); `handleRemoveChip` has no `store`/`vertical` case (`:367-388`). The only escape is "clear all."
- **Why it matters / frustration:** Buyer narrows to one seller/vertical, then can't back out one facet without resetting everything.
- **Business impact:** Filter friction; fewer refined sessions reaching PDP.

### Lower-severity (Low)
- **Mobile navbar search has no typeahead** — the overlay is a plain form; `SearchSuggestions` is desktop-only (`Navbar.tsx:584-626`).
- **Keyboard Enter on a product/category search suggestion no-ops** (`SearchSuggestions.tsx:177-179`).
- **Dead code**: `CategoryDropdown` imported but never rendered (`Navbar.tsx:25`); `WishlistSkeleton.tsx` orphaned + structurally wrong (list vs grid); orphaned `Hero.tsx`; unused 4-entry `steps` array (`checkout/page.tsx:2015-2040`).
- **`text-left` physical class** in the language menu (`Navbar.tsx:357`) → RTL misalignment.
- **Spinner-only loading** for orders (`OrdersLoadingScreen`) and `ui/loading.tsx` (concentric pings + fake progress bar) — no structural skeleton.
- **`ArrowRight` missing `rtl:rotate-180`** in `CartMobileBar.tsx:61` and `OrderSummaryCard.tsx:212`.
- **Hardcoded filter facets** (colors/sizes/fabrics static in `ProductFilters.tsx:103-113`) will drift from real inventory.
- **Missing copy**: `openSouk.nudgeBody` resolves to empty (`NoSearchResults.tsx:157`).
- **Returns illustration** uses raw `<img>` for an external Contabo URL (`returns/page.tsx:600`) pending a `remotePatterns` entry.

---

## 4. Exact fixes

| # | Exact fix | Why it works | Effort | Priority |
|---|---|---|---|---|
| A | Render a `lastName` input next to `firstName` (split the "Full name" into First + Last, two `sm:col-span-1` fields), OR drop the `lastName>=2` check (`:625-628`) and split `firstName` server-side. Add a checkout test that submits as a guest with a one-word name. | Removes the impossible validation; restores the guest funnel | **Low** | **P0** |
| B | Add a seller-identity row to `ProductCard` (shop name → shop link + rating + `is_verified`-gated badge) using `store_*` payload fields. Backfill the other two cards via a shared `<SellerStrip>`. | Restores comparison + trust at the grid; lifts good sellers | **Med** | **P1** |
| C | Gate the ateliers-rail badge on a real `a.is_verified` flag; render nothing when false. | Makes "Verified" mean something; removes the deceptive signal | **Low** | **P1** |
| D | Make the cart path fetch the same server quote as buy-now (`orderService.getCheckoutQuote`) on mount + country change; render the quote total, not `cartState.total_amount`. | Price shown == price charged; kills last-step surprises | **Med** | **P1** |
| E | Add `loading.tsx` skeletons for `products/[id]`, `category/[slug]`, `products`, `cart`, `orders`, `wishlist` reusing the existing inline skeletons; add `generateMetadata` to `category/[slug]`; consider converting PDP/category data fetch to RSC. | Instant skeleton on navigation; recovers SEO on category pages; lighter bundle | **Med→High** | **P1** |
| F | Collapse the three cards into one `<ProductCard variant>`; lift the shared `<AddToCartButton>` (min-44, `onError`, `.currency-mad`). Delete dead props. | One source of truth for trust signals + a11y; ×3 less maintenance | **Med** | **P2** |
| G | Gate `TryOnButton` on the same `!isJewelry` condition as `TryOnModal`. | No dead CTA on jewelry PDPs | **Low** | **P2** |
| H | Pre-check auth in `applyCoupon`; if guest, show "Sign in to apply a coupon" with a login link instead of "invalid code." | Turns a dead-end into a recoverable path | **Low** | **P2** |
| I | Add a sticky mobile "Continue" bar to checkout step 1, mirroring `CartMobileBar`. | Keeps the CTA reachable after a long form | **Low** | **P2** |
| J | Add `store`/`vertical` cases to `getFilterChips()` + `handleRemoveChip`. | Each facet individually removable | **Low** | **P2** |
| — | Wire `SearchSuggestions` into the mobile overlay; fix Enter-to-navigate on suggestions; fix `Navbar.tsx:357` `text-left`→`text-start`; add `rtl:rotate-180` to the two arrows; delete dead code; add `remotePatterns` for the returns illustration. | Closes the Low cluster cheaply | **Low** | **P2** |

---

## 5. Frontend improvements

### 10 quick wins (Low effort, high signal)
1. Render the missing `lastName` field (P0-A). *Do this first.*
2. Gate the ateliers "Verified" badge on a real flag (P1-C).
3. `Navbar.tsx:357` `text-left` → `text-start`.
4. Add `rtl:rotate-180` to `CartMobileBar.tsx:61` and `OrderSummaryCard.tsx:212` arrows.
5. Gate `TryOnButton` on `!isJewelry` (P2-G).
6. Guest-coupon: show "sign in to apply a coupon" instead of "invalid" (P2-H).
7. Add `store`/`vertical` filter chips + removal (P2-J).
8. Delete dead code: `CategoryDropdown` import, `WishlistSkeleton.tsx`, `Hero.tsx`, checkout `steps` array.
9. Add the missing `openSouk.nudgeBody` translation key.
10. Give `TraditionalProductCard`'s add-to-cart `min-h-[44px] min-w-[44px]` and add the `onError` image fallback.

### 10 strategic improvements (Med/High, 1–3 sprints)
1. Add `loading.tsx` skeletons to all data routes (P1-E).
2. Add `generateMetadata` to `category/[slug]`; evaluate RSC for PDP + category data fetch.
3. Unify the three product cards into one variant-driven component (P2-F).
4. Seller-identity row on every card, backed by `store_*` fields (P1-B).
5. Server-quote the cart checkout path (P1-D).
6. Build a real seller-comparison surface (same product, multiple sellers → compare price/rating/delivery).
7. Replace spinner-only loaders (orders, `ui/loading.tsx`) with structural skeletons.
8. API-drive the filter facets (colors/sizes/fabrics) instead of hardcoding.
9. Extract a shared `<TrustPillRow>` and place it consistently at card → PDP → cart → checkout.
10. Standardize the AI badge (amber "AI" pill) across all four AI surfaces incl. try-on.

### 5 trust improvements
1. Seller identity + real verification on listing cards (who am I buying from?).
2. Honest "Verified" everywhere — one gated component, never hardcoded.
3. Surface seller rating + response time on cards and PDP seller row.
4. Show shipping cost + delivery estimate on the **card**, not only checkout.
5. Consistent buyer-protection pills (secure payment, 14-day returns, COD) at card → PDP → cart → checkout.

### 5 conversion improvements
1. Unblock guest checkout (P0-A).
2. Server-quote the cart path so totals never change at the end (P1-D).
3. Sticky mobile "Continue" on checkout step 1 (P2-I).
4. Recoverable guest-coupon path (P2-H).
5. Move the PDP trust-pill row **above** the Add-to-Cart button (currently below both CTAs, below the fold on short desktop — `page.tsx:2037`).

### 5 responsiveness improvements
1. Enforce 44px minimum on every interactive control (audit `TraditionalProductCard`, icon buttons).
2. Mobile typeahead in the navbar search overlay.
3. Verify PDP above-fold on 390×667: ensure price + primary CTA reachable without scroll (gallery `max-h-[55vh]`, `page.tsx:1430`).
4. Add `rtl:` variants to all hover-slide transforms (`TraditionalProductCard` quick actions).
5. Add route skeletons so navigation never shows a blank shell on mobile networks.

### 5 accessibility improvements
1. Make hovering quick-actions keyboard-reachable (`ProductCard.tsx:243` uses `tabIndex={isHovering ? 0 : -1}` — keyboard users can never reach them).
2. `<article>` landmark + `aria-label` on all three cards (Traditional uses `<div>`; MegaOffer has no label).
3. Fix Enter-to-navigate on search suggestions (`SearchSuggestions.tsx:177`).
4. Ensure every icon-only button has an `aria-label` and a visible focus ring.
5. Verify `aria-current`/focus-trap on the mobile filter `Dialog` and the language menu.

---

## 6. Buyer journey review

| Step | Main friction | Suggested improvement |
|---|---|---|
| **Land on homepage** | Server-rendered + ISR (good), but the whole subtree is `'use client'` and several rails self-fetch in `useEffect` (Navbar categories, `FollowedShopsRail`) → content pops in after hydration | Move self-fetching rails to SWR with SSR fallback or RSC; ship less hydration JS |
| **Search or browse** | Desktop search is strong; **mobile overlay has no typeahead**; Enter on a product suggestion no-ops | Wire `SearchSuggestions` into mobile; fix suggestion navigation |
| **Compare products** | **No seller identity on cards**; shipping/delivery not on cards; no side-by-side seller comparison | Seller-identity row + shipping/delivery on cards; build a compare surface |
| **Trust seller** | **Fake "Verified" on every atelier**; real verification absent from listings | Gate the badge on a real flag; surface rating/response time |
| **View product detail** | Strong hierarchy, good AI placement; trust pills sit **below** both CTAs; jewelry try-on button is inert | Move trust pills above Add-to-Cart; gate try-on on `!isJewelry` |
| **Add to cart** | Solid: toasts, sticky bar, free-ship progress, cross-sell | Keep; ensure `+` is disabled during in-flight qty updates |
| **Checkout** | **P0: guest checkout blocked (missing last name)**; cart-path stale totals; no sticky mobile CTA; guest coupon dead-ends | Fix P0; server-quote cart path; sticky CTA; coupon login path |
| **Track order** | Good multi-seller sub-orders + "buy it again"; spinner-only loading, no structural skeleton | Add an orders skeleton; keep the reorder affordance |
| **Get support** | `FloatingSupportButton` global + WhatsApp/call at checkout (good); returns flow is complete (4-tab) | Surface return/shipping policy earlier (on PDP/card), not only in footer pages |

---

## 7. UI system review

- **Typography:** Coherent — Playfair Display for serif headlines, Poppins/Montserrat/Rubik/IBM Plex Arabic wired as font variables in the root layout with `display:'swap'` (`layout.tsx:8-58`). Arabic gets a dedicated face. Good.
- **Spacing:** Consistent Tailwind scale; responsive grids (`grid-cols-2 lg:grid-cols-4`, etc.). No obvious drift in the audited surfaces.
- **Button hierarchy:** Mostly clear (amber primary CTA, secondary outline), but the same semantic "add to cart" has **two** style definitions across cards (`p-2.5 rounded-xl min-44` vs `p-2 rounded-2xl`, no min) — extract one button.
- **Color usage:** Atlas Indigo + Saffron Amber on near-white; note the documented Tailwind token inversion (`primary.*`=amber, `secondary.*`=indigo) — use `hsl(var(--primary))`/`atlas-*` tokens, not raw scales.
- **Cards:** Three forked product cards (see P2-F) — the single biggest consistency debt; rating/free-ship/countdown badges appear inconsistently across them.
- **Forms:** Generally strong — `autoComplete` on all checkout fields, inline `role="alert"` field errors on blur, collapsed secondary fields behind a toggle. Marred by the missing `lastName` input (P0).
- **Tables/lists:** Orders use per-seller sub-order rows with status badges — readable. Filter strip uses `role="list"`.
- **Icons:** Lucide throughout; directional icons mostly carry `rtl:rotate-180` (two misses noted).
- **Trust-badge placement:** Good at PDP/cart/checkout (secure + returns pills, ReassuranceStrip); **absent on cards**; **fake on the ateliers rail**. Inconsistent — the #1 trust-system fix.
- **Mobile responsive behavior:** A real strength — sticky bars, safe-area, mobile filter `Dialog`, snap rails, 48px nav targets.

---

## 8. State review

| State | Status | Evidence |
|---|---|---|
| **Skeletons** | **Mixed** — inline PLP/wishlist skeletons match layout well (`products/page.tsx:47-60`, `wishlist/page.tsx:72-103`); but `WishlistSkeleton.tsx` is orphaned + structurally wrong; orders/`ui/loading.tsx` are spinner-only | ✅ inline / ❌ shared |
| **Loading** | **No route-level `loading.tsx` anywhere** — all client-side; hard navigations blank until hydrate+fetch | ❌ framework-level |
| **Empty** | **Strong** — wishlist, orders, returns all have iconful, on-brand, CTA-bearing empties | ✅ |
| **No-result** | **Strong** — `NoSearchResults` (did-you-mean, popular chips, Open Souk cross-link); orders zero-filter clears filters | ✅ (one gap: same state regardless of active-filter context) |
| **Error** | **Strong** — global `error.tsx` (retry+digest+support), inline `role="alert"` on checkout fields, quote error alert | ✅ |
| **Disabled** | **Good** — place-order disabled while `isProcessing`, qty `+` disabled at max, COD disabled >500/non-MA with reason overlay | ✅ (gap: Buy Now has no in-flight disabled state, `page.tsx:1958`) |

---

## 9. Next.js-specific frontend review

- **Route consistency:** App Router, clean route tree. Homepage is a correct **Server Component + ISR** (`page.tsx:9`, direct data-layer call — no self-fetch anti-pattern). But PDP, `category/[slug]`, cart, checkout, wishlist are all `'use client'` — the conversion-critical routes render client-side.
- **Layout consistency:** One root `layout.tsx` (fonts, providers, mobile nav, support button, PWA). Nested `layout.tsx` only for `products/[id]`, `seller`, `shops/[name]`. Consistent shell.
- **Component consistency:** The three forked product cards are the main offender; also dead/unrendered components (`CategoryDropdown` mega-menu, `WishlistSkeleton`, `Hero.tsx`).
- **Image & asset optimization:** Strong. `next/image` everywhere it matters, correct `sizes`, `priority` on LCP. One external `<img>` on returns pending a `remotePatterns` entry. `display:'swap'` on all fonts. Opportunity: audit the homepage client-subtree bundle weight.
- **Page-speed perception:** Hurt by (a) **no route skeletons** → blank-then-pop on navigation, and (b) client-rendered PDP/category → empty first paint until JS fetches. ISR homepage is the bright spot. *Recommend a Lighthouse/CWV pass (LCP/CLS/INP) on PDP + category to quantify — not run here.*
- **Hydration / loading UX:** Several rails and the navbar fetch in `useEffect` (not SWR/RSC) → category links and followed-shops flash in after mount. `MegaOfferProductCard`'s direct `e.target.src` mutation is a hydration-mismatch risk. `category/[slug]` has **no `generateMetadata`** → weak SEO/social for a key landing surface.

---

## 10. Final roadmap

### P0 — must fix now (today)
- **Render the missing `lastName` field** (or remove the unsatisfiable validation). Guest checkout is blocked. Add a regression test. *(Fix A)*

### P1 — next sprint
- Seller identity on listing cards *(B)*.
- Gate the ateliers "Verified" badge on a real flag *(C)*.
- Server-quote the cart checkout path *(D)*.
- Add `loading.tsx` skeletons to all data routes + `generateMetadata` on `category/[slug]`; assess RSC for PDP/category *(E)*.

### P2 — later
- Unify the three product cards + shared `<AddToCartButton>` *(F)*.
- Gate try-on on `!isJewelry` *(G)*; recoverable guest-coupon path *(H)*; sticky mobile checkout CTA *(I)*; store/vertical filter chips *(J)*.
- Replace spinner-only loaders with skeletons; API-drive filter facets; standardize AI badges; mobile search typeahead; fix the Low cluster (RTL arrows, `text-start`, dead code, missing copy, `remotePatterns`).

---

### Verification of the headline claims (code-confirmed, not assumed)
- **P0-A:** `handleShippingChange` (`checkout/page.tsx:287-292`) sets `[name]:value` only; "Full name" input bound to `firstName` (`:1455-1460`); validation requires `lastName>=2` (`:625-628`); no `lastName` input exists. ✅ confirmed.
- **P1-B:** `grep -c 'shop|store|seller' ProductCard.tsx` → 0. ✅ confirmed.
- **P1-C:** `HomeContent.tsx:681-685` renders the badge unconditionally. ✅ confirmed.
- **No `loading.tsx`:** `find src/app -name loading.tsx` → empty. ✅ confirmed.

*Read-only audit. No product code was modified. Improve phase (if approved) routes through `beldify-ecommerce-ui` → orchestrator per project rules.*
