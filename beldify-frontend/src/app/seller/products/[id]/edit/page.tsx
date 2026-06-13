'use client';

/**
 * /seller/products/[id]/edit — Edit an existing seller product
 *
 * Architecture: mirrors /seller/products/new/page.tsx
 * Differences:
 *   - Prefills form via GET /api/seller/products/{id}
 *   - Submits via PUT /api/seller/products/{id}
 *   - Falls back to list search if single-product endpoint 404s (NOTE-1)
 *   - Success → toast + navigate to /seller/products
 *
 * NOTE-1: GET /api/seller/products/{id} is a new endpoint being added in
 * parallel by the backend packet. If it returns 404 (not yet live), we attempt
 * to find the product in the GET /api/seller/products list response. This
 * fallback is defensive and can be removed once the endpoint is live.
 */

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { getSellerProduct, updateSellerProduct, deleteSellerProduct } from '@/services/sellerProductService';
import { getSellerProducts, getStoreProfile } from '@/services/sellerOnboardingService';
import {
  fetchVerticalConfig,
  patchProductVerticalConfig,
  VerticalField,
  VerticalSlug,
} from '@/services/verticalService';
import VerticalProductForm from '@/components/seller/VerticalProductForm';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/category';
import toast from '@/utils/toast';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Package,
  XCircle,
  X,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiGenerateButton } from '@/components/seller/AiGenerateButton';
import { AiImageGenerator } from '@/components/seller/AiImageGenerator';
import { InsufficientCreditsModal } from '@/components/seller/InsufficientCreditsModal';
import { getSellerCredits, FeatureCosts } from '@/services/sellerCreditService';
import {
  generateListing,
  translateListing,
  InsufficientCreditsError,
  ListingLocaleResult,
} from '@/services/sellerAiService';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const inputClass =
  'block w-full rounded-2xl bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-150';

interface ProductForm {
  product_name_en: string;
  product_name_ar: string;
  description: string;
  description_ar: string;
  category_id: string;
  current_sale_unit_price: string;
  quantity: string;
  is_active: boolean;
  product_image: File | null;
  imagePreview: string | null;
  existingImageUrl: string | null;
}

const emptyForm: ProductForm = {
  product_name_en: '',
  product_name_ar: '',
  description: '',
  description_ar: '',
  category_id: '',
  current_sale_unit_price: '',
  quantity: '',
  is_active: true,
  product_image: null,
  imagePreview: null,
  existingImageUrl: null,
};

interface AiReviewState {
  en: Partial<ListingLocaleResult>;
  ar: Partial<ListingLocaleResult>;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

export default function SellerEditProductPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // FE-J1: vertical-aware fields
  const [vertical, setVertical] = useState<VerticalSlug | null>(null);
  const [verticalFields, setVerticalFields] = useState<VerticalField[]>([]);
  const [verticalSpec, setVerticalSpec] = useState<Record<string, string>>({});
  const [showVerticalErrors, setShowVerticalErrors] = useState(false);

  // ── AI state ──────────────────────────────────────────────────────────────
  const [costs, setCosts] = useState<FeatureCosts | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiReview, setAiReview] = useState<AiReviewState | null>(null);
  const [creditsModal, setCreditsModal] = useState<{
    open: boolean;
    cost?: number;
    balance?: number;
    feature?: string;
  }>({ open: false });

  // AI image generator — array of existing product images with ids
  const [aiExistingImages, setAiExistingImages] = useState<{ id: number; url: string }[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch product data and categories in parallel
  useEffect(() => {
    if (!isAuthenticated || !productId) return;

    const fetchProduct = async () => {
      try {
        // Prefer dedicated single-product endpoint
        const res = await getSellerProduct(productId);
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          // NOTE-1: Fallback — backend endpoint may not be live yet. Search the list.
          const listRes = await getSellerProducts();
          const found = listRes.data.find((p) => String(p.id) === String(productId));
          if (found) return found;
          throw Object.assign(new Error('Product not found'), { response: { status: 404 } });
        }
        throw err;
      }
    };

    Promise.all([
      fetchProduct(),
      categoryService.getAllCategories().catch(() => [] as Category[]),
    ])
      .then(([product, cats]) => {
        setCategories(cats);
        setCategoriesLoading(false);
        // Populate form from product data
        setForm({
          product_name_en: (product as any).product_name_en ?? (product as any).name ?? '',
          product_name_ar: (product as any).product_name_ar ?? '',
          description: (product as any).description ?? '',
          description_ar: (product as any).description_ar ?? '',
          category_id: String((product as any).category_id ?? ''),
          current_sale_unit_price: String((product as any).current_sale_unit_price ?? (product as any).price ?? ''),
          quantity: String((product as any).quantity ?? ''),
          is_active: (product as any).is_active ?? true,
          product_image: null,
          imagePreview: null,
          existingImageUrl: (product as any).product_image_url ?? (product as any).image_url ?? null,
        });
        // Seed AI image generator with known product images
        const imgs: { id: number; url: string }[] = [];
        if (Array.isArray((product as any).images)) {
          (product as any).images.forEach((img: any, idx: number) => {
            if (img?.url) imgs.push({ id: img.id ?? idx + 1, url: img.url });
          });
        } else {
          const singleUrl = (product as any).product_image_url ?? (product as any).image_url;
          if (singleUrl) imgs.push({ id: Number(productId) || 1, url: singleUrl });
        }
        setAiExistingImages(imgs);
        // FE-J1: seed vertical spec from the product's existing customization_options.
        const existingOpts = (product as any).customization_options;
        if (existingOpts && typeof existingOpts === 'object') {
          const seeded: Record<string, string> = {};
          for (const [k, v] of Object.entries(existingOpts)) {
            if (v != null) seeded[k] = String(v);
          }
          setVerticalSpec(seeded);
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) {
          setLoadError(t('seller.product.not_found', 'Product not found.'));
        } else if (err?.response?.status === 403) {
          setSuspended(true);
        } else {
          setLoadError(t('seller.product.load_error', 'Could not load product. Please try again.'));
        }
      })
      .finally(() => setPageLoading(false));
  }, [isAuthenticated, productId, t]);

  // Fetch AI costs on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    getSellerCredits()
      .then((data) => setCosts(data.costs))
      .catch(() => {});
  }, [isAuthenticated]);

  // FE-J1: resolve the seller's store vertical, then load its field schema.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getStoreProfile()
      .then((res) => {
        const slug = (res.data as any)?.store_type as VerticalSlug | undefined;
        if (cancelled || !slug) return;
        setVertical(slug);
        return fetchVerticalConfig(slug).then((config) => {
          if (!cancelled) setVerticalFields(config.fields ?? []);
        });
      })
      .catch(() => {
        // Non-fatal: fall back to the generic form.
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleVerticalChange = (key: string, value: string) => {
    setVerticalSpec((prev) => ({ ...prev, [key]: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, product_image: file, imagePreview: preview }));
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, product_image: null, imagePreview: null }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ── AI handlers ───────────────────────────────────────────────────────────

  const handleAiGenerate = async () => {
    if (!form.product_name_en.trim()) return;
    setAiGenerating(true);
    setAiReview(null);
    try {
      const res = await generateListing({
        product_name: form.product_name_en,
        category_id: form.category_id || undefined,
        locales: ['en', 'ar'],
      });
      setAiReview({
        en: res.result.en ?? {},
        ar: res.result.ar ?? {},
      });
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        setCreditsModal({ open: true, cost: err.cost, balance: err.balance, feature: err.feature });
      } else {
        toast.error(t('ai.generate_error', 'AI generation failed. Credits were not charged.'));
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiReview = () => {
    if (!aiReview) return;
    setForm((prev) => ({
      ...prev,
      product_name_en: aiReview.en.title ?? prev.product_name_en,
      product_name_ar: aiReview.ar.title ?? prev.product_name_ar,
      description: aiReview.en.description ?? prev.description,
      description_ar: aiReview.ar.description ?? prev.description_ar,
    }));
    setAiReview(null);
  };

  const handleDiscardAiReview = () => {
    setAiReview(null);
  };

  const handleAutoTranslate = async () => {
    if (!form.product_name_en.trim()) return;
    setAiTranslating(true);
    try {
      const res = await translateListing({
        name: form.product_name_en,
        description: form.description || undefined,
      });
      const arResult = res.result.ar ?? res.result.ma;
      setForm((prev) => ({
        ...prev,
        product_name_ar: arResult?.name ?? prev.product_name_ar,
        description_ar: arResult?.description ?? prev.description_ar,
      }));
      toast.success(t('ai.translate_success', 'Fields translated successfully.'));
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        setCreditsModal({ open: true, cost: err.cost, balance: err.balance, feature: err.feature });
      } else {
        toast.error(t('ai.translate_error', 'Translation failed. Credits were not charged.'));
      }
    } finally {
      setAiTranslating(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteSellerProduct(productId);
      toast.success(t('seller.product.delete_success', 'Product deleted.'));
      router.push('/seller/products');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setSuspended(true);
      } else {
        toast.error(t('seller.product.delete_error', 'Failed to delete product. Please try again.'));
      }
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.product_name_en.trim()) {
      setSubmitError(t('seller.product.validation_name', 'Product name (English) is required.'));
      return;
    }

    // FE-J1: client-side required-field validation for vertical fields.
    const missingRequired = verticalFields.find(
      (f) => f.required && !verticalSpec[f.key],
    );
    if (missingRequired) {
      setShowVerticalErrors(true);
      setSubmitError(
        t('seller.product.vertical_required', '{{field}} is required for this product type.').replace(
          '{{field}}',
          missingRequired.label,
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      await updateSellerProduct(productId, {
        product_name_en: form.product_name_en,
        product_name_ar: form.product_name_ar || undefined,
        description: form.description || undefined,
        description_ar: form.description_ar || undefined,
        category_id: form.category_id || undefined,
        current_sale_unit_price: form.current_sale_unit_price || undefined,
        quantity: form.quantity || undefined,
        is_active: form.is_active,
        product_image: form.product_image ?? undefined,
      });

      // FE-J1: persist vertical spec alongside the normal update. Non-blocking on failure.
      if (verticalFields.length > 0) {
        try {
          await patchProductVerticalConfig(productId, verticalSpec);
        } catch {
          toast.error(
            t(
              'seller.product.vertical_save_failed',
              'Product saved, but its custom attributes could not be saved. Edit the product to add them.',
            ),
          );
        }
      }

      toast.success(t('seller.product.update_success', 'Product updated!'));
      router.push('/seller/products');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setSuspended(true);
      } else if (err?.response?.status === 422) {
        const errors = err.response.data?.errors || {};
        const first = Object.values(errors)[0];
        const msg = Array.isArray(first) ? first[0] : (err.response.data?.message ?? null);
        setSubmitError(msg || t('seller.product.validation_error', 'Please check your input.'));
      } else {
        setSubmitError(t('seller.product.update_error', 'Failed to update product. Please try again.'));
        toast.error(t('seller.product.update_error', 'Failed to update product. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <Package className="w-10 h-10 text-indigo-600 mb-6" aria-hidden="true" />
          <h1 className="text-xl font-bold text-gray-900 mb-3" style={playfair}>
            {t('seller.product.login_title', 'Sign in to edit a product')}
          </h1>
          <Link
            href={`/login?redirect=/seller/products/${productId}/edit`}
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors mt-4"
          >
            {t('seller.product.sign_in', 'Sign in')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Suspended ─────────────────────────────────────────────────────────────
  if (suspended) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 ring-2 ring-rose-200 flex items-center justify-center mb-6">
            <XCircle className="w-8 h-8 text-rose-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-3" style={playfair}>
            {t('seller.product.suspended_title', 'Your store is suspended')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('seller.product.suspended_body', 'You cannot edit products while your store is suspended. Please contact support.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-3">
          <Link
            href="/seller/products"
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {t('seller.product.eyebrow', 'Products')}
            </p>
            <h1 className="text-xl font-bold text-gray-900" style={playfair}>
              {t('seller.product.edit_title', 'Edit product')}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">

        {/* Loading skeleton */}
        {pageLoading && (
          <div className="space-y-4" aria-label={t('common.loading', 'Loading...')}>
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
            <Skeleton className="h-24" />
          </div>
        )}

        {/* Load error */}
        {!pageLoading && loadError && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <XCircle className="w-10 h-10 text-rose-400 mb-4" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-700 mb-1">{loadError}</p>
            <Link
              href="/seller/products"
              className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-700 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              {t('seller.products.back_to_list', 'Back to products')}
            </Link>
          </div>
        )}

        {/* Form */}
        {!pageLoading && !loadError && (
          <>
            {submitError && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700" role="alert">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Product names */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
                {/* Section header with AI buttons */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {t('seller.product.section_info', 'Product info')}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <AiGenerateButton
                      label={t('ai.generate_listing', 'Generate with AI')}
                      cost={costs?.listing_writer ?? 2}
                      onClick={handleAiGenerate}
                      loading={aiGenerating}
                      disabled={!form.product_name_en.trim()}
                    />
                    <AiGenerateButton
                      label={t('ai.auto_translate', 'Auto-translate')}
                      cost={costs?.translate_listing ?? 1}
                      onClick={handleAutoTranslate}
                      loading={aiTranslating}
                      disabled={!form.product_name_en.trim()}
                    />
                  </div>
                </div>

                {/* AI Review step */}
                {aiReview && (
                  <div className="rounded-2xl bg-indigo-50 ring-1 ring-indigo-200 p-5 space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-semibold mb-1">
                      {t('ai.review_title', 'AI generated — review before applying')}
                    </p>
                    <div className="space-y-2">
                      {aiReview.en.title && (
                        <div>
                          <p className="text-xs font-medium text-indigo-700 mb-0.5">
                            {t('ai.review_name_en', 'Name (English)')}
                          </p>
                          <p className="text-sm text-gray-900 bg-white rounded-xl px-3 py-2 ring-1 ring-indigo-200">
                            {aiReview.en.title}
                          </p>
                        </div>
                      )}
                      {aiReview.ar.title && (
                        <div>
                          <p className="text-xs font-medium text-indigo-700 mb-0.5">
                            {t('ai.review_name_ar', 'Name (Arabic)')}
                          </p>
                          <p className="text-sm text-gray-900 bg-white rounded-xl px-3 py-2 ring-1 ring-indigo-200" dir="rtl">
                            {aiReview.ar.title}
                          </p>
                        </div>
                      )}
                      {aiReview.en.description && (
                        <div>
                          <p className="text-xs font-medium text-indigo-700 mb-0.5">
                            {t('ai.review_desc_en', 'Description (English)')}
                          </p>
                          <p className="text-sm text-gray-900 bg-white rounded-xl px-3 py-2 ring-1 ring-indigo-200 line-clamp-3">
                            {aiReview.en.description}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleApplyAiReview}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('ai.apply', 'Apply')}
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscardAiReview}
                        className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 text-xs font-medium transition-colors"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('ai.discard', 'Discard')}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="product_name_en" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.product.name_en_label', 'Product name (English)')}
                    <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="product_name_en"
                    name="product_name_en"
                    type="text"
                    value={form.product_name_en}
                    onChange={handleChange}
                    required
                    placeholder={t('seller.product.name_en_placeholder', 'e.g. Royal Moroccan Caftan')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="product_name_ar" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.product.name_ar_label', 'Product name (Arabic)')}
                    <span className="text-gray-400 font-normal text-xs ms-1">
                      ({t('common.optional', 'optional')})
                    </span>
                  </label>
                  <input
                    id="product_name_ar"
                    name="product_name_ar"
                    type="text"
                    dir="rtl"
                    value={form.product_name_ar}
                    onChange={handleChange}
                    placeholder="قفطان مغربي ملكي"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.product.description_label', 'Description')}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={form.description}
                    onChange={handleChange}
                    placeholder={t('seller.product.description_placeholder', 'Describe your product...')}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="description_ar" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.product.description_ar_label', 'Description (Arabic)')}
                    <span className="text-gray-400 font-normal text-xs ms-1">
                      ({t('common.optional', 'optional')})
                    </span>
                  </label>
                  <textarea
                    id="description_ar"
                    name="description_ar"
                    rows={3}
                    dir="rtl"
                    value={form.description_ar}
                    onChange={handleChange}
                    placeholder="وصف المنتج بالعربية..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {/* Category + pricing */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {t('seller.product.section_pricing', 'Category & pricing')}
                </h2>

                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.product.category_label', 'Category')}
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    disabled={categoriesLoading}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">
                      {categoriesLoading
                        ? t('common.loading', 'Loading...')
                        : t('common.select_option', 'Select an option')}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {i18n.language === 'ar' || i18n.language === 'ma'
                          ? cat.name_ar || cat.name_en
                          : cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="current_sale_unit_price" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('seller.product.price_mad_label', 'Price (MAD)')}
                    </label>
                    <input
                      id="current_sale_unit_price"
                      name="current_sale_unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.current_sale_unit_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('seller.product.quantity_label', 'Quantity')}
                    </label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={form.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* is_active toggle */}
                <div className="flex items-center gap-3">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={handleToggle}
                    className="h-4 w-4 rounded text-indigo-700 border-gray-300 focus:ring-indigo-700/30 cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    {t('seller.product.is_active_label', 'List product as active (visible to buyers)')}
                  </label>
                </div>
              </div>

              {/* Product image */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {t('seller.product.section_image', 'Product image')}
                </h2>

                {/* Existing image or new preview */}
                {(form.imagePreview || form.existingImageUrl) ? (
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden ring-1 ring-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imagePreview ?? form.existingImageUrl ?? ''}
                      alt={t('seller.product.image_preview_alt', 'Product preview')}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-1 right-1 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-rose-500 hover:bg-white transition-colors"
                      aria-label={t('seller.product.remove_image', 'Remove image')}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="product_image"
                    className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl ring-1 ring-dashed ring-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-amber-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-600">
                      {t('seller.product.image_upload_hint', 'Click to upload product image')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t('seller.product.image_hint_size', 'JPG, PNG or WebP — max 5 MB')}
                    </span>
                  </label>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  id="product_image"
                  name="product_image"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </div>

              {/* AI image generator — visible when product has at least one existing image */}
              {aiExistingImages.length > 0 && (
                <AiImageGenerator
                  productId={productId}
                  existingImages={aiExistingImages}
                  onRefresh={() => {
                    // AiImageGenerator manages its own internal image list and appends
                    // the newly generated image on success — no parent rebuild needed.
                    // This callback is kept for external side-effects (e.g. re-fetching
                    // the product list) but must NOT clobber aiExistingImages.
                  }}
                />
              )}

              {/* FE-J1: vertical-specific attributes (jewelry etc.) */}
              {vertical && verticalFields.length > 0 && (
                <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {t('seller.product.section_attributes', 'Product attributes')}
                  </h2>
                  <VerticalProductForm
                    vertical={vertical}
                    values={verticalSpec}
                    onChange={handleVerticalChange}
                    showErrors={showVerticalErrors}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2',
                  'bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3',
                  'text-sm font-semibold transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50'
                )}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t('seller.product.submitting', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    {t('seller.product.edit_submit_cta', 'Save changes')}
                  </>
                )}
              </button>
            </form>

            {/* Danger zone — delete product */}
            <div className="mt-8 rounded-2xl ring-1 ring-rose-200 bg-rose-50 p-6">
              <h2 className="text-sm font-semibold text-rose-700 uppercase tracking-wide mb-2">
                {t('seller.product.danger_zone', 'Danger zone')}
              </h2>
              <p className="text-sm text-rose-600 mb-4">
                {t('seller.product.delete_warning', 'Deleting this product is permanent and cannot be undone.')}
              </p>
              {deleteConfirm ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-rose-700">
                    {t('seller.product.delete_confirm_prompt', 'Are you sure?')}
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  >
                    {deleting
                      ? t('seller.product.deleting', 'Deleting...')
                      : t('seller.product.delete_confirm_yes', 'Yes, delete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                    className="rounded-full ring-1 ring-rose-300 text-rose-700 px-5 py-2 text-sm font-medium hover:bg-rose-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-full ring-1 ring-rose-300 text-rose-700 px-5 py-2 text-sm font-medium hover:bg-rose-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                >
                  {t('seller.product.delete_cta', 'Delete product')}
                </button>
              )}
            </div>
          </>
        )}
      </main>

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
