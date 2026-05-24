import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('services/tailoring/tailors/[id]/page.tsx — Atlas compliance', () => {
  // ── i18n wiring (TDD red) ──────────────────────────────────────────────────
  it('is a client component (required for useTranslation)', () => {
    expect(pageSrc).toMatch(/'use client'/);
  });

  it('imports useTranslation from react-i18next', () => {
    expect(pageSrc).toContain('useTranslation');
  });

  it('wires breadcrumb "Home" through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.breadcrumbHome'");
  });

  it('wires "Languages Spoken" heading through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.languagesSpoken'");
  });

  it('wires "Working Hours" heading through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.workingHours'");
  });

  it('wires "Services Offered" heading through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.servicesOffered'");
  });

  it('wires "Book an Appointment" CTA through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.bookAppointment'");
  });

  it('wires "Contact via WhatsApp" through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.contactWhatsApp'");
  });

  it('wires "Contact Information" sidebar heading through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.contactInformation'");
  });

  it('wires "Business Hours" through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.businessHours'");
  });

  it('wires "Customer Reviews" heading through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.customerReviews'");
  });

  it('wires "Portfolio" heading through t()', () => {
    expect(pageSrc).toContain("t('content.tailorDetail.portfolio'");
  });

  // ── Atlas design tokens ────────────────────────────────────────────────────
  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('imports icons from lucide-react', () => {
    expect(pageSrc).toContain('lucide-react');
  });

  it('does not use primary-* tokens (non-Atlas)', () => {
    expect(pageSrc).not.toMatch(/\bprimary-\d+\b/);
  });

  it('does not use neutral-* tokens (non-Atlas)', () => {
    expect(pageSrc).not.toMatch(/\bneutral-\d+\b/);
  });

  it('does not use dark: class variants', () => {
    expect(pageSrc).not.toContain('dark:');
  });

  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('does not use raw <img> tags (must use next/image or background)', () => {
    expect(pageSrc).not.toMatch(/<img\s/);
  });

  it('uses rounded-2xl for cards', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses amber-200 for borders/rings (Atlas hairlines)', () => {
    expect(pageSrc).toContain('amber-200');
  });

  it('uses indigo-700 for primary CTA buttons (not green for WhatsApp)', () => {
    // Green should only appear for WhatsApp branding color (that is OK per DESIGN.md)
    // But the primary CTA "Book Appointment" must be indigo
    expect(pageSrc).toContain('indigo-700');
  });
});
