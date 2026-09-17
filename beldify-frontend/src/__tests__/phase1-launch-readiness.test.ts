/**
 * Phase 1 launch-readiness tests (TDD — node / source-reading environment)
 *
 * These tests read source files directly and assert structural contracts,
 * avoiding the jsdom overhead for pure static-analysis checks.
 *
 * For render-based behavioural tests see:
 *   src/__tests__/phase1-launch-readiness-render.test.tsx
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

// ── helpers ───────────────────────────────────────────────────────────────────
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 1 — COD checkout end-to-end
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 1 — COD checkout', () => {
  const checkout = read('src/app/checkout/page.tsx');

  it('defaults selectedPayment to "cod"', () => {
    // useState<string>('cod') must be present so COD is the primary default
    expect(checkout).toMatch(/useState<string>\(\s*['"]cod['"]\s*\)/);
  });

  it('maps cod → cash_on_delivery in normalizedPaymentMethod', () => {
    expect(checkout).toContain("cod: 'cash_on_delivery'");
  });

  it('does NOT render a required card form when any payment method is selected', () => {
    // The renderPaymentSection should not contain required card input fields
    // (cardNumber, cardHolder, expiryDate, cvv as required inputs)
    expect(checkout).not.toMatch(/name="cardNumber"[^>]*required/);
    expect(checkout).not.toMatch(/name="cvv"[^>]*required/);
  });

  it('COD method card has NO "Coming soon" overlay — it is immediately selectable', () => {
    // paypal and card return a non-null reason from paymentDisabledReason();
    // cod returns null so it has no overlay.  The gate is paymentDisabledReason(method).
    expect(checkout).toMatch(/paymentDisabledReason\s*\(/);
    // COD must never have an unconditional overlay — confirmed by the null-check on the helper
    expect(checkout).toMatch(/paymentDisabledReason\(method\)\s*&&/);
  });

  it('on success routes to /order-confirmation with orderId from response', () => {
    // Must push to /order-confirmation?orderId=...
    expect(checkout).toContain('/order-confirmation?orderId=');
  });

  it('extracts order_number from response.data.order_number first (backend contract)', () => {
    // The backend store() returns { status: 'success', data: { order_number, id, ... } }
    // Confirmation page binds by order_number via GET /api/orders/{orderNumber}
    expect(checkout).toContain('response?.data?.order_number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 2 — Seller registration page
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 2 — /seller/register page', () => {
  it('page file exists at src/app/seller/register/page.tsx', () => {
    expect(exists('src/app/seller/register/page.tsx')).toBe(true);
  });

  const getPage = () => read('src/app/seller/register/page.tsx');

  it('uses AuthContext / useAuth to gate access', () => {
    const page = getPage();
    expect(page).toMatch(/useAuth|AuthContext/);
  });

  it('shows login/register prompt when unauthenticated', () => {
    const page = getPage();
    // Must handle the !isAuthenticated state
    expect(page).toMatch(/isAuthenticated/);
    // And direct to login
    expect(page).toMatch(/\/login/);
  });

  it('renders a store-request form for authenticated users', () => {
    const page = getPage();
    // Must have an onSubmit handler
    expect(page).toMatch(/onSubmit|handleSubmit/);
    // Must have business type field
    expect(page).toMatch(/business_type|businessType/);
    // Must have country field
    expect(page).toMatch(/country/);
    // Must have contact email or phone field
    expect(page).toMatch(/contact_email|contact_phone|contactEmail/);
  });

  it('has a pending-approval confirmation state', () => {
    const page = getPage();
    expect(page).toMatch(/pending|submitted|approval/i);
  });

  it('uses Atlas design tokens (indigo / amber palette)', () => {
    const page = getPage();
    expect(page).toMatch(/indigo-[0-9]+|amber-[0-9]+/);
  });

  it('has i18n keys under seller.register namespace', () => {
    const page = getPage();
    expect(page).toMatch(/seller\.register\./);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 2 — i18n keys present in en.json and ar.json
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 2 — i18n seller.register keys', () => {
  it('en.json has seller.register block', () => {
    const en = read('src/i18n/locales/en.json');
    const parsed = JSON.parse(en);
    expect(parsed).toHaveProperty('seller');
    expect(parsed.seller).toHaveProperty('register');
  });

  it('ar.json has seller.register block', () => {
    const ar = read('src/i18n/locales/ar.json');
    const parsed = JSON.parse(ar);
    expect(parsed).toHaveProperty('seller');
    expect(parsed.seller).toHaveProperty('register');
  });

  it('en.json seller.register has title key', () => {
    const parsed = JSON.parse(read('src/i18n/locales/en.json'));
    expect(parsed.seller.register).toHaveProperty('title');
  });

  it('ar.json seller.register has title key', () => {
    const parsed = JSON.parse(read('src/i18n/locales/ar.json'));
    expect(parsed.seller.register).toHaveProperty('title');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 3 — Seller dashboard SSO entry
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 3 — Seller dashboard SSO entry', () => {
  it('/seller/register page surfaces "Go to seller dashboard" entry for approved sellers', () => {
    const page = read('src/app/seller/register/page.tsx');
    // Must reference the seller/enter backend URL or a "go to dashboard" action
    expect(page).toMatch(/seller\/enter|seller.*dashboard|dashboard.*seller/i);
  });

  it('the seller/enter navigation uses full-page href (window.location.href), not router.push', () => {
    const page = read('src/app/seller/register/page.tsx');
    // Must use window.location.href for full-page nav (session cookie + redirect)
    expect(page).toMatch(/window\.location\.href|href.*seller\/enter/);
  });

  it('seller/enter URL is built from NEXT_PUBLIC_API_URL env var (bare origin)', () => {
    const page = read('src/app/seller/register/page.tsx');
    // Must reference NEXT_PUBLIC_API_URL to construct the backend URL
    expect(page).toMatch(/NEXT_PUBLIC_API_URL|process\.env.*API_URL/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 3 — Seller service exists
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 2 — sellerService exists', () => {
  it('src/services/sellerService.ts exists', () => {
    expect(exists('src/services/sellerService.ts')).toBe(true);
  });

  it('sellerService exports a submitStoreRequest function', () => {
    const svc = read('src/services/sellerService.ts');
    expect(svc).toMatch(/submitStoreRequest/);
  });

  it('sellerService POSTs to /api/seller/register or /store-request/store', () => {
    const svc = read('src/services/sellerService.ts');
    expect(svc).toMatch(/\/api\/seller\/register|\/store-request\/store|seller.*register|store-request/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 4 — Homepage i18n extraction (HomeContent client component)
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 4 — Homepage i18n extraction', () => {
  const homeContentPath = 'src/components/home/HomeContent.tsx';
  // Hero i18n keys moved to BrandHeroSlide (extracted in hero-admin-switch feature)
  const brandHeroSlidePath = 'src/components/home/BrandHeroSlide.tsx';
  const pagePath = 'src/app/page.tsx';

  it('HomeContent.tsx exists at src/components/home/HomeContent.tsx', () => {
    expect(exists(homeContentPath)).toBe(true);
  });

  it('HomeContent.tsx has "use client" directive at the top', () => {
    const content = read(homeContentPath);
    expect(content).toMatch(/^['"]use client['"]/);
  });

  it('HomeContent.tsx imports useTranslation from react-i18next', () => {
    const content = read(homeContentPath);
    expect(content).toMatch(/from ['"]react-i18next['"]/);
    expect(content).toMatch(/useTranslation/);
  });

  it('CampaignArtSlides.tsx calls t() for home.hero art slide keys (photo hero replaced by art slides)', () => {
    // After campaign-art overhaul, BrandHeroSlide is a shim; hero i18n keys live in CampaignArtSlides
    const content = read('src/components/home/CampaignArtSlides.tsx');
    expect(content).toContain("home.hero.art_slide1_headline");
  });

  it('CampaignArtSlides.tsx uses useTranslation for all hero copy (no hardcoded strings)', () => {
    const content = read('src/components/home/CampaignArtSlides.tsx');
    expect(content).toContain("useTranslation");
  });

  it('HeroSection.tsx uses t() for hero section_label (aria)', () => {
    const content = read('src/components/home/HeroSection.tsx');
    expect(content).toContain("home.hero.section_label");
  });

  it('HomeContent.tsx calls t() for home.trust.verified_sellers', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.trust.verified_sellers");
  });

  it('HomeContent.tsx calls t() for home.trust.free_delivery', () => {
    // The trust strip uses 4 keys: free_delivery, verified_sellers, returns, support.
    // secure_payments was removed in the neutral-canvas overhaul (2026-06-10).
    const content = read(homeContentPath);
    expect(content).toContain("home.trust.free_delivery");
  });

  it('HomeContent.tsx calls t() for home.trust.returns', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.trust.returns");
  });

  it('HomeContent.tsx calls t() for home.trust.support', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.trust.support");
  });

  it('HomeContent.tsx calls t() for home.categories.subtitle', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.categories.subtitle");
  });

  it('HomeContent.tsx calls t() for home.categories.empty', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.categories.empty");
  });

  it('HomeContent.tsx calls t() for home.offers.editorial_title', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.offers.editorial_title");
  });

  it('HomeContent.tsx calls t() for home.offers.editorial_description', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.offers.editorial_description");
  });

  it('HomeContent.tsx calls t() for home.offers.cta_shop_collection', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.offers.cta_shop_collection");
  });

  it('HomeContent.tsx calls t() for home.offers.cta_explore', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.offers.cta_explore");
  });

  it('HomeContent.tsx calls t() for home.tailoring.headline', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.tailoring.headline");
  });

  it('HomeContent.tsx calls t() for home.tailoring.description', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.tailoring.description");
  });

  it('HomeContent.tsx calls t() for home.tailoring.cta', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.tailoring.cta");
  });

  it('HomeContent.tsx calls t() for all tailoring step keys', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.tailoring.step1_title");
    expect(content).toContain("home.tailoring.step1_detail");
    expect(content).toContain("home.tailoring.step2_title");
    expect(content).toContain("home.tailoring.step2_detail");
    expect(content).toContain("home.tailoring.step3_title");
    expect(content).toContain("home.tailoring.step3_detail");
  });

  it('HomeContent.tsx calls t() for home.ateliers.subtitle', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.ateliers.subtitle");
  });

  it('HomeContent.tsx calls t() for home.ateliers.view_all', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.ateliers.view_all");
  });

  it('HomeContent.tsx calls t() for home.journal.subtitle', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.journal.subtitle");
  });

  it('HomeContent.tsx calls t() for home.journal.view_all', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.journal.view_all");
  });

  it('HomeContent.tsx calls t() for home.journal.read_time_suffix', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.journal.read_time_suffix");
  });

  it('HomeContent.tsx calls t() for home.seller.headline_line1', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.headline_line1");
  });

  it('HomeContent.tsx calls t() for home.seller.headline_line2', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.headline_line2");
  });

  it('HomeContent.tsx calls t() for home.seller.description', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.description");
  });

  it('HomeContent.tsx calls t() for home.seller.cta', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.cta");
  });

  it('HomeContent.tsx calls t() for home.seller.ai_chip', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.ai_chip");
  });

  it('HomeContent.tsx calls t() for home.seller.stat_range_label', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.stat_range_label");
  });

  it('HomeContent.tsx calls t() for home.seller.stat_sellers_label', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.stat_sellers_label");
  });

  it('HomeContent.tsx calls t() for home.seller.stat_protection_label', () => {
    const content = read(homeContentPath);
    expect(content).toContain("home.seller.stat_protection_label");
  });

  it('page.tsx no longer contains hardcoded French strings', () => {
    const page = read(pagePath);
    expect(page).not.toContain('Vendeurs vérifiés');
    expect(page).not.toContain('Élégance Traditionnelle');
    expect(page).not.toContain('Want it tailored to you?');
  });

  it('HomeContent.tsx does not contain hardcoded French strings', () => {
    const content = read(homeContentPath);
    expect(content).not.toContain('Vendeurs vérifiés');
    expect(content).not.toContain('Élégance Traditionnelle');
  });

  it('page.tsx renders <HomeContent with categories and data props', () => {
    const page = read(pagePath);
    expect(page).toMatch(/<HomeContent[^>]*categories/);
    expect(page).toMatch(/<HomeContent[^>]*data/);
  });

  it('page.tsx still contains getHomeData and getTopCategories server-side fetching', () => {
    const page = read(pagePath);
    expect(page).toContain('getHomeData');
    expect(page).toContain('getTopCategories');
  });

  it('page.tsx does NOT contain the obsolete NOTE comment about RSC→Client error', () => {
    const page = read(pagePath);
    expect(page).not.toContain('RSC→Client webpack-manifest error');
    expect(page).not.toContain('extracting into a');
  });

  it('page.tsx no longer contains FeaturedSections import (moved to HomeContent)', () => {
    const page = read(pagePath);
    expect(page).not.toMatch(/import FeaturedSections/);
  });

  it('HomeContent.tsx imports FeaturedSections, MegaOffers, Newsletter', () => {
    const content = read(homeContentPath);
    expect(content).toMatch(/import FeaturedSections|FeaturedSections/);
    expect(content).toMatch(/import.*MegaOffers|MegaOffers/);
    expect(content).toMatch(/import.*Newsletter|Newsletter/);
  });
});
