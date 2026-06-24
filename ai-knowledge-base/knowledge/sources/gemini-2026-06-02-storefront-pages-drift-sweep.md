---
name: Gemini drift sweep — storefront pages
description: ~30 Atlas design-system drift findings across storefront pages (contrast, currency-mad, JIT, RTL, glassmorphism)
type: source
sources: [raw/gemini/2026-06-02-storefront-pages-drift-sweep.txt]
created: 2026-06-03
updated: 2026-06-03
---

# Gemini drift sweep — storefront pages

## Summary
A breadth-first Gemini sweep of storefront pages enumerating ~30 Atlas design-system drift findings, prioritized P0–P2. Confirms the same drift classes the redesign review found, across more files.

## Key points
- **P0 contrast**: `text-white` on amber across size-guide, FeaturedCategories, tailoring tailors pages, error.tsx, ProductGrid, ErrorMessage → `text-amber-950`.
- **P0 missing `currency-mad`**: checkout price spans (1194/1209/1215), ShippingCalculator.
- **P1 Tailwind JIT failure**: `bg-[hsl(var(--primary))]` → literal `bg-indigo-700`.
- **P1 banned numbered scales**: `primary-*`/`secondary-*` in PWA prompt + reminder banner → literal amber/indigo.
- **P1 physical RTL bugs**: `left-4`/`right-2` → logical `start-*`.
- **P2 banned gradient text + glassmorphism** (`backdrop-blur bg-white/90`) → solid colors across Navbar, PDP, checkout, home, MobileBottomNav.

## See also
- [[concepts/atlas-design-system]]
- [[concepts/tailwind-jit-dynamic-class-pitfalls]]
- [[concepts/css-rtl-override-physical-properties]]
