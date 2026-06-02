# Product

## Register

product

> Beldify is split across an editorial storefront (`www.beldify.com`), a seller dashboard (`pro.beldify.com`), and an admin panel. The **default** register for design work is **product** — the seller and admin tool surfaces where design serves throughput, clarity, and confidence. The storefront homepage and brand/marketing surfaces are the exception: treat those as **brand** register per-task when the work is hero, editorial, or campaign-shaped. When in doubt on a storefront shopping flow (PLP, PDP, cart, checkout), it is product too — design serves the task of buying.

## Users

Beldify is a three-sided marketplace, and the design must hold all three without compromising the operator tools that are the default surface.

- **Artisan sellers (primary operators of the default surface).** Tetouani and wider-Morocco craftspeople and small sellers managing listings, photos, orders, and payouts on `pro.beldify.com`. Often non-technical, frequently on a phone, sometimes on a patchy connection. Their job: get a product listed, understand an order, get paid — without a manual. Bilingual AR/FR, Arabic-first comfort.
- **Admins / operators.** Internal staff running catalog, sellers, moderation, and orders through the admin panel. Their job: see the state of the marketplace and act on it fast across dense tables and dashboards. Speed and legibility beat decoration.
- **Shoppers (the end beneficiaries the tools exist to serve).** A blended audience — in-country Moroccan buyers (mobile-first, price- and trust-sensitive, AR/FR) and diaspora / heritage buyers abroad (AR/EN, story-driven, higher AOV, shipping-aware). They buy caftans, djellabas, and artisan goods. They never see the tools, but every seller/admin screen exists to make their experience better.

The job to be done across all three: **make Moroccan craft legible, trustworthy, and easy to transact — for the maker, the operator, and the buyer.**

## Product Purpose

Beldify = *Beldi* (بلدي — local, traditional, artisan, authentic) + *-ify* (the modernising suffix). The product makes heritage craft accessible and the artisan's work legible online: a multi-seller marketplace where Tetouani and Moroccan craftspeople sell, with AI assistance (listing quality, photo enhancement, styling, size guidance) layered on top.

Why it exists: artisan craft is hard to find, hard to trust online, and hard for the maker to present well. Beldify gives the maker professional tooling, the buyer editorial confidence, and the operator control.

Success looks like:
- A non-technical seller lists a product, fills an order, and understands their payout without help.
- An admin can read the state of the marketplace at a glance and act in one or two clicks.
- A shopper trusts what they're buying enough to complete checkout — in-country on a mid-range Android, or in the diaspora drawn by the story.

## Brand Personality

Three words: **artisan, editorial, confident.**

- **Voice:** Confident but humble. Celebrates craft, not luxury for its own sake. Short, editorial sentences. Heritage and durability over hype. ("Beldi (بلدي), reimagined." "Worn for centuries. Made for today.") No marketing fluff — never "Revolutionary!", "Best in class!", "seamless", "supercharge".
- **Bilingual by default.** EN/AR/FR with full RTL. Arabic is first-class, never an afterthought or a flipped LTR layout.
- **Place-anchored.** Tetouan is the cultural anchor — tarz-tetouani embroidery, zellige, caftan tetouani, medina whitewash + cobalt. Cultural references are specific, not generic "Moroccan."
- **AI as a quiet assistant**, not a gimmick. Surfaced as discreet, consistent chips (Lucide `Sparkles`), clearly distinct from trust badges and category chips. The AI augments the artisan; it never replaces or upstages the craft.
- On the **tool surfaces**, personality is dialed toward calm competence: the warmth lives in the palette and type, but a seller filling an order should feel guided and unhurried, not marketed to.

## Anti-references

What Beldify must never look or read like:

- **Generic SaaS.** No purple→blue gradient buttons, no blue-to-cyan gradients, no gray-on-gray flat dashboards. The default admin/seller tool must not read as a Bootstrap/PixInvent template.
- **Luxury-for-its-own-sake e-commerce.** Not a cold, minimalist, all-white luxury boutique that hides the maker. The artisan and the place stay visible.
- **AI slop signals.** No gradient text (`background-clip: text`), no decorative glassmorphism, no tiny uppercase tracked eyebrow above every section, no numbered `01 / 02 / 03` scaffolding, no identical icon-card grids repeated endlessly, no hero-metric template.
- **Flattened heritage.** No stock "generic Moroccan" imagery, no lamp/tagine clichés standing in for craft, no zellige used as loud foreground decoration (motifs are ambient, 10–15% opacity, background only).
- **Rose/red as a brand color.** Tetouani Garnet (`#be123c`) is reserved for sale tags and error states only.
- **RTL as an afterthought.** No hard-coded LTR layouts, no Arabic crammed into a Latin type system, no untranslated strings leaking through.

## Design Principles

1. **The artisan stays visible.** Every surface, including operator tools, exists to make a maker's craft legible and sellable. Design choices that hide the maker or the place are wrong even when they look clean.
2. **Heritage is specific, modernity is quiet.** Anchor in real Tetouani craft (named, not generic); let AI and tooling be discreet assistants. The fusion is "Beldi × AI," not "AI with a Moroccan skin."
3. **Bilingual and RTL are first-class, not retrofitted.** Arabic parity is a correctness requirement, not a nice-to-have. A layout isn't done until it's right in RTL.
4. **Serve the task on tools, tell the story on brand.** Seller/admin screens optimize for clarity and throughput; storefront/marketing surfaces carry the editorial voice. Don't decorate a workflow or flatten a hero.
5. **Built for the real device and network.** A mid-range Android on a slow Moroccan connection is the design target, not an edge case. Performance and legibility are accessibility concerns, not afterthoughts.

## Accessibility & Inclusion

- **WCAG 2.1 AA** as the floor: body text ≥4.5:1, large/bold ≥3:1, placeholders held to the same bar. The recurring failure to police: muted gray text on warm tinted near-white — bump toward ink when close.
- **Full Arabic RTL parity** is non-negotiable. Layouts, components, and motion must be correct under `dir="rtl"`; never hard-code directional layout — use the `useDirection()` hook. Per-element `dir`/`lang` on bilingual lockups for correct screen-reader pronunciation.
- **Low-end mobile and slow networks are a primary constraint, not an edge case.** Treat performance (LCP, bundle size, image weight via `next/image`) as an accessibility requirement. The mid-range Android shopper and the seller on a patchy connection set the budget.
- **Reduced motion honored everywhere.** Every animation needs a `prefers-reduced-motion: reduce` alternative (crossfade or instant). Already wired globally in `globals.css`; new motion must respect it.
- **Keyboard and focus.** Interactive elements reachable and visibly focusable; semantic z-index scale, no focus traps in modals/dropdowns.
