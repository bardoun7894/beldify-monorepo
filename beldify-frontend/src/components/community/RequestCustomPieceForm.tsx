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
import { ChevronDown, ImagePlus, Loader2, X, AlertCircle, Gem, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { categoryService } from '@/services/categoryService';
import { createCommunityPost } from '@/services/communityService';
import type { Category } from '@/types/category';

type MaterialOption = { value: string; en: string; ar: string; swatch: string };

/** Metals — offered when the request is for a jewelry category. */
const JEWELRY_MATERIALS: MaterialOption[] = [
  { value: 'gold', en: 'Gold', ar: 'ذهب', swatch: '#f59e0b' },
  { value: 'silver', en: 'Silver', ar: 'فضة', swatch: '#d1d5db' },
  { value: 'copper', en: 'Copper', ar: 'نحاس', swatch: '#b45309' },
  { value: 'brass', en: 'Brass', ar: 'نحاس أصفر', swatch: '#92400e' },
  { value: 'mixed', en: 'Mixed', ar: 'مختلط', swatch: '#6b7280' },
];

/** Fabrics — offered for clothing, kaftans, tailoring and every other vertical. */
const FABRIC_MATERIALS: MaterialOption[] = [
  { value: 'cotton', en: 'Cotton', ar: 'قطن', swatch: '#f5f5f4' },
  { value: 'wool', en: 'Wool', ar: 'صوف', swatch: '#a8a29e' },
  { value: 'silk', en: 'Silk', ar: 'حرير', swatch: '#fbcfe8' },
  { value: 'linen', en: 'Linen', ar: 'كتان', swatch: '#e7e5e4' },
  { value: 'leather', en: 'Leather', ar: 'جلد', swatch: '#78350f' },
  { value: 'velvet', en: 'Velvet', ar: 'مخمل', swatch: '#5b21b6' },
  { value: 'other', en: 'Other', ar: 'أخرى', swatch: '#6b7280' },
];

const JEWELRY_RE = /jewel|bijou|مجوهرات|حلي|مجوهر/i;

/** A category is "jewelry" when its slug or any of its names match. */
const isJewelryCategory = (c?: Category | null): boolean =>
  !!c && JEWELRY_RE.test(`${c.slug ?? ''} ${c.name ?? ''} ${c.name_en ?? ''} ${c.name_ar ?? ''}`);

const ACCEPTED = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const MAX_BYTES = 2048 * 1024; // 2 MB — matches backend images.* max:2048

export default function RequestCustomPieceForm() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [material, setMaterial] = useState('');
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

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/custom-orders/new');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    categoryService
      .getAllCategories()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        // Material is the only required field — pre-select a category so the
        // buyer can post with a single tap. Jewelry first (the flagship
        // custom-piece vertical), else the first available category.
        setCategoryId((prev) => {
          if (prev !== '') return prev;
          const jewelry = list.find((c) => isJewelryCategory(c));
          return (jewelry ?? list[0])?.id ?? '';
        });
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      if (typeof URL.revokeObjectURL === 'function') {
        previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      }
    };
  }, []);

  // Keep the local bilingual helper — intentional, do not convert to react-i18next
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  // `t` here is a local bilingual helper re-derived from `isRTL` on every render; `isRTL` is
  // already in the dep array. Listing `t` separately would add a new function ref each render.
  /* eslint-disable react-hooks/exhaustive-deps */
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
  /* eslint-enable react-hooks/exhaustive-deps */

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      if (prev[idx] && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(prev[idx]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  /**
   * getAllCategories returns only leaf categories (Caftan, Takchita, Jewelry…) — the
   * departments themselves are never in the payload, they only appear as each leaf's
   * `parent`. So every returned category is selectable; we group them by department
   * for scanability. Leaves without a parent (Jewelry) get their own trailing group.
   */
  const groupedCategories = (() => {
    const groups = new Map<string, { label: string; items: Category[] }>();
    categories.forEach((c) => {
      const parent = c.parent;
      const key = parent ? String(parent.id) : '_ungrouped';
      const label = parent ? (isRTL ? parent.name_ar : parent.name_en) || '' : '';
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key)!.items.push(c);
    });
    // Ungrouped last so departments read first.
    return [...groups.entries()]
      .sort(([a], [b]) => (a === '_ungrouped' ? 1 : b === '_ungrouped' ? -1 : 0))
      .map(([key, g]) => ({ key, ...g }));
  })();

  const selectedCategory = categories.find((c) => Number(c.id) === Number(categoryId)) ?? null;
  const isJewelry = isJewelryCategory(selectedCategory);
  const materialOptions = isJewelry ? JEWELRY_MATERIALS : FABRIC_MATERIALS;
  const categoryLabel = (c: Category) =>
    (isRTL ? c.name_ar : c.name_en) || c.name || c.slug;

  // A material chosen for one vertical is meaningless in another.
  useEffect(() => {
    setMaterial('');
    setPurity('');
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError(t('Please choose a category.', 'يرجى اختيار الفئة.'));
      return;
    }
    if (!material) {
      setError(t('Please choose a material.', 'يرجى اختيار المادة.'));
      return;
    }

    if (budgetMin && budgetMax) {
      const min = parseFloat(budgetMin);
      const max = parseFloat(budgetMax);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        setError(t('Budget minimum cannot be greater than the maximum.', 'يجب ألا تتجاوز الميزانية الدنيا الميزانية القصوى.'));
        return;
      }
    }

    const opt = materialOptions.find((m) => m.value === material);
    const materialLabel = opt ? (isRTL ? opt.ar : opt.en) : material;
    const catLabel = selectedCategory ? categoryLabel(selectedCategory) : '';
    const title = t(
      `Custom ${catLabel} — ${materialLabel}`,
      `${catLabel} مخصص — ${materialLabel}`,
    );
    const trimmed = notes.trim();
    const description =
      trimmed.length >= 20
        ? trimmed
        : t(
            `${trimmed ? trimmed + ' — ' : ''}Looking for a custom ${catLabel} in ${materialLabel}. Reference image(s) attached if provided.`,
            `${trimmed ? trimmed + ' — ' : ''}أبحث عن ${catLabel} مخصص من ${materialLabel}. الصور المرجعية مرفقة إن وُجدت.`
          );

    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    fd.append('category_id', String(categoryId));
    fd.append('currency', 'MAD');
    if (budgetMin) fd.append('budget_min', budgetMin);
    if (budgetMax) fd.append('budget_max', budgetMax);
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
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t('Request a custom piece', 'اطلب قطعة مخصصة')}
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700 ring-1 ring-rose-200"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category — what kind of piece; drives the material options below */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          <span className="flex items-center gap-1.5">
            <LayoutGrid size={14} className="text-amber-600" aria-hidden />
            {t('What are you looking for?', 'ماذا تريد؟')}
            <span className="text-rose-600 text-xs">*</span>
          </span>
        </label>
        {categories.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">
            {t('Loading categories…', 'جارٍ تحميل الفئات…')}
          </p>
        ) : (
          <div className="space-y-3">
            {groupedCategories.map((group) => (
              <div key={group.key}>
                {group.label && (
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1.5">
                    {group.label}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {group.items.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(Number(c.id))}
                      aria-pressed={Number(categoryId) === Number(c.id)}
                      className={[
                        'rounded-full border-2 px-3.5 py-2 text-xs font-semibold transition-all duration-150',
                        Number(categoryId) === Number(c.id)
                          ? 'border-indigo-700 bg-indigo-50 text-indigo-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/30',
                      ].join(' ')}
                    >
                      {categoryLabel(c)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Material — options depend on the selected category */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          <span className="flex items-center gap-1.5">
            <Gem size={14} className="text-amber-600" aria-hidden />
            {t('Material', 'المادة')}
            <span className="text-rose-600 text-xs">*</span>
          </span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {materialOptions.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMaterial(m.value)}
              aria-pressed={material === m.value}
              className={[
                'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all duration-150',
                material === m.value
                  ? 'border-indigo-700 bg-indigo-50 text-indigo-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/30',
              ].join(' ')}
            >
              <span
                className="w-5 h-5 rounded-full ring-1 ring-black/10 shrink-0"
                style={{ background: m.swatch }}
                aria-hidden
              />
              {isRTL ? m.ar : m.en}
            </button>
          ))}
        </div>
      </div>

      {/* Notes (optional) */}
      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-1.5">
          {t('Describe what you want', 'صف ما تريد')}{' '}
          <span className="text-gray-400 text-xs font-normal">{t('(optional)', '(اختياري)')}</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            isJewelry
              ? t('e.g. a thin engraved ring, size 7…', 'مثال: خاتم رفيع منقوش، مقاس 7…')
              : t('e.g. an embroidered kaftan, sleeves to the wrist…', 'مثال: قفطان مطرز، أكمام حتى المعصم…')
          }
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Image upload (optional) */}
      <div>
        <span className="block text-sm font-semibold text-gray-900 mb-1.5">
          {t('Reference photos', 'صور مرجعية')}{' '}
          <span className="text-gray-400 text-xs font-normal">{t('(optional)', '(اختياري)')}</span>
        </span>
        <label
          htmlFor="images"
          className="flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm font-medium text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all duration-200"
        >
          <ImagePlus className="h-5 w-5 shrink-0" aria-hidden />
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
          <ul className="mt-3 grid grid-cols-4 gap-2.5">
            {previews.map((src, idx) => (
              <li key={src} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-gray-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={t('reference', 'مرجع')} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow"
                  aria-label={t('Remove image', 'إزالة الصورة')}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* More details (optional, collapsed) */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-amber-50 transition-colors"
          aria-expanded={showMore}
        >
          {t('More details (optional)', 'تفاصيل إضافية (اختياري)')}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-4 px-4 py-4 bg-white">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Budget min (MAD)', 'الميزانية الدنيا (درهم)')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Budget max (MAD)', 'الميزانية القصوى (درهم)')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 transition-all bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Purity is a metals concept — meaningless for fabrics */}
                  {isJewelry && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {t('Purity', 'العيار')}
                      </label>
                      <input
                        type="text"
                        value={purity}
                        onChange={(e) => setPurity(e.target.value)}
                        placeholder={t('e.g. 18k, 925', 'مثال: 18 قيراط، 925')}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 transition-all bg-white"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Size', 'المقاس')}
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder={
                        isJewelry
                          ? t('e.g. ring 7, 45cm', 'مثال: خاتم 7، 45سم')
                          : t('e.g. M, 42, 160cm', 'مثال: M، 42، 160سم')
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 transition-all bg-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-700 px-4 py-3.5 min-h-[48px] font-semibold text-sm text-white transition-colors hover:bg-indigo-800 disabled:opacity-60 shadow-sm"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {t('Post to Open Souk', 'انشر في السوق المفتوح')}
      </button>
      <p className="text-center text-xs text-gray-400 leading-relaxed">
        {t(
          'Sellers and artisans in the community can see your request and respond.',
          'يمكن للبائعين والحرفيين في المجتمع رؤية طلبك والرد عليه.'
        )}
      </p>
    </form>
  );
}
