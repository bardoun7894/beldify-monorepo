# Knowledge Base Index

| Article | Summary | Type | Updated |
|---------|---------|------|---------|
| [[sources/beldify-claude]] | Monorepo with Next.js frontend and Laravel backend - project rules | source | 2026-05-08 |
| [[entities/beldify]] | Multi-seller e-commerce platform with tailoring services | entity | 2026-05-08 |
| [[entities/nextjs]] | React-based full-stack framework for web applications | entity | 2026-05-08 |
| [[entities/laravel]] | PHP framework for building web applications and APIs | entity | 2026-05-08 |
| [[concepts/monorepo]] | Single repository containing multiple projects | concept | 2026-05-08 |
| [[concepts/dev-workflow]] | Standard process for making changes in Beldify | concept | 2026-05-08 |
| [[sources/backend-claude]] | Laravel 10 backend with multi-seller, tailoring, community features | source | 2026-05-08 |
| [[entities/mysql]] | Relational database used by Beldify backend | entity | 2026-05-08 |
| [[entities/redis]] | In-memory data store used for caching in Beldify backend | entity | 2026-05-08 |
| [[entities/sanctum]] | Laravel package for API authentication and token management | entity | 2026-05-08 |
| [[entities/fcm]] | Firebase Cloud Messaging for push notifications | entity | 2026-05-08 |
| [[concepts/service-repository-pattern]] | Architectural pattern separating business logic from data access | concept | 2026-05-08 |
| [[concepts/api-versioning]] | Strategy for managing API changes without breaking clients | concept | 2026-05-08 |
| [[concepts/multi-seller-ecommerce]] | E-commerce platform allowing multiple vendors to sell | concept | 2026-05-08 |
| [[concepts/caching-strategy]] | Redis-based caching approach in Beldify Laravel backend | concept | 2026-05-08 |

| [[concepts/production-db-reset]] | Safe workflow for wiping and reseeding the Beldify production MySQL database | concept | 2026-05-15 |
| [[concepts/cloudflare-caching-issue]] | Long-lived CF edge cache pinning stale Next.js chunks and how to resolve it | concept | 2026-05-15 |
| [[concepts/atlas-design-system]] | Editorial Moroccan-marketplace design system — Atlas Indigo + Saffron Amber | concept | 2026-05-15 |
| [[concepts/stitch-design-generation]] | Using Stitch MCP to generate UI screens then port to React with parallel agents | concept | 2026-05-15 |
| [[concepts/docker-deployment]] | Docker Compose setup and container management for Beldify on MyContabo | concept | 2026-05-15 |
| [[concepts/nextjs-image-config]] | Configuring next/image hostname whitelist for remote category and product images | concept | 2026-05-15 |
| [[concepts/category-image-pipeline]] | How category images flow from Unsplash download to storefront render | concept | 2026-05-15 |
| [[connections/design-system-and-deployment]] | Non-obvious link: three independent caching layers block Atlas from reaching visitors | connection | 2026-05-15 |

| [[sources/sessions-2026-05-14-7f3c17d0]] | 200-turn session: Firebase silencing, PWA assets, AccountSubControl seeder fix, Stitch homepage live, BuildKit stall workaround | source | 2026-05-21 |
| [[concepts/seeder-fk-pre-resolution]] | Pre-fetch and inject NOT NULL foreign-key IDs before insert to prevent Laravel seeder integrity violations | concept | 2026-05-21 |
| [[concepts/docker-bind-mount-over-rebuild]] | Source changes arrive via bind mount on container start — skip docker rebuilds for pure source-code edits | concept | 2026-05-21 |

| [[concepts/open-souk-feature]] | Community reverse-marketplace page renamed to "Open Souk / السوق المفتوح" with full Darija localization | concept | 2026-05-21 |
| [[concepts/admin-atlas-migration]] | Quantified scope and priority roadmap for migrating Beldify admin from Bootstrap/PixInvent to Atlas Tailwind-only | concept | 2026-05-21 |
| [[concepts/tailwind-jit-dynamic-class-pitfalls]] | Production bugs: phantom tw-primary-* tokens, dynamic class construction, @apply in Blade inline styles | concept | 2026-05-21 |
| [[concepts/missing-views-git-restore]] | Recovering admin views missing from Contabo — git restore pattern + macOS→Linux case-sensitivity fix | concept | 2026-05-21 |
| [[concepts/admin-login-redirect-fix]] | Fixing post-login 404: RouteServiceProvider::HOME mismatch, view name, stale session intended URL | concept | 2026-05-21 |
| [[concepts/admin-asset-url-misconfiguration]] | APP_URL pointing to raw IP over HTTP causes all Laravel asset() calls to produce MIME-type errors | concept | 2026-05-21 |
| [[concepts/admin-panel-migration-decision]] | Three-reviewer panel verdict: finish Atlas migration, reject Filament pivot — Codex decisive, Gemini dissent | concept | 2026-05-21 |

| [[concepts/php-opcache-deployment-pitfall]] | PHP-FPM opcache pins stale autoload classmap — container recreation required after composer dump-autoload | concept | 2026-05-23 |
| [[concepts/docker-env-file-recreation]] | Docker env_file is frozen at container creation — .env changes need --force-recreate not restart | concept | 2026-05-23 |
| [[concepts/css-accordion-max-height-pattern]] | grid-template-rows 0fr trick fails with multi-child lists — use max-height for robust accordion | concept | 2026-05-23 |
| [[concepts/css-rtl-override-physical-properties]] | Logical CSS properties lose cascade against PixInvent's physical RTL rules — use matching physical props | concept | 2026-05-23 |
| [[concepts/beldify-admin-v3-sidebar]] | Clean V3 admin sidebar — parchment surface, collapse rail, Cmd+K palette, no PixInvent conflicts | concept | 2026-05-23 |
| [[concepts/beldify-admin-v3-component-library]] | Reusable Blade component library for V3 admin pages — 11 components, canonical page recipe | concept | 2026-05-23 |

| [[concepts/sidebar-badge-service]] | Laravel service + ViewComposer injecting 5 Redis-cached badge counts into V3 admin sidebar | concept | 2026-05-24 |
| [[concepts/seller-shell-layout]] | Mobile-first 5-tab bottom nav + desktop pill nav for seller dashboard — no PixInvent, RTL-aware, iOS safe-area | concept | 2026-05-24 |
| [[concepts/atlas-frontend-migration]] | Parallel agent fan-out (Phase 1-4) for Next.js Atlas migration; git worktree isolation; Phase 4 gap analysis | concept | 2026-05-24 |

| [[concepts/laravel-optional-typehint-pitfall]] | optional($model) returns Illuminate\Support\Optional, not null — breaks ?Model type hints | concept | 2026-05-24 |
| [[concepts/vitest-worktree-config-collision]] | Vitest walks parent dirs for vite.config.ts — hits monorepo root config lacking vitest in git worktrees | concept | 2026-05-24 |
| [[concepts/i18n-t-fallback-vs-locale-value]] | t('key','fallback') only uses fallback if key is absent — existing keys with English values silently win | concept | 2026-05-24 |
| [[concepts/seller-experience-specs-006]] | Five-slice professional spec for seller experience — register wizard, products CRUD, orders v3, reports, storefront preview | concept | 2026-05-24 |
| [[concepts/sqlite-migration-driver-guard]] | Wrapping dropForeign/dropIndex in DB::getDriverName() !== sqlite guards for cross-driver Laravel migration compatibility | concept | 2026-05-25 |
| [[concepts/git-orphaned-gitlink-fix]] | Converting a mode-160000 orphaned gitlink with no .gitmodules to a normal tracked subdirectory | concept | 2026-05-25 |
| [[concepts/nextjs-i18n-lint]] | Custom i18n-lint.mjs script scanning JSX for untranslated literals; gap: JS string arrays and missing locale keys | concept | 2026-05-25 |

| [[concepts/laravel-static-service-anti-pattern]] | Instance methods called with :: static syntax cause white-screen 500s — fix with app(ClassName::class)->method() | concept | 2026-05-28 |
| [[concepts/css-has-selector-body-class-hook]] | CSS :has() unreliable for admin skin scoping — use plain body.bdv3-shell class hook instead | concept | 2026-05-28 |
| [[concepts/pixinvent-rtl-data-textdirection]] | PixInvent sets data-textdirection="rtl" on body, not dir="rtl" on html — 18 CSS selectors corrected | concept | 2026-05-28 |
| [[concepts/prod-local-git-drift]] | CSS cache-buster bumps applied directly on prod without committing create rsync regression risk | concept | 2026-05-28 |
| [[concepts/laravel-blade-route-guard-pattern]] | Wrapping route() calls in @if(Route::has()) prevents 500s when routes are renamed or missing | concept | 2026-05-28 |

| [[concepts/macos-docker-case-sensitivity-pitfall]] | macOS APFS bind mount exposes case-insensitivity to Docker — breaks Laravel translator group lookup and PSR-4; fix is named volume | concept | 2026-05-29 |
| [[concepts/docker-local-production-mirror]] | Multi-step pattern (tarball + mysqldump + named volume) for mirroring Contabo production to local Docker | concept | 2026-05-29 |
| [[concepts/laravel-user-display-name-accessor]] | Beldify users.name is always null — locale-aware display_name accessor + mb_strtoupper for avatar initials | concept | 2026-05-29 |

| [[concepts/variant-write-service]] | Canonical single normalizer for all Beldify variant writes — seller, admin, and manage controllers | concept | 2026-05-31 |
| [[concepts/options-matrix-variant-builder]] | Shopify-style variant builder: declare options (Color, Size) → auto-generate all combinations at base price | concept | 2026-05-31 |
| [[concepts/dual-mode-seller-dashboard]] | Simple/Advanced progressive disclosure seller dashboard — Binance Lite/Pro pattern for non-technical shop owners | concept | 2026-05-31 |
| [[concepts/beldify-local-volume-sync]] | Named Docker volume sync pattern for local :7895 stack — sync-local.sh + opcache restart required | concept | 2026-05-31 |
| [[concepts/line-awesome-cdn-version-fix]] | seller_shell loaded LA 1.1.0 from dead CDN causing blank icons — upgraded to 1.3.0 | concept | 2026-05-31 |
| [[concepts/beldify-ecommerce-ui-skill]] | Custom Claude skill enforcing Atlas design + frontend-engineer/impeccable/gemini toolchain | concept | 2026-05-31 |
| [[concepts/admin-dashboard-atlas-polish]] | impeccable pass: MAD currency, Atlas charts, i18n eyebrow/subtitle, leaking placeholder keys fixed | concept | 2026-05-31 |

| [[concepts/laravel-route-model-binding-null-param]] | Route with no {store} segment injects empty Store (exists=false) — not null — causing UrlGenerationException | concept | 2026-06-01 |
| [[concepts/seller-no-store-gating]] | EnsureSellerHasStore middleware redirects store-less sellers to store.request.create; fixes infinite dashboard redirect loop | concept | 2026-06-01 |
| [[concepts/seller-js-layout-scope]] | Scripts in page @section('scripts') are absent on all other pages — shared JS must live in the shell layout | concept | 2026-06-01 |
| [[concepts/buyer-seller-messaging-contract-fix]] | Next.js proxy sent recipient_id; backend required shop_id → 422 on every send; plus missing [shopId]/page.tsx conversation detail page | concept | 2026-06-01 |

| [[concepts/tailwind-css-comment-premature-close]] | A */  inside a CSS comment body terminates the block early — PostCSS emits "Unexpected '/'" build failure; diagnose with npx tailwindcss standalone | concept | 2026-06-02 |
| [[concepts/tailwind-arbitrary-value-slash-pitfall]] | bg-[hsl(var(--token)/0.NN)] fails JIT because / is read as opacity-modifier — fix by registering alpha-aware tokens with <alpha-value> | concept | 2026-06-02 |
| [[concepts/atlas-frontend-migration]] | Phase 5 (5 screens via worktree agents), P0 palette sweep, CSS build failures diagnosed, PRs merged to origin/main | concept | 2026-06-02 |
| [[concepts/beldify-ecommerce-ui-skill]] | First real execution (7 surfaces); CSS build pitfalls discovered; seller dashboard Stitch IA port; IBM Plex Sans Arabic added | concept | 2026-06-02 |
| [[concepts/laravel-mcamara-locale-redirect-post-bug]] | POST to locale-less route → mcamara 302 → browser replays as GET → 405; fix: GET links that swap locale segment in current URL | concept | 2026-06-02 |
| [[concepts/laravel-reverb-broadcasting-scheme-config]] | REVERB_SCHEME=ws fed to server-side Pusher HTTP client → cURL "Protocol ws disabled"; derive http/https from ws/wss; L10 uses soketi not laravel/reverb | concept | 2026-06-02 |
| [[concepts/buyer-seller-messaging-contract-fix]] | Added realtime: MessageSent broadcast, Echo listener + dedup + optimistic send, soketi round-trip verified | concept | 2026-06-02 |
| [[concepts/beldify-local-volume-sync]] | Added: sync-local.sh must run from monorepo root (not beldify-backend/) or path resolution fails silently | concept | 2026-06-02 |

*(This index will populate as Claude Code captures conversations and you ingest documents.)*| [[sources/gemini-2026-06-02-storefront-atlas-redesign-review]] | Atlas storefront drift review (contrast/currency/RTL) + synthesis | source | 2026-06-03 |
| [[sources/gemini-2026-06-02-storefront-pages-drift-sweep]] | ~30 Atlas drift findings across storefront pages | source | 2026-06-03 |
| [[sources/panel-2026-05-30-product-mgmt-backend]] | Panel: variant split-brain, stale stock cache, description drift | source | 2026-06-03 |
| [[sources/panel-2026-05-21-admin-css-js-conflicts]] | Panel: finish Atlas (not Filament), commissions-first + CI rules | source | 2026-06-03 |
| [[sources/gemini-2026-05-31-seller-dual-mode-reference-apply]] | Plan: Simple/Advanced seller dashboard reference apply | source | 2026-06-03 |
| [[sources/hooked-2026-06-19-marketplace-loop-delta]] | Delta Hooked audit — loop half-closed, 4 P0/P1 fixes shipped (19e13cb) | source | 2026-06-19 |
| [[sources/marketplace-frontend-ai-review-2026-06-19]] | 36-agent code-grounded review of the Beldify storefront + AI suite (8 P0s, 4 refuted) | source | 2026-06-19 |
| [[concepts/marketplace-frontend-ai-review]] | The 2026-06-19 storefront+AI review, 8 P0s, and the shipped fixes (PRs #7/#8/#11) | concept | 2026-06-19 |
| [[concepts/beldify-buyer-ai-ux]] | Buyer AI suite is real + ethical but under-reached; fix placement/discoverability not models | concept | 2026-06-19 |
