import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('shipping/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('imports icons from lucide-react', () => {
    expect(pageSrc).toContain('lucide-react');
  });

  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses rounded-2xl for cards (Atlas card radius)', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses neutral gray-200 hairlines (Atlas card border, amber retired 2026-06-10)', () => {
    expect(pageSrc).toContain('gray-200');
  });

  it('wires Shipping Confirmation to i18n key', () => {
    expect(pageSrc).not.toMatch(/"Shipping Confirmation:"/);
    expect(pageSrc).toContain("content.shipping.shippingConfirmation");
  });

  it('wires Delivery Days to i18n key', () => {
    expect(pageSrc).not.toMatch(/"Delivery Days:"/);
    expect(pageSrc).toContain("content.shipping.deliveryDays");
  });

  it('wires Address Changes to i18n key', () => {
    expect(pageSrc).not.toMatch(/"Address Changes:"/);
    expect(pageSrc).toContain("content.shipping.addressChanges");
  });

  it('wires Package Handling to i18n key', () => {
    expect(pageSrc).not.toMatch(/"Package Handling:"/);
    expect(pageSrc).toContain("content.shipping.packageHandling");
  });
});
