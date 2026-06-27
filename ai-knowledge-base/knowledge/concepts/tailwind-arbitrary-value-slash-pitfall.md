---
name: Tailwind v3 Arbitrary-Value Internal Slash Pitfall
description: ""
type: concept
tags: [tailwind, css, tokens, atlas, build]
sources: []
created: "2026-06-02"
updated: "2026-06-02"
---
# Tailwind v3 Arbitrary-Value Internal Slash Pitfall

## Problem

In Tailwind v3 JIT, a `/` inside an arbitrary-value bracket is interpreted as the **opacity-modifier separator**, not as part of the value. This breaks CSS function calls like `hsl()` that contain `/` as a separator:

```html
<!-- FAILS: the / is read as opacity modifier; produces malformed output -->
<div class="bg-[hsl(var(--primary)/0.1)]">
```

PostCSS then emits "Unexpected '/'" and the build fails — same surface error as [[concepts/tailwind-css-comment-premature-close]] but a different root cause.

This issue was introduced in the 2026-06-02 session when a fix-agent auto-generated 21 occurrences of `bg-[hsl(var(--primary)/0.1)]` across storefront components as a palette fix.

## Fix — register alpha-aware tokens

In `tailwind.config.js`, register the Atlas palette tokens with `<alpha-value>` so Tailwind can generate opacity variants using the standard `/` modifier syntax:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'atlas-primary':   'hsl(240 39% 24% / <alpha-value>)',  // #252555 Atlas Indigo
      'atlas-secondary': 'hsl(38  99% 55% / <alpha-value>)',  // #fea619 Saffron Amber
    },
  },
},
```

Then use the standard Tailwind opacity modifier (no arbitrary bracket needed):

```html
<!-- WORKS: Tailwind expands this to hsl(240 39% 24% / 0.1) -->
<div class="bg-atlas-primary/[0.1]">
<!-- or with a preset opacity -->
<div class="bg-atlas-primary/10">
```

## Why this matters for Beldify

Beldify's CSS custom properties (`--primary`, `--secondary`) are already declared in `globals.css` for theming, but the JIT engine cannot safely embed `var()` references inside arbitrary-value brackets that also contain `/`. The alpha-token approach is the canonical Tailwind v3 solution.

## Token name → hex mapping (Beldify)

| Token | Hex | Role |
|---|---|---|
| `atlas-primary` | `#252555` | Atlas Indigo (deep navy) |
| `atlas-secondary` | `#fea619` | Saffron Amber (accent) |

Note: Beldify's legacy `tailwind.config.js` has `primary.*` = **amber** and `secondary.*` = **indigo** (inverted). Always use `atlas-primary` / `atlas-secondary` for Atlas-system colors; never use `primary` / `secondary` for Atlas intent. See [[concepts/beldify-tailwind-atlas-token-collision]].

## False-green vitest

String-based vitest tests that scan TSX files for class names will pass even when this build failure is present — they never compile CSS. Only `npx tailwindcss -i src/app/globals.css -o /tmp/tw.css` will reveal the error. See [[concepts/tailwind-css-comment-premature-close]] for the diagnostic pattern.
