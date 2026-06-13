'use client';

/**
 * T034 — Buyer: jewelry PDP fields
 *
 * Displays jewelry-specific attributes from a product's spec/customization_options.
 * Optional fields are hidden if null/undefined/empty — no blank row shown.
 *
 * Props come from the product's additional_attributes (ready-made)
 * or spec (custom-order preview).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gem } from 'lucide-react';

// ─── field i18n keys + English fallbacks ─────────────────────────────────────

const FIELD_KEYS: Record<string, { key: string; fallback: string }> = {
  material:       { key: 'jewelry.fields.material',       fallback: 'Material' },
  purity:         { key: 'jewelry.fields.purity',         fallback: 'Purity' },
  weight_grams:   { key: 'jewelry.fields.weight_grams',   fallback: 'Weight' },
  size:           { key: 'jewelry.fields.size',           fallback: 'Size' },
  gemstone_type:  { key: 'jewelry.fields.gemstone_type',  fallback: 'Gemstone' },
  gemstone_count: { key: 'jewelry.fields.gemstone_count', fallback: 'Gemstone Count' },
  gemstone_carat: { key: 'jewelry.fields.gemstone_carat', fallback: 'Carat' },
  engraving:      { key: 'jewelry.fields.engraving',      fallback: 'Engraving' },
  finish:         { key: 'jewelry.fields.finish',         fallback: 'Finish' },
};

// Ordered display sequence (material always first)
const DISPLAY_ORDER = [
  'material',
  'purity',
  'weight_grams',
  'size',
  'gemstone_type',
  'gemstone_count',
  'gemstone_carat',
  'engraving',
  'finish',
];

// ─── props ────────────────────────────────────────────────────────────────────

export interface JewelryFieldsProps {
  /** Raw spec/customization_options from product */
  spec: Record<string, string | number | null | undefined>;
  /** Compact layout (e.g. for cart/order summary) */
  compact?: boolean;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function JewelryFields({ spec, compact = false }: JewelryFieldsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  // Build ordered list of fields that have a non-null, non-empty value
  const visibleFields = DISPLAY_ORDER
    .map(key => ({
      key,
      label: t(FIELD_KEYS[key]?.key ?? `jewelry.fields.${key}`, FIELD_KEYS[key]?.fallback ?? key),
      value: spec[key],
    }))
    .filter(({ value }) => {
      if (value === null || value === undefined || value === '') return false;
      if (String(value).toLowerCase() === 'none') return false;
      return true;
    });

  if (visibleFields.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5" dir={isRTL ? 'rtl' : 'ltr'}>
        {visibleFields.map(({ key, label, value }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 ring-1 ring-amber-200 px-2.5 py-1 text-xs text-amber-800"
          >
            <span className="font-medium">{label}:</span>
            <span>{String(value)}{key === 'weight_grams' ? ' g' : ''}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl ring-1 ring-gray-200 bg-white overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t('jewelry.fields.specs_aria', 'Jewelry specifications')}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <Gem className="h-4 w-4 text-amber-600" aria-hidden />
        <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
          {t('jewelry.fields.piece_specs', 'Piece Specifications')}
        </p>
      </div>

      {/* Fields */}
      <dl className="divide-y divide-gray-100">
        {visibleFields.map(({ key, label, value }) => (
          <div key={key} className="flex items-center gap-4 px-5 py-3">
            <dt className="w-32 shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {label}
            </dt>
            <dd className="text-sm font-medium text-gray-900 capitalize">
              {String(value)}
              {key === 'weight_grams' && <span className="text-gray-500 font-normal ms-1">g</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
