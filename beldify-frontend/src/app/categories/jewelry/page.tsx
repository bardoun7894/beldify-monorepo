'use client';

/**
 * Jewelry category page — live data from backend API.
 * Resolves jewelry category by slug via GET /api/categories/getAllCategories,
 * then fetches products via GET /api/products/all?category=<id>.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, Gem, X } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/api';
import { getImageUrl } from '@/utils/imageUtils';
import logger from '@/utils/consoleLogger';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// ─── filter options ──────────────────────────────────────────────────────────

const MATERIAL_OPTIONS = ['gold', 'silver', 'copper', 'brass', 'mixed'];
const GEMSTONE_OPTIONS = ['none', 'diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'semi-precious', 'other'];

const MATERIAL_LABELS: Record<string, string> = {
  gold: 'ذهب', silver: 'فضة', copper: 'نحاس', brass: 'نحاس أصفر', mixed: 'مختلط',
};
const GEMSTONE_LABELS: Record<string, string> = {
  none: 'بدون', diamond: 'ماس', emerald: 'زمرد', ruby: 'ياقوت أحمر',
  sapphire: 'ياقوت أزرق', pearl: 'لؤلؤ', 'semi-precious': 'أحجار شبه كريمة', other: 'أخرى',
};

// ─── product shape from API ──────────────────────────────────────────────────

interface ApiProduct {
  id: number;
  name: string;
  name_ar?: string;
  price: number | string;
  material?: string;
  gemstone_type?: string | null;
  image?: string | null;
  main_image?: string | null;
  store?: { name: string; slug: string } | null;
  store_name?: string;
}

// Slugs that identify the jewelry category (checked in priority order).
const JEWELRY_SLUGS = ['jewelry', 'bijoux', 'مجوهرات'];

export default function JewelryCategoryPage() {
  const { t } = useTranslation();
  // ar AND ma (Darija default) are RTL/Arabic-script — the old `=== 'ar'` check
  // served the whole page in English+LTR to Darija users.
  const { isRTL } = useDirection();

  const [materialFilter, setMaterialFilter] = useState<string>('');
  const [gemstoneFilter, setGemstoneFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Step 1: resolve jewelry category id by slug
        const categories = await categoryService.getAllCategories();
        const jewelryCat = categories.find(
          (c) =>
            JEWELRY_SLUGS.includes(c.slug?.toLowerCase?.() ?? '') ||
            c.name_en?.toLowerCase()?.includes('jewel') ||
            c.name_ar?.includes('مجوهر')
        );

        if (!jewelryCat) {
          if (!cancelled) setProducts([]);
          return;
        }

        // Step 2: fetch products for this category
        const data = await productService.getProducts({ category: jewelryCat.id });
        if (!cancelled) {
          const list: ApiProduct[] = data?.products ?? data?.data ?? [];
          setProducts(list);
        }
      } catch (err) {
        logger.error('Error fetching jewelry products:', err);
        if (!cancelled) {
          setLoadError(t('jewelry.load_error', 'تعذّر تحميل المنتجات'));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [t]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (materialFilter && p.material !== materialFilter) return false;
      if (gemstoneFilter && p.gemstone_type !== gemstoneFilter) return false;
      return true;
    });
  }, [products, materialFilter, gemstoneFilter]);

  const hasActiveFilters = materialFilter || gemstoneFilter;

  const clearFilters = () => {
    setMaterialFilter('');
    setGemstoneFilter('');
  };

  const getDisplayName = (p: ApiProduct) =>
    isRTL ? (p.name_ar || p.name) : (p.name || p.name_ar || '');

  const getImageSrc = (p: ApiProduct): string => {
    const raw = p.main_image || p.image;
    if (!raw) return '';
    return getImageUrl(raw);
  };

  return (
    <div className="min-h-screen bg-canvas pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Hero ── */}
      <div className="bg-indigo-950 text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-2">
            {t('jewelry.categories_eyebrow', 'التصنيفات')}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight mb-3"
            style={isRTL ? undefined : playfair}
          >
            <Gem className="inline-block h-8 w-8 text-amber-400 me-2 mb-1" aria-hidden />
            {t('jewelry.title', 'المجوهرات')}
          </h1>
          <p className="text-indigo-300 text-base max-w-xl">
            {t('jewelry.subtitle', 'مجوهرات مغربية تقليدية وعصرية. قطع جاهزة أو مصنوعة حسب الطلب.')}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {/* ── Filter bar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
              showFilters
                ? 'bg-indigo-700 text-white ring-indigo-700'
                : 'bg-white text-gray-700 ring-gray-200 hover:ring-indigo-300'
            )}
            aria-expanded={showFilters}
            aria-controls="jewelry-filters"
          >
            <Filter className="h-4 w-4" aria-hidden />
            {t('jewelry.filter', 'تصفية')}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-700/30"
            >
              <X className="h-3 w-3" aria-hidden />
              {t('jewelry.clear_filters', 'مسح التصفية')}
            </button>
          )}

          <span className="text-sm text-gray-400 ms-auto">
            {isLoading
              ? t('jewelry.loading', 'جارٍ التحميل…')
              : `${filtered.length} ${t('jewelry.items', 'قطعة')}`}
          </span>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div
            id="jewelry-filters"
            className="rounded-2xl ring-1 ring-gray-200 bg-white p-5 mb-6 space-y-5"
          >
            {/* Material filter */}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
                {t('jewelry.material', 'المادة')}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('jewelry.filter_by_material', 'تصفية حسب المادة')}>
                {MATERIAL_OPTIONS.map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setMaterialFilter(materialFilter === mat ? '' : mat)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                      materialFilter === mat
                        ? 'bg-indigo-700 text-white ring-indigo-700'
                        : 'bg-white text-gray-700 ring-gray-200 hover:ring-indigo-300'
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
                {t('jewelry.gemstone', 'الحجر الكريم')}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('jewelry.filter_by_gemstone', 'تصفية حسب الحجر الكريم')}>
                {GEMSTONE_OPTIONS.map((gem) => (
                  <button
                    key={gem}
                    onClick={() => setGemstoneFilter(gemstoneFilter === gem ? '' : gem)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                      gemstoneFilter === gem
                        ? 'bg-indigo-700 text-white ring-indigo-700'
                        : 'bg-white text-gray-700 ring-gray-200 hover:ring-indigo-300'
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

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-label={t('jewelry.loading', 'جارٍ التحميل…')}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <li key={i} className="rounded-2xl ring-1 ring-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Error state ── */}
        {!isLoading && loadError && (
          <p className="text-rose-700 bg-rose-50 rounded-2xl ring-1 ring-rose-200 px-5 py-4 text-sm">
            {loadError}
          </p>
        )}

        {/* ── Empty / no-match state ── */}
        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Gem className="h-10 w-10 text-amber-300" aria-hidden />
            <p className="text-base font-semibold text-gray-600">
              {hasActiveFilters
                ? t('jewelry.no_match', 'لا توجد قطع تطابق التصفية')
                : t('jewelry.no_products', 'لا توجد منتجات حالياً')}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-indigo-600 underline">
                {t('jewelry.clear_filters', 'مسح التصفية')}
              </button>
            )}
          </div>
        )}

        {/* ── Product grid ── */}
        {!isLoading && !loadError && filtered.length > 0 && (
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label={t('jewelry.products_aria', 'المجوهرات')}
          >
            {filtered.map((product) => {
              const imgSrc = getImageSrc(product);
              const storeName =
                product.store?.name ?? product.store_name ?? '';
              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.id}`}
                    className="group block rounded-2xl ring-1 ring-gray-200 bg-white overflow-hidden hover:ring-indigo-300 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                    aria-label={getDisplayName(product)}
                  >
                    {/* Product image */}
                    <div className="relative aspect-square bg-amber-50">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={getDisplayName(product)}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gem className="h-10 w-10 text-amber-200" aria-hidden />
                        </div>
                      )}
                      {/* Material badge */}
                      {product.material && (
                        <span className="absolute top-2 start-2 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-gray-200 capitalize">
                          {isRTL ? (MATERIAL_LABELS[product.material] ?? product.material) : product.material}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                        {getDisplayName(product)}
                      </p>
                      {storeName && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{storeName}</p>
                      )}
                      <p className="text-sm font-bold text-indigo-700 mt-1.5 tabular-nums">
                        {formatPrice(Number(product.price))}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* ── Custom order CTA ── */}
        <div className="mt-10 rounded-2xl bg-indigo-700 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-300 font-medium mb-1">
              {t('jewelry.cta_eyebrow', 'لا تجد ما تبحث عنه؟')}
            </p>
            <p className="text-lg font-semibold" style={isRTL ? undefined : playfair}>
              {t('jewelry.cta_title', 'اطلب قطعة مخصصة')}
            </p>
            <p className="text-sm text-indigo-200 mt-0.5">
              {t('jewelry.cta_sub', 'صمّم مجوهراتك مع حرفي موثوق.')}
            </p>
          </div>
          <Link
            href="/custom-orders/new?vertical=jewelry"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-indigo-950 font-semibold px-5 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Gem className="h-4 w-4" aria-hidden />
            {t('jewelry.cta_button', 'طلب مخصص')}
          </Link>
        </div>
      </div>
    </div>
  );
}
