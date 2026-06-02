---
name: Stitch Design Generation
description: Using the Stitch MCP to generate editorial UI screens for Beldify, then porting them to React
type: concept
sources: [daily/2026-05-14.md]
created: 2026-05-15
updated: 2026-05-15
---

# Stitch Design Generation

## Overview
Stitch is a design-generation MCP (Model Context Protocol tool) used to produce high-fidelity HTML/CSS screen designs that serve as visual targets. The generated HTML previews are deployed to the running `beldify-frontend` container and used as references for React ports by frontend-engineer agents.

## Key Points
- Stitch project for Beldify: ID `2822550655708305761` ("Beldify — Moroccan Marketplace")
- Design system within Stitch: ID `assets/1998950717374000813` ("Beldify Atlas")
- Generated screens are downloaded as `.html` + `.png` pairs, deployed under `/design-preview/`
- After generation, a `frontend-engineer` subagent reads the HTML reference and ports it to the corresponding Next.js `page.tsx`
- Parallel agent dispatch: 3 agents worked simultaneously on auth-funnel, browse-funnel, and content pages; 2 agents on checkout + seller storefront; 1 agent on Navbar

## Details
On 2026-05-14, the Stitch workflow was used to systematically upgrade every customer-facing page. The process:

1. **Create project** in Stitch with brand name and aesthetic brief (editorial Moroccan marketplace)
2. **Define design system** ("Beldify Atlas") with palette, typography, shape tokens
3. **Generate screens** one at a time — Homepage, PDP, Cart, Checkout, Seller storefront
4. **Download assets** (HTML + PNG) and deploy to `/design-preview/` via `docker cp`
5. **Dispatch frontend-engineer agent** per page cluster with: DESIGN.md as authority, Stitch HTML as visual reference, existing page.tsx to preserve business logic, TypeScript + curl-200 as verification gate

### Screens generated and their React targets
| Stitch screen | React page | Status |
|--------------|------------|--------|
| Homepage | `src/app/page.tsx` | ✅ Ported |
| Product Detail | `src/app/products/[id]/page.tsx` | ✅ Ported |
| Cart | `src/app/cart/page.tsx` | ✅ Ported |
| Checkout | `src/app/checkout/page.tsx` | ✅ Ported |
| Seller storefront | `src/app/shops/[name]/page.tsx` | ✅ Ported |

### Verification gate used by each agent
- `tsc --noEmit --skipLibCheck` → zero errors in the changed files
- `curl https://www.beldify.com/<route>` → HTTP 200
- Existing logic hooks (cart state, auth context, wishlist, API fetches) confirmed present in final file

## Limitations Observed
- Vitest could not run during the port sessions because a `vite.config.ts` at `$HOME` conflicted with the project's own config. Verification fell back to tsc + curl.
- `CategoryDropdown` (API-driven mega-dropdown) was dropped from the desktop Navbar in favor of static editorial links. Can be reinstated alongside the static links if needed.

## Related Concepts
- [[concepts/atlas-design-system]] — The design system used within Stitch and codified in DESIGN.md
- [[entities/nextjs]] — Target framework for all React ports
- [[concepts/docker-deployment]] — Container where HTML previews are served and ports are deployed

## Sources
- [[daily/2026-05-14.md]] — Full Stitch workflow executed; 5 screens generated; 16 pages ported with parallel agents
