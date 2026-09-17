/**
 * The shop page must never fabricate content about a real business.
 *
 * It used to render a hardcoded array of four generic *category* images
 * (category_4_caftan.png, category_7_jabador.png, …) with alt="Atelier interior"
 * on EVERY shop page — i.e. stock catalogue art presented as photos of that
 * specific seller's workshop.
 *
 * The About grid must show the shop's OWN product photos, and show nothing when
 * the shop has none. These are source-level assertions because the offence is the
 * mere presence of hardcoded image URLs.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = readFileSync(
  join(process.cwd(), 'src/app/shops/[name]/page.tsx'),
  'utf-8'
);

describe('shop page — no fabricated atelier imagery', () => {
  it('has no hardcoded ATELIER_IMAGES array', () => {
    expect(SOURCE).not.toMatch(/const\s+ATELIER_IMAGES\s*=/);
  });

  it('hardcodes no category stock-image URLs', () => {
    expect(SOURCE).not.toMatch(/storage\/categories\/category_\d+/);
  });

  it('hardcodes no absolute remote image URLs at module scope', () => {
    // Any literal https://…png/jpg in source is a stock-art smell.
    expect(SOURCE).not.toMatch(/'https:\/\/[^']+\.(png|jpe?g|webp)'/i);
  });

  it('derives the About grid from the shop\'s own product photos', () => {
    expect(SOURCE).toMatch(/const atelierImages\s*=\s*allProducts/);
    expect(SOURCE).toMatch(/main_image/);
  });

  it('renders no About grid when the shop has no photos', () => {
    expect(SOURCE).toMatch(/atelierImages\.length > 0 && \(/);
  });

  it('no longer captions the images as the seller\'s workshop interior', () => {
    // The alt text must not assert these are photos of the atelier itself.
    // (Scoped to the alt= prop so this file's own explanatory comment above
    // does not trip the assertion.)
    expect(SOURCE).not.toMatch(/alt=\{t\([^)]*Atelier interior/);
  });
});
