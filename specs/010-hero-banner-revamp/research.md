# Research: 010-hero-banner-revamp

**Generated**: 2026-06-13
**Feature**: [spec.md](./spec.md)

## Prior art from KB

*Mode: pre · Sources below are load-bearing for this feature.*

- **Hero admin switch** `[[beldify-hero-admin-switch]]` (merged + live): `/api/hero-config` → `{mode:'brand'|'campaign', banners:[{id,title,subtitle,button_text,button_link,image_url,text_position}]}`. 300s backend cache; frontend `/api/home/route.ts` re-fetch `revalidate:60`. Degrades to `{mode:'brand',banners:[]}` on error.
- **Atlas tokens** `[[beldify-design-tokens]]`: Atlas Indigo + Saffron Amber on **neutral near-white canvas**, strict **60-30-10**. Parchment/amber-hairline look retired 2026-06-10.
- **Token collision** `[[beldify-tailwind-atlas-token-collision]]`: in `tailwind.config.js`, `primary.*`=AMBER and `secondary.*`=INDIGO are inverted vs intuition; apply Atlas colors via `hsl(var(--primary))` / `hsl(var(--secondary))` arbitrary form, NOT raw `indigo-*`/`amber-*`.
- **i18n** `[[beldify-i18n-architecture]]`: 7 locales (ar,en,fr,es,ma,nl,de). **Content rule: `ar` for ar/ma, else `en`.** Banner table has only `_en`/`_ar` columns → fr/es/nl/de render English **by design** (not a bug). Auto-translate is OPTIONAL stretch only.
- **AI banner generator** `[[beldify-ai-banner-generation]]` — **STALE memory corrected 2026-06-13**: `BannerAiController`, `_ai_generate.blade.php`, `config/ai.php`, `BannerAiService`, `KieClient` are **already on backend `main`** and deployed (AI suite ship 2026-06-13). `feat/ai-banner-generation` is a fully-merged ancestor of main (0 unique commits). The feature is **dormant only because no Kie.ai key is set** (`AiSetting 'ai.kie.api_key'`). Activation = admin pastes key in Admin → AI Settings. NOT a code task. AI banners save as normal `Banner` rows → flow through the campaign carousel automatically.
- **Growth rule** `[[beldify-whatsapp-never-checkout]]`: hero must drive **in-app** discovery/search; never push users off-platform.
- **Vitest hazard** `[[beldify-vitest-dual-config-hazard]]`: always `npm run test` from `beldify-frontend`; never bare `vitest`/root runs (dual-config shadows the React plugin → "React is not defined").
- **Isolation hazard** `[[parallel-agents-shared-tree-stash-hazard]]` / `[[beldify-tryon-wallet-collision]]`: a concurrent payouts session is live in the main tree. ALL work for this feature happens in the dedicated worktrees — never the live tree.

## Design critique + directions

See `ai-knowledge-base/raw/gemini/2026-06-13-hero-banner-redesign.md` (gemini design review + 3 directions + Claude synthesis). Chosen direction: **Search + Split-Canvas hybrid** (gemini's Split-Canvas carousel + a persistent marketplace search bar that gemini under-weighted).
