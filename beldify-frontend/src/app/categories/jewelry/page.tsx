'use client';

/**
 * T033 — Buyer: Jewelry category page + filters
 *
 * Filters: material (gold/silver/copper/brass/mixed) + gemstone type.
 * LIVE WIRING (WS-A): replace MOCK_JEWELRY_PRODUCTS with
 * GET /api/v1/products?category=jewelry&material={m}&gemstone_type={g}
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, Gem, X } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// ─── filter options (from contracts.md §A1 jewelry field options) ─────────────

const MATERIAL_OPTIONS = ['gold', 'silver', 'copper', 'brass', 'mixed'];
const GEMSTONE_OPTIONS = ['none', 'diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'semi-precious', 'other'];

const MATERIAL_LABELS: Record<string, string> = {
  gold: 'ذهب', silver: 'فضة', copper: 'نحاس', brass: 'نحاس أصفر', mixed: 'مختلط',
};
const GEMSTONE_LABELS: Record<string, string> = {
  none: 'بدون', diamond: 'ماس', emerald: 'زمرد', ruby: 'ياقوت أحمر',
  sapphire: 'ياقوت أزرق', pearl: 'لؤلؤ', 'semi-precious': 'أحجار شبه كريمة', other: 'أخرى',
};

// ─── mock products ─────────────────────────────────────────────────────────────
// LIVE WIRING (WS-A): replace with real product list API response

interface JewelryProduct {
  id: number;
  name: string;
  nameAr: string;
  price: number;
  material: string;
  gemstone_type: string | null;
  image: string | null;
  store: { name: string; slug: string };
}

const MOCK_JEWELRY_PRODUCTS: JewelryProduct[] = [
  {
    id: 1, name: 'Gold Filigree Ring', nameAr: 'خاتم فيليجران ذهبي',
    price: 1850, material: 'gold', gemstone_type: 'emerald',
    image: null,
    store: { name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
  },
  {
    id: 2, name: 'Silver Bracelet', nameAr: 'سوار فضي',
    price: 420, material: 'silver', gemstone_type: 'none',
    image: null,
    store: { name: 'Artisan Souq', slug: 'artisan-souq' },
  },
  {
    id: 3, name: 'Pearl Necklace', nameAr: 'عقد لؤلؤ',
    price: 3200, material: 'gold', gemstone_type: 'pearl',
    image: null,
    store: { name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
  },
  {
    id: 4, name: 'Copper Cuff Bangle', nameAr: 'إسورة نحاس',
    price: 280, material: 'copper', gemstone_type: 'none',
    image: null,
    store: { name: 'Fez Crafts', slug: 'fez-crafts' },
  },
];

export default function JewelryCategoryPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [materialFilter, setMaterialFilter] = useState<string>('');
  const [gemstoneFilter, setGemstoneFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_JEWELRY_PRODUCTS.filter(p => {
      if (materialFilter && p.material !== materialFilter) return false;
      if (gemstoneFilter && p.gemstone_type !== gemstoneFilter) return false;
      return true;
    });
  }, [materialFilter, gemstoneFilter]);

  const hasActiveFilters = materialFilter || gemstoneFilter;

  const clearFilters = () => {
    setMaterialFilter('');
    setGemstoneFilter('');
  };

  return (
    <div className="min-h-screen bg-amber-50/50 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Hero ── */}
      <div className="bg-indigo-950 text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-2">
            {isRTL ? 'التصنيفات' : 'Categories'}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight mb-3"
            style={isRTL ? undefined : playfair}
          >
            <Gem className="inline-block h-8 w-8 text-amber-400 me-2 mb-1" aria-hidden />
            {isRTL ? 'المجوهرات' : 'Jewelry'}
          </h1>
          <p className="text-indigo-300 text-base max-w-xl">
            {isRTL
              ? 'مجوهرات مغربية تقليدية وعصرية. قطع جاهزة أو مصنوعة حسب الطلب.'
              : 'Traditional and contemporary Moroccan jewelry. Ready-made or custom-crafted pieces.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {/* ── Filter bar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
              showFilters
                ? 'bg-indigo-700 text-white ring-indigo-700'
                : 'bg-white text-gray-700 ring-amber-200 hover:ring-indigo-300'
            )}
            aria-expanded={showFilters}
            aria-controls="jewelry-filters"
          >
            <Filter className="h-4 w-4" aria-hidden />
            {isRTL ? 'تصفية' : 'Filter'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-700/30"
            >
              <X className="h-3 w-3" aria-hidden />
              {isRTL ? 'مسح التصفية' : 'Clear filters'}
            </button>
          )}

          <span className="text-sm text-gray-400 ms-auto">
            {filtered.length} {isRTL ? 'قطعة' : 'items'}
          </span>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div
            id="jewelry-filters"
            className="rounded-2xl ring-1 ring-amber-200 bg-white p-5 mb-6 space-y-5"
          >
            {/* Material filter */}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
                {isRTL ? 'المادة' : 'Material'}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={isRTL ? 'تصفية حسب المادة' : 'Filter by material'}>
                {MATERIAL_OPTIONS.map(mat => (
                  <button
                    key={mat}
                    onClick={() => setMaterialFilter(materialFilter === mat ? '' : mat)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                      materialFilter === mat
                        ? 'bg-indigo-700 text-white ring-indigo-700'
                        : 'bg-white text-gray-700 ring-amber-200 hover:ring-indigo-300'
                    )}
                    aria-pressed={materialFilter === mat}
                  >
                    {isRTL ? MATERIAL_LABELS[mat] : mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Gemstone filter */}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
                {isRTL ? 'الحجر الكريم' : 'Gemstone'}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={isRTL ? 'تصفية حسب الحجر الكريم' : 'Filter by gemstone'}>
                {GEMSTONE_OPTIONS.map(gem => (
                  <button
                    key={gem}
                    onClick={() => setGemstoneFilter(gemstoneFilter === gem ? '' : gem)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                      gemstoneFilter === gem
                        ? 'bg-indigo-700 text-white ring-indigo-700'
                        : 'bg-white text-gray-700 ring-amber-200 hover:ring-indigo-300'
                    )}
                    aria-pressed={gemstoneFilter === gem}
                  >
                    {isRTL ? GEMSTONE_LABELS[gem] : gem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Product grid ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Gem className="h-10 w-10 text-amber-300" aria-hidden />
            <p className="text-base font-semibold text-gray-600">
              {isRTL ? 'لا توجد قطع تطابق التصفية' : 'No pieces match your filters'}
            </p>
            <button onClick={clearFilters} className="text-sm text-indigo-600 underline">
              {isRTL ? 'مسح التصفية' : 'Clear filters'}
            </button>
          </div>
        ) : (
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label={isRTL ? 'المجوهرات' : 'Jewelry products'}
          >
            {filtered.map(product => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="group block rounded-2xl ring-1 ring-amber-200 bg-white overflow-hidden hover:ring-indigo-300 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                  aria-label={isRTL ? product.nameAr : product.name}
                >
                  {/* Product image */}
                  <div className="relative aspect-square bg-amber-50">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={isRTL ? product.nameAr : product.name}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gem className="h-10 w-10 text-amber-200" aria-hidden />
                      </div>
                    )}
                    {/* Material badge */}
                    <span className="absolute top-2 start-2 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200 capitalize">
                      {isRTL ? MATERIAL_LABELS[product.material] : product.material}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                      {isRTL ? product.nameAr : product.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{product.store.name}</p>
                    <p className="text-sm font-bold text-indigo-700 mt-1.5 tabular-nums">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* ── Custom order CTA ── */}
        <div className="mt-10 rounded-2xl bg-indigo-700 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-300 font-medium mb-1">
              {isRTL ? 'لا تجد ما تبحث عنه؟' : "Can't find what you're looking for?"}
            </p>
            <p className="text-lg font-semibold" style={isRTL ? undefined : playfair}>
              {isRTL ? 'اطلب قطعة مخصصة' : 'Request a Custom Piece'}
            </p>
            <p className="text-sm text-indigo-200 mt-0.5">
              {isRTL ? 'صمّم مجوهراتك مع حرفي موثوق.' : 'Design your jewelry with a trusted artisan.'}
            </p>
          </div>
          <Link
            href="/custom-orders/new?vertical=jewelry"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-indigo-950 font-semibold px-5 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Gem className="h-4 w-4" aria-hidden />
            {isRTL ? 'طلب مخصص' : 'Custom Order'}
          </Link>
        </div>
      </div>
    </div>
  );
}
