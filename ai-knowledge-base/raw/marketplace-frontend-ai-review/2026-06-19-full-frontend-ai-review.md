# Beldify Marketplace — Full Frontend + AI Product Review (2026-06-19)

> Persona: Senior E-commerce Product Designer · Marketplace UX Auditor · CRO Specialist · AI Product Reviewer.
> Scope: the buyer-facing Next.js web frontend of Beldify (Morocco, MAD, Arabic-RTL primary, multi-seller, COD-first), plus its AI surfaces (NL search assist, review summaries, size advisor, virtual try-on, recommendations).

## Methodology note

This was a **code-grounded** review by **8 parallel specialist agents** (one per journey-slice / AI-surface / cross-cutting dimension) **+ one adversarial verifier per Critical/High finding** — **36 agents total, 68 raw findings, 4 refuted on verification, 64 standing**. **No live staging URL or screenshots were available**, so pure UI-render/runtime findings are marked **`ASSUMED`**; everything else is **`file:line`-verified against the repo** at `/Users/mohamedbardouni/projects/beldify`. Where a verifier downgraded, upgraded, or re-attributed the root cause, this report uses the **corrected** severity and mechanism, not the original claim. A follow-up live [[dogfood]] pass is recommended to capture screenshot evidence for the ASSUMED items.

KB grounding woven in: [[concepts/atlas-design-system]] (Atlas Indigo + Saffron Amber; "VERIFIED BY BELDIFY" amber badge belongs only on truly verified stores), [[memory: Beldify guest checkout]], [[memory: Beldify guest cart unblocked]], [[memory: Beldify WhatsApp never checkout]], [[memory: Beldify buyer AI (free)]], [[memory: Beldify AI try-on + product images]], [[concepts/beldify-dormant-features-activation]], [[concepts/marketplace-completeness-roadmap]], [[sources/2026-06-10-frontend-completeness-audit]].

**Important self-correction:** the review's initial assumption that Beldify has *no returns flow* and *no free-shipping rule* was **wrong**. A full buyer returns flow (FE page + Laravel endpoints + 14-day enforcement + admin console) and a real **500 MAD free-shipping threshold** both exist end-to-end. Four findings that rested on those stale assumptions were refuted (see appendix). The KB notes that claimed otherwise are stale.

---

## 1. Overall verdict

Beldify's buyer frontend is a **genuinely premium-feeling, accessibility-above-norm, RTL-correct storefront with a guest-COD checkout and an honestly-built AI suite** — but it leaks money and trust at three specific layers: (a) the **narrowing layer** (sort silently does nothing on category pages, the seller facet vanishes on the primary browse path, filters offer fabricated values that dead-end buyers); (b) the **add-to-cart layer** (the main grid quick-add submits a wrong `product.id` as `stock_id`, and QuickView shows a phantom "added" toast that never touches the cart); and (c) the **trust layer** (every seller is stamped "Verified" with no backing flag, COD silently vanishes above 500 MAD, transfer buyers commit before seeing the RIB, and a sitewide "Live Chat" button is a fake `alert()`). The bones are strong — editorial hierarchy, server-side quote totals, true guest checkout, honest AI labeling in Arabic — which is exactly why the broken core mechanics are so costly: a buyer who is otherwise convinced gets stopped at the one tap that matters.

| Dimension | Rating (1–10) | Justification |
|---|---|---|
| **Frontend quality** | **7** | Atlas tokens, strong skeletons/empty states, real focus-trap modals, RTL logical props; dragged down by indigo-shade drift (995 hardcoded indigo-700 vs 49 Atlas), 3 parallel loading systems, and 3 divergent card components (two with fake add-to-cart). |
| **Buyer UX** | **6** | Discovery and dead-end recovery (NoSearchResults) are excellent; the narrowing layer (broken sort, missing seller/rating filters, mock filter values, blind mobile apply) is where a real buyer's session is lost. |
| **Trust** | **4** | Systemic: unconditional "Verified" badge on every seller, fabricated "Response: Fast"/"1 year" stats, FAQ promising Apple/Google Pay that don't exist, fake "Live Chat", silently-unpaid card orders. Each erodes the COD trust that is the whole conversion gate. |
| **Conversion readiness** | **5** | Guest checkout + server-side quote are best-in-class, but the primary grid add-to-cart is broken, COD dies silently above 500 MAD (the premium tier), and transfer buyers can't see who/how-much before committing — the high-value funnel is near-dead. |
| **Marketplace clarity** | **5** | Cart/checkout group by seller correctly (the hard part is done), but cards carry zero seller identity, cross-seller comparison is impossible, and checkout reinforces no seller trust at the money moment. |
| **AI experience quality** | **7** | Rare among marketplaces: every AI surface is real, mounted, ethically built, and labeled in Arabic; size advisor is a model of consent + honesty. Held back by *placement/discoverability* (review summary buried behind the Reviews tab, NL search absent from the global Navbar, mobile "AI" label hidden) and one missing try-on "this is an approximation" caveat — failures of reach, not of gimmickry. A 9 would require the AI to change a real buying decision *and* be reachable where the decision happens; today it mostly isn't. |

---

## 2. Top strengths

1. **`NoSearchResults.tsx` is best-in-class dead-end recovery** — did-you-mean synonym link (`NoSearchResults.tsx:64-76`), spelling/general-terms tips, popular-search chips, "browse all", *and* an Open Souk reverse-marketplace CTA with matching open requests (`:126-166`). A buyer who misspells "caftan" is never stranded.
2. **True guest checkout with no account wall** — `checkout/page.tsx:535-538` explicitly allows guest COD/transfer and the login link (`:2037-2044`) is a demoted, non-blocking hint. Paired with server-side authoritative totals via `getCheckoutQuote` (`checkout/page.tsx:956-961`) this is the single biggest conversion win, correctly implemented and matching the KB server-side-trust rule.
3. **The AI suite is real, mounted, and ethically built** — every surface is imported and *rendered* (verified, not orphaned): `AiReviewSummaryCard` (`products/[id]/page.tsx:2238`), `SizeAdvisorSheet` (`:1819`), `TryOnButton`/`TryOnModal` (`:1966`/`:2401`), `SearchAssistBar` (`products/page.tsx:478`). The size advisor never auto-selects (`SizeAdvisorSheet.tsx:91-96`), shows confidence, hedges on low confidence, and only highlights *in-stock* sizes — the model the other surfaces should follow.
4. **Mobile buy experience is genuinely thoughtful** — sticky `PdpBuyBar` with `env(safe-area-inset-bottom)`, 48px WCAG targets, total price, RTL-correct arrow, and a `"كيفاش نشري؟"` How-to-buy COD onboarding sheet in Darija (`HowToBuySheet.tsx`) — exactly right for non-technical Moroccan COD buyers. The PDP correctly suppresses `MobileBottomNav` so the two bars never stack.
5. **Honest trust scaffolding where the team chose restraint** — review aggregation derives verified/with-image counts from *real* rows (`api.ts:381-410`, `ReviewCard.tsx:110-114`), the shop page refuses to fabricate per-review cards and shows an honest aggregate (`shops/[name]/page.tsx:646-665`), and home seller stats use "Growing" + a real MAD range instead of invented counts (`HomeContent.tsx:829-862`). This is the right instinct — it just isn't applied uniformly (see the verified-badge and "Response: Fast" findings).

---

## 3. Top problems (Critical + High, post-verification)

Ordered by severity then business impact. Severities are the **corrected** ones from the adversarial verifier.

### Critical

1. **Grid quick-add sends `product.id` as `stock_id` — primary catalog add-to-cart adds the wrong/nonexistent item** · Both · Product cards/add-to-cart · **Critical** (confirmed)
   *Why it matters:* `ProductCard.tsx:114` → `CartContext.tsx:437` → POSTs `{ stock_id: product.id }`; the catalog lives in the `stocks` table so the server gets a wrong/nonexistent stock id. The main `/products` grid (`products/page.tsx:623`) renders `ProductCard` with no override, so this is the live default. *User pain:* buyer taps the amber cart button, gets an error or a different item silently lands in the cart. *Business impact:* kills the highest-frequency add-to-cart entry point on the busiest page; the codebase itself proves `id` ≠ `stock_id` (PDP and wishlist both deliberately resolve `product.stock.id`).

2. **COD silently capped at 500 MAD with no upfront warning — kills high-value caftan/jewelry conversion** · Both · Payment method · **Critical** (confirmed)
   *Why it matters:* `COD_MAX_AMOUNT=500` (`checkout/page.tsx:123`); above it, the effect at `:1017-1021` silently flips `cod`→`bank_transfer` with no toast, and the only disclosure is a disabled overlay on step 2. *User pain:* a 1,200 MAD caftan buyer who expected cash-on-delivery suddenly faces transfer-to-a-stranger before goods ship — the exact barrier COD removes. *Business impact:* direct loss of the highest-value orders; the biggest carts are the most likely to abandon.

3. **Bank-transfer buyer places the order before ever seeing the RIB/account or amount** · Both · Offline transfer · **Critical** (confirmed)
   *Why it matters:* transfer methods show only a one-line description at checkout; the payee RIB and exact MAD amount are fetched *only after* the order is placed (`PaymentProofUpload.tsx:71-81`, rendered on the confirmation page). *User pain:* "confirm and pay by transfer" with zero visibility into who/how-much reads as a scam vector to a cautious Moroccan shopper. *Business impact:* transfer is the *only* option above 500 MAD, so this compounds the COD cap into a near-dead high-value funnel.

### High

4. **PDP stamps EVERY seller "Verified" regardless of real status** · Web · Seller trust/PDP · **High** (confirmed; the pdp-cards slice rated the same issue Critical at the dimension level)
   `products/[id]/page.tsx:1656` renders `BadgeCheck` unconditionally; the shop type (`:131-141`) has no `is_verified` field, and the fallback subtitle hardcodes "Verified artisan seller" (`:1631`). On a COD market the badge is the conversion lever; once a buyer is burned by a "verified" stranger, every badge platform-wide loses signal. Off-token too (indigo, not Atlas amber).

5. **PDP "Add to bag" forces login while "Buy now" is guest — inconsistent wall mid-purchase** · Both · Auth gating · **High** (confirmed)
   `handleAddToCart` (`:819`) and `handlePurchaseNow` (`:964`) hard-redirect guests to `/login`; `handleBuyNow` (`:1060`) does not. The two CTAs sit side by side. Guest cart infra (`X-Guest-Token`) already exists — this is a policy mismatch, not a technical limit. Login walls at add-to-cart are a top COD abandonment driver.

6. **Product cards show zero seller identity — cross-seller comparison is impossible** · Both · Cards · **High** (confirmed)
   Grep of `ProductCard.tsx` returns no shop/seller reference. On a multi-seller catalog selling near-identical caftans, the buyer can't prefer the verified/known shop without opening every PDP → decision fatigue, and commission leakage to WhatsApp/Instagram where they trust a known seller (violates the WhatsApp-closes-in-app rule). *Note:* needs a backend field add (`store_name/store_rating/store_is_verified`) before the FE row.

7. **No seller trust signals at checkout — buyer commits money blind** · Web · Checkout trust · **High** (confirmed)
   Cart/checkout group by seller (the hard part is done) but the header is just a `store_name` string — no badge, rating, or ships-from city at the COD-commit moment (`cart/page.tsx:225-248`, `checkout/page.tsx:1835-1907`). Multi-seller orders feel riskiest exactly when the buyer is asked to trust several strangers at once.

8. **Hardcoded "Response: Fast" and defaulted "Years on Beldify" fabricate seller credibility** · Web · Shop page · **High** (confirmed)
   `shops/[name]/page.tsx:469` renders the literal string "Fast" for every shop; `yearsOnBeldify()` (`:28-33`) returns 1 when `created_at` is missing. Same fabricated-credibility class as the fake reviews removed on 2026-06-10. Rating/products tiles *are* correctly data-gated, making the fake tiles a visible inconsistency.

9. **Sort is silently broken on both category pages — clicking any sort reorders nothing** · Both · Categories · **High** (adjust — root cause corrected)
   *Corrected mechanism:* `/api/categories/{slug}` routes to `CategoryController@getCategoryBySlug` (`api.php:210`), which fetches `$category->stocks()` with **no `orderBy` and never reads `request('sort')`** (`CategoryController.php:356-416`) — the sort param is dropped unconditionally, so even canonical tokens would fail. The fix is **backend** (apply the same ordering switch `ProductController`/`ProductSearchService` already use), not the frontend token mapping the original finding proposed. Price-sort is the #1 narrowing action for budget COD buyers.

10. **ProductQuickView add-to-cart is a no-op — success toast, empty cart** · Both · QuickView · **High** (adjust — mechanism corrected)
    *Corrected mechanism:* `ProductCard.tsx:351` *does* pass `onAddToCart={onAddToCart}`, but **no `ProductCard` call site (7 usages) ever supplies it**, so it's `undefined`; `ProductQuickView.tsx:82-99` skips the call under `if (onAddToCart)` yet still fires `toast.success`. The modal quantity is ignored entirely. Phantom confirmation destroys trust in every future add-to-cart toast.

11. **Store/seller + ALL rating/location/delivery filters are missing on the category browse path** · Both · Filters · **High** (confirmed)
    The store/vertical facets only render when a `facets` prop is passed, and it's passed *only* on `/products` (`page.tsx:506`). Both category pages render `<ProductFilters>` with no facets. There is additionally **no rating, location, or delivery/COD filter anywhere** in `ProductFilters.tsx`. The single most load-bearing filter in a multi-seller market is absent on the most common browse entry.

12. **Product filters use hardcoded mock colors/sizes/fabrics — buyers filter into zero-result dead ends** · Web · Filter drawer · **High** (confirmed)
    `availableColors/Sizes/Fabrics` are static literals (`ProductFilters.tsx:103-113`) wired to the real query (`products/page.tsx:212-214`); picking Wool + XXL + a color no in-stock product has yields a genuine empty grid with only a generic "No results". The store/vertical sections prove the correct facet+count pattern was available and deliberately skipped.

13. **Global support widget offers a fake "Live Chat" (`alert`) and a dead phone number on every page** · Both · Support · **High** (confirmed)
    `FloatingSupportButton.tsx:16-32` — "Live Chat" fires `alert('Live chat will be implemented soon!')`, "Call Us" dials `tel:+212XXXXXXXX` (literal X's), labels are hardcoded English. Mounted sitewide (`layout.tsx:127`). A real WhatsApp number (`+212708150351`) already powers checkout/order/contact — the FAB just doesn't use it.

14. **FAQ promises payment methods (Apple/Google Pay, PayPal) and prepaid return labels the real flow doesn't deliver** · Web · FAQ/Trust · **High** (confirmed)
    `faqs/page.tsx:88-89` lists Apple Pay/Google Pay (which exist nowhere in the checkout method list) and card/PayPal (which take no real charge); the returns page contradicts *itself* — "prepaid return label" (`returns/page.tsx:334`) vs "you pay return shipping" (`:448`, `:561`). Written contracts that are provably false on the surfaces buyers consult to de-risk a purchase.

15. **Guest COD buyers have no in-app way to track or find their order** · Both · Guest flow · **High** (confirmed)
    `getOrders()` returns `[]` without a `userId` (`orderService.ts:204-210`); no public track/lookup route exists; the FAQ tells users to "check the Orders section" a guest can't reach (`faqs/page.tsx:21`). The post-checkout confirmation *is* reachable, but the **return visit** dead-ends — a structural gap for a guest-checkout-forward marketplace.

16. **AI review summary is fetched only after the buyer clicks the Reviews tab — most buyers never see it** · Web · AI review summary · **High** (confirmed)
    The lazy fetch fires only when `activeTab==='reviews'` (`products/[id]/page.tsx:1118`) and the card renders only inside the hidden reviews tabpanel (`:2235`); the default tab is "description". The single best AI trust artifact is invisible at the moment trust is decided.

17. **AI try-on result shown next to "Buy now" with no "simulation/approximate" disclaimer** · Both · Virtual try-on · **High** (confirmed)
    `TryOnModal.tsx:837-868` renders the generated garment-on-body image full-bleed above a primary "Buy now" with no caveat, unlike the size advisor which hedges confidence. AI try-on flatters drape/length; in a COD market with return friction, over-trust converts straight into a delivery refusal.

18. **PayPal and Card are selectable but silently create an unpaid "pending" order — buyer thinks they paid** · Both · Payment honesty · **High** (confirmed)
    Gateways carry no `paymentDisabledReason`, so they're fully clickable; submit creates the order with `payment_status: pending` and no charge, no card form, no gateway redirect (`checkout/page.tsx:341-354, 633-648`). The buyer sees "order placed" and believes they paid online.

19. **Hardcoded English shipping-method names + delivery times leak into the Arabic/RTL checkout** · Both · Localization · **High** (confirmed)
    `shippingMethodOptions` maps `m.name`/`m.delivery_time` with no `t()` wrapper (`checkout/page.tsx:1289-1290`); the `shippingService` fallback is hard-English ("Standard Delivery", "3–5 business days") and fires whenever the API list is empty. Arabic-only buyers see Latin-script options at the shipping-cost decision step.

20. **No delivery date/ETA on cart, and cart shipping shows "—" by default** · Both · Shipping clarity · **High** (confirmed)
    `OrderSummaryCard.tsx:84` shows "Free" only at subtotal ≥ 500, else an em-dash; the city estimator (`ShippingCalculator.tsx`) is collapsed *and* mounted with **no `onCalculate` callback** (`:192`) so it's a dead control — the buyer literally cannot get a real shipping number on the cart. Unknown cost + no ETA is a top cart-abandonment driver, doubly so for COD cash-budgeting.

21. **Primary quick actions (wishlist, quick-view) are hover-only — invisible/unreachable on touch** · Both · A11y/mobile · **High** (confirmed)
    `ProductCard.tsx:244-265` — `opacity-0 group-hover:opacity-100`, `tabIndex` driven only by `onMouseEnter`, and a blanket `aria-hidden="true"`. On the primary Moroccan touch audience, wishlist-from-grid (a retention signal) and quick-view simply don't exist; also a WCAG 2.1.1/4.1.2 violation.

---

## 4. Frontend improvement recommendations

For each top problem: the exact UI/UX fix, why it improves experience and trust/conversion, effort, priority.

| # | Title · Platform | Exact improvement | Why it improves UX | Why it improves trust/conversion | Effort | Priority |
|---|---|---|---|---|---|---|
| 1 | Grid quick-add wrong `stock_id` · Both | Resolve a real `stock_id` (enrich `/api/products/all` payload with `stock.id`), call `addItem(stock_id, 1, 'stock')`; until then make the card cart button a Link to the PDP. Add a vitest asserting payload uses `stock_id` not `product.id`. | The most-used action finally works | Restores the highest-frequency add-to-cart; ends "wrong item in cart" support contacts | Med | **P0** |
| 2 | COD cap silent · Both | Non-blocking line on >500 totals ("الدفع عند الاستلام متاح حتى 500 درهم — خلّص بالتحويل أو تواصل معانا"), fire a toast on the auto-switch, surface it on step 1 not just step 2; business: raise cap for verified buyers / partial-deposit COD | Buyer learns the constraint early, not at the last step | Recovers the premium tier (caftans/jewelry >500 MAD) that COD-distrust otherwise loses | Med | **P0** |
| 3 | Transfer RIB hidden until after order · Both | When a transfer method is selected, inline-expand the payee RIB/account + exact MAD amount (`getPaymentInstructions`) + "you'll upload the receipt after placing the order" | Buyer sees who/how-much *before* committing cash | Removes the "scam vector" read at the highest-anxiety transfer moment | Med | **P0** |
| 9 | Category sort silently broken · Both | **Backend:** `getCategoryBySlug` must read `sort` and apply the same ordering switch `ProductController` uses (price_asc/price_desc/top_rated/newest). Add a regression test. | Price/popularity sort actually reorders | Restores the #1 narrowing action for budget COD buyers; kills "is this site broken?" abandonment | Low (BE) | **P0** |
| 13 | Fake "Live Chat" + dead phone FAB · Both | Replace the 3 options with WhatsApp deep-link to `+212708150351`, real `tel:`, `mailto:support@beldify.com`; remove/relabel "Live Chat"; i18n all labels; add `aria-label` + Escape-to-close | Help actually reaches a human | A working help affordance on a COD market signals a legitimate, maintained site | Low | **P0** |
| 14 | FAQ over-promises payment/returns · Web | Align FAQ to live reality (COD + bank transfer; card/PayPal "coming soon" only if truthful; drop Apple/Google Pay); reconcile returns copy into one consistent "who pays return shipping" statement | Buyer's expectations match reality | Treats FAQ/returns as a contract; removes the bait-and-switch trust killer | Low | **P0** |
| 4 | Unconditional "Verified" badge · Web | Add `is_verified` to the shop type + API; render `BadgeCheck` + "Verified artisan seller" only when `shop.is_verified === true`, in Atlas amber; neutral "Seller on Beldify" otherwise | Badge means something again | Restores the core COD trust lever platform-wide | Low (FE) + BE field | **P1** |
| 5 | Inconsistent auth wall on CTAs · Both | Drop the `:819` guard so guest add-to-bag mirrors `handleBuyNow`'s no-auth path (`addItem` already carries `X-Guest-Token`); both CTAs behave identically for guests | No surprise login bounce | Removes a top COD abandonment driver and the "bait" perception | Med | **P1** |
| 6 | Cards have no seller · Both | Backend: add `store_name/store_rating/store_is_verified` to product responses; FE: one-line secondary seller row + amber verified badge (gated) under the product name | Buyer can compare sellers in-grid | Lifts CTR-to-PDP, keeps the sale in-app vs WhatsApp, rewards verified sellers | Med | **P1** |
| 7 | No seller trust at checkout · Web | Render verified badge (gated) + rating + "Ships from {city}" in each seller group header (needs those fields on the quote/cart store object) | Buyer knows who they're paying | Lowers checkout abandonment + COD refusal on multi-seller orders | Med | **P1** |
| 8 | Fake "Response: Fast"/"1 year" · Web | Wire Response to a real avg-reply metric or remove the tile; hide Years when `created_at` is genuinely absent instead of defaulting to 1 | Stats stop lying | Protects the credibility of the whole stats strip | Low | **P1** |
| 10 | QuickView phantom add · Both | Wire QuickView directly to `useCart().addToCart` with the selected quantity; `toast.success` only after the promise resolves, `toast.error` on failure | "Added" means added, with the right qty | Stops poisoning trust in every add-to-cart toast | Med | **P1** |
| 11 | Category filters missing facets · Both | Pass `facets` to `ProductFilters` on both category pages; add rating (4★+), seller-location/city, delivery/COD-eligible sections backed by API facets; hide empty sections | Buyer can self-serve to trusted/local/affordable sellers | Removes a top abandonment driver on the dominant browse path | High | **P1** |
| 12 | Mock filter values dead-end buyers · Web | Drive colors/sizes/fabrics from facets with counts; hide 0-match values; hide the section if facets absent | No fictional filter values | False-empty results no longer read as "store is empty/broken" | Med | **P1** |
| 15 | Guest order untrackable · Both | Public order-lookup page (`order_number` + shipping email → status timeline), reusing the order-detail timeline and the existing guest-by-email pattern; link from the confirmation email + FAQ | Guest can re-check status | Cuts "where is my order" support load + COD refusal | Med | **P1** |
| 16 | AI review summary buried · Web | Surface a compact one-line AI gist (summary + star + count) in the buy column near the rating row; fetch on product load, render only on 200; keep the full pros/cons card in the Reviews tab | The trust artifact appears where the decision is made | Turns a built-but-invisible AI feature into a real conversion lever | Med | **P1** |
| 17 | Try-on no disclaimer · Both | One quiet mono caption under the result: "صورة تقريبية مولّدة بالذكاء الاصطناعي — قد يختلف المقاس والقصّة عن المنتج الحقيقي" (reuse the provenance styling) | Sets honest expectations without killing delight | Prevents over-trust → COD delivery refusals | Low | **P1** |
| 18 | Silently-unpaid card orders · Both | Hide PayPal/Card until the gateway is live (buy-now's COD-first list is the precedent), or gate them behind a "قريباً / Coming soon" overlay reusing the existing disabled-overlay mechanism | No phantom "paid" orders | Removes payment-confusion and COD/card reconciliation support load | Low | **P1** |
| 19 | English shipping copy in RTL · Both | Wrap method names + ETA in `t()` keyed by method id; translate the `shippingService` fallback; render ETA from a structured day-range | Arabic buyer reads Arabic options | Higher completion at the shipping-cost step | Low | **P1** |
| 20 | Cart shipping "—" + no ETA · Both | Show a concrete inline estimate ("from 30 MAD" / "Free over 500 MAD" with the existing progress bar) and wire `ShippingCalculator`'s `onCalculate` so the city picker actually updates the summary; add a delivery-window line | Buyer can answer "how much / when" before checkout | Removes the #1 cart-abandonment trigger (hidden shipping cost) | Med | **P1** |
| 21 | Hover-only quick actions · Both | Reveal on `@media (hover:none)`/coarse-pointer, drop the blanket `aria-hidden`, real labels, focusability independent of hover | Mobile buyers get wishlist + quick-view | Recovers wishlist (retention) signals + grid-to-cart on the dominant device; fixes WCAG | Med | **P1** |

---

## 5. Buyer journey audit

| Step | Main friction | Suggested improvement |
|---|---|---|
| **Discover** | Strong editorial home + accessible typeahead, but the ateliers rail can show fabricated "Verified" shops (static fallback), Discover cards use a *men's* category image as the generic missing-image fallback, and the AI NL search the team built isn't wired into the global Navbar search every buyer starts from. | Hide the ateliers rail on empty API (never show "Verified" on static cards); swap the gendered fallback for a neutral Atlas monogram; promote NL assist into the Navbar (or run the parse for >2-word queries on arrival at `/products`). |
| **Compare** | Cards carry **no seller identity** and no rating/location facet on the category path; cross-seller comparison forces opening every PDP; price-sort on category pages does nothing. | Add a per-card seller row (gated verified badge + rating); fix backend category sort; pass facets + add rating/location/delivery filters on category pages. |
| **Trust seller** | The PDP seller card finally appears but its "Verified" badge is unconditional, "Response: Fast"/years are decorative, and the rating shown is the *product* rating not the seller's — so there's still no seller-reputation number on the PDP. | Gate the badge on `is_verified`; wire/remove the fabricated stats; surface a real seller rating on the PDP seller card. |
| **Add to cart** | Grid quick-add submits the wrong `stock_id`; QuickView and `TraditionalProductCard` show fake success toasts; "Add to bag" forces login while "Buy now" is guest. | Fix stock-id resolution, wire QuickView to the real cart, unify guest auth across both CTAs. |
| **Checkout** | True guest checkout + server-side quote are excellent, but COD vanishes silently above 500 MAD, transfer buyers can't see the RIB/amount before committing, card/PayPal create silently-unpaid orders, shipping options render in English, and no concrete buyer-protection copy sits at the money moment. | Surface the COD cap early + toast the switch; inline the RIB/amount for transfers; hide dormant gateways; localize shipping; add an "inspect before you pay" / "Beldify Buyer Guarantee" line at the confirm button. |
| **Receive** | Order-detail tracking is genuinely strong (timeline, per-seller status, reorder, cancel, return), but a **guest** who used COD can't reach Orders at all after the confirmation email, and "shipped" orders with no tracking number show no "awaiting tracking" line. | Public guest order-lookup; add an "awaiting tracking" affordance when status is shipped but no tracking number exists. |
| **Help / return / dispute** | The sitewide support FAB is a fake "Live Chat" + dead phone; the FAQ over-promises payment methods and prepaid return labels; the returns explainer image loads from dead Contabo storage. The *actual* returns flow exists and is good — it's the discovery and the copy that misfire. | Wire the FAB to real WhatsApp/tel/mailto; align FAQ/returns copy to reality; move the returns SVG to local public disk with an `onError` fallback. |

---

## 6. AI experience audit

**Mounting check (verified, not orphaned):** every AI surface is imported *and* rendered in a real page — `AiReviewSummaryCard` (`products/[id]/page.tsx:2238`), `SearchAssistBar` (`products/page.tsx:478`), `SizeAdvisorSheet` (`:1819`), `TryOnButton`/`TryOnModal` (`:1966`/`:2401`), recommendations via `HomeContent.tsx`. **Nothing is orphaned-but-built.** The failures are *placement, discoverability, and one missing caveat*, not gimmickry. (The one "AI" surface that is really *not* AI is the "AI styled for you" chip on the PDP "Complete the look" shelf — it labels a plain `partitionShelves()` slice of related products as AI styling; relabel to "You may also like" to avoid AI-overclaim.)

| Surface | What works | What is confusing | What to improve | More or less visible? |
|---|---|---|---|---|
| **AI search assist** (`SearchAssistBar`) | Fallback-safe (plain search on empty/error, `buyerAiService.ts:127`), only fires on >2-word queries, removable reply line, ethical | Mounted **only** in the `/products` hero, not the global Navbar every buyer starts from; "✨ AI" chip has no explanation; **on mobile the "AI" word is `hidden sm:inline`** so it's a bare sparkle on the primary device; the whole search blocks on a synchronous, un-timed LLM call (no debounce/timeout) | Promote into the Navbar; explanatory placeholder ("ask naturally — قفطان أحمر تحت 800 درهم"); always-show the "AI" label on mobile + an example chip; run keyword results immediately then overlay AI-refined filters (progressive enhancement) + ~2.5s timeout fallback | **MORE** — it's invisible at the real point of intent |
| **AI review summaries** (`AiReviewSummaryCard`) | Grounded + non-deceptive: shows `review_count`, returns null on 204 (<3 reviews) so no fabricated social proof, pros/cons chips, Arabic provenance | Fetched + rendered **only behind the Reviews tab** (default tab is "description"), so the majority never see the headline differentiator at the moment trust is decided | Surface a one-line gist (summary + star + count) in the buy column near the rating row; fetch on product load, render only on 200; keep the full card in the tab | **MORE** — biggest wasted-investment gap |
| **AI size advisor** (`SizeAdvisorSheet`) | The strongest surface: explicit AI label, confidence level, never auto-selects (asks "Use this size"), honest low-confidence hedge, only highlights in-stock sizes | Entry link sits a control block *below* the size pills (after the fabric picker), so it's not at the moment of size doubt | Move the entry immediately under the size radiogroup, next to the "Size" legend | Keep visible; **reposition** to the trigger moment |
| **Virtual try-on** (`TryOnButton`/`TryOnModal`) | Correctly apparel-only + config-gated, photo "not stored" note, complete honest paid flow with auto-refund-on-fail, daily-limit/top-up states | **No "this is an AI approximation / fit may differ" caveat** beside the result image, which sits directly above "Buy now" — the highest trust risk in the suite (over-trust → COD refusal, and returns carry friction) | Add one quiet mono caption under the result; pro/con chip polarity also relies on aria-hidden glyphs (a11y) | Keep visible; **add the caveat** |
| **AI recommendations / personalization** (home ateliers) | Honest — no fake personalization claim | Rendered as a generic ateliers grid with **no "recommended for you"/AI framing**, and silently falls back to four fixed "Maison Tetouan/Dar Fes" tiles with invented 4.9★ + an unconditional "Verified" badge | Label "موصى به لك / Ateliers we recommend" **only** when live data exists; never show "Verified" on static fallback cards; hide the rail on empty live data | Keep, but **fix the fabricated-trust fallback before promoting any personalization** |

**Net AI verdict:** unusually mature and ethical for a marketplace — labeled in Arabic, grounded, fallback-safe, consent-respecting. The work to do is reach (Navbar + buy-column placement, mobile label), one trust caveat (try-on), and honesty around the recommendations fallback — not building new models.

---

## 7. Visual design review

- **Spacing & layout:** strong — `aspect-[4/5]` cards reserve space (no CLS at the card level), sticky sort/filter bars, paced editorial home scroll. One CLS bug: the skeleton image is `aspect-square` vs the card's `4/5`, so the grid jumps on every load (`products/page.tsx:52` vs `ProductCard.tsx:176`).
- **Typography:** Playfair display name → indigo price hierarchy on the PDP is editorial-grade; `currency-mad` forces LTR MAD inside RTL text — correct. Gaps: hardcoded English leaks (shipping methods, offer countdown chip, FAB labels, several order action ternaries) on an Arabic-first store.
- **Card design:** clean but dense (category chip + rating + name + shipping + price + CTA in one tall tile) and missing seller identity; three divergent card components (`ProductCard`, `TraditionalProductCard`, `QuickView`) with inconsistent add-to-cart behavior.
- **Buttons & CTA clarity:** single amber AA-contrast CTA per card is good; the PDP CTA stack is clear. Problem: "Add to bag" (login-walled) and "Buy now" (guest) look identical but behave differently.
- **Color hierarchy (Atlas amber/indigo):** **systemic indigo-shade drift** — 995 hardcoded Tailwind `indigo-700` (#4338ca) vs only 49 canonical `hsl(var(--primary))` (#252555), so the brand indigo is the wrong, brighter one almost everywhere, and the focus ring (#252555) doesn't match the button's own `ring-indigo-700`. Plus an off-Atlas `LoadingManager` (purple/pink/orange gradients) firing full-screen at high-intent waits, and a stray `bg-blue-600` active page in Pagination.
- **Icon consistency:** mostly good; Pagination prev/next chevrons don't RTL-flip, so "previous" points the wrong way in Arabic.
- **Trust-badge placement:** the core problem area — "Verified" is unconditional on the PDP, off-token (indigo not amber), and absent from cards and checkout where it would actually help.
- **Seller-info visibility:** absent from cards, PDP (no seller rating number), and checkout headers — the three highest-leverage decision points, even though `Shop.is_verified/rating/total_reviews` exist in the type system elsewhere.
- **Mobile readability:** strong primitives (48px buy-bar targets, safe-area insets everywhere) undercut by sub-44px add-to-cart/pagination/sort targets, hover-only quick actions, and the cart bar painting over the bottom nav.

---

## 8. State review

| State | Quality | Notes |
|---|---|---|
| **Empty** | Mixed — excellent to bare | `NoSearchResults` (did-you-mean + Open Souk cross-link) and `EmptyCartState` (icon + headline + CTA) are best-in-class; but the catalog no-result *count label* is a bare "No results" and some lighter lists lack a designed empty. Standardize on one `EmptyState` primitive. |
| **Loading** | Strong, but fragmented | Content-shaped skeletons everywhere (PDP 2-col, `ProductGridSkeleton`), priority gated to above-fold, heavy providers deferred via `dynamic()`. But **three parallel loading systems** (`loading.tsx`, off-brand `LoadingManager`, `LoadingSpinner`) create palette inconsistency. |
| **Skeletons** | Good, one CLS bug | Matched shapes except the catalog skeleton's `aspect-square` vs card `4/5` → layout shift. |
| **Error** | Strong | Designed error + retry on products, quote loading/error on checkout, rose error on notifications, mid-stream error retry on infinite scroll. |
| **Disabled** | Good but under-announced | OOS frosted overlay + disabled CTA + NotifyMe swap; the payment disabled overlay and the COD-limit overlay aren't announced to screen readers. |
| **No-results** | Excellent on `/products`, weak elsewhere | The strong `NoSearchResults` body exists, but mock-driven filter combinations produce *false* empties with no "this option was never real" hint; category dead-ends reuse `window.location.reload()` as primary recovery. |

---

## 9. Quick wins (15, low-to-med effort, high value)

1. **Fix the fake support FAB** — wire WhatsApp `+212708150351` / real `tel:` / `mailto:support@beldify.com`, remove "Live Chat", i18n labels, add `aria-label` + Escape (`FloatingSupportButton.tsx:16-32`). **[P0, Low]**
2. **Align FAQ + returns copy to reality** — drop Apple/Google Pay, mark card "coming soon" if truthful, reconcile the prepaid-vs-buyer-paid return-shipping contradiction (`faqs/page.tsx:35,88-89`, `returns/page.tsx:334,448,561`). **[P0, Low]**
3. **Gate the "Verified" badge** on `shop.is_verified === true`; kill the hardcoded "Verified artisan seller" fallback (`products/[id]/page.tsx:1631,1656`). **[P1, Low + BE field]**
4. **Remove/wire the fabricated seller stats** — kill "Response: Fast", hide "Years" when `created_at` absent (`shops/[name]/page.tsx:28-33,469`). **[P1, Low]**
5. **Hide PayPal/Card** until the gateway is live, or gate behind a "قريباً" overlay (`checkout/page.tsx:341-354`). **[P1, Low]**
6. **Localize shipping method names + ETAs** via `t()` and translate the `shippingService` fallback (`checkout/page.tsx:1289-1290`, `shippingService.ts:39-64`). **[P1, Low]**
7. **Add the try-on approximation caveat** — one mono caption under the result image (`TryOnModal.tsx:837-868`). **[P1, Low]**
8. **Bump sub-44px targets** — grid add-to-cart 38→44px, pagination/sort chips to 44px via the existing `.touch-target` helper (`ProductCard.tsx:321`, `Pagination.tsx:96-104`, `products/page.tsx:571`). **[P1, Low]**
9. **Wire `ShippingCalculator`'s `onCalculate`** so the cart city picker actually updates the summary, and show a concrete inline estimate instead of "—" (`OrderSummaryCard.tsx:84,192`). **[P1, Med]**
10. **Replace the gendered Discover fallback image** with a neutral Atlas monogram (`DiscoverFeed.tsx:86-89`). **[P2, Low]**
11. **Fix the skeleton aspect-ratio** — `aspect-square` → `aspect-[4/5]` to stop the catalog layout shift (`products/page.tsx:52`). **[P2, Low]**
12. **Localize the offer countdown chip** + set aria-label from the localized string, font-arabic gating for `ma` (`OfferCountdownChip.tsx:47-62`). **[P2, Low]**
13. **Move the returns SVG to local public disk** + `onError` fallback (off dead Contabo) (`returns/page.tsx:596-605`). **[P2, Low]**
14. **Relabel "AI styled for you"** → "You may also like" on the related-products shelf (`products/[id]/page.tsx:2329-2333`); reframe home ateliers to "recommended" only on live data. **[P2, Low]**
15. **RTL/Atlas pagination polish** — `bg-blue-600` → `indigo-700`, RTL-flip prev/next chevrons, logical `start-4` + localized skip link (`Pagination.tsx:62-72,98`, `layout.tsx:118-123`). **[P2, Low]**

---

## 10. Strategic improvements (10 bigger 3–6-month bets)

1. **Cross-seller comparison layer** — seller identity + gated verified badge + rating on every product card, plus a "compare sellers for this item" affordance; the marketplace's seller-discovery flywheel is currently invisible at the decision point.
2. **A real verification system** — a backend `is_verified` truth source feeding a single Atlas-amber "VERIFIED BY BELDIFY" badge, surfaced consistently on card, PDP seller block, and checkout header; retire every decorative/hardcoded "verified".
3. **Facet-driven filtering everywhere** — colors/sizes/fabrics/stores/verticals from real API facets with per-value counts, plus rating/location/delivery/COD-eligible sections, on *both* the products and category paths; hide 0-match values so no buyer dead-ends.
4. **Activate the dormant payment gateway** (Stripe/CMI built per [[concepts/beldify-dormant-features-activation]]) with credentials, or hide card/PayPal until then — end the silently-unpaid-order class entirely.
5. **Raise/redesign the COD ceiling** — verified-buyer COD limits, partial-deposit COD, or a transparent transfer flow that shows the RIB + amount inline; the >500 MAD premium tier is the catalog's monetization core.
6. **Guest order portal** — public order-lookup (order # + email) reusing the order-detail timeline, linked from the confirmation email; first-class support for the guest-COD model the marketplace is built on.
7. **AI search promotion to the global Navbar** with progressive enhancement (keyword-first, AI-refined overlay) + mobile-visible affordance — turn a built-but-buried differentiator into a funnel-top lever.
8. **AI review-summary in the buy column** + a recommendations engine that earns the "recommended for you" framing (real personalization data, never a static fallback) — move grounded AI trust signals to where decisions happen.
9. **Promote returns/buyer-protection upfront** — the returns flow exists and is good; surface a truthful "14-day returns · COD · Buyer Guarantee" strip on PDP/cart/checkout (already partly shipped) with consistent who-pays-shipping copy, as a conversion lever rather than buried reassurance.
10. **Atlas token unification + single loading system** — migrate the 995 hardcoded `indigo-700` sites to `hsl(var(--primary))`, collapse the three loading systems into one Atlas-colored primitive, so a single theme change propagates and the brand reads consistent screen-to-screen.

---

## 11. Final roadmap

### P0 — must fix now (8)

1. Grid quick-add sends `product.id` as `stock_id` — **Critical** (`ProductCard.tsx:100-129` → `CartContext.tsx:436-437`)
2. COD silently capped at 500 MAD, no upfront warning — **Critical** (`checkout/page.tsx:123,1017-1021`)
3. Bank-transfer buyer commits before seeing RIB/amount — **Critical** (`checkout/page.tsx:306-340`, `PaymentProofUpload.tsx:71-81`)
4. PDP stamps every seller "Verified" — **High/Critical** (`products/[id]/page.tsx:1656`)
5. PDP "Add to bag" login wall vs guest "Buy now" — **High** (`products/[id]/page.tsx:819-837,1060-1113`)
6. Product cards show zero seller identity — **High** (`ProductCard.tsx`)
7. Category sort silently broken (backend root cause) — **High** (`CategoryController.php:356-416`)
8. Fake "Live Chat" + dead phone FAB; FAQ over-promises payment/returns — **High** (`FloatingSupportButton.tsx:16-32`; `faqs/page.tsx:35,88-89`)

### P1 — next sprint (16)

- QuickView phantom add-to-cart (`ProductQuickView.tsx:82-99`)
- `TraditionalProductCard` fake add-to-cart — *latent* (no live render site; fix-or-delete) (`TraditionalProductCard.tsx:96-116`)
- No seller trust signals at checkout (`checkout/page.tsx:1835-1849`)
- Hardcoded "Response: Fast"/"Years" stats (`shops/[name]/page.tsx:461-471`)
- Category browse path missing store/rating/location/delivery facets (`categories/[slug]/page.tsx:180-186`)
- Mock colors/sizes/fabrics dead-end buyers (`ProductFilters.tsx:103-113`)
- Static "Verified" fallback ateliers on home (`HomeContent.tsx:97-115,664-705`)
- Result count "{{count}} product" missing plural (`products/page.tsx:548-552`, `en.json:771`)
- Mobile filter drawer applies blind, no live count (`ProductFilters.tsx:707-723`)
- Guest COD orders untrackable (`orderService.ts:204-211`)
- AI review summary buried behind Reviews tab (`products/[id]/page.tsx:1117-1125,2230-2239`)
- AI try-on missing approximation disclaimer (`TryOnModal.tsx:837-868`)
- Card/PayPal create silently-unpaid orders (`checkout/page.tsx:341-354,633-648`)
- English shipping copy leaks into RTL checkout (`checkout/page.tsx:1286-1295`)
- Cart shipping "—" + no ETA + dead city picker (`OrderSummaryCard.tsx:71-86,192`)
- Hover-only quick actions invisible on touch (`ProductCard.tsx:244-265`)
- Sub-44px tap targets (`ProductCard.tsx:321`, `Pagination.tsx:96-104`)
- Nested filter sub-components remount, drop focus/state (`ProductFilters.tsx:209,562,618`)

### P2 — later (24)

AI search assist not in global Navbar (`products/page.tsx:476-483`) · mobile "AI" label hidden (`SearchAssistBar.tsx:131-133`) · NL search blocks with no timeout (`SearchAssistBar.tsx:57-86`) · "Find my size" placement (`products/[id]/page.tsx:1818`) · home recommendations unframed/static fallback (`HomeContent.tsx:104-115`) · review pros/cons aria-glyph polarity (`AiReviewSummaryCard.tsx:48-69`) · gendered Discover fallback image (`DiscoverFeed.tsx:86-89`) · duplicate category routes drift (`category` vs `categories`) · subcategory numeric-id links (`categories/[slug]/page.tsx:299`) · dead orphaned home components with fake brands (`Hero.tsx` etc.) · offer countdown chip English (`OfferCountdownChip.tsx:47-62`) · cards never show seller (Medium variant) (`ProductCard.tsx:269-343`) · mobile sticky bar hides discount (`PdpBuyBar.tsx:58-69`) · PDP debug logging in render path (`products/[id]/page.tsx:289-303`) · reviews can't filter by verified/photos (`ReviewsSection.tsx:197-245`) · `/shops` no rating sort + invalid `type` param (**ASSUMED**) (`ShopSort.tsx:13`) · review helpful-vote state not persisted (`ReviewCard.tsx:20`) · no buyer-protection copy at money moment (`checkout/page.tsx:1976-1993`) · cart/checkout dual currency formatters (`OrderSummaryCard.tsx:47-51`) · multi-seller cart shipping placeholder (`cart/page.tsx:221-246`) · guest coupon may 401→login redirect (**ASSUMED**) (`CartContext.tsx:391-403`) · notifications page off-Atlas (`notifications/page.tsx:333`) · post-purchase action labels bypass i18n (`orders/page.tsx:524-530`) · returns SVG on dead Contabo (`returns/page.tsx:596-605`) · tracking metadata silently absent (**ASSUMED**) (`orders/[orderNumber]/page.tsx:643-660`) · indigo brand-shade drift (`globals.css:97`, `button.tsx:12`) · off-brand LoadingManager (`LoadingManager.tsx:41-54`) · root layout hardcoded `dir=rtl lang=ma` FOUC (`layout.tsx:112-113`) · English/left-positioned skip link (`layout.tsx:118-123`) · skeleton aspect mismatch (`products/page.tsx:52`) · off-Atlas pagination + non-flipped chevrons (`Pagination.tsx:98,62-72`) · inconsistent empty-state quality (`products/page.tsx:546-547`) · cart bar covers bottom nav (`CartMobileBar.tsx:32` — adjusted High→Medium) · FAB physical `right-6` not `end-6` (`FloatingSupportButton.tsx:35`) · near-zero `dvh` adoption (`ClientProvider.tsx:58`) · search overlay ignores top safe-area (**ASSUMED**) (`Navbar.tsx:584-586`).

---

## Appendix — Refuted by verification (4 dropped findings)

These were claimed as problems but the adversarial verifier proved the premise false against the code. The review self-corrected; they are **not** real defects:

1. **"Card 'free shipping' badge is a fabricated promise"** — REFUTED. A real 500 MAD free-shipping threshold exists end-to-end (`shippingService.ts:34-46`, `checkout/page.tsx:1896`, test at `shippingService.test.ts:120`); orders ≥500 MAD genuinely get free standard shipping. (Narrow residual at Low: the badge keys off single-product `displayPrice` not cart subtotal, and only the *standard* tier is free.)
2. **"'Free 14-day returns' promised but no returns flow exists" (cart/checkout)** — REFUTED. A complete buyer returns flow exists: FE page + `returnService` + Laravel `OrderActionsController::storeReturnRequest` enforcing the exact 14-day-from-delivery window + admin console. The KB "no returns flow" note is stale.
3. **"False trust promises: 'Free 14-day returns' + conditional 'Free shipping' with no backing flow" (visual slice)** — REFUTED. Both backing flows exist (returns end-to-end; free shipping honored ≥500 MAD). The only minor caveat is `updated_at` used as a `delivered_at` proxy.
4. **"Returns/refund policy undiscoverable BEFORE purchase"** — REFUTED. The PDP already has a purpose-built RETURNS trust pill (`products/[id]/page.tsx:2038-2053`, asserted by `pdp-chrome.test.tsx`), and cart/checkout/empty-cart all surface "Free 14-day returns" beside the CTA. The recommended fix was already shipped. (Inverse residual: cart/checkout assert "Free returns" as fact while the PDP pill deliberately avoids that wording — a truthfulness *inconsistency* worth a separate small finding, not this one.)
