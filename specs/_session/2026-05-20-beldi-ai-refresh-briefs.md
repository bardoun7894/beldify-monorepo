# Beldi × AI Refresh — Implementation Briefs
**Date:** 2026-05-20
**Design system reference:** `/Users/mohamedbardouni/projects/beldify/DESIGN.md` v2.0
**Verify with:** `cd beldify-frontend && npx tsc --noEmit --skipLibCheck` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → 200
**CF purge required at ship time** — Cloudflare edge caches Next.js chunks. After deploy: purge `www.beldify.com/*` via CF dashboard or `curl -X POST .../purge_cache`.

---

## Cluster 1 — Homepage (P0 — over-invest)

**File:** `beldify-frontend/src/app/page.tsx`
**Priority:** P0. This is the brand anchor. Every delta below must land before any other cluster.

### 1.1 Fix indigo shade on hero CTA

**Line 104:** `bg-indigo-600` → `bg-indigo-700`

```tsx
// BEFORE
className="... bg-indigo-600 hover:bg-indigo-700 ..."

// AFTER
className="... bg-indigo-700 hover:bg-indigo-800 ..."
```

No logic change. className only.

### 1.2 Wrap hero copy in t()

**Lines 88–99:** Eyebrow label, headline, body paragraph are bare string literals. Must go through `t()`.

```tsx
// BEFORE (approximate)
<span>New arrivals from Moroccan ateliers</span>
<h1>Discover authentic <span className="text-indigo-700">Moroccan fashion</span></h1>
<p>Handcrafted djellabas, caftans and zellige accessories.</p>

// AFTER
<span>{t('hero.eyebrow', 'New arrivals from Moroccan ateliers')}</span>
<h1>
  {t('hero.headline', 'Discover authentic')}{' '}
  <span className="text-indigo-700">
    {t('hero.headlineAccent', 'Moroccan fashion')}
  </span>
</h1>
<p>{t('hero.body', 'Handcrafted djellabas, caftans and zellige accessories.')}</p>
```

Note `djellaba` (not `kandora`) — approved term per DESIGN.md §1.

### 1.3 Remove "Marrakech" from trust/souk copy (P0 brand drift)

**Line 225:** `"Browse verified ateliers across Fez, Marrakech, Casablanca."` →

```tsx
{t('souk.tagline', 'Browse verified ateliers across Tetouan, Fez, Casablanca.')}
```

Tetouan leads the list.

### 1.4 Reorder atelier cards — Tetouan first (P0 brand drift)

**Lines 277–281:** The atelier card array currently slots "Maison Marrakech" second and "Tetouan Tailors" fourth. Swap to put Tetouan first.

```tsx
// BEFORE (conceptual order)
const ateliers = [
  { name: 'Dar Fes Atelier', city: 'Fez', ... },
  { name: 'Maison Marrakech', city: 'Marrakech', ... },
  { name: 'Casablanca Couture', city: 'Casablanca', ... },
  { name: 'Tetouan Tailors', city: 'Tetouan', ... },
];

// AFTER
const ateliers = [
  { name: 'Maison Tetouan', city: 'Tetouan', ... },   // slot 1 — Tetouan leads
  { name: 'Dar Fes Atelier', city: 'Fez', ... },
  { name: 'Casablanca Couture', city: 'Casablanca', ... },
  { name: 'Dar Marrakech', city: 'Marrakech', ... },  // Marrakech stays, just not slot 1
];
```

If "Maison Marrakech" is a real seeded entity, rename to "Dar Marrakech" so Tetouan reads as the cultural anchor.

### 1.5 Add bilingual etymology hero lockup (new §12 pattern)

Insert immediately below the eyebrow pill in the hero section, before the H1 headline. Exact JSX from DESIGN.md §12:

```tsx
{/* Bilingual etymology lockup — intentionally bilingual regardless of page locale */}
<div className="flex items-baseline gap-3 flex-wrap mb-4" aria-label="Beldify — Beldi reimagined">
  <span dir="rtl" lang="ar" className="font-arabic text-3xl font-semibold text-gray-900 leading-tight">
    بلدي
  </span>
  <span className="text-amber-400 text-2xl select-none" aria-hidden="true">×</span>
  <span
    dir="ltr"
    lang="en"
    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
    className="text-3xl font-bold text-indigo-700 italic leading-tight"
  >
    ify
  </span>
</div>
<p className="text-sm text-gray-600 mb-6">
  {t('brand.etymologySubtitle', 'beldi (بلدي) — local, artisan, of the country')}
</p>
```

Do not translate the etymology subtitle — it explains the name.

### 1.6 Add AI-assist chip to hero (new §11 pattern)

Append after the trust strip (`<TrustStrip />` or equivalent). One customer-side chip row:

```tsx
{/* AI personalisation shelf — appears only when user has browsing history */}
{hasHistory && (
  <div className="flex items-center gap-2 mt-6 flex-wrap">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200 animate-fade-in-up">
      <Sparkles size={12} className="shrink-0" />
      {t('ai.chip.styledForYou', 'AI styled for you')}
    </span>
  </div>
)}
```

Import: `import { Sparkles } from 'lucide-react';`

LTR: chip floats left (default). RTL: flex container reverses naturally with parent `dir="rtl"`.

### 1.7 New seller strip section (after Tailoring CTA strip, before The Journal)

Insert a new `<section>` block:

```tsx
{/* Seller strip — for artisans and ateliers */}
<section className="py-16 bg-indigo-900 text-white relative overflow-hidden">
  {/* Zellige motif overlay — 10% opacity, pointer-events-none */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: "url('/motifs/zellige-tile.svg')",
      backgroundSize: '120px 120px',
      backgroundRepeat: 'repeat',
      opacity: 0.10,
    }}
    aria-hidden="true"
  />
  <div className="relative max-w-7xl mx-auto px-6">
    <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
      {t('sellerStrip.eyebrow', 'For artisans & ateliers')}
    </p>
    <h2
      className="text-3xl sm:text-4xl font-bold mb-4 max-w-xl"
      style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
    >
      {t('sellerStrip.headline', 'Sell your craft. Reach Morocco and beyond.')}
    </h2>
    <p className="text-indigo-200 text-base mb-8 max-w-lg">
      {t('sellerStrip.body', 'Beldify gives Tetouani ateliers and independent artisans a professional storefront with AI-assisted listings, order management, and direct buyer messaging.')}
    </p>
    <div className="flex items-center gap-3 flex-wrap">
      <a
        href="https://pro.beldify.com"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-gray-900 font-semibold text-sm hover:bg-amber-300 transition-colors duration-200"
      >
        {t('sellerStrip.cta', 'Open your boutique')}
      </a>
      {/* AI seller chip */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-700 text-white text-xs font-medium">
        <Sparkles size={12} className="shrink-0" />
        {t('ai.chip.aiListings', 'AI-assisted listings')}
      </span>
    </div>
  </div>
</section>
```

Position: after the existing Tailoring CTA strip (indigo-900 block), before the Journal section. The two dark strips should NOT be adjacent — ensure the journal section or a sand-background row separates them visually. If needed, swap order: Journal → Seller Strip, or insert an amber-50/40 spacer between them.

**Note:** `/motifs/zellige-tile.svg` must exist in `beldify-frontend/public/motifs/`. If the motif SVG is not yet created, replace with `style={{ display: 'none' }}` and file a TODO comment — do not remove the element scaffolding.

### Verification — Cluster 1

```bash
cd beldify-frontend
npx tsc --noEmit --skipLibCheck
# Expected: 0 errors

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
```

Visual checks:
- [ ] Hero CTA is `indigo-700` (not `indigo-600`)
- [ ] "Tetouan" appears first in atelier list
- [ ] "Marrakech" does NOT appear in the souk/trust tagline
- [ ] Etymology lockup renders — AR right-to-left, EN italic Playfair, amber × separator
- [ ] AI chip renders (only if `hasHistory` condition true in dev)
- [ ] Seller strip is present and dark indigo (not adjacent to tailoring strip)

---

## Cluster 2 — Category / Souk (P1 — P0 rebuild needed)

**File:** `beldify-frontend/src/app/category/[slug]/page.tsx`
**Priority:** This page has deep structural drift. Treat as a rebuild of the styling layer, not a patch.

### 2.1 Replace all wrong card backgrounds (systemic — 3 instances)

**Lines 136, 176, 201:** `bg-white rounded-xl shadow-md border border-gray-200` appears on the page wrapper, sidebar, and main content area.

Replace every instance:
```tsx
// BEFORE
className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"

// AFTER
className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200"
```

If `overflow-hidden` is needed for clipping content, add it back: `bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden`.

### 2.2 Remove dual accent bar (P1 anti-pattern)

**Lines 147–149:** The horizontal half-amber / half-indigo `h-1.5` bar is not in DESIGN.md and violates the single-accent rule. Remove it entirely.

```tsx
// DELETE these two lines:
<div className="h-1.5 bg-amber-500 w-1/2" />
<div className="h-1.5 bg-indigo-600 w-1/2" />
```

If a visual separator is needed between the hero band and the product grid, use `<div className="h-px bg-amber-200 my-4" />` (single amber hairline, per §8).

### 2.3 Fix error state color

**Line 113:** `text-red-500` → `text-rose-700` for error messages. `red-500` is not in palette. `rose-700` maps to Tetouani Garnet (sale/error use only, per §2).

```tsx
// BEFORE
<p className="text-red-500">...</p>

// AFTER
<p className="text-rose-700">...</p>
```

### 2.4 Replace @heroicons with Lucide

The category page imports `@heroicons/react/24/outline` (FunnelIcon, AdjustmentsHorizontalIcon, ArrowPathIcon). Per DESIGN.md §9, Lucide is the single icon library.

```tsx
// BEFORE
import { FunnelIcon, AdjustmentsHorizontalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// AFTER
import { SlidersHorizontal, Settings2, RefreshCw } from 'lucide-react';
// FunnelIcon → SlidersHorizontal
// AdjustmentsHorizontalIcon → Settings2
// ArrowPathIcon → RefreshCw
```

Update all JSX usages (className props pass-through should still work, just update the component names).

### 2.5 Fix text color for filter labels

**Lines 180, 281:** `text-indigo-800` on body text / filter labels. Indigo-800 is a CTA hover state, not a text token. Replace with `text-gray-900` (primary body) or `text-indigo-700` if intentional indigo branding on the label.

```tsx
// Labels that describe categories
className="text-indigo-800 font-medium"
// → 
className="text-gray-900 font-medium"
```

### 2.6 Add editorial hero band to category page

Category pages should open with an indigo editorial strip (like the homepage souk section header). After the `<header>` / breadcrumb, insert:

```tsx
<div className="bg-indigo-700 text-white py-12 px-6">
  <div className="max-w-7xl mx-auto">
    <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-2">
      {t('category.eyebrow', 'Beldify Souk')}
    </p>
    <h1
      className="text-4xl sm:text-5xl font-bold"
      style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
    >
      {categoryName}
    </h1>
  </div>
</div>
```

RTL: The parent page already handles dir via `useDirection()`. The eyebrow + headline will right-align automatically.

### Verification — Cluster 2

```bash
cd beldify-frontend
npx tsc --noEmit --skipLibCheck

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/category/djellaba
# Expected: 200
```

Visual checks:
- [ ] No `bg-white rounded-xl shadow-md border border-gray-200` anywhere on this page
- [ ] Dual accent bar gone
- [ ] Error state uses `text-rose-700` (not `text-red-500`)
- [ ] No `@heroicons` imports in this file
- [ ] Category opens with indigo editorial band

---

## Cluster 3 — Product Detail / PDP (P1)

**File:** `beldify-frontend/src/app/products/[id]/page.tsx`
**Status:** Largely compliant. Targeted fixes only.

### 3.1 Fix color swatch border

**Around line 1358:** Color swatch buttons use `border-gray-200`. For an active/hover ring, use amber:

```tsx
// BEFORE
className="... border border-gray-200 ..."

// AFTER — inactive swatch
className="... ring-1 ring-amber-200 ..."

// AFTER — active/selected swatch
className="... ring-2 ring-amber-500 ..."
```

### 3.2 Add AI styling chip to "Complete the Look" / "Styled for you" shelf

If a "styled for you" or "complete the look" row exists on PDP (check around lines 1400–1500), prepend an AI chip heading:

```tsx
<div className="flex items-center gap-2 mb-4">
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
    <Sparkles size={12} className="shrink-0" />
    {t('pdp.aiStyling', 'AI styled for you')}
  </span>
</div>
```

If no such shelf exists, skip — do not add an empty section.

### 3.3 Verify Tetouan provenance in product metadata

If the product has a `seller_city` or `region` field in the API response, render a small provenance line below the seller name:

```tsx
{product.seller_city && (
  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600 mt-1">
    {product.seller_city} · {t('pdp.artisanMade', 'artisan made')}
  </p>
)}
```

This uses the AI metadata caption typography from DESIGN.md §3, repurposed for provenance. Purely additive — no existing code changes.

### 3.4 Verify PDP uses indigo-700 (not indigo-600) for Add to Cart

Scan for any remaining `indigo-600` in this file and replace with `indigo-700`. One-liner:

```bash
grep -n 'indigo-600' beldify-frontend/src/app/products/\[id\]/page.tsx
```

Replace each hit: `bg-indigo-600` → `bg-indigo-700`, `text-indigo-600` → `text-indigo-700`, `border-indigo-600` → `border-indigo-700`.

### Verification — Cluster 3

```bash
cd beldify-frontend
npx tsc --noEmit --skipLibCheck

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/products/1
# Expected: 200

grep -n 'indigo-600' beldify-frontend/src/app/products/\[id\]/page.tsx
# Expected: 0 lines
```

Visual checks:
- [ ] Active color swatch has `ring-2 ring-amber-500`
- [ ] Add to Cart is indigo-700
- [ ] AI chip visible on styling shelf (if shelf exists)
- [ ] Provenance caption renders in `font-mono text-[10px]` if seller_city is present

---

## Cluster 4 — Cart & Checkout (P1)

**Files:**
- `beldify-frontend/src/app/cart/page.tsx`
- `beldify-frontend/src/app/checkout/page.tsx`

**Status:** Both files are largely compliant. Targeted fixes only.

### 4.1 Cart — no active conflicts

Cart page correctly uses `bg-amber-50/40`, `rounded-2xl ring-1 ring-amber-200`, `indigo-700` CTAs, and the bespoke strip radial gradient. The `hover:text-rose-600` on delete is acceptable (destructive action = Tetouani Garnet territory).

Additive only:

```tsx
{/* If cart has items, show AI suggestion chip above the "You might also like" row */}
{cartItems.length > 0 && (
  <div className="flex items-center gap-2 mt-8 mb-3">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
      <Sparkles size={12} className="shrink-0" />
      {t('cart.aiSuggestions', 'Complete the look')}
    </span>
  </div>
)}
```

### 4.2 Checkout — fix minor palette drifts

**Completed step checkmark:** Currently `bg-green-600`. Replace with `bg-indigo-700` (active state token) for completed steps. Stepper pattern: completed = `bg-indigo-700`, active = `bg-indigo-700 ring-2 ring-amber-300`, inactive = `bg-gray-200`.

```tsx
// BEFORE
className="bg-green-600 text-white rounded-full ..."

// AFTER
className="bg-indigo-700 text-white rounded-full ..."
```

**Free shipping text:** `text-green-600` → `text-amber-600`. Green is not in palette; amber is the accent for good news.

```tsx
// BEFORE
<span className="text-green-600 font-medium">Free shipping</span>

// AFTER
<span className="text-amber-600 font-medium">{t('checkout.freeShipping', 'Free shipping')}</span>
```

**Input border radius:** `rounded-lg` inputs → `rounded-2xl` per §4. This is P3 but worth doing in the same pass:

```tsx
// BEFORE
className="... rounded-lg border ..."

// AFTER
className="... rounded-2xl border ..."
```

Only apply to form `<input>`, `<select>`, `<textarea>` elements — not to inline badges or stepper circles.

### 4.3 Checkout — verify Tetouan pickup label

**Line 772 area:** "Pickup — Tetouan" is already correct. Confirm it is wrapped in `t()`:

```tsx
// Should be:
{t('checkout.pickupTetouan', 'Pickup — Tetouan')}
```

If it is a bare string, wrap it. No visual change, i18n correctness only.

### Verification — Cluster 4

```bash
cd beldify-frontend
npx tsc --noEmit --skipLibCheck

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/cart
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/checkout
# Expected: 200

grep -n 'bg-green-600\|text-green-600' beldify-frontend/src/app/checkout/page.tsx
# Expected: 0 lines
```

Visual checks:
- [ ] Completed stepper steps are indigo-700 (not green-600)
- [ ] Free shipping indicator is amber-600 (not green-600)
- [ ] Form inputs have rounded-2xl
- [ ] AI "Complete the look" chip visible in cart (if items present)

---

## Cross-cluster reminders

1. **Vitest is broken** — do not run `npm test`. Use `npx tsc --noEmit --skipLibCheck` for type safety, and manual `curl` for route health.
2. **Cloudflare purge at ship time** — all four clusters ship as one CF purge of `www.beldify.com/*`. Do not purge before all clusters are merged.
3. **No new image hosts** — the whitelist is locked: `pro.beldify.com`, `api.beldify.com`, `www.beldify.com`, `eu2.contabostorage.com`, `images.unsplash.com`.
4. **`/motifs/` SVGs** — Cluster 1.7 (seller strip zellige overlay) requires `beldify-frontend/public/motifs/zellige-tile.svg`. If not yet created, add a TODO comment and keep the container element. Do not remove the structural scaffolding.
5. **`Sparkles` import** — All four clusters add `Sparkles` from `lucide-react`. Confirm it is not already imported before adding the import line.
6. **RTL** — Every new string goes through `t()`. Every new layout uses `useDirection()` or relies on parent `dir` attr. Never hard-code `direction: rtl`.
7. **Touch targets** — Any new interactive element (AI chip click, seller strip CTA) must be minimum 44×44px tap target on mobile. Pad with `min-h-[44px] min-w-[44px]` if the chip is too small.
