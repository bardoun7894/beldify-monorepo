'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { intlLocale } from '@/i18n/config';
import { getSellerProducts, SellerProduct } from '@/services/sellerOnboardingService';
import { Plus, Package, AlertCircle, Pencil, X, Copy } from 'lucide-react';
import { AiGenerateButton } from '@/components/seller/AiGenerateButton';
import { InsufficientCreditsModal } from '@/components/seller/InsufficientCreditsModal';
import { getSellerCredits, FeatureCosts } from '@/services/sellerCreditService';
import {
  generateMarketing,
  MarketingResult,
  InsufficientCreditsError,
} from '@/services/sellerAiService';
import toast from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

function fmtPrice(price: string | number, numLocale: string = 'fr-MA'): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(n) ? String(price) : n.toLocaleString(numLocale, { minimumFractionDigits: 0 });
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

/** Per-product marketing copy bottom sheet / modal */
interface MarketingSheetProps {
  result: MarketingResult;
  onClose: () => void;
}

function MarketingSheet({ result, onClose }: MarketingSheetProps) {
  const { t } = useTranslation();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('ai.copied', `${label} copied!`));
    } catch {
      toast.error(t('ai.copy_failed', 'Could not copy to clipboard.'));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      variant="sheet"
      side="bottom"
      labelledBy="marketing-sheet-title"
      panelClassName="sm:max-w-lg sm:mx-auto sm:rounded-3xl overflow-hidden"
      aria-label={t('ai.marketing_sheet_title', 'Marketing copy')}
    >
      {/* Header */}
      <div className="bg-indigo-700 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium">
            {t('ai.marketing_eyebrow', 'AI Marketing')}
          </p>
          <h2
            id="marketing-sheet-title"
            className="text-base font-bold text-white leading-snug font-heading"
          >
            {t('ai.marketing_sheet_title', 'Marketing copy')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="text-indigo-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
          {/* WhatsApp message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {t('ai.whatsapp_label', 'WhatsApp message')}
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(result.whatsapp_message, 'WhatsApp message')}
                aria-label={t('ai.copy_whatsapp', 'Copy WhatsApp message')}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.copy', 'Copy')}
              </button>
            </div>
            <p className="text-sm text-gray-800 bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-4 py-3 leading-relaxed">
              {result.whatsapp_message}
            </p>
          </div>

          {/* Social caption */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {t('ai.social_caption_label', 'Social caption')}
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(result.social_caption, 'Social caption')}
                aria-label={t('ai.copy_social', 'Copy social caption')}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.copy', 'Copy')}
              </button>
            </div>
            <p className="text-sm text-gray-800 bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-4 py-3 leading-relaxed">
              {result.social_caption}
            </p>
          </div>

          {/* Product URL */}
          {result.product_url && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {t('ai.product_url_label', 'Product link')}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.product_url, 'Product link')}
                  aria-label={t('ai.copy_url', 'Copy product link')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('common.copy', 'Copy')}
                </button>
              </div>
              <p className="text-xs text-gray-500 font-mono bg-gray-50 ring-1 ring-gray-200 rounded-xl px-3 py-2 break-all">
                {result.product_url}
              </p>
            </div>
          )}
      </div>
    </Dialog>
  );
}

export default function SellerProductsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const numLocale = intlLocale(i18n.language);

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI marketing state
  const [costs, setCosts] = useState<FeatureCosts | null>(null);
  const [marketingSheet, setMarketingSheet] = useState<MarketingResult | null>(null);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [creditsModal, setCreditsModal] = useState<{
    open: boolean;
    cost?: number;
    balance?: number;
    feature?: string;
  }>({ open: false });

  useEffect(() => {
    if (!isAuthenticated) return;
    getSellerProducts()
      .then((res) => setProducts(res.data))
      .catch(() => setError(t('seller.products.fetch_error', 'Could not load products.')))
      .finally(() => setLoading(false));
  }, [isAuthenticated, t]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSellerCredits()
      .then((data) => setCosts(data.costs))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleMarketingCopy = async (productId: number) => {
    setGeneratingFor(productId);
    try {
      const res = await generateMarketing({ product_id: productId });
      setMarketingSheet(res.result);
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        setCreditsModal({ open: true, cost: err.cost, balance: err.balance, feature: err.feature });
      } else {
        toast.error(t('ai.marketing_error', 'Marketing copy generation failed. Credits were not charged.'));
      }
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
            {t('seller.products.eyebrow', 'Inventory')}
          </p>
          <h1 className="text-xl font-bold text-gray-900 font-heading">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100">
                <TableHead>{t('seller.products.col_name', 'Product')}</TableHead>
                <TableHead numeric>{t('seller.products.col_price', 'Price (MAD)')}</TableHead>
                <TableHead numeric>{t('seller.products.col_stock', 'Stock')}</TableHead>
                <TableHead>{t('seller.products.col_status', 'Status')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('common.actions', 'Actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const stock = (product as any).quantity ?? (product as any).stock ?? '—';
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="py-3.5 font-medium text-gray-900">
                      {product.name}
                    </TableCell>
                    <TableCell numeric className="py-3.5 text-gray-700">
                      <span className="currency-mad">{fmtPrice(product.price, numLocale)} DH</span>
                    </TableCell>
                    <TableCell numeric className="py-3.5 text-gray-700">
                      {stock}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge variant={product.is_active ? 'success' : 'neutral'}>
                        {product.is_active
                          ? t('seller.products.status_active', 'Active')
                          : t('seller.products.status_inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                          aria-label={t('seller.products.edit_aria', 'Edit {{name}}', { name: product.name })}
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          {t('common.edit', 'Edit')}
                        </Link>
                        <AiGenerateButton
                          label={t('ai.marketing_copy', 'Marketing copy')}
                          cost={costs?.marketing_copy ?? 1}
                          onClick={() => handleMarketingCopy(product.id)}
                          loading={generatingFor === product.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Marketing copy sheet */}
      {marketingSheet && (
        <MarketingSheet
          result={marketingSheet}
          onClose={() => setMarketingSheet(null)}
        />
      )}

      {/* Insufficient credits modal */}
      <InsufficientCreditsModal
        open={creditsModal.open}
        onClose={() => setCreditsModal({ open: false })}
        cost={creditsModal.cost}
        balance={creditsModal.balance}
        feature={creditsModal.feature}
      />
    </div>
  );
}
