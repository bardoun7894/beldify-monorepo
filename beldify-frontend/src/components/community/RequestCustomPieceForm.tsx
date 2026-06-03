'use client';

/**
 * RequestCustomPieceForm — a deliberately SIMPLE "Request a Custom Piece" form
 * that posts the request into the community **Open Souk** (CommunityPost) so other
 * users / sellers can see it and respond.
 *
 * Design intent (per product owner): the ONLY required field is Material.
 * Everything else is optional and kept minimal. Image upload supported.
 * Open to any logged-in (normal) user.
 *
 * Reuses existing infra:
 *   - communityService.createCommunityPost (POST /community/posts, multipart)
 *   - categoryService.getAllCategories (to resolve the Jewelry category)
 *   - useAuth for the login gate
 *
 * Backend (StoreCommunityPostRequest) requires title(min5)/description(min20)/category_id,
 * so those are auto-filled from Material + notes — the user never has to type them.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';
import { ChevronDown, ImagePlus, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { categoryService } from '@/services/categoryService';
import { createCommunityPost } from '@/services/communityService';
import type { Category } from '@/types/category';

const MATERIALS = ['gold', 'silver', 'copper', 'brass', 'mixed'] as const;
type Material = (typeof MATERIALS)[number];

const MATERIAL_LABELS: Record<Material, { en: string; ar: string }> = {
  gold: { en: 'Gold', ar: 'ذهب' },
  silver: { en: 'Silver', ar: 'فضة' },
  copper: { en: 'Copper', ar: 'نحاس' },
  brass: { en: 'Brass', ar: 'نحاس أصفر' },
  mixed: { en: 'Mixed', ar: 'مختلط' },
};

const ACCEPTED = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const MAX_BYTES = 2048 * 1024; // 2 MB — matches backend images.* max:2048

export default function RequestCustomPieceForm() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [material, setMaterial] = useState<Material | ''>('');
  const [notes, setNotes] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [purity, setPurity] = useState('');
  const [size, setSize] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // Ref keeps a live snapshot of object URLs so the unmount cleanup
  // can revoke only those still alive at the time the component tears down.
  const previewsRef = useRef<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Login gate — "for normal users": any logged-in buyer can post.
  // Wait until authLoading is false before redirecting so that a brief
  // unauthenticated state during hydration does not create a redirect loop
  // (old: redirect fired immediately → login → back to /custom-orders/new →
  //  component re-mounted while still hydrating → redirect again).
  // New: /login?redirect=/custom-orders/new (same path, loop-safe).
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/custom-orders/new');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    categoryService
      .getAllCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // Keep the ref in sync with state so the unmount cleanup has the live list.
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Revoke any remaining object URLs when the component unmounts.
  useEffect(() => {
    return () => {
      // Guard: revokeObjectURL may be unimplemented in some environments (jsdom).
      if (typeof URL.revokeObjectURL === 'function') {
        previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      }
    };
  }, []);

  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const onFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const next: File[] = [];
      const nextPreviews: string[] = [];
      Array.from(files).forEach((file) => {
        if (!ACCEPTED.includes(file.type)) {
          setError(t('Only JPG, PNG or GIF images are allowed.', 'يُسمح فقط بصور JPG أو PNG أو GIF.'));
          return;
        }
        if (file.size > MAX_BYTES) {
          setError(t('Each image must be under 2 MB.', 'يجب أن تكون كل صورة أقل من 2 ميغابايت.'));
          return;
        }
        next.push(file);
        nextPreviews.push(URL.createObjectURL(file));
      });
      if (next.length) {
        setError(null);
        setImages((prev) => [...prev, ...next]);
        setPreviews((prev) => [...prev, ...nextPreviews]);
      }
    },
    [isRTL]
  );

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      // Revoke the specific object URL being removed to free memory immediately.
      // Guard: revokeObjectURL may be unimplemented in some environments (jsdom).
      if (prev[idx] && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(prev[idx]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  /**
   * Resolve the Jewelry category id.
   *
   * Matches on slug or name (EN/AR) with a case-insensitive "jewel" / Arabic
   * jewellery terms check.  Returns null in two distinct cases:
   *   - categories not yet loaded → caller shows "still loading" message
   *   - categories loaded but no jewelry found → caller shows "not found" message
   * The previous `?? categories[0]` silent fallback has been removed: it would
   * silently post the piece under the wrong category whenever the backend
   * category seed didn't include a jewelry entry.
   */
  const resolveCategoryId = (): { id: number | null; loaded: boolean } => {
    if (categories.length === 0) return { id: null, loaded: false };
    const jewelry = categories.find(
      (c) =>
        /jewel/i.test(c.slug ?? '') ||
        /jewel|مجوهرات|حلي/i.test(`${c.name ?? ''} ${c.name_en ?? ''} ${c.name_ar ?? ''}`)
    );
    return { id: jewelry ? Number(jewelry.id) : null, loaded: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) {
      setError(t("Please choose a material — it's the only required field.", "يرجى اختيار المادة — إنه الحقل المطلوب الوحيد."));
      return;
    }

    // Budget validation (11b): both present → min must not exceed max.
    if (budgetMin && budgetMax) {
      const min = parseFloat(budgetMin);
      const max = parseFloat(budgetMax);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        setError(t('Budget minimum cannot be greater than the maximum.', 'يجب ألا تتجاوز الميزانية الدنيا الميزانية القصوى.'));
        return;
      }
    }

    const { id: categoryId, loaded: categoriesLoaded } = resolveCategoryId();
    if (!categoryId) {
      // Distinguish between "still loading" and "no jewelry category found".
      setError(
        categoriesLoaded
          ? t(
              'No jewelry category found — please contact support.',
              'لم يُعثر على فئة مجوهرات — يرجى التواصل مع الدعم.',
            )
          : t(
              'Categories are still loading — please try again in a moment.',
              'لا تزال الفئات قيد التحميل — يرجى المحاولة مرة أخرى بعد لحظة.',
            )
      );
      return;
    }

    const materialLabel = MATERIAL_LABELS[material][isRTL ? 'ar' : 'en'];
    // Auto-fill backend-required fields so the user only has to pick a material.
    const title = t(`Custom piece — ${materialLabel}`, `قطعة مخصصة — ${materialLabel}`);
    const trimmed = notes.trim();
    const description =
      trimmed.length >= 20
        ? trimmed
        : t(
            `${trimmed ? trimmed + ' — ' : ''}Looking for a custom ${material} piece. Reference image(s) attached if provided.`,
            `${trimmed ? trimmed + ' — ' : ''}أبحث عن قطعة ${materialLabel} مخصصة. الصور المرجعية مرفقة إن وُجدت.`
          );

    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    fd.append('category_id', String(categoryId));
    fd.append('currency', 'MAD');
    if (budgetMin) fd.append('budget_min', budgetMin);
    if (budgetMax) fd.append('budget_max', budgetMax);
    // product_specifications.* must be strings (backend rule).
    fd.append('product_specifications[material]', material);
    if (purity) fd.append('product_specifications[purity]', purity);
    if (size) fd.append('product_specifications[size]', size);
    images.forEach((file) => fd.append('images[]', file));

    try {
      setSubmitting(true);
      setError(null);
      const post = await createCommunityPost(fd);
      toast.success(t('Your request is live in Open Souk', 'طلبك منشور الآن في السوق المفتوح'));
      router.push(`/community/posts/${post.id}`);
    } catch {
      setError(t('Could not post your request. Please try again.', 'تعذّر نشر طلبك. يرجى المحاولة مرة أخرى.'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'} aria-label={t('Request a custom piece', 'اطلب قطعة مخصصة')}>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      {/* Material — the only required field */}
      <div>
        <label htmlFor="material" className="block text-sm font-medium text-gray-900">
          {t('Material', 'المادة')} <span className="text-red-600">*</span>
        </label>
        <select
          id="material"
          required
          value={material}
          onChange={(e) => setMaterial(e.target.value as Material)}
          className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
        >
          <option value="">{t('Choose a material…', 'اختر المادة…')}</option>
          {MATERIALS.map((m) => (
            <option key={m} value={m}>
              {MATERIAL_LABELS[m][isRTL ? 'ar' : 'en']}
            </option>
          ))}
        </select>
      </div>

      {/* Notes (optional) */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
          {t('Describe what you want', 'صف ما تريد')}{' '}
          <span className="text-gray-400 font-normal">{t('(optional)', '(اختياري)')}</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('e.g. a thin engraved ring, size 7…', 'مثال: خاتم رفيع منقوش، مقاس 7…')}
          className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
        />
      </div>

      {/* Image upload (optional) */}
      <div>
        <span className="block text-sm font-medium text-gray-900">
          {t('Reference photos', 'صور مرجعية')}{' '}
          <span className="text-gray-400 font-normal">{t('(optional)', '(اختياري)')}</span>
        </span>
        <label
          htmlFor="images"
          className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 px-4 py-5 text-sm text-amber-800 hover:bg-amber-50"
        >
          <ImagePlus className="h-5 w-5" aria-hidden />
          {t('Add photo(s)', 'أضف صورة/صور')}
        </label>
        <input
          id="images"
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
        {previews.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-3">
            {previews.map((src, idx) => (
              <li key={src} className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-amber-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={t('reference', 'مرجع')} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  aria-label={t('Remove image', 'إزالة الصورة')}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* More details (optional, collapsed) */}
      <div className="rounded-xl border border-amber-200">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700"
          aria-expanded={showMore}
        >
          {t('More details (optional)', 'تفاصيل إضافية (اختياري)')}
          <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {showMore && (
          <div className="space-y-4 px-3 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-700">
                {t('Budget min (MAD)', 'الميزانية الدنيا (درهم)')}
                <input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-200 px-2.5 py-2"
                />
              </label>
              <label className="text-sm text-gray-700">
                {t('Budget max (MAD)', 'الميزانية القصوى (درهم)')}
                <input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-200 px-2.5 py-2"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-700">
                {t('Purity', 'العيار')}
                <input
                  type="text"
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  placeholder={t('e.g. 18k, 925', 'مثال: 18 قيراط، 925')}
                  className="mt-1 w-full rounded-lg border border-amber-200 px-2.5 py-2"
                />
              </label>
              <label className="text-sm text-gray-700">
                {t('Size', 'المقاس')}
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder={t('e.g. ring 7, 45cm', 'مثال: خاتم 7، 45سم')}
                  className="mt-1 w-full rounded-lg border border-amber-200 px-2.5 py-2"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-800 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {t('Post to Open Souk', 'انشر في السوق المفتوح')}
      </button>
      <p className="text-center text-xs text-gray-400">
        {t('Sellers and artisans in the community can see your request and respond.', 'يمكن للبائعين والحرفيين في المجتمع رؤية طلبك والرد عليه.')}
      </p>
    </form>
  );
}
