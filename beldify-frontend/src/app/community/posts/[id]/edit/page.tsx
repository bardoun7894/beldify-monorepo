'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ImageIcon,
  X,
  Tag,
  Wallet,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { fetchCommunityPost, updateCommunityPost } from '@/services/communityService';
import { categoryService } from '@/services/categoryService';
import { useDirection } from '@/hooks/useDirection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { CommunityPost } from '@/types/community';
import type { Category } from '@/types/category';
import logger from '@/utils/consoleLogger';

// ─── Available skill chips (shared with create page) ─────────────────────────
const AVAILABLE_SKILLS = [
  { key: 'embroidery', ar: 'التطريز', en: 'Embroidery' },
  { key: 'tailoring', ar: 'الخياطة', en: 'Tailoring' },
  { key: 'leather', ar: 'الجلد', en: 'Leather Craft' },
  { key: 'weaving', ar: 'النسيج', en: 'Weaving' },
  { key: 'zellige', ar: 'الزليج', en: 'Zellige' },
  { key: 'woodwork', ar: 'النجارة', en: 'Wood Carving' },
  { key: 'pottery', ar: 'الفخار', en: 'Pottery' },
  { key: 'jewelry', ar: 'المجوهرات', en: 'Jewelry' },
  { key: 'knitting', ar: 'التريكو', en: 'Knitting' },
  { key: 'dyeing', ar: 'الصباغة', en: 'Dyeing' },
  { key: 'caftan', ar: 'القفطان', en: 'Caftan Making' },
  { key: 'djellaba', ar: 'الجلابة', en: 'Djellaba Making' },
];

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({
  icon,
  title,
  subtitle,
  required,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
        <span className="text-indigo-700">{icon}</span>
        {title}
        {required && <span className="text-rose-600 text-xs">*</span>}
      </h3>
      {subtitle && <p className="text-xs text-gray-500 ms-6">{subtitle}</p>}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ApiErrorBanner({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl flex items-start gap-2.5"
    >
      <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
      <p className="text-sm text-rose-700 flex-1">{error}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-700 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

// ─── Gate for posts that cannot be edited ────────────────────────────────────
function EditBlockedGate({
  reason,
  postId,
  t,
}: {
  reason: '403' | '422' | 'status' | 'unknown';
  postId: string;
    t: TFunction<any, any>;
}) {
  const messages: Record<typeof reason, string> = {
    '403': t(
      'editPost.blocked403',
      'You are not authorised to edit this request. It may belong to another account, or editing has been locked because a proposal was already accepted.'
    ),
    '422': t(
      'editPost.blocked422',
      'This request cannot be edited — it has already received responses and the edit cap has been reached.'
    ),
    status: t(
      'editPost.blockedStatus',
      'This request can only be edited while it is open or pending.'
    ),
    unknown: t('editPost.blockedUnknown', 'This request cannot be edited right now.'),
  };

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <div className="w-14 h-14 bg-rose-50 rounded-full ring-1 ring-rose-200 flex items-center justify-center mx-auto mb-4">
        <ShieldAlert size={22} className="text-rose-500" />
      </div>
      <h2
        className="text-xl font-bold text-gray-900 mb-3"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('editPost.blockedTitle', 'Editing not available')}
      </h2>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">{messages[reason]}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/community/posts/${postId}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-full transition-colors duration-200"
        >
          {t('community.view_request', 'View request')}
        </Link>
        <Link
          href="/community/my-posts"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-white ring-1 ring-gray-200 hover:ring-gray-300 text-gray-700 text-sm font-semibold rounded-full transition-colors duration-200"
        >
          {t('myPosts.pageTitle', 'My Requests')}
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EditPostPage() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();

  const rawId = (params?.id as string) ?? '';
  const postId = rawId.includes('-') ? rawId.split('-')[0] : rawId;

  // Load state
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [post, setPost] = useState<CommunityPost | null>(null);

  // Block gate state
  const [blocked, setBlocked] = useState<'403' | '422' | 'status' | 'unknown' | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state (initialised from post data)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    timelineValue: '1',
    timelineUnit: 'weeks' as 'days' | 'weeks' | 'months',
    budget: { min: 0, max: 0, currency: 'MAD' },
  });
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);

  // Images
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const newImagePreviewsRef = useRef<string[]>([]);
  useEffect(() => { newImagePreviewsRef.current = newImagePreviews; }, [newImagePreviews]);
  useEffect(() => () => { newImagePreviewsRef.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    categoryId?: string;
    budget?: string;
  }>({});

  // ── Auth gate ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/community/posts/${postId}/edit`);
    }
  }, [isAuthenticated, postId, router]);

  // ── Load post + categories in parallel ──────────────────────────────────
  useEffect(() => {
    if (!postId) return;

    const controller = new AbortController();

    const run = async () => {
      setLoadingPost(true);
      setLoadError(null);

      try {
        const [postData, catData] = await Promise.all([
          fetchCommunityPost(postId),
          categoryService.getAllCategories().catch(() => []),
        ]);

        setCategories(catData);
        setLoadingCategories(false);

        const status = postData.status ?? 'open';
        if (status !== 'open' && status !== 'pending') {
          setBlocked('status');
          setPost(postData);
          setLoadingPost(false);
          return;
        }

        // Ownership check
        const postOwnerId = postData.userId ?? postData.user?.id;
        if (user?.id && Number(postOwnerId) !== Number(user.id)) {
          setBlocked('403');
          setPost(postData);
          setLoadingPost(false);
          return;
        }

        setPost(postData);

        // Prefill form
        const budgetRaw = postData.budget;
        const budgetMin =
          budgetRaw?.min != null
            ? Number(budgetRaw.min)
            : Number(postData.budget_min ?? 0);
        const budgetMax =
          budgetRaw?.max != null
            ? Number(budgetRaw.max)
            : Number(postData.budget_max ?? 0);
        const currency = budgetRaw?.currency ?? postData.currency ?? 'MAD';

        // Parse timeline — e.g. "2 weeks"
        const timelineParts = (postData.timeline ?? '').split(' ');
        const timelineValue = timelineParts[0] ?? '1';
        const timelineUnit = (['days', 'weeks', 'months'] as const).includes(
          timelineParts[1] as any
        )
          ? (timelineParts[1] as 'days' | 'weeks' | 'months')
          : 'weeks';

        setFormData({
          title: postData.title ?? '',
          description: postData.description ?? '',
          categoryId: String(postData.categoryId ?? postData.category?.id ?? ''),
          timelineValue,
          timelineUnit,
          budget: { min: budgetMin, max: budgetMax, currency },
        });

        const skills = postData.requiredSkills ?? postData.required_skills ?? [];
        setRequiredSkills(Array.isArray(skills) ? skills : []);

        // Existing images — keep URL strings only
        const imgs = postData.images ?? [];
        const urlList = imgs.map(img =>
          typeof img === 'string' ? img : (img as any).image_path ?? ''
        ).filter(Boolean);
        setExistingImageUrls(urlList);
      } catch (err: any) {
        if (!controller.signal.aborted) {
          logger.error('Failed to load post for editing:', err);
          setLoadError(err?.message ?? t('common.errorTitle', 'Something went wrong'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPost(false);
        }
      }
    };

    run();
    return () => controller.abort();
  }, [postId, user?.id, t]);

  // ── Form handlers ────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'timelineValue' || name === 'timelineUnit') {
        // keep timelineValue / timelineUnit in sync
      }
      return next;
    });
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBudgetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [name]: name === 'min' || name === 'max' ? parseFloat(value) || 0 : value,
      },
    }));
  };

  const toggleSkill = useCallback((skillKey: string) => {
    setRequiredSkills(prev =>
      prev.includes(skillKey) ? prev.filter(s => s !== skillKey) : [...prev, skillKey]
    );
  }, []);

  // ── Image handlers ───────────────────────────────────────────────────────
  const processFiles = useCallback((files: File[]) => {
    const valid: File[] = [];
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) return;
      valid.push(file);
    });
    setNewImages(prev => [...prev, ...valid]);
    setNewImagePreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  }, []);

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = t('community.error_title_min_length', 'Title must be at least 5 characters');
    }
    if (!formData.description || formData.description.trim().length < 20) {
      errors.description = t(
        'community.error_description_min_length',
        'Description must be at least 20 characters'
      );
    }
    if (!formData.categoryId) {
      errors.categoryId = t('community.error_category_required', 'Please select a category');
    }
    if (
      formData.budget.min > 0 &&
      formData.budget.max > 0 &&
      formData.budget.min > formData.budget.max
    ) {
      errors.budget = t(
        'community.error_invalid_budget',
        'Minimum budget cannot be greater than maximum'
      );
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      document.querySelector('.error-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const timelineString = `${formData.timelineValue || '1'} ${formData.timelineUnit || 'weeks'}`;
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category_id', formData.categoryId);
      fd.append('timeline', timelineString);
      fd.append('timeline_value', formData.timelineValue);
      fd.append('timeline_unit', formData.timelineUnit);
      fd.append('budget', JSON.stringify(formData.budget));
      fd.append('budget_min', formData.budget.min.toString());
      fd.append('budget_max', formData.budget.max.toString());
      fd.append('budget_currency', formData.budget.currency);

      requiredSkills.forEach(skill => fd.append('required_skills[]', skill));

      // New image files
      newImages.forEach((img, idx) => fd.append(`images[${idx}]`, img));

      await updateCommunityPost(postId, fd);
      setSubmitted(true);

      // Navigate back to post detail
      router.push(`/community/posts/${postId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setBlocked('403');
      } else if (status === 422) {
        const serverErrors = err?.response?.data?.errors;
        if (serverErrors) {
          const mapped: typeof validationErrors = {};
          if (serverErrors.title) mapped.title = serverErrors.title[0];
          if (serverErrors.description) mapped.description = serverErrors.description[0];
          if (serverErrors.category_id) mapped.categoryId = serverErrors.category_id[0];
          setValidationErrors(mapped);
          // If the 422 is due to edit-cap (edit_cap message), show blocked gate
          const apiMessage = err?.response?.data?.message ?? '';
          if (
            apiMessage.toLowerCase().includes('edit') ||
            apiMessage.toLowerCase().includes('cap') ||
            apiMessage.toLowerCase().includes('cannot')
          ) {
            setBlocked('422');
          } else {
            setSubmitError(
              t('editPost.validationErrors', 'Please fix the highlighted errors above.')
            );
            document.querySelector('.error-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          setBlocked('422');
        }
      } else {
        const apiMessage = err?.response?.data?.message;
        setSubmitError(
          apiMessage ||
            err?.message ||
            t('community.error_creating_post', 'Error updating post')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-5 w-5" />
      </div>
    );
  }

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 flex items-center justify-center">
            <LoadingSpinner className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-canvas py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-white rounded-2xl p-8 ring-1 ring-rose-200">
              <AlertCircle size={32} className="text-rose-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-3 text-gray-900">
                {t('common.errorTitle', 'Something went wrong')}
              </h2>
              <p className="mb-6 text-rose-700 text-sm">{loadError}</p>
              <Link
                href="/community/my-posts"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors"
              >
                <ArrowLeft size={16} />
                {t('myPosts.pageTitle', 'My Requests')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Blocked gate ─────────────────────────────────────────────────────────
  if (blocked) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="bg-indigo-950 text-white py-4 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <Link
              href={`/community/posts/${postId}`}
              className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              {t('community.view_request', 'View request')}
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <EditBlockedGate reason={blocked} postId={postId} t={t} />
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Hero band ─────────────────────────────────────────────────────── */}
      <section className="bg-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link
            href={`/community/posts/${postId}`}
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft size={15} />
            {t('common.back_to', 'Back to')} {t('community.request', 'request')}
          </Link>
          <p className="text-amber-400 text-[10px] uppercase tracking-[0.2em] font-semibold mb-2">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold leading-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('editPost.pageTitle', 'Edit your request')}
          </h1>
          {post?.title && (
            <p className="text-indigo-300 text-sm mt-1 truncate max-w-xl">{post.title}</p>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden shadow-sm">
          {/* Form header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm">
                  {user?.full_name_en?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {t('editPost.formTitle', 'Update your bespoke request')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('editPost.formSubtitle', 'Changes will be visible to all artisans immediately')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            {/* ── SECTION: Title & Description ─────────────────────────── */}
            <section className="px-6 py-6 space-y-5">
              {/* Title */}
              <div className={validationErrors.title ? 'error-field' : ''}>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-1.5">
                  {t('community.title_label', 'Request title')}
                  <span className="text-rose-600 ms-0.5">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('community.title_placeholder', 'e.g. Custom embroidered djellaba for a wedding')}
                  maxLength={100}
                  className={[
                    'w-full px-4 py-3 border rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700',
                    validationErrors.title
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  ].join(' ')}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {validationErrors.title ? (
                    <p className="text-xs text-rose-700 flex items-center gap-1">
                      <AlertCircle size={11} className="shrink-0" />
                      {validationErrors.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-gray-400 font-mono">
                    {formData.title.length}/100
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className={validationErrors.description ? 'error-field' : ''}>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-1.5">
                  {t('community.description_label', 'Describe your request')}
                  <span className="text-rose-600 ms-0.5">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t(
                    'community.description_placeholder',
                    'Describe the material, colors, measurements, style inspiration, and any special details...'
                  )}
                  rows={6}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={[
                    'w-full px-4 py-3 border rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 resize-none leading-relaxed',
                    validationErrors.description
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  ].join(' ')}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {validationErrors.description ? (
                    <p className="text-xs text-rose-700 flex items-center gap-1">
                      <AlertCircle size={11} className="shrink-0" />
                      {validationErrors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-gray-400 font-mono">
                    {formData.description.length}/2000
                  </span>
                </div>
              </div>
            </section>

            {/* ── SECTION: Category ────────────────────────────────────── */}
            <section className="px-6 py-6">
              <SectionHeading
                icon={<Tag size={14} />}
                title={t('community.category_label', 'Category')}
                subtitle={t('community.pick_category', 'Select the category that best matches your request')}
                required
              />
              <div className={validationErrors.categoryId ? 'error-field' : ''}>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  disabled={loadingCategories}
                  className={[
                    'w-full px-4 py-3 border rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white',
                    validationErrors.categoryId
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-gray-200 hover:border-gray-300',
                    loadingCategories ? 'opacity-60 cursor-wait' : '',
                  ].join(' ')}
                >
                  <option value="">
                    {loadingCategories
                      ? t('common.loading', 'Loading…')
                      : t('community.select_category', 'اختار الصنف')}
                  </option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {isRTL ? (category as any).name_ar ?? category.name : category.name}
                    </option>
                  ))}
                </select>
                {validationErrors.categoryId && (
                  <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1">
                    <AlertCircle size={11} className="shrink-0" />
                    {validationErrors.categoryId}
                  </p>
                )}
              </div>
            </section>

            {/* ── SECTION: Required Skills ─────────────────────────────── */}
            <section className="px-6 py-6">
              <SectionHeading
                icon={<Wrench size={14} />}
                title={t('community.skills_label', 'Required Skills')}
                subtitle={t(
                  'community.skills_help',
                  'Tag the crafts you need — sellers with matching expertise will be highlighted'
                )}
              />
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('community.skills_label', 'Required Skills')}
              >
                {AVAILABLE_SKILLS.map(skill => {
                  const selected = requiredSkills.includes(skill.key);
                  return (
                    <button
                      key={skill.key}
                      type="button"
                      onClick={() => toggleSkill(skill.key)}
                      aria-pressed={selected}
                      className={[
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                        selected
                          ? 'bg-indigo-700 text-white shadow-sm'
                          : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-indigo-300 hover:text-indigo-700',
                      ].join(' ')}
                    >
                      {selected && <CheckCircle2 size={11} className="shrink-0" />}
                      {isRTL ? skill.ar : skill.en}
                    </button>
                  );
                })}
              </div>
              {requiredSkills.length > 0 && (
                <p className="mt-3 text-xs text-indigo-700 font-semibold">
                  {requiredSkills.length} {t('community.skills_selected', 'skill(s) selected')}
                </p>
              )}
            </section>

            {/* ── SECTION: Budget ──────────────────────────────────────── */}
            <section className="px-6 py-6">
              <SectionHeading
                icon={<Wallet size={14} />}
                title={t('community.budget_section', 'Budget Range')}
                subtitle={t('community.budget_guidance', 'Setting a clear budget attracts more focused bids')}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="min" className="block text-xs font-medium text-gray-600 mb-1.5">
                    {t('community.from_price', 'Min')}
                  </label>
                  <input
                    type="number"
                    id="min"
                    name="min"
                    value={formData.budget.min || ''}
                    onChange={handleBudgetChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white hover:border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="max" className="block text-xs font-medium text-gray-600 mb-1.5">
                    {t('community.to_price', 'Max')}
                  </label>
                  <input
                    type="number"
                    id="max"
                    name="max"
                    value={formData.budget.max || ''}
                    onChange={handleBudgetChange}
                    placeholder="500"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white hover:border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-xs font-medium text-gray-600 mb-1.5">
                    {t('community.currency', 'Currency')}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.budget.currency}
                    onChange={handleBudgetChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white hover:border-gray-300"
                  >
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              {validationErrors.budget && (
                <p className="mt-2 text-xs text-rose-700 flex items-center gap-1">
                  <AlertCircle size={11} className="shrink-0" />
                  {validationErrors.budget}
                </p>
              )}
            </section>

            {/* ── SECTION: Timeline ────────────────────────────────────── */}
            <section className="px-6 py-6">
              <SectionHeading
                icon={<Clock size={14} />}
                title={t('community.timeline_section', 'Timeline')}
                subtitle={t('community.timeline_estimate', 'How much time do you need for completion?')}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  id="timelineValue"
                  name="timelineValue"
                  value={formData.timelineValue}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                />
                <select
                  id="timelineUnit"
                  name="timelineUnit"
                  value={formData.timelineUnit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                >
                  <option value="days">{t('community.timeline_days', 'Days')}</option>
                  <option value="weeks">{t('community.timeline_weeks', 'Weeks')}</option>
                  <option value="months">{t('community.timeline_months', 'Months')}</option>
                </select>
              </div>
            </section>

            {/* ── SECTION: Reference images ─────────────────────────────── */}
            <section className="px-6 py-6">
              <SectionHeading
                icon={<ImageIcon size={14} />}
                title={t('community.section_photos', 'Reference Photos')}
                subtitle={t('editPost.photosSubtitle', 'Add new photos (existing photos are retained)')}
              />

              {/* Existing images */}
              {existingImageUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-gray-400 mb-2">
                    {t('editPost.existingPhotos', 'Existing photos')} ({existingImageUrls.length})
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {existingImageUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL ?? ''}/${url}`}
                          alt={`${t('community.image_preview_alt', { index: i + 1 })}`}
                          className="w-full aspect-square object-cover rounded-xl ring-1 ring-gray-200"
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-rose-700 text-white rounded-full flex items-center justify-center hover:bg-rose-800 transition-colors shadow opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label={t('common.remove', 'Remove')}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new images */}
              <div
                onDragEnter={e => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragActive(false); }}
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragActive(false);
                  processFiles(Array.from(e.dataTransfer.files));
                }}
                className={[
                  'cursor-pointer flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-2xl transition-all duration-200',
                  isDragActive
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/20',
                ].join(' ')}
                role="button"
                tabIndex={0}
                aria-label={t('community.drop_zone_label', 'Image drop zone')}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={e => {
                    if (e.target.files) processFiles(Array.from(e.target.files));
                    (e.target as HTMLInputElement).value = '';
                  }}
                />
                <div className="mb-2 rounded-full bg-white ring-1 ring-gray-200 p-2.5 shadow-sm">
                  <ImageIcon size={20} className={isDragActive ? 'text-indigo-500' : 'text-amber-400'} />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-0.5">
                  {isDragActive
                    ? t('community.drag_photos_here', 'Drop photos here')
                    : t('community.drag_drop_images', 'Drag & drop photos here')}
                </p>
                <p className="text-[10px] text-gray-400 font-mono tracking-wide mt-1">
                  JPG · PNG · WEBP · max 5 MB
                </p>
              </div>

              {newImagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-gray-400 mb-2.5">
                    {newImagePreviews.length} {t('editPost.newPhotos', 'new photo(s) to add')}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {newImagePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={t('community.image_preview_alt', { index: i + 1 })}
                          className="w-full aspect-square object-cover rounded-xl ring-1 ring-indigo-200"
                        />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeNewImage(i); }}
                          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-rose-700 text-white rounded-full flex items-center justify-center hover:bg-rose-800 transition-colors shadow opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label={t('common.remove', 'Remove')}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── SECTION: Submit ──────────────────────────────────────── */}
            <section className="px-6 py-6 bg-gray-50">
              <AnimatePresence>
                {submitError && (
                  <div className="mb-5">
                    <ApiErrorBanner error={submitError} onDismiss={() => setSubmitError(null)} />
                  </div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500 text-center sm:text-start">
                  {t(
                    'editPost.submitNote',
                    'Changes will be visible to artisans immediately after saving.'
                  )}
                </p>

                <div className="flex gap-3">
                  <Link
                    href={`/community/posts/${postId}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-white ring-1 ring-gray-200 hover:ring-gray-300 text-gray-700 text-sm font-semibold rounded-full transition-colors duration-200"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-300 text-white rounded-full text-sm font-semibold transition-colors duration-200 shrink-0 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {t('common.saving', 'Saving…')}
                      </>
                    ) : (
                      t('editPost.saveChanges', 'Save changes')
                    )}
                  </button>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}
