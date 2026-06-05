# Beldify Growth Plan — Getting Non-Tech, Social-Media Buyers to Use the Website + OpenSouk

**Date:** 2026-06-05
**Author:** Beldify team
**Market:** Morocco — non-tech buyers who live in WhatsApp / Facebook / Instagram / TikTok
**Core thesis:** Don't drag social-media users onto a website. Meet them where they are, and make the website feel like an extension of WhatsApp — not a separate, scary place.

---

## 1. The Problem (stated plainly)

Our buyers are not "website people." They are comfortable in:
- **WhatsApp** — the #1 commerce surface in Morocco. People already buy via WhatsApp daily.
- **Facebook groups** — huge buy/sell communities.
- **Instagram / TikTok** — discovery via Reels/short video.

Every step we ask of them — *open a website → create an account → browse → checkout* — is a drop-off point. Today we have **two hard friction walls**:

1. **Forced login before checkout** (`checkout/page.tsx:418` — `if (!user?.id) … auth_required`). A social visitor who lands on a product cannot buy without signing up.
2. **No way to share a product to WhatsApp** — the channel our users trust most for *discovery and word-of-mouth* is missing. (Note: we deliberately do **not** want buyers to *order* via the seller's WhatsApp — see the anti-disintermediation rule below. WhatsApp drives traffic in; the sale closes in-app.)

The fix is not "more ads." It is **removing friction**, **turning every buyer into a distribution channel**, and **keeping the transaction in-app so the commission is captured**.

---

## 1b. Beldify is a MARKETPLACE, not a single-brand store

This reframes the whole plan. A landing page has one product and one audience to convince. A marketplace is **two-sided** — it needs both **supply** (sellers with products) and **demand** (buyers) — and that creates leverage a landing page never has:

### Sellers are the marketing army (the growth multiplier)
Every seller already has their own WhatsApp Status / Instagram / TikTok / Facebook following, and is *already* marketing — just selling solo and keeping 100%. **We don't have to buy all the buyer traffic ourselves.** We make Beldify a better place for a seller to point their existing audience than selling solo → recruit the seller → their audience flows in for free. **Top-priority channel = seller acquisition + seller tools.**

### Why a seller chooses Beldify over COD-in-DMs (the value we must deliver)
This is the flip side of the commission worry. A seller pays commission only if Beldify makes them sell *more* than they would alone. We must give them things they **can't** do solo:
- **Trust/warranty for their buyers** — COD guarantee, returns, disputes → higher conversion on *their own* traffic.
- **A real shop page + catalog** instead of a disappearing WhatsApp Status.
- **Cross-discovery** — buyers from *other* sellers' traffic find them too (network effect).
- **Order tracking, payments, reviews, social proof.**

If Beldify makes the seller sell more, they happily pay the cut **and** bring their crowd. If not, they disintermediate. The product's job is to keep that inequality true.

### Liquidity / chicken-and-egg — go deep, not wide
A marketplace feels dead if a buyer lands and sees 3 products in their city/category. Early marketing must keep **supply and demand dense in a few verticals + cities**, not thin everywhere:
- Pick **2–3 categories** (e.g. caftans, wedding, jewelry) and **1–2 cities** to make *alive* first.
- Concentrate seller recruitment + buyer ads there until it has momentum, then expand.
- "Shops near you / in your city" surfaces local density and makes it feel populated.

## 2. Strategy — 3 Layers

### ⚠️ Non-negotiable rule — protect the commission (anti-disintermediation)

**WhatsApp brings people IN and spreads products OUT. WhatsApp is NEVER the checkout.**

The fatal mistake for a marketplace: if a buyer taps "Order on WhatsApp" and lands in the *seller's* DMs before paying, they do a COD side-deal and Beldify earns **nothing**. Repeat that a few times and the platform is just a free lead-gen tool sellers abuse.

Therefore:

| Action | Allowed? | Why |
|---|---|---|
| Share a **product link** to WhatsApp | ✅ Yes | Link goes *back to the app*; buyer still checks out in Beldify. Pure marketing. |
| In-app **Buy now → guest checkout → COD** | ✅ Yes — the ONLY buy path | Order + **commission recorded** before anyone is contacted. |
| Notify the **seller via WhatsApp AFTER** an in-app order | ✅ Yes | Seller gets the familiar ping; commission already locked. |
| Expose seller's **raw WhatsApp/phone before purchase** | 🚫 No | This is the leak. Pre-sale questions go through **in-app messaging** (exists in `communityService`) or a **masked number** only. |

**The "warranty" that makes buyers choose in-app:** buyer protection — COD guarantee, returns, dispute resolution — **applies only to orders placed in Beldify**. Side-deals get no protection. Seller terms ban off-platform circumvention. In-app must be the *safer* choice, not just the available one.

### Layer 1 — Acquisition: bring Beldify TO them (don't wait for them to come)

| Tactic | What it is | Effort |
|---|---|---|
| **Share-to-WhatsApp** | One-tap share on every product, shop, and OpenSouk post → shares the **product link back to the app**. Buyers spread products for free; sale still closes in-app. | Low — code |
| **Seller WhatsApp notification on order** | When an in-app order is placed, ping the seller on WhatsApp. Familiar channel, **after** commission is captured. | Low–Med — backend |
| **Seller link-in-bio page** | A clean public page each seller pastes into TikTok/Instagram bio → their Beldify shop. | Low — code |
| **QR codes** | Sellers print a QR (packaging, physical shop, flyers) → scan lands on their Beldify shop. | Low — code |
| **WhatsApp Business catalog + Status** | Sellers post daily products to Status (Stories people already check). | Process, not code |
| **Facebook buy/sell groups** | Sellers post products with a deep link back to their Beldify shop. | Process |
| **TikTok / Reels** | Short product video → "رابط فالبيو". | Process |

> **Why this works:** Our deep links already work from a direct URL with the buy button visible (`products/[id]/page.tsx`). So every link we put into social lands the user exactly where they can act. We just need to *generate* those links everywhere.

### Layer 2 — Conversion: remove every friction point on-site

| Friction today | Fix |
|---|---|
| **Forced login to checkout** | **Guest checkout** — phone number + COD. Account creation becomes *optional, offered after* the first order ("save your details for next time?"). |
| Trust | Lead with **الدفع عند الاستلام (COD)** badges — the payment method Moroccans trust. Already supported for Morocco ≤500 MAD; make it the hero option and widen where viable. |
| Language | Darija + Arabic are complete (`ma.json`, `ar.json`) — keep Darija-first, MAD prices, no English walls. |
| Contact | Click-to-call / click-to-WhatsApp the **seller** directly on the product. |
| Speed | Mobile-first, fast load — buyers are on phones, sometimes slow connections. PDP is already SSR; keep it lean. |

### Layer 3 — Retention & virality: make OpenSouk feel like the apps they already know

**Important reality:** Today OpenSouk is a **custom-order request board** (buyer posts "I want a caftan like this, budget X" → sellers send proposals). It is *not* a social feed — no likes, comments, or external sharing (`types/community.ts`, `communityService.ts`).

Two paths (not mutually exclusive):

- **Quick path (now):** Add **share-to-WhatsApp** to every OpenSouk request + seller proposal, and surface response counts / social proof. A buyer shares their request to their own WhatsApp groups → more sellers, more activity, free reach.
- **Bigger path (later):** Build a true **product/seller social feed** — vertical scroll of product photos + short seller videos (Status-style), likes, comments, and one-tap share. This is the muscle memory of Instagram/Facebook, which our users already have. This is a larger build (new endpoints + feed UI) and should be its own spec.

---

## 3. Quick Wins — ship first (highest ROI / lowest effort)

Ordered by impact-per-effort. All are real gaps confirmed in the codebase.

1. **Share-to-WhatsApp / Web Share** on PDP, shop, and OpenSouk posts — `navigator.share()` with `wa.me` fallback. Shares the **product link back to the app** (never a seller's contact). This is the safe growth lever.
   *Files:* `products/[id]/page.tsx`, `shops/[name]/page.tsx`, `community/page.tsx`.
2. **Guest checkout + COD-first** — remove the `auth_required` wall; collect phone + address; offer account creation *after* order. **This is what captures the commission** from social traffic, so it pairs directly with the share buttons.
   *Files:* `checkout/page.tsx:418`, `CartContext.tsx`, backend order endpoint.
3. **Seller WhatsApp notification on new order** — after an in-app order is placed, notify the seller on WhatsApp. Familiar channel, fires *after* commission is locked.
   *Files:* backend order-created event/notification; needs seller WhatsApp field (opt-in).
4. **Seller link-in-bio landing page** — `/shop/<name>` styled as a clean, shareable bio page sellers put in TikTok/Insta.
   *Files:* enhance `shops/[name]/page.tsx` or a dedicated public route.
5. **QR code per shop/product** — generate a downloadable QR that encodes the deep link, for sellers to print.
   *Files:* shop/PDP page + a small QR util.
6. **OG / link-preview tags** — when a product link is pasted into WhatsApp/Facebook, it must show image + title + price. Verify/implement OpenGraph meta on PDP and shop routes.

> **Bonus enabler:** add a **WhatsApp option to `FloatingSupportButton.tsx`** (currently phone/email/placeholder chat only) — gives every visitor a familiar escape hatch to a human.

---

## 4. Content & Channel Playbook (process, runs in parallel with code)

- **WhatsApp Status** — sellers post 2–3 products/day. Treat it like a daily shop window.
- **Facebook groups** — identify the 10 biggest Moroccan buy/sell groups per category (caftans, shoes, jewelry, etc.). Sellers post with Beldify deep links.
- **TikTok/Reels** — 15–30s product videos, "link in bio" → seller's Beldify page. Partner with 3–5 micro-influencers per vertical (caftan, wedding, jewelry).
- **Referral** — "share this product, your friend gets X% off first order." Built on the share buttons.
- **Social proof everywhere** — "X people bought this", photo reviews, "shops near you / shops in your city".

---

## 5. KPIs to watch

| Metric | Why |
|---|---|
| **Social → site click-through** | Are deep links working as entry points? |
| **Guest-checkout conversion rate** | Did removing the login wall raise sales? |
| **Share button usage** | Is free distribution kicking in? |
| **% orders via COD** | Trust signal for the segment. |
| **WhatsApp-initiated orders** | Is the trusted channel converting? |
| **OpenSouk posts shared externally** | Is the community pulling in reach? |

---

## 6. Build Sequence (recommended)

1. **Sprint 1 (enablers):** WhatsApp order button + Share-to-WhatsApp + OG tags. *(Frontend-led, small backend for seller WhatsApp number.)*
2. **Sprint 2 (conversion):** Guest checkout + COD-first. *(Backend + Frontend.)*
3. **Sprint 3 (distribution):** Link-in-bio page + QR codes.
4. **Sprint 4 (bigger bet):** OpenSouk social feed (own spec).

Each sprint is shippable on its own and improves a distinct number (reach → conversion → reach → retention).

---

## 7. Risks / Notes

- **Seller WhatsApp numbers** — to put an order/contact button on a product, the seller's WhatsApp must be stored & verified. Need a backend field + opt-in (privacy).
- **COD abuse / fake orders** — guest checkout lowers friction but raises fake-order risk. Mitigate with phone OTP verification on first guest order.
- **Spam in groups** — coach sellers on group rules; over-posting gets them banned. Provide ready-made, non-spammy post templates.
- **OG image generation** — product images must be correctly sized for WhatsApp/FB previews (1200×630-ish or square).

---

*This is a living document. Update KPIs and sprint status as we ship.*
