'use client';

/**
 * T030 — Seller store settings: vertical picker
 *
 * Reads/sets the store's store_type → vertical.
 * LIVE WIRING (WS-A): replace MOCK_STORE_PROFILE with GET /api/v1/seller/store
 * and the save call with PATCH /api/v1/seller/store
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gem,
  Scissors,
  Shirt,
  ShoppingBag,
  Users,
  CheckCircle2,
  ChevronRight,
  Save,
} from 'lucide-react';
import { fetchVerticalConfig, VerticalSlug } from '@/services/verticalService';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// ─── vertical definitions ────────────────────────────────────────────────────

interface VerticalOption {
  slug: VerticalSlug;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ReactNode;
  badge?: string;
}

const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    slug: 'regular',
    label: 'Regular Store',
    labelAr: 'متجر عادي',
    description: 'Sell ready-made products. No custom order configuration.',
    descriptionAr: 'بيع منتجات جاهزة. لا تكوين مخصص.',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    slug: 'jewelry',
    label: 'Jewelry',
    labelAr: 'المجوهرات',
    description: 'Sell ready-made and custom-made jewelry pieces with material, purity, gemstone and finish fields.',
    descriptionAr: 'بيع المجوهرات الجاهزة والمخصصة مع حقول المادة والنقاء والأحجار الكريمة.',
    icon: <Gem className="h-5 w-5" />,
    badge: 'جديد',
  },
  {
    slug: 'menswear',
    label: "Men's Clothing",
    labelAr: 'ملابس رجالية',
    description: 'Ready-made and made-to-order menswear with measurements and fabric selection.',
    descriptionAr: 'ملابس رجالية جاهزة وبناءً على الطلب مع قياسات واختيار الأقمشة.',
    icon: <Shirt className="h-5 w-5" />,
  },
  {
    slug: 'womenswear',
    label: "Women's Clothing",
    labelAr: 'ملابس نسائية',
    description: 'Ready-made and made-to-order womenswear with measurements and fabric selection.',
    descriptionAr: 'ملابس نسائية جاهزة وبناءً على الطلب مع قياسات واختيار الأقمشة.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    slug: 'tailor',
    label: 'Tailor Store',
    labelAr: 'متجر الخياطة',
    description: 'Full tailoring service with measurements, fabric catalog, and custom orders.',
    descriptionAr: 'خدمة خياطة كاملة مع القياسات وكتالوج الأقمشة والطلبات المخصصة.',
    icon: <Scissors className="h-5 w-5" />,
  },
];

// ─── mock store profile ───────────────────────────────────────────────────────
// LIVE WIRING (WS-A): replace with GET /api/v1/seller/store
const MOCK_STORE_PROFILE = {
  id: 12,
  name: 'Atlas Bijoux',
  store_type: 'jewelry' as VerticalSlug,
};

export default function StoreSettingsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [storeType, setStoreType] = useState<VerticalSlug>(MOCK_STORE_PROFILE.store_type);
  const [pendingVertical, setPendingVertical] = useState<VerticalSlug | null>(null);
  const [configPreview, setConfigPreview] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch field preview when vertical is selected
  useEffect(() => {
    if (!pendingVertical) return;
    fetchVerticalConfig(pendingVertical).then(config => {
      setConfigPreview(config.fields.map(f => f.label));
    });
  }, [pendingVertical]);

  const handleVerticalSelect = (slug: VerticalSlug) => {
    setPendingVertical(slug);
    setConfigPreview([]);
  };

  const handleSave = async () => {
    if (!pendingVertical) return;
    setSaving(true);
    // LIVE WIRING (WS-A): replace with PATCH /api/v1/seller/store { store_type: pendingVertical }
    await new Promise(r => setTimeout(r, 600));
    setStoreType(pendingVertical);
    setPendingVertical(null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeVertical = pendingVertical ?? storeType;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-0.5">
              {isRTL ? 'إعدادات المتجر' : 'Store Settings'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
              {isRTL ? 'اختيار نوع المتجر' : 'Store Vertical'}
            </h1>
          </div>
          {pendingVertical && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                saving
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
              )}
            >
              <Save className="h-4 w-4" aria-hidden />
              {saving
                ? (isRTL ? 'جارٍ الحفظ…' : 'Saving…')
                : (isRTL ? 'حفظ' : 'Save')}
            </button>
          )}
          {saved && (
            <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {isRTL ? 'تم الحفظ' : 'Saved'}
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-3xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500 mb-6">
          {isRTL
            ? 'اختر تخصص متجرك. النوع المحدد يحدد الحقول المتاحة في نموذج المنتج وطلبات التصنيع المخصص.'
            : 'Choose your store specialisation. The selected vertical determines which fields appear in your product form and custom-order requests.'}
        </p>

        {/* ── Vertical picker ── */}
        <fieldset className="space-y-3">
          <legend className="sr-only">
            {isRTL ? 'نوع المتجر' : 'Store vertical'}
          </legend>

          {VERTICAL_OPTIONS.map(option => {
            const isActive = activeVertical === option.slug;
            const label = isRTL ? option.labelAr : option.label;
            const desc = isRTL ? option.descriptionAr : option.description;

            return (
              <label
                key={option.slug}
                htmlFor={`vertical-${option.slug}`}
                className={cn(
                  'flex items-start gap-4 rounded-2xl p-4 ring-1 cursor-pointer transition-all duration-150',
                  isActive
                    ? 'ring-2 ring-indigo-700 bg-white shadow-sm'
                    : 'ring-amber-200 bg-white hover:ring-indigo-300 hover:shadow-sm'
                )}
              >
                <input
                  type="radio"
                  id={`vertical-${option.slug}`}
                  name="store_type"
                  value={option.slug}
                  checked={isActive}
                  onChange={() => handleVerticalSelect(option.slug)}
                  className="sr-only"
                />

                <div
                  className={cn(
                    'mt-0.5 shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
                    isActive ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-700'
                  )}
                  aria-hidden
                >
                  {option.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-semibold text-gray-900', isActive && 'text-indigo-700')}>
                      {label}
                    </span>
                    {option.badge && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        {option.badge}
                      </span>
                    )}
                    {storeType === option.slug && !pendingVertical && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">
                        {isRTL ? 'الحالي' : 'Current'}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 leading-snug">{desc}</p>
                </div>

                <ChevronRight
                  className={cn(
                    'mt-1 shrink-0 h-4 w-4 transition-colors rtl:rotate-180',
                    isActive ? 'text-indigo-700' : 'text-gray-300'
                  )}
                  aria-hidden
                />
              </label>
            );
          })}
        </fieldset>

        {/* ── Field preview ── */}
        {pendingVertical && configPreview.length > 0 && (
          <div className="mt-6 rounded-2xl bg-indigo-50/70 ring-1 ring-indigo-200 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-medium mb-3">
              {isRTL ? 'الحقول المتاحة لهذا التخصص' : 'Fields for this vertical'}
            </p>
            <div className="flex flex-wrap gap-2">
              {configPreview.map(label => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-white ring-1 ring-indigo-200 px-3 py-1 text-xs font-medium text-indigo-800"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {pendingVertical && configPreview.length === 0 && pendingVertical === 'regular' && (
          <div className="mt-6 rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-5">
            <p className="text-sm text-gray-500">
              {isRTL
                ? 'المتجر العادي لا يحتوي على حقول مخصصة — منتجات جاهزة فقط.'
                : 'Regular stores have no custom fields — ready-made products only.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
