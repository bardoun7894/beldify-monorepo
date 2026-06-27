'use client';

/**
 * Product Comparison Page
 *
 * Route: /compare?ids=1,2,3,4
 *
 * Fetches up to 4 products by ID and renders a side-by-side comparison
 * table with key attributes: image, name, price, rating, description,
 * color, size, stock status, store info, and reviews count.
 *
 * States: loading (skeleton grid), empty (no IDs or < 2 products),
 * error (fetch failure with retry), and edge cases (product not found,
 * > 4 IDs capped).
 */

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { syncUrlLocale } from '@/i18n/config';
import { productService } from '@/services/api';
import { Product } from '@/types/product';
import logger from '@/utils/consoleLogger';
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  X,
  AlertTriangle,
  Package,
  Store,
  Ruler,
  Palette,
  Tag,
  Check,
  Minus,
} from 'lucide-react';

const MAX_COMPARE = 4;
const MIN_COMPARE = 2;

/** Map product attributes into flat rows for the comparison table. */
interface CompareRow {
  label: string;
  icon: React.ReactNode;
  /** One value per product, in the same order as products[] */
  values: (string | React.ReactNode)[];
}

export default function ComparePage() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<number[]>([]);

  const idsParam = searchParams.get('ids');
  const productIds = useMemo(() => {
    if (!idsParam) return [];
    return idsParam
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
      .slice(0, MAX_COMPARE);
  }, [idsParam]);

  useEffect(() => {
    syncUrlLocale();
  }, [searchParams, i18n]);

  useEffect(() => {
    if (productIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setFailedIds([]);

    Promise.allSettled(
      productIds.map((id) =>
        productService
          .getProduct(id)
          .then((res) => {
            // Handle both { product: {...} } and { data: {...} } and direct Product
            const product = res?.product ?? res?.data ?? res;
            return product as Product;
          })
      )
    ).then((results) => {
      const resolved: Product[] = [];
      const failed: number[] = [];

      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value?.id) {
          resolved.push(r.value);
        } else {
          failed.push(productIds[i]);
        }
      });

      setProducts(resolved);
      setFailedIds(failed);
      setLoading(false);

      if (resolved.length < MIN_COMPARE) {
        setError(
          t('compare.error.not_enough', {
            count: resolved.length,
            min: MIN_COMPARE,
            defaultValue: 'Need at least {{min}} products to compare.',
          })
        );
      }
    }).catch((err) => {
      logger.error('Compare fetch error:', err);
      setError(t('compare.error.fetch', 'Failed to load products for comparison.'));
      setLoading(false);
    });
  }, [productIds, t]);

  // ── Build comparison rows ──────────────────────────────────────────────────
  const rows: CompareRow[] = useMemo(() => {
    if (products.length < MIN_COMPARE) return [];

    const fmtPrice = (n: number) =>
      `${n.toLocaleString(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${t('common.currency', 'MAD')}`;

    return [
      {
        label: t('compare.attributes.price', 'Price'),
        icon: <Tag className="w-4 h-4" aria-hidden />,
        values: products.map((p) => {
          if (p.has_discount && p.discount_price != null) {
            return (
              <div key={p.id} className="flex flex-col items-center">
                <span className="text-lg font-bold text-indigo-700 tabular-nums">
                  {fmtPrice(p.discount_price)}
                </span>
                <span className="text-xs text-gray-400 line-through tabular-nums">
                  {fmtPrice(p.price)}
                </span>
              </div>
            );
          }
          return (
            <span key={p.id} className="text-lg font-bold text-indigo-700 tabular-nums">
              {fmtPrice(p.price)}
            </span>
          );
        }),
      },
      {
        label: t('compare.attributes.rating', 'Rating'),
        icon: <Star className="w-4 h-4" aria-hidden />,
        values: products.map((p) => (
          <div key={p.id} className="flex items-center justify-center gap-1">
            <span className="text-sm font-semibold text-amber-600">
              {p.rating != null ? p.rating.toFixed(1) : '—'}
            </span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-xs text-gray-400">
              ({p.reviews_count ?? 0})
            </span>
          </div>
        )),
      },
      {
        label: t('compare.attributes.category', 'Category'),
        icon: <Package className="w-4 h-4" aria-hidden />,
        values: products.map((p) => (
          <span key={p.id} className="text-sm text-gray-700">
            {isRTL && p.category_ar ? p.category_ar : p.category}
          </span>
        )),
      },
      {
        label: t('compare.attributes.store', 'Store'),
        icon: <Store className="w-4 h-4" aria-hidden />,
        values: products.map((p) => (
          <span key={p.id} className="text-sm text-gray-700">
            {p.store_name || t('compare.attributes.unknown_store', 'Unknown')}
          </span>
        )),
      },
      {
        label: t('compare.attributes.availability', 'Availability'),
        icon: <Check className="w-4 h-4" aria-hidden />,
        values: products.map((p) =>
          p.in_stock || p.stock_status === 'in_stock' || (p.stock ?? 0) > 0 ? (
            <span key={p.id} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
              <Check className="w-3.5 h-3.5" aria-hidden />
              {t('products.in_stock', 'In Stock')}
            </span>
          ) : (
            <span key={p.id} className="inline-flex items-center gap-1 text-sm font-medium text-rose-500">
              <Minus className="w-3.5 h-3.5" aria-hidden />
              {t('products.out_of_stock', 'Out of Stock')}
            </span>
          )
        ),
      },
      {
        label: t('compare.attributes.color', 'Color'),
        icon: <Palette className="w-4 h-4" aria-hidden />,
        values: products.map((p) =>
          p.color?.name ? (
            <div key={p.id} className="flex items-center justify-center gap-2">
              {p.color.code && (
                <span
                  className="inline-block w-4 h-4 rounded-full ring-1 ring-gray-300"
                  style={{ backgroundColor: p.color.code }}
                  aria-hidden
                />
              )}
              <span className="text-sm text-gray-700">
                {isRTL && p.color.name_ar ? p.color.name_ar : p.color.name}
              </span>
            </div>
          ) : (
            <span key={p.id} className="text-sm text-gray-400">
              {t('compare.attributes.not_applicable', '—')}
            </span>
          )
        ),
      },
      {
        label: t('compare.attributes.size', 'Size'),
        icon: <Ruler className="w-4 h-4" aria-hidden />,
        values: products.map((p) =>
          p.size?.name ? (
            <span key={p.id} className="text-sm font-medium text-gray-700">
              {isRTL && p.size.name_ar ? p.size.name_ar : p.size.name}
            </span>
          ) : (
            <span key={p.id} className="text-sm text-gray-400">
              {t('compare.attributes.not_applicable', '—')}
            </span>
          )
        ),
      },
    ];
  }, [products, t, i18n.language, isRTL]);

  // ── Remove a product from comparison ───────────────────────────────────────
  const removeProduct = (id: number) => {
    const remaining = productIds.filter((pid) => pid !== id);
    if (remaining.length === 0) {
      router.replace('/compare');
      return;
    }
    router.replace(`/compare?ids=${remaining.join(',')}`);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link skeleton */}
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-8" />

          {/* Title skeleton */}
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />

          {/* Grid skeleton */}
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: `repeat(${Math.min(MAX_COMPARE, productIds.length || MAX_COMPARE)}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: productIds.length || MAX_COMPARE }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-atlas-sm">
                {/* Image skeleton */}
                <div className="aspect-[3/4] bg-gray-100 animate-pulse" />
                {/* Name skeleton */}
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state — no IDs or less than MIN ──────────────────────────────────
  if (productIds.length === 0 || products.length < MIN_COMPARE) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-amber-500" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {t('compare.empty.title', 'Compare Products')}
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            {t(
              'compare.empty.description',
              'Select at least {{min}} products to compare them side by side. Browse our catalog and add items to compare.',
              { min: MIN_COMPARE }
            )}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden />
            {t('compare.empty.browse', 'Browse Products')}
          </Link>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && products.length < MIN_COMPARE) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-rose-500" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {t('compare.error.title', 'Comparison Error')}
          </h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden />
            {t('compare.empty.browse', 'Browse Products')}
          </Link>
        </div>
      </div>
    );
  }

  // ── Main comparison view ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className={`inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} aria-hidden />
            {t('compare.back_to_products', 'Back to Products')}
          </Link>

          {failedIds.length > 0 && (
            <p className="text-xs text-amber-600">
              {t('compare.error.some_failed', {
                count: failedIds.length,
                defaultValue: '{{count}} product(s) could not be loaded',
              })}
            </p>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
          {t('compare.title', 'Compare Products')}
          <span className="text-gray-400 text-lg font-normal ml-2">
            ({products.length} {t('compare.products', 'products')})
          </span>
        </h1>

        {/* ── Desktop: side-by-side grid ── */}
        <div className="hidden md:block">
          {/* Header cards */}
          <div
            className="grid gap-4 mb-6"
            style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}
          >
            {/* Empty header cell */}
            <div />

            {products.map((product) => (
              <div key={product.id} className="relative bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-atlas-sm group">
                {/* Remove button */}
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                  aria-label={t('compare.remove', 'Remove from comparison')}
                >
                  <X className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                </button>

                {/* Image */}
                <Link href={`/products/${product.id}`}>
                  <div className="aspect-[3/4] relative bg-gray-50 overflow-hidden">
                    {(product.images?.[0] || product.main_image) ? (
                      <Image
                        src={product.images?.[0] || product.main_image!}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <Package className="w-12 h-12" aria-hidden />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link
                    href={`/products/${product.id}`}
                    className="block text-sm font-semibold text-gray-900 hover:text-indigo-700 transition-colors line-clamp-2 mb-1"
                  >
                    {product.name}
                  </Link>
                  {product.store_name && (
                    <p className="text-xs text-gray-400 mb-2">{product.store_name}</p>
                  )}

                  {/* Price */}
                  {product.has_discount && product.discount_price != null ? (
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-base font-bold text-indigo-700 tabular-nums">
                        {product.discount_price.toLocaleString(i18n.language, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {t('common.currency', 'MAD')}
                      </span>
                      <span className="text-xs text-gray-400 line-through tabular-nums">
                        {product.price.toLocaleString(i18n.language, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ) : (
                    <p className="text-base font-bold text-indigo-700 tabular-nums mb-3">
                      {product.price.toLocaleString(i18n.language, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {t('common.currency', 'MAD')}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="text-sm font-medium text-gray-700">
                      {product.rating != null ? product.rating.toFixed(1) : '—'}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({product.reviews_count ?? 0})
                    </span>
                  </div>

                  {/* Add to cart CTA */}
                  {product.in_stock || product.stock_status === 'in_stock' || (product.stock ?? 0) > 0 ? (
                    <Link
                      href={`/products/${product.id}`}
                      className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                    >
                      <ShoppingBag className="w-4 h-4" aria-hidden />
                      {t('compare.view_product', 'View Product')}
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center gap-2 w-full rounded-lg bg-gray-100 text-gray-400 text-sm font-medium py-2.5">
                      <Minus className="w-4 h-4" aria-hidden />
                      {t('products.out_of_stock', 'Out of Stock')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Attribute comparison rows */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-atlas-sm">
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`grid gap-4 ${
                  rowIdx < rows.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}
              >
                {/* Label cell */}
                <div className="flex items-center gap-2 px-4 py-4 bg-gray-50">
                  <span className="text-indigo-500">{row.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{row.label}</span>
                </div>

                {/* Value cells */}
                {row.values.map((val, colIdx) => (
                  <div key={colIdx} className="flex items-center justify-center px-4 py-4 text-center">
                    {typeof val === 'string' ? (
                      <span className="text-sm text-gray-700">{val}</span>
                    ) : (
                      val
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Description section */}
          <div className="mt-6 bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-atlas-sm">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}
            >
              <div className="flex items-start gap-2 px-4 py-4 bg-gray-50">
                <span className="text-xs text-gray-400 mt-0.5" aria-hidden>ℹ</span>
                <span className="text-sm font-medium text-gray-700">
                  {t('compare.attributes.description', 'Description')}
                </span>
              </div>
              {products.map((product) => (
                <div key={product.id} className="px-4 py-4">
                  <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                    {isRTL && product.description_ar
                      ? product.description_ar
                      : product.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mobile: horizontal scrollable table ── */}
        <div className="md:hidden overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div
            className="min-w-0"
            style={{ width: `${products.length * 280}px` }}
          >
            {/* Mobile product cards row */}
            <div className="flex gap-3 mb-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[260px] bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-atlas-sm group"
                >
                  {/* Image */}
                  <Link href={`/products/${product.id}`}>
                    <div className="aspect-[4/5] relative bg-gray-50">
                      {(product.images?.[0] || product.main_image) ? (
                        <Image
                          src={product.images?.[0] || product.main_image!}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="260px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <Package className="w-10 h-10" aria-hidden />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="block text-sm font-semibold text-gray-900 line-clamp-2 mb-1"
                    >
                      {product.name}
                    </Link>

                    {/* Price */}
                    <p className="text-sm font-bold text-indigo-700 tabular-nums mb-2">
                      {product.has_discount && product.discount_price != null
                        ? `${product.discount_price.toLocaleString(i18n.language, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ${t('common.currency', 'MAD')}`
                        : `${product.price.toLocaleString(i18n.language, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ${t('common.currency', 'MAD')}`}
                    </p>
                    <Link
                      href={`/products/${product.id}`}
                      className="block w-full text-center rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold py-2 transition-colors"
                    >
                      {t('compare.view_product', 'View Product')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Attribute rows */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-atlas-sm">
              {rows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`${rowIdx < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  {/* Attribute label */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="text-indigo-500">{row.icon}</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {row.label}
                    </span>
                  </div>
                  {/* Value columns */}
                  <div className="flex gap-2 p-3">
                    {row.values.map((val, colIdx) => (
                      <div key={colIdx} className="flex-1 flex items-center justify-center min-h-[44px] text-center px-1">
                        {typeof val === 'string' ? (
                          <span className="text-xs text-gray-700 leading-relaxed">{val}</span>
                        ) : (
                          val
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Description rows (mobile) */}
              <div className="border-t border-gray-100">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs text-gray-400" aria-hidden>ℹ</span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('compare.attributes.description', 'Description')}
                  </span>
                </div>
                <div className="flex gap-2 p-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex-1 px-1">
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                        {isRTL && product.description_ar
                          ? product.description_ar
                          : product.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          {products.length > 2 && (
            <p className="text-center text-xs text-gray-400 mt-3 animate-pulse">
              {isRTL ? 'اسحب للمقارنة ←' : '← Swipe to compare'}
            </p>
          )}
        </div>

        {/* ── Add more products CTA ── */}
        {products.length < MAX_COMPARE && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-gray-50 text-indigo-700 px-6 py-3 text-sm font-semibold ring-1 ring-indigo-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            >
              <PlusIcon className="w-4 h-4" aria-hidden />
              {t('compare.add_more', 'Add more products to compare')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/** Inline Plus icon to avoid importing extra lucide icon */
function PlusIcon({ className, ...props }: { className?: string; [key: string]: unknown }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
