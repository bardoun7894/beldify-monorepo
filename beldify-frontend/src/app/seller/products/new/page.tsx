'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { createSellerProduct, getStoreProfile } from '@/services/sellerOnboardingService';
import {
  fetchVerticalConfig,
  patchProductVerticalConfig,
  VerticalField,
  VerticalSlug,
} from '@/services/verticalService';
import VerticalProductForm from '@/components/seller/VerticalProductForm';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import toast from '@/utils/toast';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Package,
  XCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
};

export default function SellerNewProductPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FE-J1: vertical-aware fields
  const [vertical, setVertical] = useState<VerticalSlug | null>(null);
  const [verticalFields, setVerticalFields] = useState<VerticalField[]>([]);
  const [verticalSpec, setVerticalSpec] = useState<Record<string, string>>({});
  const [showVerticalErrors, setShowVerticalErrors] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    categoryService
      .getAllCategories()
      .then((cats) => setCategories(cats))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // FE-J1: resolve the seller's store vertical, then load its field schema.
  // Non-jewelry verticals (or stores with no/empty schema) render nothing → zero regression.
  useEffect(() => {
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
        // Non-fatal: store may have no profile/vertical yet — fall back to generic form.
      });
    return () => { cancelled = true; };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.product_name_en.trim()) {
      setError(t('seller.product.validation_name', 'Product name (English) is required.'));
      return;
    }
    if (!form.category_id) {
      setError(t('seller.product.validation_category', 'Please select a category.'));
      return;
    }
    if (!form.current_sale_unit_price || isNaN(Number(form.current_sale_unit_price))) {
      setError(t('seller.product.validation_price', 'Please enter a valid price.'));
      return;
    }
    if (!form.quantity || isNaN(Number(form.quantity))) {
      setError(t('seller.product.validation_quantity', 'Please enter a valid quantity.'));
      return;
    }

    // FE-J1: client-side required-field validation for vertical fields.
    const missingRequired = verticalFields.find(
      (f) => f.required && !verticalSpec[f.key],
    );
    if (missingRequired) {
      setShowVerticalErrors(true);
      setError(
        t('seller.product.vertical_required', '{{field}} is required for this product type.').replace(
          '{{field}}',
          missingRequired.label,
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSellerProduct({
        product_name_en: form.product_name_en,
        product_name_ar: form.product_name_ar || undefined,
        description: form.description || undefined,
        description_ar: form.description_ar || undefined,
        category_id: form.category_id,
        current_sale_unit_price: form.current_sale_unit_price,
        quantity: form.quantity,
        is_active: form.is_active,
        product_image: form.product_image,
      });

      // FE-J1: persist vertical spec onto the freshly-created product.
      // A PATCH failure here is non-blocking — the product already exists, so we
      // warn the seller to edit it and retry rather than rolling back the create.
      const productId = (created?.data as any)?.id;
      const hasVerticalValues = Object.values(verticalSpec).some((v) => v !== '' && v != null);
      if (productId && hasVerticalValues) {
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

      toast.success(t('seller.product.create_success', 'Product added!'));
      router.push('/seller/onboarding');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setSuspended(true);
      } else if (err?.response?.status === 422) {
        const errors = err.response.data?.errors || {};
        const first = Object.values(errors)[0];
        const msg = Array.isArray(first) ? first[0] : (err.response.data?.message ?? null);
        setError(msg || t('seller.product.validation_error', 'Please check your input.'));
      } else {
        setError(t('seller.product.create_error', 'Failed to create product. Please try again.'));
        toast.error(t('seller.product.create_error', 'Failed to create product. Please try again.'));
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
            {t('seller.product.login_title', 'Sign in to add a product')}
          </h1>
          <Link
            href="/login?redirect=/seller/products/new"
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
            {t('seller.product.suspended_body', 'You cannot add products while your store is suspended. Please contact support.')}
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
            href="/seller/onboarding"
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
              {t('seller.product.title', 'Add a new product')}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Product names */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('seller.product.section_info', 'Product info')}
            </h2>

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
                <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
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
                  <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
                </label>
                <input
                  id="current_sale_unit_price"
                  name="current_sale_unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.current_sale_unit_price}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('seller.product.quantity_label', 'Quantity')}
                  <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
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

            {form.imagePreview ? (
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden ring-1 ring-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imagePreview}
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
                {t('seller.product.submitting', 'Submitting...')}
              </>
            ) : (
              <>
                <Package className="w-4 h-4" aria-hidden="true" />
                {t('seller.product.submit_cta', 'Add product')}
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
