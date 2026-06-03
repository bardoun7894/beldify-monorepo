import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const LOCALE_DIR = join(ROOT, 'src/i18n/locales');

type JsonObject = Record<string, unknown>;

function readLocale(locale: string): JsonObject {
  return JSON.parse(readFileSync(join(LOCALE_DIR, `${locale}.json`), 'utf-8'));
}

function flattenStrings(value: unknown, path: string[] = [], out: Record<string, string> = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as JsonObject)) {
      flattenStrings(child, [...path, key], out);
    }
  } else if (typeof value === 'string') {
    out[path.join('.')] = value;
  }

  return out;
}

function placeholders(value: string) {
  return Array.from(value.matchAll(/{{\s*([\w.]+)\s*}}/g)).map((match) => match[1]).sort();
}

describe('i18n locale quality', () => {
  it('keeps the navbar language list aligned with supported locales', () => {
    const navbar = readFileSync(join(ROOT, 'src/components/layout/Navbar.tsx'), 'utf-8');

    expect(navbar).not.toContain("code: 'de'");
    expect(navbar).toContain('LOCALES');
  });

  it('keeps ma/ar interpolation placeholders aligned with English', () => {
    const en = flattenStrings(readLocale('en'));

    for (const locale of ['ma', 'ar']) {
      const target = flattenStrings(readLocale(locale));

      for (const [key, englishValue] of Object.entries(en)) {
        if (!(key in target)) continue;

        expect(placeholders(target[key]), `${locale}.${key}`).toEqual(placeholders(englishValue));
      }
    }
  });

  it('keeps Moroccan Arabic copy polished and free of obvious machine wording', () => {
    const maValues = Object.values(flattenStrings(readLocale('ma'))).join('\n');

    for (const phrase of [
      'لقفة',
      'الكاريتو',
      'الكارو',
      'كوموند',
      'لكوموند',
      'كونط',
      'بروفيل',
      'كاطيكور',
      'ليفريزون',
      'ستوك',
      'بوتيك',
      'بوتيقات',
      'تيليفون',
      'كوليكسيون',
      'كولشي',
      'فيلتراج',
      'شحاط',
      'ماشي ضروري',
      'حانوت',
      'حوايج',
      'بانر',
      'بانرات',
      'نفتش',
      'مستاستخدم',
      'استخدمة',
      'الاستخدمة',
      'استخدمات',
      'ديالة شي حاجة',
      'واي ',
      'جونان',
      'طابلو دبور',
      'فريانة',
      'رجع بزاف',
      'ما لقاش',
      'بتاع',
      'تنضاج ليبلديفاي',
      'إعدادات للغة',
      'ختار للغة',
      'لنجليزية',
      'لفرونسي',
      'لسبنيول',
      'لالمانية',
      'Community',
      'messages.',
    ]) {
      expect(maValues).not.toContain(phrase);
    }

    expect(Object.values(flattenStrings(readLocale('ma')))).not.toContain('للغة');
  });

  it('keeps Arabic copy in Modern Standard Arabic without Darija leakage', () => {
    const arValues = Object.values(flattenStrings(readLocale('ar'))).join('\n');

    for (const phrase of [
      'ما كاين',
      'شوف كولشي',
      'ليفريزون',
      'الحانوت',
      'حوايج',
      'ديال',
    ]) {
      expect(arValues).not.toContain(phrase);
    }
  });
});
