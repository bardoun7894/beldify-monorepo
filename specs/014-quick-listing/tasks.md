# Tasks: 014 — Quick Listing (PWA Camera + Voice Intake)

**Branch**: `feat/quick-listing` (both repos — `beldify-frontend/` + nested `beldify-backend/`, commit separately per `[[beldify-nested-backend-git-repo]]`)
**Scope reminder**: PWA-first, no Telegram/WhatsApp/webhook/phone-identity code in this feature. Fabric is NEVER AI-guessed, in any task. Price is a hint only, never auto-filled.

NIU = 5 — dependency-ordered with real parallelism after T0/T2 land.

**Dependency graph**:
```
T0 (spike) ──────────────────────────────► gates T3, T4 only
T1 (frontend shell+photos) ─┐
T2 (backend StockCreationService+draft/publish) ─┤─ independent of T0, run in parallel with it
T5 (fabric+price UI, needs T2's endpoints)        │
T6 (color+qty/size UI, needs T2's endpoints)      │
                                                    ├─► T7 (review+publish, needs T1+T2+T5+T6, and T3 if voice ships)
T3 (voice UI, gated by T0) ──────► T4 (backend transcription, gated by T0=Go/Secondary, needs T2) ─┘
T8 (QA, after everything)
T9 (review, last)
```

## T0 — [backend-engineer] Darija ASR spike  (P0 — gates T3/T4 only, does NOT block T1/T2/T5/T6)
- Collect/record 10-20 representative Darija seller-style product-description clips (garment type + color + price digits).
- Evaluate transcription quality via the AI plumbing already in place (`AiManager`/`OpenAiCompatibleClient`/OpenRouter) first; fall back to evaluating one direct ASR provider only if OpenRouter has no usable audio path.
- Score on "does the downstream AI-draft step get enough signal," not word-for-word accuracy.
- Deliverable: short written go/secondary/defer recommendation (see plan.md T0) committed to `specs/014-quick-listing/` (e.g. `asr-spike-findings.md`) so T3/T4's scope is unambiguous before frontend work starts.
- No `php artisan test` gate on this task — it's an evaluation, not shipped code. Do not leave throwaway spike scripts in `app/`; keep them in a scratch location outside the tracked source tree, or clearly marked/removed before T3/T4 begin.

## T1 — [frontend-engineer] Quick Add screen shell + photo capture  (P0; independent of T0)
- `src/app/seller/quick-listing/page.tsx` — new authenticated seller route (Bearer-token auth via existing `useAuth`/`api` client pattern, same as `listingAiService.ts`'s consumer).
- Photo capture via `<input type="file" accept="image/*" capture="environment">` (recommended over a custom `getUserMedia` camera view — see plan.md rationale), 2-3 photos, thumbnail strip with remove.
- Draft resilience: captured photos + any entered fields persisted client-side (IndexedDB recommended for binary photo data) surviving an accidental reload; cleared on publish success or explicit discard.
- Seed `quickListing.*` i18n keys (en/ar/fr first-pass; full 7-locale parity deferred to T7).
- TDD first: `npm run test` (never bare vitest) — renders, capture triggers file selection, thumbnail add/remove, draft persistence round-trip survives simulated reload.

## T2 — [backend-engineer] `StockCreationService` extraction + draft/publish/fabrics endpoints  (P0; independent of T0)
- Extract `ProductController::store()`'s Stock+ProductImage persistence into `App\Services\Seller\StockCreationService::create()`; refactor the controller to call it. Existing `ProductController` feature tests MUST stay green untouched — this is the regression net for a pure extraction.
- New route group `auth:sanctum` + `role:store_owner`, prefix `seller/quick-listing` (matches `routes/api.php:448` conventions): `POST draft`, `GET fabrics`, `POST publish`.
- `QuickListingController@draft` — photos (2-3) + optional audio + optional caption (at least one of audio/caption required) → AI-drafted `{title_en, title_ar, description_en, description_ar, suggested_category_id (grounded to real leaf categories, invented→null), extracted_color (via ColorExtractor — confirm its contract with the owning workstream first, degrade to null on failure/unavailability), price_range_hint (simple min/max/percentile query over comparable active stocks, null under a comparables floor)}`. Photos staged, not yet linked to a `Stock`.
- `QuickListingController@fabrics` — `GET ?category_id=` → `VariantFabric` list (check for an existing endpoint before adding a duplicate route); empty list is valid. Zero AI involvement.
- `QuickListingController@publish` — final structured payload → `StockCreationService::create()` → `Stock` (status `pending`) + `ProductImage`, moving staged images to final path. No `CreditService` call anywhere — add an explicit code comment at the would-be charge point.
- TDD first: `StockCreationService` parity unit test vs. pre-extraction `ProductController::store()` output; `draft` feature tests (photo+caption happy path, category-fallback-to-null, color-extraction-failure degrades gracefully, price-hint-null-under-floor); `fabrics` (populated + empty); `publish` (Stock+ProductImage created, status=pending, grep-verify no `CreditService` import in the slice). `php artisan test` green.

## T3 — [frontend-engineer] Voice-note input + typed-caption fallback  (P1; BLOCKED until T0 delivers its recommendation)
- Shape depends on T0's outcome (Go / Secondary / Defer — see plan.md). Typed-caption field ships unconditionally regardless of outcome and can be built in parallel with T0 (it has no dependency on the spike).
- If not Defer: `MediaRecorder` hold-to-record UI, waveform/timer feedback, playback-before-send, `getUserMedia({audio:true})` permission handling with denied-state fallback to the caption field.
- Wired to `POST .../draft`'s audio field (T2).
- TDD: `npm run test` — record/stop/playback state transitions (mock `MediaRecorder`), permission-denied fallback, caption field always present, quick-pick chips if Secondary outcome.

## T4 — [backend-engineer] Darija transcription integration  (P1; BLOCKED until T0 = Go or Secondary; needs T2's `draft` endpoint to exist)
- **Skip this task entirely if T0 = Defer.**
- Wire the spike-validated provider into `QuickListingController@draft`'s audio branch: transcript → same downstream AI-draft prompt path as a typed caption.
- Low-confidence/failed transcription → graceful fallback (photo-only signal or a flag prompting the frontend to ask for typed caption), never a 500.
- TDD: feature test with a fixture/mocked transcription response asserting transcript flows into the same draft path as caption text; low-confidence fixture asserts graceful non-500 fallback. `php artisan test` green.

## T5 — [frontend-engineer] Fabric tap-list + price-range hint UI  (P0; needs T2's `fabrics`/`draft` endpoints)
- Fabric: tap/chip list from `GET .../fabrics`; section hidden entirely when empty. Zero AI wiring in this component.
- Price: seller-typed numeric input; `price_range_hint` rendered as inline advisory text only — never sets the input's value programmatically.
- TDD: `npm run test` — chip render/select, empty-list hides section, hint renders as advisory text only (assert no `.value` mutation), null hint renders nothing.

## T6 — [frontend-engineer] Color pre-fill + quantity/size chips  (P0; needs T2's `draft` endpoint)
- Color: pre-selected chip from `extracted_color` (hex + localized name) with one-tap override; `null` → empty/seller-must-pick, not an error.
- Quantity: chip row (1/2/5/10/20+), 20+ opens a numeric stepper.
- Sizes (vertical-dependent): chip multi-select, reusing the existing size taxonomy/data source (port data from `Seller/products/create.blade.php`'s size handling, not markup).
- TDD: `npm run test` — color pre-fill + override, quantity chip + stepper, size chip multi-select, all feeding shared draft form state (T1).

## T7 — [frontend-engineer] One-screen review + publish + install-prompt  (P0; needs T1+T2+T5+T6, and T3 if voice shipped)
- Single editable review screen assembling all prior state; every field independently correctable.
- نشر (Publish) → `POST .../publish`; success → clear local draft, honest "submitted for review" copy (never "live now"), then post-publish install-to-home-screen prompt (never a pre-flow gate), framed around order-alert push value (note iOS-requires-install / Android-doesn't asymmetry).
- Failure → draft state preserved, not cleared.
- Full 7-locale i18n parity pass (en/ar/fr/es/ma/nl/de) for all `quickListing.*` keys. Atlas tokens, RTL, mobile-first audit.
- TDD: `npm run test` — assembled review renders all fields, publish success clears draft + shows honest copy + triggers install-prompt logic, publish failure preserves draft, 7-locale i18n parity check (reuse existing project convention/test). Lint + `build:prod` clean.

## T8 — [qa-engineer] Full gate + regression + honesty assertions  (after T1-T7 complete)
- Run full `php artisan test` + `npm run test` suites; report counts.
- Assert: `ProductController::store()` dashboard path byte-identical pre/post extraction; category never invented (real leaf id or null→picker, including a stress fixture with a deliberately bad AI response); fabric never appears in any AI-service prompt (grep-verify); price-hint never mutates the price input (component-test assertion, not just visual check); no `CreditService` call anywhere in the quick-listing backend slice (grep-verify); publish-success copy contains honest pending-review wording, never unqualified "live"/"published"; install prompt fires only post-publish-success, never on load/mid-flow; manual (or automated E2E if tooling exists) verification of camera capture + voice recording (if shipped) on iOS Safari and Android Chrome, uninstalled.
- Verify lint + `build:prod` clean (frontend), Pint/lint clean (backend).

## T9 — [reviewer] Spec compliance + contract review  (last)
- Diff vs FR1–FR16. Confirm no phone-identity/webhook/chat-session artifacts leaked in from the superseded chat-bot design; `StockCreationService` extraction preserves the dashboard contract; `ColorExtractor` integration degrades gracefully and matches the confirmed real contract (not a guessed one); fabric has zero AI code path anywhere; price-hint never auto-fills; free/no-credit honored in code; approval-queue honesty reflected in actual shipped UI copy. Report P0–P3; no edits.
