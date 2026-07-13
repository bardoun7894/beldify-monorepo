# Plan: 014 — Quick Listing (PWA Camera + Voice Intake)

Full-stack. Frontend: `beldify-frontend/` (Next.js 15). Backend: `beldify-backend/` (its own nested git repo, `[[beldify-nested-backend-git-repo]]`). Both repos branch/commit independently as `feat/quick-listing`.

## T0 — Darija ASR spike (de-risking, gates only the voice sub-path)

Not real feature code — a throwaway evaluation harness, run before any voice-input UI work begins.

- Collect or record 10-20 representative Darija product-description clips (seller-style phrasing: garment type, color word, occasion, price mentioned in digits — e.g. "قندورة صفراء ديال العرس، فيها الطراز، الثمن 450 درهم").
- Try the candidate transcription path reachable through the existing AI plumbing first — check whether `AiManager`/`OpenAiCompatibleClient` (OpenRouter) exposes an audio-transcription-capable model/endpoint before reaching for a brand-new provider integration; if OpenRouter has no usable audio path, evaluate one direct provider (e.g. a Whisper-compatible endpoint) as a second option — but do not integrate a full new provider client permanently until the spike says it's worth it.
- Score each transcript not on word-for-word accuracy but on **"does the downstream AI-draft step get enough signal"**: does it preserve product-type words, color words, and price digits well enough that feeding the (possibly imperfect) transcript into the existing `SellerAiService`/`ListingIntelligenceService`-style prompt still produces a usable title/description/category draft?
- **Output**: a short written recommendation (a few paragraphs is enough — this is a spike, not a spec) choosing one of:
  - (a) **Go** — voice ships as the primary input as designed (FR2/FR3 as written).
  - (b) **Secondary** — voice ships but demoted to an optional alongside a more prominent typed-caption/quick-chip fallback (adjust FR2/FR3 framing before building).
  - (c) **Defer** — voice input is cut from v1 entirely; ship typed-caption + preset caption chips only, revisit voice later.
- This recommendation is a **hard gate before T3 (voice-input frontend)** starts, but does **not** block T1/T2/T4/T5/T6/T7 (photo capture, backend draft/publish endpoints, color, fabric, price-hint, review screen) — those proceed in parallel with T0.

## Identity / auth — decision record
Quick Listing reuses the **existing Bearer-token seller JSON API surface**, the same one `POST /api/seller/listing-ai/analyze` (`SellerListingAiController`, feature 012) already uses from the frontend via `src/services/listingAiService.ts` + the shared `api` client (`@/lib/api`, attaches the seller's Sanctum token from `useAuth`). New route group:

```php
Route::middleware(['auth:sanctum', 'role:store_owner'])->prefix('seller/quick-listing')->group(function () {
    Route::post('draft', [QuickListingController::class, 'draft']);
    Route::get('price-hint', [QuickListingController::class, 'priceHint']); // or folded into draft response — decide during T2
    Route::get('fabrics', [QuickListingController::class, 'fabrics']);
    Route::post('publish', [QuickListingController::class, 'publish']);
});
```
Matches the existing seller group's conventions at `routes/api.php:448`. **No** SSO handoff ticket (`sellerBridgeService.ts`'s `enterSellerDashboard()` pattern) is involved — that mechanism exists solely to bridge a Bearer-token session into the *Blade* dashboard's cookie session, and Quick Add is a native Next.js page that never leaves the Bearer-token world.

**Explicit non-decision carried over, demoted**: the `users.phone` dual-normalizer bug (`App\Support\Phone::normalize()` vs `App\Support\PhoneNumber::normalizeMa()`, raw writes at `API/Mobile/AuthController.php:46,311`, missing `00212` handling in `Phone::normalize()`) is real and still true, but **out of scope for this plan** — it only matters for a future phone-number-based identity lookup (Phase 3 WhatsApp). Do not fix it as part of this feature; do not let it block any T-numbered task below. Tracked as a standing known-bug reference only.

## T1 — [frontend-engineer] Quick Add screen shell + photo capture
- New route `src/app/seller/quick-listing/page.tsx` (Next.js App Router), gated the same way other seller-only pages check auth (`useAuth`, role guard — check existing pattern, e.g. how `src/app/seller/register/page.tsx` or similar guards seller-only routes).
- Photo capture: evaluate `<input type="file" accept="image/*" capture="environment">` (simplest, broadest compatibility, triggers native camera UI on both iOS Safari and Android Chrome without any custom camera view) vs. a `getUserMedia`-driven live in-page camera view (more native-app feel, meaningfully more implementation/testing surface, more failure modes across browser versions). **Recommendation: ship the `<input capture>` approach for v1** — it is dramatically less risky cross-browser and meets the "2-3 photos, no install" requirement without inventing a camera UI; a live-preview camera view is a plausible v2 polish item, not required now.
- Multi-photo (2-3): repeat the capture input or use `multiple` where supported, plus a simple thumbnail strip with per-photo remove.
- Draft resilience: persist captured-photo state (as object URLs / a small IndexedDB or base64-in-localStorage blob store — decide size limits carefully, photos are large; likely IndexedDB over localStorage for the binary data specifically) so a reload mid-flow doesn't lose captured photos. FR12.
- i18n keys `quickListing.*` seeded (title, capture prompts, etc.) in en/ar/fr first-pass; full 7-locale parity is a T7 (review screen) + polish pass item once all copy is finalized.
- TDD: `npm run test` — component renders, capture-input triggers file selection (mock `FileReader`), thumbnail add/remove, localStorage/IndexedDB draft persistence round-trip.

## T2 — [backend-engineer] `StockCreationService` extraction + `POST draft` + `POST publish`
- Extract `ProductController::store()`'s Stock+ProductImage persistence (~lines 140-225) into `App\Services\Seller\StockCreationService::create(Store $store, array $data, array $imagePaths, ?int $userId = null): Stock`. Refactor `ProductController::store()` to call it for the non-variant path. **Byte-identical behavior required** — protected by keeping all existing `ProductController` feature tests green untouched + a new parity unit test asserting `StockCreationService` output matches.
- `QuickListingController@draft` — `POST /api/seller/quick-listing/draft`: accepts multipart photos (2-3) + optional audio file + optional typed caption (at least one of audio/caption required — validate). Resolves store via `resolveStore()`-equivalent (reuse the pattern, don't duplicate). Calls:
  - AI draft service (new, thin — reuse `AiManager`/`SellerAiService`/`ListingIntelligenceService` client plumbing, do not build a new provider client): caption-or-transcript text → `{title_en, title_ar, description_en, description_ar, suggested_category_id}`, category validated server-side against the real leaf-category set (reuse `[[beldify-ai-listing-intelligence|012]]`'s grounding pattern) — invented/non-leaf → `null`, frontend shows a picker.
  - Color: call `ColorExtractor` (confirm actual public method signature with the owning workstream before wiring this — do not guess the contract; if unavailable/throws, `extracted_color: null`, never blocks).
  - Price-range hint: simple query — `Stock::where('category_id', $categoryId)->where('is_deleted', false)->where('is_active', true)` → min/max or a percentile band of `current_sale_unit_price`. No new ML model. Returns `null` gracefully if too few comparables (define a floor, e.g. <3 listings → no hint rather than a misleadingly narrow range).
  - Returns the full draft JSON (FR2's response shape). **Nothing persisted yet** — photos are stored to a temp/staging path (or directly to the final `stocks/{store_id}/...` path but not yet linked to a `Stock` row — decide which is simpler; recommend staging under a `quick-listing-drafts/{store_id}/{draft_token}/` prefix via `StorageService`, moved/renamed on publish, so an abandoned draft doesn't leave orphaned files silently attributed to a real stock's path convention).
- `QuickListingController@fabrics` — `GET /api/seller/quick-listing/fabrics?category_id=`: returns `VariantFabric` options (check first whether an existing fabric-list endpoint already exists anywhere in the API before adding a duplicate route). Empty list is valid.
- `QuickListingController@publish` — `POST /api/seller/quick-listing/publish`: final structured payload (title_en/ar, description_en/ar, category_id, color hex/name, fabric_id?, price, quantity, sizes[]?, staged image refs from `draft`) → `StockCreationService::create()` → `Stock` (`is_active = 1` — LIVE immediately, no approval queue) + `ProductImage` rows, moving staged images to their final path. No `CreditService` call — explicit comment at the would-be charge point (FR10).
- TDD first: feature tests for `draft` (photos+caption happy path, photos+audio happy path — audio transcription itself can be mocked/stubbed at this layer since T3's ASR integration is separate, category-fallback-to-null on invented category, color-extraction-failure degrades gracefully, price-hint returns null under the comparables floor), `fabrics` (populated + empty), `publish` (creates Stock+ProductImage matching `StockCreationService` parity test, status=pending, no credit charge — grep-verify no `CreditService` import/call in the whole quick-listing slice). `php artisan test` green.

## T3 — [frontend-engineer] Voice-note input + typed-caption fallback (gated by T0)
- **Do not start until T0's spike recommendation is in.**
- `MediaRecorder` hold-to-record UI (press-and-hold button, waveform/timer feedback while recording, playback-before-send confirmation). Permissions handling (`getUserMedia({audio:true})`) with a clear denied-permission fallback message pointing at the typed-caption field.
- Typed-caption text field is **always present** regardless of T0's outcome (FR16) — implement this piece unconditionally, in parallel with T0 if desired, since it has zero dependency on the spike.
- If T0 = (a) Go: voice is the prominent/primary input, caption is visually secondary.
- If T0 = (b) Secondary: voice is offered but visually deprioritized under a "or type instead" caption field, plus quick-pick caption chips (e.g. "قندورة"/"جلابة"/"طقم") as fast-path hints.
- If T0 = (c) Defer: voice UI is not built at all in v1; ship typed-caption + quick-pick chips only.
- Audio upload wired to `POST /api/seller/quick-listing/draft`'s audio field.
- TDD: `npm run test` — record/stop/playback state transitions (mock `MediaRecorder`), permission-denied fallback, caption field always renders, chip quick-fill.

## T4 — [backend-engineer] Darija transcription integration (only if T0 = Go or Secondary)
- Wire the spike-validated transcription provider into `QuickListingController@draft`'s audio branch: audio file → transcript text → same downstream AI-draft prompt path as a typed caption (FR3's "one unified downstream prompt, two possible text sources").
- Low-confidence/failed transcription → do not hard-fail; either fall back to photo-only draft signal or return a flag telling the frontend to prompt for typed caption instead (decide exact UX contract with T3's frontend work — coordinate, don't guess independently).
- TDD: feature test with a fixture audio file (or mocked transcription client response) asserting the transcript flows into the same draft-generation path as a caption; low-confidence fixture asserts graceful fallback, not a 500.
- **Skipped entirely if T0 = Defer** — in that case this task does not exist for v1; audio never reaches the backend.

## T5 — [frontend-engineer] Fabric tap-list + price-range hint UI
- Fabric: fetch `GET .../fabrics?category_id=`, render as a tap/chip list; skip the section entirely (no empty-state clutter) when the list is empty. Never AI-populated — this component has zero AI wiring, by design (FR7).
- Price: seller-typed numeric input; render the `price_range_hint` (from the draft response) as inline advisory text above/near the input, styled clearly as a hint not a value (e.g. muted text, not a pre-filled field) — never programmatically sets the input's value.
- TDD: `npm run test` — fabric chips render/select, empty-list hides section, price-hint renders as advisory text and never mutates the price field's value, price-hint absent (null) renders nothing.

## T6 — [frontend-engineer] Color pre-fill + quantity/size chips
- Color: render `extracted_color` (hex swatch + localized name) as a pre-selected chip with a one-tap "change" affordance opening a small color picker/palette (reuse whatever color-selection component pattern already exists elsewhere in seller/product UI, if any — check before building a new one); `null` → empty/seller-must-pick state, not an error.
- Quantity: chip row (1, 2, 5, 10, 20+) with 20+ opening a numeric stepper.
- Sizes (vertical-dependent): chip multi-select reusing the existing size taxonomy/component if one exists in the seller product form already (check `Seller/products/create.blade.php`'s size handling for the taxonomy source of truth, port the *data*, not Blade markup).
- TDD: `npm run test` — color pre-fill renders + override flow, quantity chip selection + 20+ stepper, size chip multi-select, all wired into the shared draft form state from T1.

## T7 — [frontend-engineer] One-screen review + publish + install-prompt
- Single review screen assembling T1(photos)+T3(voice/caption)+T5(fabric/price)+T6(color/qty/sizes) state into one editable summary, each field independently correctable (per the core UX rationale — no serial question-walk).
- نشر (Publish) button → `POST /api/seller/quick-listing/publish`; on success: clear the `localStorage`/IndexedDB draft (FR12), show honest "published — the listing is live" copy (FR11 — never "live now"), then trigger the **post-publish** install-to-home-screen prompt (FR14) — never shown before or during the flow, and framed around order-alert push value (note the iOS-requires-install / Android-doesn't asymmetry in the copy or at least in code comments, `[[beldify-pwa-webpush]]`).
- Full 7-locale i18n parity pass for all `quickListing.*` keys introduced across T1/T3/T5/T6/T7 (en, ar, fr, es, ma, nl, de) — do this as a dedicated pass once copy is stable, not per-component, to avoid re-translating churn.
- Atlas design tokens, RTL, mobile-first layout audit.
- TDD: `npm run test` — full assembled-state review renders all fields, publish success clears local draft + shows honest copy + triggers install-prompt logic, publish failure keeps the draft intact (does not clear on error), i18n key parity check (existing project convention/test for 7-locale parity, reuse it).

## T8 — [qa-engineer] Full gate + regression + honesty assertions
- Run full backend (`php artisan test`) + frontend (`npm run test`, never bare vitest) suites; report counts.
- Assert: `ProductController::store()` dashboard path is byte-identical pre/post `StockCreationService` extraction (diff behavior, not just green tests); category is never invented (real leaf id or null→picker, in both the draft response and a stress test with a deliberately bad AI response fixture); fabric is never present in any AI-service call/prompt (grep-verify the AI-draft service's prompt construction never mentions fabric); price is never programmatically written by the frontend price-hint into the input value (verify via a component test asserting no `.value =` side effect from the hint); no `CreditService` call anywhere in the quick-listing backend slice (grep-verify); publish-success copy contains "قيد المراجعة"/"published — the listing is live"-equivalent wording, not "live"/"published" unqualified; install prompt logic only fires after a successful publish event, never on page load or mid-flow; uninstalled-browser manual verification checklist (or Playwright/equivalent if the project has E2E tooling — check) for iOS Safari + Android Chrome camera capture and (if shipped) voice recording.
- Verify lint + `build:prod` clean on frontend; Pint/lint clean on backend.

## T9 — [reviewer] Spec compliance + contract review
- Diff vs FR1–FR16. Confirm: no phone-identity/webhook/session-machine code was accidentally built (this spec explicitly excludes it — flag if any WhatsApp/Telegram/chat-session artifacts leaked in from the superseded design); `StockCreationService` extraction didn't change the dashboard contract; `ColorExtractor` integration point degrades gracefully and doesn't hardcode assumptions about a contract that wasn't confirmed; fabric truly has zero AI code path; price-hint truly never auto-fills; free/no-credit honored in code; approval-queue honesty reflected in actual UI copy, not just the spec. Report P0–P3; no edits.

## Risks / guards
- **T0 spike is the schedule risk** — if it drags, T3/T4 slip, but T1/T2/T5/T6/T7 (everything except voice) do not, since voice is additive by design. Do not let voice uncertainty block shipping the rest.
- **`ColorExtractor` contract is owned by a concurrent workstream** — confirm the actual method signature before T2 wires it; build T2's integration point defensively (try/catch, graceful null) so a late or changed contract doesn't break the whole draft endpoint.
- **Extraction risk (`StockCreationService`)** — same guard as the superseded spec: existing `ProductController` feature tests are the regression net, plus an explicit parity test.
- **Fabric AI-leakage risk** — because the rest of the draft endpoint is AI-heavy, it would be easy for a future refactor to accidentally fold fabric into the same AI prompt "for consistency." T8's grep-verify assertion exists specifically to catch that regression class early and permanently, not just at initial ship.
- **Price auto-fill temptation** — same class of risk as fabric: a well-meaning future change might "helpfully" pre-fill the price from the hint. T8's assertion guards this too.
- **Phase 3 (WhatsApp) is explicitly not started** — the `ChatChannel` contract shape from the superseded spec is worth keeping as a design note in this plan for whoever picks up Phase 3 later, but zero code, migration, or route for it ships as part of this feature. Forward-looking contract shape (unchanged from the superseded design, for reference only):
  ```php
  interface ChatChannel {
      public function verifyWebhook(Request $request): bool;
      public function parseInboundMessage(Request $request): ?InboundChatMessage;
      public function downloadMedia(string $mediaRef): ?string;
      public function sendMessage(string $chatRef, string $text, array $options = []): void;
  }
  ```
  When Phase 3 is scheduled: fix the phone-normalization bug first (see Identity/auth decision record above), then build this adapter as a second caller of the now-proven `StockCreationService`.


> **CORRECTION 2026-07-13 — there is NO product approval queue.** Earlier drafts said listings land `pending` and required "submitted for review" copy plus an auto-approve fast-follow. Verified against code and the live prod schema: `stocks` has no approval column, and `Seller/ProductController::store()` sets `is_active = 1` on create (`:170`). A published listing is LIVE. The "approval bottleneck" in older notes refers to **store** approval, not products.
