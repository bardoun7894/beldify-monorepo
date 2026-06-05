import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const ma = JSON.parse(readFileSync(join(ROOT, 'src/i18n/locales/ma.json'), 'utf-8'));
const homeContent = readFileSync(join(ROOT, 'src/components/home/HomeContent.tsx'), 'utf-8');

describe('Homepage Darija copy', () => {
  it('uses natural Moroccan wording for the main homepage actions', () => {
    expect(ma.home.hero.cta_shop).toBe('تسوّق فالسوق');
    expect(ma.home.tailoring.cta).toBe('بدا طلب الخياطة');
    expect(ma.home.seller.cta).toBe('حلّ الحانوت ديالك');
    expect(ma.newsletter.button).toBe('تسجّل');
  });

  it('removes awkward homepage phrases', () => {
    const homepageCopy = JSON.stringify({
      home: ma.home,
      featuredSections: ma.featuredSections,
      megaOffers: ma.megaOffers,
      openSouk: ma.openSouk,
      newsletter: ma.newsletter,
    });

    expect(homepageCopy).not.toContain('وصّل للمغرب وما فوق');
    expect(homepageCopy).not.toContain('ستي بالميا فريانة');
    expect(homepageCopy).not.toContain('يتلانش الكاتالوغ');
    expect(homeContent).not.toContain('بيدين تتشقّق من الحب');
  });
});
