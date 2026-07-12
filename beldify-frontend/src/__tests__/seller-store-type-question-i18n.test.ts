/**
 * "What do you sell?" store-type question — i18n key parity across all 7
 * locales (en, ar, fr, es, ma, nl, de). A missing key in any locale is a
 * build/lint failure per project convention.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const LOCALE_DIR = join(ROOT, 'src/i18n/locales');
const LOCALES = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];

function readLocale(locale: string): Record<string, any> {
  return JSON.parse(readFileSync(join(LOCALE_DIR, `${locale}.json`), 'utf-8'));
}

const STORE_TYPE_KEYS = [
  'store_type_label',
  'store_type_loading',
  'store_type_load_error',
  'validation_store_type',
];

describe('seller.register "what do you sell?" i18n keys', () => {
  for (const locale of LOCALES) {
    for (const key of STORE_TYPE_KEYS) {
      it(`${locale} has seller.register.${key}`, () => {
        const data = readLocale(locale);
        const value = data?.seller?.register?.[key];
        expect(value, `${locale}.seller.register.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});
