'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { getSellerProducts, SellerProduct } from '@/services/sellerOnboardingService';
import { Plus, Package, AlertCircle, Pencil } from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

function fmtPrice(price: string | number): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(n) ? String(price) : n.toLocaleString('fr-MA', { minimumFractionDigits: 0 });
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

export default function SellerProductsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSellerProducts()
      .then((res) => setProducts(res.data))
      .catch(() => setError(t('seller.products.fetch_error', 'Could not load products.')))
      .finally(() => setLoading(false));
  }, [isAuthenticated, t]);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
            {t('seller.products.eyebrow', 'Inventory')}
          </p>
          <h1 className="text-xl font-bold text-gray-900" style={playfair}>
            {t('seller.products.title', 'My Products')}
          </h1>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('seller.products.add_product', 'Add product')}
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl ring-1 ring-gray-200">
          <Package className="w-10 h-10 text-amber-300 mb-4" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {t('seller.products.no_products', 'No products yet')}
          </p>
          <p className="text-xs text-gray-400 mb-6">
            {t('seller.products.no_products_sub', 'Add your first product to start selling.')}
          </p>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('seller.products.add_first_product', 'Add your first product')}
          </Link>
        </div>
      )}

      {/* Products list */}
      {!loading && !error && products.length > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">
                    {t('seller.products.col_name', 'Product')}
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    {t('seller.products.col_price', 'Price (MAD)')}
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    {t('seller.products.col_stock', 'Stock')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    {t('seller.products.col_status', 'Status')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">{t('common.actions', 'Actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const stock = (product as any).quantity ?? (product as any).stock ?? '—';
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">
                        {fmtPrice(product.price)} DH
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">
                        {stock}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            product.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600',
                          ].join(' ')}
                        >
                          {product.is_active
                            ? t('seller.products.status_active', 'Active')
                            : t('seller.products.status_inactive', 'Inactive')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                          aria-label={t('seller.products.edit_aria', 'Edit {{name}}', { name: product.name })}
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          {t('common.edit', 'Edit')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
