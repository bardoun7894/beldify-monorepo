---
name: specs/004-frontend-improvements/landing-atlas-plan.md
description: Auto-synced from specs/004-frontend-improvements/landing-atlas-plan.md
type: source
sync_origin: specs/004-frontend-improvements/landing-atlas-plan.md
sync_hash: f2f5f269009d732e
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/004-frontend-improvements/landing-atlas-plan.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Landing Page — Atlas Visual Port Plan

**Scope:** Visual-only port of the Next.js storefront homepage to the Atlas design system.
**Hard constraints:** No data-layer changes, no new libraries, no component-contract changes, no placeholder content.
**RTL:** `dir="rtl"` already set on `<html>` in layout.tsx; we reinforce with logical CSS throughout.

---

## Step 0 — Foundation: Token Alignment

**Files:** `tailwind.config.js` + `src/app/globals.css`
These two files are touched first because every subsequent section change references the corrected tokens.

### 0-A: `tailwind.config.js` — swap `primary` and `secondary` palettes

**Current problem:** `primary` maps to amber shades; `secondary` maps to indigo shades. Atlas inverts this: indigo IS the primary, amber IS the secondary/accent.

**What to change (lines 11–37):**

Replace the `primary` color scale with the Atlas Deep Indigo ramp anchored at `#252555`, and replace `secondary` with the Saffron Amber ramp anchored at `#fea619`. Also add an explicit `surface` token for parchment (`#fbf9f4`) and the Atlas named tokens as direct hex entries so they can be referenced without `hsl()` wrappers.

Concrete replacement block for `colors`:

```js
colors: {
  // Atlas Deep Indigo — primary
  primary: {
    DEFAULT: '#252555',
    container: '#3b3b6d',
    'on-container': '#a8a7e1',
    50:  '#eeeef8',
    100: '#d5d5ef',
    200: '#ababdf',
    300: '#8181cf',
    400: '#5757bf',
    500: '#3b3b8f',
    600: '#33337a',
    700: '#252555',   // Atlas base
    800: '#1c1c40',
    900: '#13132b',
    950: '#0a0a16',
  },
  // Atlas Saffron Amber — secondary / accent
  secondary: {
    DEFAULT: '#fea619',
    on: '#855300',
    50:  '#fff8eb',
    100: '#ffefc7',
    200: '#ffdc8a',
    300: '#fec94d',
    400: '#feb52b',
    500: '#fea619',   // Atlas base
    600: '#e08800',
    700: '#b86b00',
    800: '#925400',
    900: '#784400',
    950: '#442400',
  },
  // Atlas surface tokens
  surface: {
    DEFAULT: '#fbf9f4',   // parchment
    card:    '#ffffff',
    variant: '#e4e1ec',
  },
  'on-surface':         '#1b1c19',
  'on-surface-variant': '#47464f',
  outline:              '#777680',
  // Preserve semantic CSS-variable references used by shadcn/ui primitives
  background: 'hsl(var(--background))',
  foreground:  'hsl(var(--foreground))',
  card: {
    DEFAULT:    'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  popover: {
    DEFAULT:    'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  muted: {
    DEFAULT:    'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT:    'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  destructive: {
    DEFAULT:    'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  border: 'hsl(var(--border))',
  input:  'hsl(var(--input))',
  ring:   'hsl(var(--ring))',
  error:  '#ba1a1a',
},
```

Also extend `boxShadow` in `theme.extend`:

```js
boxShadow: {
  'atlas-sm': '0 2px 8px rgba(37,37,85,0.06)',
  'atlas':    '0 4px 20px rgba(37,37,85,0.09)',
  'atlas-lg': '0 8px 32px rgba(37,37,85,0.12)',
},
```

### 0-B: `globals.css` — correct HSL variables to Atlas values

**Current problem (lines 39–60):** HSL triplets define indigo at `#4338ca` (indigo-700) and amber at `#f59e0b` (amber-500); Atlas requires `#252555` and `#fea619`. Background is pure white; Atlas parchment is `#fbf9f4`.

**Replace the `:root` block (lines 39–96) with these exact values:**

```css
:root {
  /* ── Atlas Deep Indigo ramp ── */
  --indigo-50:  232 63% 95%;   /* #eeeef8 */
  --indigo-100: 232 54% 89%;   /* #d5d5ef */
  --indigo-400: 240 43% 60%;   /* #6c6cbf */
  --indigo-500: 240 41% 39%;   /* #3b3b8f */
  --indigo-600: 240 40% 34%;   /* #33337a */
  --indigo-700: 240 38% 24%;   /* #252555 — Atlas primary base */
  --indigo-800: 240 38% 18%;   /* #1c1c40 */
  --indigo-900: 240 38% 12%;   /* #13132b */

  /* ── Atlas Saffron Amber ramp ── */
  --amber-50:   43 100% 95%;   /* #fff8eb */
  --amber-100:  43 100% 89%;   /* #ffefc7 */
  --amber-300:  43 99%  65%;   /* #fec94d */
  --amber-400:  38 99%  58%;   /* #feb52b */
  --amber-500:  38 99%  55%;   /* #fea619 — Atlas secondary base */
  --amber-600:  33 100% 44%;   /* #e08800 */
  --amber-700:  27 100% 36%;   /* #b86b00 */
  --amber-900:  22 100% 24%;   /* #784400 */

  /* ── Tetouani Garnet (sale/error only) ── */
  --rose-700: 347 77% 41%;     /* #be123c */

  /* ── Semantic surface ── */
  --background: 40 43% 98%;    /* #fbf9f4 parchment */
  --foreground: 97 4% 10%;     /* #1b1c19 ink */
  --card: 0 0% 100%;
  --card-foreground: 97 4% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 97 4% 10%;

  /* ── Semantic aliases ── */
  --primary:             var(--indigo-700);   /* #252555 */
  --primary-foreground:  0 0% 100%;
  --secondary:           var(--amber-500);    /* #fea619 */
  --secondary-foreground: 30 100% 26%;        /* #855300 on-secondary */

  /* ── UI states ── */
  --muted:              248 14% 93%;
  --muted-foreground:   249 7%  47%;          /* #47464f on-surface-variant */
  --accent:             var(--amber-50);
  --accent-foreground:  var(--amber-900);
  --destructive:        347 77% 41%;          /* #ba1a1a approx */
  --destructive-foreground: 0 0% 98%;

  /* ── Form ── */
  --border: 249 7% 47%;                       /* outline #777680 */
  --input:  248 14% 93%;
  --ring:   var(--indigo-700);
  --radius: 1rem;                             /* 16px */

  /* ── Typography ── */
  --font-sans:       var(--font-poppins), "SF Pro Display", system-ui, sans-serif;
  --font-arabic:     var(--font-rubik), "IBM Plex Sans Arabic", "Cairo", system-ui, sans-serif;
  --font-heading:    var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif;
  --font-decorative: var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif;
}

.dark {
  --background: 240 38% 12%;
  --foreground: 0 0% 98%;
  --card: 240 38% 16%;
  --card-foreground: 0 0% 98%;
  --popover: 240 38% 16%;
  --popover-foreground: 0 0% 98%;
  --primary:            var(--indigo-400);
  --primary-foreground: 0 0% 100%;
  --secondary:          var(--amber-400);
  --secondary-foreground: 0 0% 100%;
  --muted:           240 38% 22%;
  --muted-foreground: 240 10% 65%;
  --accent:          var(--amber-100);
  --accent-foreground: var(--amber-900);
  --border: 240 20% 28%;
  --input:  240 20% 28%;
  --ring:   var(--indigo-400);
}
```

**Also update the `moroccan-pattern` SVG fill color (line 137):** change `fill='%236366f1'` to `fill='%23252555'`.

**Also update the focus-ring utilities (lines 26–35):** change `ring-indigo-500` to `ring-primary` (uses the new token). These are global, not homepage-specific, but the token swap makes the old value wrong.

**RTL utilities to add (append after line 133):** Extend the `[dir="rtl"]` block to cover `gap-x-*`, `ml-*`, `mr-*` utilities needed on the homepage:

```css
[dir="rtl"] {
  /* existing space-x overrides preserved */
  .space-x-1 > :not([hidden]) ~ :not([hidden]) { --tw-space-x-reverse: 1; }
  .space-x-2 > :not([hidden]) ~ :not([hidden]) { --tw-space-x-reverse: 1; }
  .space-x-4 > :not([hidden]) ~ :not([hidden]) { --tw-space-x-reverse: 1; }
  /* new: flip flex-row inline icons */
  .space-x-3 > :not([hidden]) ~ :not([hidden]) { --tw-space-x-reverse: 1; }
}
```

---

## Step 1 — `src/app/layout.tsx`

**File:** `/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/app/layout.tsx`

**Changes (visual only, no data/logic):**

1. **Skip-link RTL fix (line 111):** Change `focus:left-4` to `focus:start-4` (logical property) so the skip link appears on the correct side in RTL. Full replacement:
   ```
   className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-xl focus:shadow-lg"
   ```
   (Also: `bg-indigo-600` → `bg-primary` so the hardcoded hex is gone.)

2. **Theme color in `generateViewport` (line 91):** Change `'#6366f1'` to `'#252555'` (Atlas primary).

3. **msapplication-TileColor (line 84):** Change `'#6366f1'` to `'#252555'`.

**Do NOT change:** Font loading (lines 9–43), `<html>` attributes, `<body>` wrapper, ClientProvider, MobileBottomNav.

---

## Step 2 — `src/app/page.tsx`: Section-by-Section Visual Restyle

**File:** `/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/app/page.tsx`

**Do NOT change:** `getHomeData()`, `getTopCategories()`, data fetching, imports of FeaturedSections/MegaOffers/Newsletter, Suspense wrappers, prop passing.

Work section by section, top to bottom.

### 2-A: `<main>` wrapper (line 65)
```diff
- className="min-h-screen bg-amber-50/40 text-gray-900"
+ className="min-h-screen bg-surface text-on-surface"
```
(`bg-surface` resolves to parchment `#fbf9f4` via Tailwind token added in Step 0.)

### 2-B: Announcement strip (lines 67–69)

**Desktop + Mobile:** Full-width bar, primary background, on-primary text, `py-2` vertical.

```diff
- <div className="bg-gray-900 text-amber-50 py-2 text-center text-xs font-medium tracking-wide">
-   Free shipping across Morocco on orders over 500 MAD — Free returns within 14 days
+ <div className="bg-primary text-white py-2 text-center text-xs font-medium tracking-widest" dir="rtl">
+   شحن مجاني داخل المغرب للطلبات فوق 500 درهم — إرجاع مجاني خلال 14 يوماً
```

**Note on hardcoded text:** Per the audit, `page.tsx` is an RSC that cannot call `useTranslation()`. The design spec requires this exact Arabic copy regardless of locale (the homepage is Arabic-first per DESIGN.md). Hardcoded Arabic here is intentional and consistent with the existing bilingual lockup pattern in the hero (lines 97–113). Do NOT add any translation key or wrapping component.

### 2-C: Hero section (lines 76–144)

The hero RSC content cannot use `t()`. Port it visually; keep all existing structure and prose exactly as-is except class names.

**Background overlay (line 86):** Change gradient direction to bring text contrast to the right side (RTL flow) and swap to surface-tinted overlay:
```diff
- className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent"
+ className="absolute inset-0 bg-gradient-to-l from-surface/95 via-surface/75 to-transparent"
```

**Outer content wrapper (line 89):** Increase vertical generosity and constrain for `max-w-7xl`:
```diff
- className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36"
+ className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40"
```

**Eyebrow pill (lines 91–94):** Restyle from amber-100 to primary-container:
```diff
- className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-300"
+ className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/20"
```
```diff
- className="h-1.5 w-1.5 rounded-full bg-amber-500"
+ className="h-1.5 w-1.5 rounded-full bg-secondary"
```
Text: keep "Authentic Moroccan craftsmanship" as-is (bilingual page; English label is intentional).

**Bilingual etymology "ify" span (lines 105–109):** The inline `style` is fine. Change Tailwind class only:
```diff
- className="text-3xl font-bold text-indigo-700 italic leading-tight"
+ className="text-3xl font-bold text-primary italic leading-tight"
```

**H1 accent span (line 120):**
```diff
- className="block text-indigo-700"
+ className="block text-primary"
```

**Primary CTA button (lines 128–134):**
```diff
- className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
+ className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-atlas transition hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

**Secondary CTA button (lines 135–140):**
```diff
- className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 transition hover:bg-gray-50"
+ className="inline-flex items-center gap-2 rounded-xl bg-surface px-6 py-3 text-sm font-semibold text-primary ring-1 ring-outline/40 transition hover:bg-primary/5"
```

### 2-D: AI personalisation chip (lines 150–153)
```diff
- className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200 animate-fade-in-up"
+ className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium ring-1 ring-primary/20 animate-fade-in-up"
```

### 2-E: Trust strip (lines 158–174)

**Section border + background:**
```diff
- className="border-y border-amber-200/60 bg-white/70 backdrop-blur"
+ className="border-y border-outline/20 bg-surface/80 backdrop-blur"
```

**Trust item wrapper:**
```diff
- className="flex flex-col items-center gap-2 text-gray-700"
+ className="flex flex-col items-center gap-2 text-on-surface-variant"
```

**Icon circle:**
```diff
- className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center ring-1 ring-amber-200"
+ className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20"
```

### 2-F: Browse the Souk — categories grid (lines 177–228)

**Section wrapper:** Keep `py-16`, update text:
```diff
- <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-medium">Browse</p>
+ <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium">السوق</p>
```

```diff
- <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900" ...>The souk</h2>
+ <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-primary" ...>مجموعات السوق</h2>
```

**"View all" link:**
```diff
- className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900"
+ className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-container"
```
Keep "View all →" text as-is (the `→` arrow points left in RTL; if you want directional correctness swap to `←` or a `rotate-180` on the SVG icon; this is optional and should not block the port).

**Empty state:**
```diff
- className="py-12 text-center text-sm text-gray-500"
+ className="py-12 text-center text-sm text-on-surface-variant"
```

**Category card:**
```diff
- className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-amber-200/60 bg-amber-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
+ className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-outline/20 bg-surface shadow-atlas-sm transition hover:-translate-y-0.5 hover:shadow-atlas"
```

**Item count badge (line 212):**
```diff
- className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm"
+ className="absolute top-3 end-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-on-surface shadow-atlas-sm"
```
(`end-3` is the RTL-logical equivalent of `right-3`.)

**Category card text positioning (lines 216–224):**
```diff
- <div className="absolute bottom-4 left-4 right-4">
+ <div className="absolute bottom-4 inset-inline-4">
```
If `inset-inline-*` is not a Tailwind utility (it isn't by default), use `absolute bottom-4 start-4 end-4` instead — both `start` and `end` are Tailwind logical props.

**Category name colour (line 218):** `text-white` stays white against the dark overlay. The Playfair Display inline style stays as-is.

**Category name content:** Display `c.name_ar || c.name_en` — prefer Arabic name if the API provides it, fall back to English. Current code shows only `c.name_en`. Change to:
```diff
- {c.name_en}
+ {c.name_ar || c.name_en}
```

### 2-G: Tailoring CTA strip (lines 231–274)

**Background colour:** Already uses `bg-indigo-900`. This is close to Atlas primary (`#252555`) but brighter. Replace:
```diff
- className="relative isolate overflow-hidden bg-indigo-900 text-white"
+ className="relative isolate overflow-hidden bg-primary text-white"
```

**Radial gradient overlay (line 234):** Replace amber/indigo with Atlas amber + primary-container:
```diff
- className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
+ className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,_#fea619_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#3b3b6d_0,_transparent_50%)]"
```

**Eyebrow label:**
```diff
- <p className="text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">Bespoke</p>
+ <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium">خياطة</p>
```

**CTA button (line 250):** Already amber; update to Atlas amber token:
```diff
- className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
+ className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-on-surface transition hover:bg-secondary/80"
```

**Step number badges (line 265):**
```diff
- className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-gray-900 font-bold"
+ className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-on-surface font-bold"
```

**Preserve all prose** (lines 243–271) exactly as-is — do not touch the English copy.

### 2-H: Hand-picked ateliers (lines 295–351)

**Section heading row:**
```diff
- <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-medium">Curated</p>
+ <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium">حُراس التراث</p>
```
```diff
- <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900" ...>Hand-picked ateliers</h2>
+ <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-primary" ...>ورشات مختارة</h2>
```

**"All ateliers" link:**
```diff
- className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900"
+ className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-container"
```

**Atelier card wrapper (line 321):**
```diff
- className="group relative overflow-hidden rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
+ className="group relative overflow-hidden rounded-2xl ring-1 ring-outline/20 bg-surface-card shadow-atlas-sm transition hover:-translate-y-0.5 hover:shadow-atlas"
```

**Verified badge (line 331):**
```diff
- className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm"
+ className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-atlas-sm"
```

**BadgeCheck icon:**
```diff
- <BadgeCheck className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.2} />
+ <BadgeCheck className="h-3.5 w-3.5 text-secondary" strokeWidth={2.2} />
```

**Atelier name:**
```diff
- className="text-lg font-semibold text-gray-900"
+ className="text-lg font-semibold text-primary"
```

**Location / specialty row:**
```diff
- <span className="inline-flex items-center gap-1 text-gray-500">
+ <span className="inline-flex items-center gap-1 text-on-surface-variant">
```
```diff
- <span className="text-amber-700 font-medium">
+ <span className="text-secondary font-medium">
```

**Atelier data (lines 313–316):** These four hardcoded objects are editorial placeholder content currently in the RSC. They are NOT API-backed. Per the hard constraint "never invent data", but also per "do not remove existing data": leave the four items as-is — they are already in the committed source. Visual restyling of their names/cities/specialties is out of scope; the class changes above handle the visual port.

### 2-I: The Journal (lines 354–425)

**Section wrapper:**
```diff
- className="bg-white border-t border-amber-100"
+ className="bg-surface-card border-t border-outline/15"
```

**Eyebrow:**
```diff
- <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-medium">Read</p>
+ <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium">المجلة</p>
```

**H2:**
```diff
- <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900" ...>The journal</h2>
+ <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-primary" ...>المجلة</h2>
```

**"All stories" link:**
```diff
- className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900"
+ className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-container"
```

**Article card:**
```diff
- className="group rounded-2xl overflow-hidden ring-1 ring-amber-100 bg-amber-50/30 hover:bg-amber-50 transition"
+ className="group rounded-2xl overflow-hidden ring-1 ring-outline/15 bg-surface hover:bg-surface/80 transition shadow-atlas-sm hover:shadow-atlas"
```

**Tag pill:**
```diff
- className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700"
+ className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
```

**Article title:**
```diff
- className="mt-3 text-xl font-semibold leading-snug text-gray-900"
+ className="mt-3 text-xl font-semibold leading-snug text-primary"
```

**Article excerpt:**
```diff
- className="mt-2 text-sm text-gray-600"
+ className="mt-2 text-sm text-on-surface-variant"
```

**Author line:**
```diff
- className="mt-4 text-xs text-gray-500"
+ className="mt-4 text-xs text-on-surface-variant"
```

### 2-J: Seller strip (lines 429–468)

**Section background:** Already `bg-indigo-900`; swap:
```diff
- className="py-16 bg-indigo-900 text-white relative overflow-hidden"
+ className="py-16 bg-primary text-white relative overflow-hidden"
```

**AI seller chip (line 462):**
```diff
- className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-indigo-700 text-white text-xs font-medium"
+ className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-medium"
```

**Open boutique button (line 456):**
```diff
- className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-full bg-amber-400 text-gray-900 font-semibold text-sm hover:bg-amber-300 transition-colors duration-200"
+ className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-xl bg-secondary text-on-surface font-semibold text-sm hover:bg-secondary/80 transition-colors duration-200"
```

**Eyebrow label:**
```diff
- <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">For artisans &amp; ateliers</p>
+ <p className="text-xs uppercase tracking-[0.18em] text-secondary font-medium mb-3">للحرفيين والورشات</p>
```

**Preserve all prose** (h2, p, href) exactly as-is.

---

## Step 3 — `src/components/Newsletter.tsx`

**File:** `/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/components/Newsletter.tsx`

**Do NOT change:** `useTranslation`, `handleSubmit`, form structure, `useEffect`, `mounted` guard.

**Visual changes only:**

**Section wrapper (line 37):**
```diff
- className="py-16 sm:py-20 bg-amber-50/40"
+ className="py-16 sm:py-20 bg-surface"
```

**Eyebrow dot (line 43):**
```diff
- <div className="w-2 h-2 bg-amber-500 rounded-full">
+ <div className="w-2 h-2 bg-secondary rounded-full">
```

**Eyebrow text:**
```diff
- className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700"
+ className="text-xs font-medium uppercase tracking-[0.18em] text-secondary"
```

**H2 (line 49):**
```diff
- className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight"
+ className="text-4xl md:text-5xl font-bold text-primary mb-3 tracking-tight"
```

**Subtitle:**
```diff
- className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
+ className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
```

**Divider line (line 57):**
```diff
- className="w-16 h-px bg-amber-200 mx-auto mt-6"
+ className="w-16 h-px bg-secondary/30 mx-auto mt-6"
```

**Input (line 68):**
```diff
- className="flex-1 rounded-2xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900"
+ className="flex-1 rounded-xl px-4 py-3 border border-outline/30 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-on-surface"
```

**Submit button (line 73):**
```diff
- className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 rounded-full font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
+ className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-xl font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-atlas hover:shadow-atlas-lg hover:-translate-y-0.5"
```

---

## Step 4 — `src/components/MegaOffers.tsx` (targeted token fixes only)

**File:** `/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/components/MegaOffers.tsx`

The audit showed this component already uses `indigo-700` and `amber-500` classes throughout. After Step 0 fixes the token values, those classes will automatically resolve to Atlas colors. No class-name changes are strictly required unless specific hardcoded hex values are used.

**Scan and replace any hardcoded hex:**
- Any occurrence of `#4338ca`, `#6366f1`, `#f59e0b` in inline `style={{}}` props must be replaced with Atlas hex values (`#252555`, `#fea619`) or removed in favour of Tailwind classes.
- Replace `bg-indigo-50` (header background) with `bg-primary/5` for tighter Atlas alignment.
- Leave all other classes as-is; the token remap in Step 0 handles the rest.

**Do NOT change:** Props, interfaces, data-fetch logic, `useEffect`, `useTheme`, `useSearchParams`, TEST_MEGA_OFFERS object.

---

## Step 5 — `src/components/home/FeaturedSections.tsx` (targeted token fixes only)

**File:** `/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/components/home/FeaturedSections.tsx`

Same approach as Step 4: the component already uses `t()` and semantic class names. After Step 0 token remap, most of it auto-corrects.

**Scan for:**
- Any hardcoded `indigo-700` / `indigo-900` / `amber-500` in inline `style={{}}` — replace with `bg-primary`, `bg-secondary`, etc.
- Any `text-gray-900` used as a heading color — replace with `text-primary`.
- Any `bg-amber-50` used as a section background — replace with `bg-surface`.
- Price display: ensure format is `{price} درهم` or `MAD {price}`. If the component already renders `product.price` directly, no change needed; the API value is authoritative.

**Do NOT change:** Props interface, `useTranslation`, `fetchBestSellers`, `fetchNewArrivals`, `fetchSpecialOffers`, state management, or component export.

---

## Files That Must NOT Change (Data/Fetch Layer)

| File | Reason |
|---|---|
| `src/app/api/home/route.ts` | Backend integration; API handler |
| `src/lib/api.ts` (and all files under `src/lib/`) | API service functions |
| `src/app/api/**` | All Next.js API route handlers |
| `src/services/**` | Axios instance and service layer |
| `src/i18n/**` | Translation config and locale strings |
| `src/contexts/**` | AuthContext, CartContext, etc. |
| `src/providers/**` | ClientProvider, ThemeProvider, PWAProviderWrapper |
| `src/hooks/**` | Custom hooks |
| `src/utils/**` | Validation, sanitization, logging |
| `next.config.js` / `next.config.*.js` | Build config |
| `public/**` | Static assets |
| `src/components/layout/**` | MobileBottomNav, header nav — separate from homepage port |
| `src/components/support/**` | FloatingSupportButton |
| `src/components/common/**` | LoadingSpinner and shared primitives |
| `src/components/home/Hero.tsx` | Unused by page.tsx; do not touch |
| `src/components/home/HeroContent.tsx` | Orphaned; do not touch |

---

## New Leaf Components (none required)

The design spec calls for an "Editorial Divider" and an "AI Curation Note" between the hero and the category grid. Both are already approximated in the current page:
- The AI chip (Step 2-D) covers the AI curation note.
- No separate divider component is needed — the trust strip serves this visual role.

If a later pass adds the full editorial divider and AI quote block as the spec describes, that is a separate task and a new component (`src/components/home/EditorialDivider.tsx`). It is out of scope for this port because the spec constraint says do not add new libraries and do not introduce markup without backing data.

---

## Execution Order

1. **Step 0-A** — `tailwind.config.js` token swap (foundation; all steps depend on this).
2. **Step 0-B** — `globals.css` HSL corrections + RTL additions (must precede component steps).
3. **Step 1** — `layout.tsx` skip-link + theme-color fixes (global; fast).
4. **Step 2** — `page.tsx` section-by-section (largest change; do in one commit).
5. **Step 3** — `Newsletter.tsx` (small; isolated).
6. **Step 4** — `MegaOffers.tsx` targeted hex scan.
7. **Step 5** — `FeaturedSections.tsx` targeted heading/surface scan.
8. **Visual QA** — open homepage in browser at 1440px and 375px, compare against design spec section by section. Verify: parchment background, deep-indigo headings, saffron-amber accents, soft indigo-tinted shadows, RTL text alignment, logical CSS positions.

---

## Token Quick-Reference (for implementer)

| Design intent | Tailwind class to use | Resolves to |
|---|---|---|
| Primary background (nav, hero CTA, strip) | `bg-primary` | `#252555` |
| Primary hover | `bg-primary-container` | `#3b3b6d` |
| Primary text (headings, links) | `text-primary` | `#252555` |
| Accent / badge / CTA | `bg-secondary` | `#fea619` |
| Accent text | `text-secondary` | `#fea619` |
| Parchment page background | `bg-surface` | `#fbf9f4` |
| White card | `bg-surface-card` | `#ffffff` |
| Body text | `text-on-surface` | `#1b1c19` |
| Muted / caption text | `text-on-surface-variant` | `#47464f` |
| Dividers | `border-outline` | `#777680` |
| Soft dividers | `border-outline/20` | `#777680` at 20% |
| Shadow small | `shadow-atlas-sm` | `0 2px 8px rgba(37,37,85,0.06)` |
| Shadow medium | `shadow-atlas` | `0 4px 20px rgba(37,37,85,0.09)` |
| Absolute start (RTL-safe right) | `end-3`, `inset-inline-end-3` | resolves correctly in RTL |
| Absolute end (RTL-safe left) | `start-3`, `inset-inline-start-3` | resolves correctly in RTL |

