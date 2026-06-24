---
name: Beldify Buyer AI UX — real but under-reached
description: The buyer-facing AI suite (NL search, review summaries, size advisor, try-on, recommendations) is ethically built and genuinely mounted; its weakness is discoverability/placement, not gimmickry
type: concept
sources: [sources/marketplace-frontend-ai-review-2026-06-19]
created: 2026-06-19
updated: 2026-06-19
---

# Beldify Buyer AI UX — real but under-reached

The 2026-06-19 AI-product-reviewer pass found something unusual for a marketplace: every buyer AI surface is real, actually rendered in a page (none orphaned), and built with restraint. The size advisor never auto-selects, shows a confidence level, hedges on low confidence, and only highlights in-stock sizes; review summaries return null below the three-review threshold so no fabricated social proof appears; NL search is fallback-safe; the try-on never stores the user photo. All are labeled as AI in Arabic, consistent with the project's no-fake-urgency ethics rule.

## The real problem is reach, not quality
The failure mode is placement and discoverability:
- **NL search assist** lives only on the `/products` hero, not the global Navbar search every buyer starts from, and its mobile "AI" label is hidden — so most users never trigger it.
- **AI review summaries** were fetched and rendered only behind the Reviews tab (default tab is "description"), so the single best AI trust artifact was invisible at the moment trust is decided. The fix surfaces a compact, clearly-labeled gist in the buy column.
- **Virtual try-on** showed the generated image directly above "Buy now" with no "approximation / fit may differ" caveat — a genuine over-trust risk in a COD market with return friction.
- **Recommendations** were honest but unframed and fell back to fabricated "Verified" ateliers with invented ratings — the bigger trust hazard, to fix before promoting any "recommended for you" personalization.

The net guidance: the work is reach (Navbar, buy-column placement, mobile labels), one trust caveat (try-on), and honesty around the recommendations fallback — not building new models. This complements the broader buyer-experience findings in [[concepts/marketplace-frontend-ai-review]].

## See also
- [[sources/marketplace-frontend-ai-review-2026-06-19]]
- [[concepts/marketplace-frontend-ai-review]]
- [[entities/beldify]]
