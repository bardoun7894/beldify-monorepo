# Spec: 014 — Quick Listing (PWA Camera + Voice Intake)

**Status**: Draft — MAJOR REVISION 2026-07-12 (Telegram/WhatsApp chat-bot approach dropped for Phase 1) · **Branch**: `feat/quick-listing` · **Date**: 2026-07-12

## Revision note (read first)
This spec **replaces** an earlier chat-bot-first design (`014-chat-listing-intake`, superseded, not deleted from history). Owner decision: **drop the chat-bot as the primary surface**. New primary surface is the **existing Beldify PWA (Next.js frontend, `beldify-frontend/`)**.

**Why the pivot** — kept here verbatim as it drives every downstream decision:
> In the PWA the seller is already authenticated (Bearer/Sanctum session via the existing `api` client — see Identity below) — so the whole phone-number identity handshake disappears, and with it the webhook, the conversation state machine, message idempotency, media-download plumbing, and Meta's approval gate. Also, a single screen beats a chat conversation for editing an 8-field structured object: she sees the entire draft at once and can correct any field directly, instead of being walked through questions serially.

Concretely, dropping the chat-bot as Phase 1 deletes an entire tier of complexity that added no user value for an *already-onboarded* seller: no `ChatChannel` contract, no `InboundChatMessage` DTO, no `chat_events` idempotency table, no `chat_listing_sessions` state machine, no Telegram contact-share handshake, no `users.telegram_id` column, no webhook signature verification. All of that existed to solve "who is this stranger messaging us" — a non-problem inside an authenticated web app.

## Problem
Listing a product today requires an existing seller to open the seller dashboard (Blade, `app/Http/Controllers/Seller/ProductController.php::store()`) and fill an 8+ field form, plus upload at least one photo before the product is even eligible to appear on the storefront (`whereHas('images')` gate on best-sellers/new-arrivals). For mobile-first sellers — many of whom are far more comfortable *speaking* Darija than typing Arabic — this form is real friction between "I have a product to sell" and "it's live."

## Goal
A **one-screen, camera-first "Quick Add" (إضافة منتج سريعة)** flow in the existing Next.js PWA. An authenticated seller:
1. Takes 2-3 photos with the device camera (no app install required — plain mobile-web `<input capture>` / `getUserMedia`, works in mobile Safari + Chrome uninstalled).
2. Either **holds to record a voice note** describing the product in Darija (primary path) or types a short caption (fallback path).
3. AI drafts: title (AR+EN), description (AR+EN), category — from the voice transcript/caption + photos.
4. **Color** is auto-extracted from the first photo and pre-filled (via the in-progress `app/Services/Images/ColorExtractor.php` — depend on it, do not reimplement).
5. **Fabric** is picked by the seller from a tap list — **never AI-guessed** (see Fabric decision below).
6. **Price**: seller types the number; AI shows a **suggested range** from comparable listings as a hint, never auto-fills.
7. **Quantity + sizes**: tap-to-select chips, not free text.
8. Seller reviews the entire draft on one screen and taps **نشر** (Publish).
9. Stock (+ ProductImage) is created via the same shared write logic `ProductController::store()` uses. **It goes live immediately** — see the correction below.

## Identity / auth (why this is simple now)
The Next.js frontend already has an authenticated seller-facing JSON API surface distinct from the Blade dashboard: `POST /api/seller/listing-ai/analyze` (feature 012, `SellerListingAiController`) is called from the frontend today via `src/services/listingAiService.ts` using the shared `api` client (`@/lib/api`), which attaches the seller's Sanctum Bearer token from `useAuth`. Quick Listing follows the **exact same pattern** — a new `/api/seller/quick-listing/*` route group, `auth:sanctum` + `role:store_owner` middleware (matching `routes/api.php:448`'s existing seller group), no new auth mechanism, no session bridge, no handoff ticket (the handoff/SSO ticket dance in `sellerBridgeService.ts` is only for entering the *Blade* dashboard — irrelevant here since Quick Add is a native Next.js page, not a Blade view).
- **No phone-identity handshake.** The seller is `Auth::user()` from the Bearer token, exactly like every other `/api/seller/*` endpoint.
- **No webhook.** Nothing is inbound from a third-party provider in Phase 1.
- **No conversation state machine.** The draft lives as React component state on one screen (plus a lightweight autosave-to-`localStorage` recommendation for resilience against an accidental tab close — decide in plan.md), not as a server-side session row.
- **No message idempotency.** A normal HTTP `POST /api/seller/quick-listing/publish` is the single write; ordinary idempotency-key-on-double-submit protection (disable button on submit, standard practice) is sufficient — no distributed retry semantics to handle.

## Demoted, not deleted: the phone-normalization bug
The earlier chat-bot spec surfaced a real, still-true bug: `users.phone` is inconsistently normalized (`App\Support\Phone::normalize()` vs `App\Support\PhoneNumber::normalizeMa()`, with `API/Mobile/AuthController.php:46` and `:311` writing `phone` **raw, unnormalized**, and `Phone::normalize()` itself mishandling the `00212...` international-dial prefix). **This bug does not block Phase 1** — Quick Listing never looks up a user by phone; identity is the Bearer token. It **does** block Phase 3 (WhatsApp adapter, see below), which is the same webhook-plus-`wa_id`-lookup design as before, now demoted to future work. Tracked here so it isn't lost, fixed whenever Phase 3 is actually scheduled — not scheduled as part of this spec's Phase 1/2 work.

## Fabric — manual only, explicit owner decision
**Fabric is NEVER AI-guessed, in any phase.** Rationale (owner's explicit words, preserved): *a vision model cannot reliably distinguish silk/chiffon/viscose in a phone photo, and a confident wrong answer causes returns and destroys trust.* The seller taps a fabric from a fixed list — reuse the existing `VariantFabric` model/table (`app/Models/VariantFabric.php`, already used by `ProductVariant`) rather than inventing a new taxonomy. If a vertical's fabric list is empty/not configured, fabric selection is skipped, not blocked (product still publishable without it, matching how fabric is optional today on the dashboard form for verticals where `product.fabric.enabled` config is off — see `app/helpers.php:27`).

## Color — auto-extract, one-tap override
Color is pre-filled from `app/Services/Images/ColorExtractor.php`, a service **another workstream is building concurrently** — this spec's backend work **depends on** that service's public contract (assumed shape: `extract(string $imagePath): array{hex: string, name_en: string, name_ar: string}` or similar — **confirm the actual signature with that workstream before wiring T2**, do not guess and do not reimplement extraction logic here). If the service is unavailable/not yet merged when Phase 1 backend work starts, Quick Listing must degrade gracefully: color field ships empty/seller-selectable, not blocking, not throwing. Never build a second color-extraction path.

## Price — AI suggests a range, never auto-fills
Seller always types the final price. AI computes/estimates a **comparable-listings price range** (e.g. "قفاطين مشابهة كتباع بين 400 و 600 درهم" — *similar caftans sell between 400 and 600 dirhams*) shown as an inline hint above the price input, sourced from the same category + attributes as other active `stocks` in that category (simple percentile/min-max query is sufficient for v1 — no new ML model). This directly targets first-time-seller pricing paralysis, a known drop-off point. The range is advisory text only; it never writes into the price field.

## Quantity + sizes — chips, not free text
Quantity: a row of tap-to-select chips (e.g. 1, 2, 5, 10, 20+, with 20+ opening a small numeric stepper) rather than a keyboard-open text field — minimizes typing on mobile. Sizes (where the vertical has them): existing size taxonomy, chip multi-select, matching how `VariantWriteService`/`ProductVariant` already model sizes elsewhere — reuse, don't reinvent. v1 Quick Listing produces **at most one default variant equivalent to today's non-variant `Stock` row** (matches `ProductController::store()`'s base path) — full multi-variant (e.g. per-size stock counts) is an explicit v2 stretch, not required for v1 (see Deferrals).

## The Darija voice input — the single biggest technical unknown
**RISK, flagged explicitly**: Darija speech-to-text quality is unproven. Standard ASR models (Whisper and similar) have inconsistent, often poor accuracy on Moroccan Darija specifically (as opposed to Modern Standard Arabic) because Darija is a spoken dialect with heavy code-switching (French/Berber loanwords) and no standard orthography. This is the highest-uncertainty piece of the whole feature and must be de-risked **before** the full voice-input UI is built.

- **Mandatory early spike** (see tasks.md T0): before any voice-input frontend work, run a small number (10-20) of real/representative Darija product-description recordings (seller-style: "قندورة صفراء ديال العرس، فيها الطراز، الثمن 450 درهم") through the candidate transcription provider(s) — start with whatever OpenRouter-accessible or directly-integrable ASR the `AiManager`/`OpenAiCompatibleClient` ecosystem can reach (e.g. an OpenAI-compatible Whisper endpoint via OpenRouter, if available) and measure: does the transcript preserve enough signal (product type, color words, price digits) for the downstream AI-draft step to work, even if word-for-word transcription is imperfect? The bar is **"good enough signal for AI extraction,"** not perfect transcription.
- **Decision gate**: spike output determines whether voice ships as (a) the primary input as originally envisioned, (b) a secondary/optional input alongside a more prominent typed-caption fallback, or (c) deferred entirely to a later iteration if signal quality is too poor to be useful, with typed caption + tap-driven quick-fields (a short set of common preset caption chips, e.g. "قندورة"/"جلابة"/"طقم" one-tap category hints) as the v1 fallback path.
- **This spike blocks nothing else** — photo capture, AI-draft-from-caption, color extraction, fabric picker, price-range hint, and chip-based quantity/sizes are all independently buildable and shippable even if voice input is deferred. Voice is additive, not a hard dependency of the rest of Quick Listing.
- **Fallback UI, always present regardless of spike outcome**: a typed-caption text field is never removed, even if voice ships successfully — voice augments, it doesn't replace, since some sellers will always prefer typing or be in a context where they can't speak (public transport, workshop noise).

## Install is never a gate
Quick Listing must work fully in an **uninstalled** mobile browser tab (Safari iOS, Chrome Android) — camera capture via standard web APIs (`<input type="file" accept="image/*" capture>` and/or `getUserMedia` for a live camera view, decide in plan.md which gives a better UX vs. reliability trade-off across both browsers), voice via `MediaRecorder`, no service-worker dependency for the core flow. An "Add to Home Screen" prompt is shown **only after a successful first listing publish**, motivated by order-alert push notifications — not shown as a precondition to using the feature. Note the platform asymmetry: iOS requires home-screen install for Web Push to work at all; Android does not (`[[beldify-pwa-webpush]]`). Since Morocco is Android-dominant, most sellers get push value without ever installing; the install prompt for iOS sellers explains *why* (to get order alerts), not as a paywall on listing.

## What's kept from the superseded chat-bot design
- **Channel-agnostic core write path**: `ProductController::store()`'s Stock+ProductImage persistence logic is still extracted into a shared `App\Services\Seller\StockCreationService`, called by the existing Blade controller AND the new Quick Listing endpoint. Any future channel (PWA now, WhatsApp later) calls the same service — this is the one piece of the original design that was never chat-bot-specific.
- **CORRECTION (2026-07-13) — THERE IS NO PRODUCT APPROVAL QUEUE.** Earlier drafts of this spec claimed listings land `status = pending` and required "submitted for review" copy plus an auto-approve-trusted-sellers fast-follow. **That was wrong.** Verified against code and the live prod schema:
  - `stocks` has **no approval column** — only `is_active` and `status` (which defaults to `in_stock`, a stock-level state, not moderation).
  - `Seller/ProductController::store()` sets `is_active = 1` on create (`:170`), and the storefront filters on `is_active`.
  - The "approval bottleneck" in prior notes refers to **store** approval (`stores.status`), not products. bardstore is already approved.

  So a seller listing **goes live the moment it is published**. The publish-confirmation UI must say **"published / تم النشر"** — saying "submitted for review" would be a lie in the other direction. No auto-approve work is needed; that scope is dropped.
- **Free / no credit charge**: Quick Listing does not call `CreditService`. Same rationale as before — this is friction removal for acquisition/retention, not a billed power-tool.
- **AI grounding discipline**: category suggestions are validated server-side against the real leaf-category set (`[[beldify-getallcategories-leaf-only]]`), reusing `ListingIntelligenceService`'s grounding pattern — an invented/non-leaf category is never accepted, the seller is shown a real picklist instead.

## Deferred: Phase 3 — WhatsApp adapter (future work, NOT built now)
Once Quick Listing's shared `StockCreationService` exists and is proven, a WhatsApp adapter becomes a straightforward second caller of that same service — for two distinct future use cases, neither built in this spec:
1. **Notifications outbound** ("your caftan sold!") — arguably higher near-term value than listing intake, since it needs no AI draft/confirmation flow, just a templated push.
2. **Photo-drop listing inbound** — the original chat-bot design (webhook, `wa_id`→phone→`Store` lookup, AI draft, confirm, publish) becomes relevant again here, and picks up exactly where the superseded chat-bot spec left off: `ChatChannel` contract, `X-Hub-Signature-256` verification, media download, idempotency, and — **this is where the phone-normalization bug (see above) actually matters and must be fixed first.**
This spec's plan.md keeps the `ChatChannel` contract shape documented as a forward-looking design note (so Phase 3 doesn't need to re-derive it from scratch) but **no WhatsApp code, migration, or route is built in Phase 1/2.**

## Functional requirements

### Phase 1 — Quick Add core (PWA)
- **FR1** — New route group `POST/GET /api/seller/quick-listing/*`, `auth:sanctum` + `role:store_owner` (+ suspended-store guard matching the existing seller group's pattern), matching `routes/api.php:448`'s conventions. No new auth mechanism.
- **FR2** — `POST /api/seller/quick-listing/draft` — accepts photos (multipart, 2-3 images) + either a voice-note audio file OR a typed caption (at least one of the two required) + `store_id` (resolved from auth if omitted, matching `ProductController`'s `resolveStore()` pattern) → returns an AI-drafted `{title_en, title_ar, description_en, description_ar, suggested_category_id, suggested_category_name, extracted_color: {hex, name_en, name_ar}|null, price_range_hint: {min, max}|null}`. This is a **draft-only** call — nothing is persisted to `stocks`/`product_images` yet.
- **FR3** — Voice note handling: if audio is present, transcribe (provider TBD by spike, T0) → feed transcript into the same AI-draft prompt path as a typed caption would use (one unified downstream prompt, two possible text sources). Transcription failure/low-confidence → fall back to treating the request as caption-less (draft proceeds with whatever photo-only signal is available, or prompts the seller to type instead) — never a hard error blocking the screen.
- **FR4** — Color: call `ColorExtractor` (dependency, contract to be confirmed with the owning workstream before implementation) on the first uploaded photo; on any failure/unavailability, `extracted_color: null`, UI shows an empty/seller-pick color field — never blocks the draft.
- **FR5** — Category: AI suggestion is validated server-side against the real leaf-category set; invented/non-leaf → `suggested_category_id: null` + the frontend shows a category picker instead of a pre-filled chip.
- **FR6** — Price range hint: `GET /api/seller/quick-listing/price-hint?category_id=&attrs=` (or folded into FR2's draft response) — simple query over active `stocks` in the same category (min/max or a percentile band), advisory only, never auto-fills the price input.
- **FR7** — Fabric: **no AI involvement whatsoever**. `GET /api/seller/quick-listing/fabrics?category_id=` (or reuse an existing fabric-list endpoint if one exists — check before adding a new one) returns the tap-list options sourced from `VariantFabric`; empty list is a valid, non-blocking response.
- **FR8** — `POST /api/seller/quick-listing/publish` — final payload (title_en/ar, description_en/ar, category_id, color, fabric_id?, price, quantity, sizes[]?, image references from the draft step) → calls the shared `StockCreationService::create()` → `Stock` (`is_active = 1`, LIVE immediately) + `ProductImage` rows. Response mirrors what the dashboard form's success response would look like (or as close as reasonably reusable).
- **FR9** — **`StockCreationService` extraction**: `ProductController::store()`'s Stock+ProductImage persistence (~lines 140-225) is extracted into `App\Services\Seller\StockCreationService::create(Store $store, array $data, array $imagePaths, ?int $userId = null): Stock`, called by both the refactored `ProductController::store()` (dashboard, unchanged behavior/contract) and the new `quick-listing/publish` endpoint. **Byte-identical dashboard behavior is a hard requirement**, verified by existing `ProductController` feature tests staying green untouched.
- **FR10** — No `CreditService` call anywhere in this flow — explicit code comment at the would-be charge point, matching the FR13-style discipline from the superseded spec.
- **FR11** — Publish-success copy says **"تم النشر" (published)** — the listing IS live. There is no approval queue for products (see the correction above); telling the seller it is "under review" would be false.
- **FR12** — Draft resilience: the in-progress draft (photos already uploaded + AI-drafted fields + any seller edits) survives an accidental tab close/reload via `localStorage` persistence on the client, cleared on successful publish or explicit seller-initiated discard. No server-side session table (contrast with the superseded chat-bot's `chat_listing_sessions`) — this is deliberately client-only since there's no cross-device/cross-session continuity requirement in Phase 1.
- **FR13** — Uninstalled-browser support: camera capture and voice recording work without PWA installation, tested against mobile Safari (iOS) and Chrome (Android) specifically — these are the two engines that matter for Morocco's device mix.
- **FR14** — Install prompt: triggered only after a successful `publish`, framed around push-notification value, never gating the Quick Add flow itself.

### Phase 2 — Darija ASR spike + voice-path hardening
- **FR15** — Spike (T0, gates only the voice sub-path, nothing else): evaluate Darija ASR quality on 10-20 representative recordings against the chosen provider; produce a short go/secondary/defer recommendation (see Decision gate above) that determines the shape of FR3's implementation before it's built for real.
- **FR16** — Whatever the spike concludes, the typed-caption fallback (FR2/FR3) ships regardless and is never removed.

## Non-functional / constraints
- Frontend-heavy feature for the first time in this spec's lineage — significant `frontend-engineer` scope, unlike the chat-bot design which was backend-only. Work happens in `beldify-frontend/` (new page, e.g. `src/app/seller/quick-listing/`) + `beldify-backend/` (new controller/service/routes).
- Must not alter `ProductController::store()`'s existing behavior/contract for dashboard-originated creates — extraction only.
- `ColorExtractor` dependency: do not block Phase 1 entirely on it landing — build the integration point (FR4) so it degrades gracefully if the service isn't ready yet, and swap in the real call once available.
- Fabric is manual, permanently, in every phase — this is a hard product rule, not a v1-only limitation to revisit.
- RTL, Atlas design tokens (`[[beldify-design-tokens]]`), 7-locale i18n parity for all new UI strings, mobile-first layout (this is explicitly a phone-camera flow).
- `npm run test` (never bare vitest, `[[beldify-vitest-dual-config-hazard]]`) + `php artisan test` + lint + build all green.

## Scope (v1) / deferrals
- **v1 IN**: PWA Quick Add screen (photo capture, typed-caption + voice-note input with spike-gated rollout, AI title/description/category draft, auto color extraction with one-tap override, manual fabric tap-list, AI price-range hint with manual price entry, chip-based quantity, chip-based sizes where applicable, one-screen review + publish), shared `StockCreationService` extraction, free/no-credit, live-on-publish confirmation UI, uninstalled-browser support, post-publish install prompt.
- **v1 OUT / deferred**:
  - Phase 3 WhatsApp adapter (notifications AND photo-drop listing) — entirely future work; phone-normalization bug fix is bundled with this deferral, not fixed now.
  - Full multi-variant (per-size stock counts) — v1 produces a single default variant equivalent to today's non-variant `Stock` row.
  - Any server-side draft session persistence (cross-device continuation) — client-`localStorage` only in v1.
  - Editing an already-published listing via Quick Add — v1 is create-only; edits still go through the existing dashboard form.
  - Multi-language voice input beyond Darija (MSA/French voice notes) — out of scope unless the spike naturally reveals they work equally well, not a v1 requirement to test separately.

## Acceptance
- Spike (T0) produces a documented go/secondary/defer recommendation for Darija ASR before any voice-input frontend UI is built for real use (a throwaway record/upload harness for the spike itself doesn't count as "the voice UI").
- A seller can complete photo capture → (voice or typed) → AI draft → color pre-filled (or gracefully empty) → fabric tap-pick → price entered with a range hint shown → quantity/sizes via chips → publish, entirely inside an uninstalled mobile browser tab, on both iOS Safari and Android Chrome.
- Publish creates a `Stock` (`is_active = 1`, live) + `ProductImage` row(s) via `StockCreationService`, matching what `ProductController::store()` would produce for equivalent structured input; existing dashboard `ProductController` feature tests remain green untouched.
- Category is always a real leaf category id or the seller is shown a real picker — never invented.
- Fabric is never AI-suggested in any code path.
- Price is never auto-filled by AI — only a range hint is shown.
- No credits are charged.
- Publish-success copy says the listing is **live** ("تم النشر") — because it is. There is no product approval queue.
- Install prompt appears only post-first-publish, never as a gate.
- `npm run test` + `php artisan test` + lint + build all green.
