# Beldify Atlas — Design System

> **Version:** 2.0 (Beldi × AI fusion, Tetouan-anchored)
> **Tone:** Editorial Moroccan marketplace. Warm, refined, confident.
> **Signature color:** Atlas Indigo `#4338ca` paired with Saffron Amber `#f59e0b`.
> **Live preview:** https://www.beldify.com/design-preview/homepage.html

This file is the authoritative design system for the Beldify storefront and admin. Every page on `www.beldify.com`, `pro.beldify.com`, `api.beldify.com` and any future surface must adhere to these tokens and patterns. Do not invent a new direction — extend this one.

---

## 1. Voice

**Etymology first.** Beldify = *Beldi* (بلدي) + *-ify*. "Beldi" is a Darija word meaning local, traditional, artisan, authentic — the kind your grandmother made, the kind that outlasts trends. "-ify" is the modernising suffix that says we augment that craft with intelligence. Together: make the local timeless, make the artisan legible, make heritage accessible.

Approved brand voice lines:
- "Beldi (بلدي), reimagined."
- "Craft meets code. Heritage meets now."
- "The artisan's workshop, online."
- "Worn for centuries. Made for today."

Voice rules:
- Confident but humble. Celebrates craft, not luxury for its own sake.
- Bilingual EN / AR with full RTL support. Arabic is first-class, never an afterthought.
- Short, editorial sentences. Avoid marketing fluff ("Revolutionary!", "Best in class!").
- Headlines hint at heritage and durability.
- Tetouan is the cultural anchor city — reference Tetouani crafts, medina, tarz-tetouani embroidery, caftan tetouani, zellige. Prefer "djellaba" over "kandora" as the garment term.

---

## 2. Palette

The palette uses Tailwind's `indigo` and `amber` scales — already present in `beldify-frontend/tailwind.config.js` (`primary` = amber, `secondary` = indigo). Use those token names where possible. Concrete hex values:

| Role | Token | Hex | Tailwind |
|---|---|---|---|
| Page canvas | Neutral Near-White | `#fcfcfc` | `bg-background` / `bg-canvas` |
| Section bands / alternates | Cool Gray Wash | `#f9fafb` | `gray-50` |
| Primary action / brand | Atlas Indigo | `#4338ca` | `indigo-700` |
| Primary CTA hover | Indigo Deep | `#3730a3` | `indigo-800` |
| Editorial dark surface | Indigo Night | `#1e1b4b` | `indigo-950` |
| Accent / badges / amber pills | Saffron Amber | `#f59e0b` | `amber-500` |
| Soft accent (chips, warnings — never page/section canvas) | Amber Sand | `#fffbeb` | `amber-50` |
| Warm tint highlights | Amber Honey | `#fcd34d` | `amber-300` |
| Body text | Ink | `#111827` | `gray-900` |
| Muted text | Slate | `#4b5563` | `gray-600` |
| Hairlines | `#e5e7eb` (gray-200) on light, `rgba(255,255,255,0.1)` on indigo dark |

**60-30-10 rule (revised 2026-06-10):** ~60% neutral canvas (near-white + gray-50 bands), ~30% indigo brand surfaces (hero, Open Souk band, tailoring CTA, footer), ~10% saffron amber accents (CTAs, badges, prices, status chips). The former parchment canvas (`#fbf9f4`) and amber-tinted card hairlines (`amber-200`) are retired — they cast the whole page yellow. Amber is an accent, never a canvas.

**Tetouani Garnet** (formerly "Marrakech red") — `rose-700` / `#be123c` — reserved for sale tags, error states, and tarz-tetouani embroidery silk accent references ONLY. It evokes the crimson silk thread of Tetouani hand-embroidery, not a brand color.

**Tetouani cobalt accents** — for editorial strips on pro.beldify.com seller surfaces and cultural callouts, the following are permitted as supporting tones (never as primary CTA color):
- `indigo-900` — deep medina blue
- `sky-900` — northern Atlantic coastal reference
- `teal-700` — zellige glaze mid-tone
- `emerald-700` — garden / riad foliage

Do NOT use:
- Purple gradients on white
- Generic blue-to-cyan SaaS gradients
- Gray-on-gray flat surfaces
- Rose / red as primary (Tetouani Garnet is reserved for sale tags and error states ONLY)

---

## 3. Typography

| Role | Font | Weights | Tailwind class |
|---|---|---|---|
| Display / headlines | **Playfair Display** (serif, italic option) | 400, 600, 700, 800 | inline `style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}` (Next font var: `--font-playfair`) |
| Body | Poppins | 400, 500, 600 | default `font-sans` |
| Arabic | Rubik | 400, 500, 600 | `font-arabic` |
| Kicker / eyebrow | Poppins uppercase | 500 | `text-xs uppercase tracking-[0.18em] text-amber-700 font-medium` |
| AI metadata caption | Poppins mono fallback | 400 | `font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600` |

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`. New pages should *not* re-import them — just use the inline style for serif headlines.

Hero scale: `text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight`.
Section title scale: `text-3xl sm:text-4xl font-bold`.

**AI metadata caption** is used for AI-generated provenance lines beneath product images or AI-suggested content blocks:
```tsx
<p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600 mt-1">
  AI styled · beldify assistant
</p>
```

---

## 4. Shape & Spacing

- Cards / buttons / inputs: `rounded-2xl` (16px). Avoid square 4px corners.
- Pills (badges, chips, eyebrow tags): `rounded-full`.
- Section vertical rhythm: `py-16` mobile, `py-20` desktop minimum.
- Page max-width: `max-w-7xl mx-auto px-6`.
- Card hover: `transition hover:-translate-y-0.5 hover:shadow-md` (subtle lift, not aggressive).

---

## 5. Imagery rules

- Editorial photography only. Lifestyle > flat-lay-on-white.
- Real Moroccan textiles, ateliers, models reflecting the region.
- **Tetouani imagery direction:** Prefer caftan tetouani (embroidered white/ivory linen), djellaba detail shots (hood detail, zellige-patterned lining), artisan hands on tarz-tetouani embroidery frame (tambour hoop), Tetouan medina whitewashed walls + cobalt-blue accents as architectural backdrops.
- Zellige and tarz-tetouani embroidery patterns may be used as CSS background motifs or SVG overlays at **10–15% opacity** for ambient cultural anchoring. See §13 for motif usage rules.
- Minimum 1200px wide. Hero images 1600–2400px.
- File serving: local `public/images/*.jpg` for static; Laravel storage at `https://pro.beldify.com/storage/categories/*.jpg` for CMS-served images.
- Whitelisted hostnames in `next.config.js`: `pro.beldify.com`, `api.beldify.com`, `www.beldify.com`, `eu2.contabostorage.com`, `images.unsplash.com`. Do not add new hosts without noting in the PR.
- Apply `bg-gradient-to-t from-black/70 via-black/10 to-transparent` overlay when text sits on top of imagery.

---

## 6. Components

### 6.1 Hero (full-bleed, editorial)
- Full-bleed image with `bg-gradient-to-r from-white/95 via-white/70 to-transparent` overlay on light hero, OR `from-indigo-950/85` overlay on dark hero.
- Left-aligned content (LTR) / right-aligned (RTL) handled by parent.
- Eyebrow pill: amber-100 chip with amber-500 dot + label.
- Headline: Playfair Display, second line in `text-indigo-700` for visual punch.
- 1 primary CTA (filled `bg-indigo-700`) + 1 ghost CTA (white pill, gray ring).
- CTA hover: `hover:bg-indigo-800`.

### 6.2 Trust strip
- 4 columns, real Lucide icons inside amber-100 circles with amber-200 ring.
- Labels in `font-medium text-gray-700`.

### 6.3 Category / atelier card
- Aspect ratio 4:5 for category, 5:4 for atelier.
- Bottom-aligned title in Playfair Display white with `drop-shadow-sm`.
- Top-right chip: `bg-white/95` with item count OR `bg-amber-400 text-gray-900` for "Verified" / "Bespoke".

### 6.4 Bespoke / editorial dark strip
- `bg-indigo-900 text-white` with radial gradient overlay: `bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]` at 25–30% opacity.
- Single CTA in amber-400 with `text-gray-900`.

### 6.5 Product card
- 1:1 image.
- Name in `text-gray-900 font-medium`.
- Price in `text-indigo-700 font-semibold`. Original price struck through in `text-gray-400`.
- Wishlist heart top-right, "+ Add" pill on hover.

### 6.6 Footer
- `bg-indigo-950 text-indigo-100`.
- 5-column grid (brand col spans 2): Shop / Sellers / Company / Help.
- Column headings in `text-amber-300 uppercase tracking-wide`.
- Social icons in `bg-white/5 ring-white/15` circles, amber hover.

### 6.7 Seller row / storefront card (pro.beldify.com)
- Seller avatar: 48×48px circle, `ring-2 ring-amber-300`.
- Verified-seller badge: `bg-amber-400 text-gray-900 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full` with Lucide `BadgeCheck` icon at 12px.
- Row background: `bg-amber-50/40 rounded-2xl ring-1 ring-amber-200`.
- Pro surface uses Tetouani cobalt accents (indigo-900 / sky-900) for editorial strips, never as primary CTA.

---

## 7. Motion

- Page entry: simple fade-in for hero (let Next.js handle).
- Card hover: **180–240ms** `transition-all ease-out-cubic` on translate + shadow. Use `duration-200` as the default.
- Image hover inside card: `scale-105 duration-500 ease-out`.
- All transitions use **ease-out-cubic** (`[cubic-bezier(0.33,1,0.68,1)]`). Never use bounce (`ease-in-out spring`) or elastic easing — they feel dated and distract from the content.
- Respect `prefers-reduced-motion`:
  ```tsx
  // in globals.css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Avoid: parallax that fights scroll, attention-seeking pulses, autoplay carousels longer than 5s.
- AI chip entrance (§11): fade-in + 4px upward translate, 200ms ease-out, staggered 80ms per chip when multiple are shown.

---

## 8. Anti-patterns (Beldify must NEVER ship)

- Generic SaaS purple→blue gradient buttons.
- Auto-popping modal install prompts on page load (already disabled — see PWAProviderWrapper).
- Centered popup modals over hero on first paint.
- Hairline divider lines with `border-gray-200` everywhere — use amber-100/amber-200 hairlines for warmth.
- Stock images with hard drop-shadow on pure white background.
- Carousel with > 5 slides and no pagination.
- "View all →" links without an actual destination page.
- Gray text (`text-gray-400`) on amber or indigo colored backgrounds — always use a tinted variant or `text-amber-100` / `text-indigo-200` respectively.
- Dual-color horizontal accent bars (e.g. half amber / half indigo `h-1.5`) — this is a one-off pattern that violates the single-accent rule.
- AI chips without the Lucide `Sparkles` icon — the icon is required for instant recognition.

---

## 9. Tech stack guardrails

- Next.js 15 App Router, RSC where data fetching matters.
- All client-only state in `'use client'` components.
- Tailwind utility-first. Custom CSS only for variable definitions in `globals.css`.
- next/image required for ALL imagery (perf + LCP).
- i18n: `react-i18next`. Every visible string goes through `t('namespace.key', 'English fallback')`.
- Locale dir handled by `useDirection()` hook — never hard-code RTL.
- Icon library: **Lucide React** is the single icon library. Do not import `@heroicons/react` in new code. AI-related features use `Sparkles` from Lucide.
- Verify changes with `tsc --noEmit --skipLibCheck` (Vitest is currently broken).

---

## 10. Where this design is in the repo

- Tokens: `beldify-frontend/tailwind.config.js` (`primary` = amber, `secondary` = indigo).
- Fonts: `beldify-frontend/src/app/layout.tsx` (Poppins / Rubik / Playfair Display).
- Reference homepage: `beldify-frontend/src/app/page.tsx`.
- Reference shops listing: `beldify-frontend/src/app/shops/page.tsx`.
- Reference shop detail: `beldify-frontend/src/app/shops/[name]/page.tsx`.
- Reference footer: `beldify-frontend/src/components/layout/Footer.tsx`.
- Live preview HTML: `beldify-frontend/public/design-preview/homepage.html`.

When upgrading a new page, copy patterns from those reference files — do not invent new ones.

---

## 11. AI-assist chip patterns

Beldify surfaces AI recommendations to both customers (www.beldify.com) and sellers (pro.beldify.com). Chips must be visually distinct from trust badges and product category chips. Use Lucide `Sparkles` (14px) as the universal AI glyph. The unicode `✦` is acceptable only in plain-text copy (email, SMS) where React components cannot render.

### 11.1 Customer-side chip (www.beldify.com)

Appears on: product cards, styled-for-you shelves, size recommendations, "complete the look" rows.

```tsx
import { Sparkles } from 'lucide-react';

// On indigo backgrounds (editorial strips, hero overlay)
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
  <Sparkles size={12} className="shrink-0" />
  {t('ai.chip.styledForYou', 'AI styled for you')}
</span>

// On sand / amber-50 backgrounds (product cards, listing pages)
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
  <Sparkles size={12} className="shrink-0" />
  {t('ai.chip.recommendation', 'Recommended for you')}
</span>
```

LTR: chip floats left or inline with content.
RTL: chip floats right; flex direction reverses naturally with `dir="rtl"` on parent.

### 11.2 Seller-side chip (pro.beldify.com)

Appears on: seller dashboard, listing quality scores, AI photo enhancement, AI description generator.

```tsx
// On amber backgrounds (pro.beldify.com seller surfaces)
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-700 text-white text-xs font-medium">
  <Sparkles size={12} className="shrink-0" />
  {t('ai.chip.photoEnhance', 'AI photo enhance')}
</span>
```

LTR/RTL: same natural flex reversal — no manual override needed.

### 11.3 AI chip entrance animation

```tsx
// Stagger chips with Tailwind animate class + inline delay
<span
  className="inline-flex ... animate-fade-in-up"
  style={{ animationDelay: `${index * 80}ms` }}
>
```

`fade-in-up` is defined in `globals.css`:
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 200ms cubic-bezier(0.33,1,0.68,1) both;
}
```

---

## 12. Bilingual etymology hero pattern

The Beldify brand name is intentionally bilingual. On marketing surfaces and editorial hero sections, present the name etymology as a lockup:

```tsx
<div className="flex items-baseline gap-3 flex-wrap" aria-label="Beldify — Beldi reimagined">
  {/* Arabic side — always RTL regardless of page locale */}
  <span
    dir="rtl"
    lang="ar"
    className="font-arabic text-3xl font-semibold text-gray-900 leading-tight"
  >
    بلدي
  </span>

  {/* Separator */}
  <span className="text-amber-400 text-2xl select-none" aria-hidden="true">×</span>

  {/* English side — always LTR */}
  <span
    dir="ltr"
    lang="en"
    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
    className="text-3xl font-bold text-indigo-700 italic leading-tight"
  >
    ify
  </span>
</div>

{/* Optional etymology subtitle */}
<p className="mt-2 text-sm text-gray-600">
  {t('brand.etymologySubtitle', 'beldi (بلدي) — local, artisan, of the country')}
</p>
```

Rules:
- `dir="rtl"` is always on the Arabic `<span>`, `dir="ltr"` always on the English `<span>`. These are explicit per-element — do not rely on page-level `dir` to cascade correctly into this lockup.
- The lockup is intentionally bilingual regardless of the active page locale. A French visitor still sees both Arabic and English.
- Never translate the etymology subtitle into the active locale — it exists to explain the name, not to be part of the UI copy.
- Keep `lang` attributes on each span for screen reader correct pronunciation.

---

## 13. Embroidery / zellige motif usage

Tarz-tetouani embroidery (silk on white linen, geometric + floral motifs) and zellige tilework are the signature visual textures of Tetouan craft. Used subtly as background texture, they anchor the brand in place without overwhelming the editorial photography.

### 13.1 Usage rules

- Maximum **10–15% opacity** when used as background overlays or section texture. Lower for dark surfaces (8–12%), slightly higher for sand/cream surfaces (12–15%).
- Only as ambient decoration — never in the foreground of interactive components (buttons, inputs, cards).
- Use as `background-image: url('/motifs/zellige-tile.svg')` or `background-image: url('/motifs/tarz-tetouani.svg')` in `globals.css` for sections that need them. Never inline in component TSX files.
- SVG motifs must be stored in `beldify-frontend/public/motifs/`.
- For CSS class usage:
  ```css
  .bg-motif-zellige {
    background-image: url('/motifs/zellige-tile.svg');
    background-size: 120px 120px;
    background-repeat: repeat;
    opacity: 0.12;
  }
  .bg-motif-tarz {
    background-image: url('/motifs/tarz-tetouani.svg');
    background-size: 240px 240px;
    background-repeat: repeat;
    opacity: 0.10;
  }
  ```
- Wrap in a `relative` container with the motif layer as an `absolute inset-0 pointer-events-none` child so it does not interfere with scrolling or interaction.

### 13.2 Approved contexts

| Surface | Motif | Opacity |
|---|---|---|
| Bespoke/tailoring dark strip (§6.4) | zellige | 10% |
| Homepage seller strip (indigo-900 background) | zellige | 10% |
| Category hero band (editorial) | tarz-tetouani | 12% |
| About / brand pages | either | up to 15% |
| Product cards, Cart, Checkout | none — too small, too busy | — |

### 13.3 Reduced motion

Motif overlays are static. No animation required. They do not need `prefers-reduced-motion` handling.
