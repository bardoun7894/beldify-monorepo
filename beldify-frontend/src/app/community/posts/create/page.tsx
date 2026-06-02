'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ImageIcon,
  X,
  Tag,
  Wallet,
  Clock,
  Sparkles,
  CheckCircle,
  Wrench,
  Eye,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { createCommunityPost } from '@/services/communityService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { useDirection } from '@/hooks/useDirection';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Available skill chips ────────────────────────────────────────────────────
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

// ─── Preview Aside (desktop live summary) ────────────────────────────────────
interface PreviewAsideProps {
  title: string;
  description: string;
  categoryName: string;
  budget: { min: number; max: number; currency: string } | undefined;
  timeline: string;
  requiredSkills: string[];
  imageCount: number;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
}

function PreviewAside({
  title,
  description,
  categoryName,
  budget,
  timeline,
  requiredSkills,
  imageCount,
  isRTL,
  t,
}: PreviewAsideProps) {
  const hasContent = title || description || budget?.min || budget?.max || requiredSkills.length > 0;

  return (
    <aside
      className="hidden lg:block sticky top-8 self-start"
      aria-label={t('community.preview_label', 'Live Preview')}
    >
      {/* Preview card */}
      <div className="bg-white rounded-2xl ring-1 ring-amber-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 bg-indigo-950 flex items-center gap-2.5">
          <Eye size={15} className="text-indigo-300 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
            {t('community.preview_label', 'Live Preview')}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {!hasContent ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-3">
                <Eye size={20} className="text-amber-400" />
              </div>
              <p className="text-sm text-gray-500">
                {t('community.preview_empty', 'Fill in the form to see a preview')}
              </p>
            </div>
          ) : (
            <>
              {/* Title */}
              {title && (
                <div>
                  <h3
                    className="text-base font-bold text-gray-900 leading-snug"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {title}
                  </h3>
                </div>
              )}

              {/* Status pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {t('community.status_open', 'Open for proposals')}
              </span>

              {/* Description excerpt */}
              {description && (
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {description}
                </p>
              )}

              {/* Budget */}
              {(budget?.min || budget?.max) ? (
                <div className="flex items-center gap-2 text-sm">
                  <Wallet size={14} className="text-indigo-700 shrink-0" />
                  <span className="font-semibold text-indigo-700">
                    {budget.min > 0 ? `${budget.min}` : '?'} – {budget.max > 0 ? `${budget.max}` : '?'}{' '}
                    <span className="font-normal text-gray-500">{budget.currency}</span>
                  </span>
                </div>
              ) : null}

              {/* Timeline */}
              {timeline && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-indigo-700 shrink-0" />
                  <span>{t('community.timeline_prefix', 'Within')} {timeline}</span>
                </div>
              )}

              {/* Category */}
              {categoryName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag size={14} className="text-indigo-700 shrink-0" />
                  <span>{categoryName}</span>
                </div>
              )}

              {/* Skills */}
              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium ring-1 ring-indigo-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Images count */}
              {imageCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ImageIcon size={13} className="text-amber-500 shrink-0" />
                  <span>
                    {imageCount} {t('community.images_attached', 'image(s) attached')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editorial tip */}
      <div className="mt-4 px-4 py-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200">
        <div className="flex items-start gap-2.5">
          <Sparkles size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            {t(
              'community.preview_tip',
              'Requests with a clear budget and reference photos attract 3× more proposals on average.'
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreatePostPage() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [submittedPostId, setSubmittedPostId] = useState<string | number | null>(null);

  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    categoryId?: string;
    budget?: string;
    images?: string;
    general?: string;
  }>({});

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    categoryId: string;
    timelineValue: string;
    timelineUnit: 'days' | 'weeks' | 'months';
    timeline: string;
    budget: { min: number; max: number; currency: string };
    images: File[];
  }>({
    title: '',
    description: '',
    categoryId: '',
    timeline: '1 weeks',
    timelineValue: '1',
    timelineUnit: 'weeks',
    budget: { min: 0, max: 0, currency: 'MAD' },
    images: [],
  });

  // Required skills multi-select chips
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ── Auth redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/community/posts/create');
    }
  }, [isAuthenticated, router]);

  // ── Fetch categories ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoryService.getAllCategories();
        setCategories(data);
      } catch {
        setError(t('community.error_loading_categories', 'Error loading categories'));
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [t]);

  // ── Pre-fill from search params ────────────────────────────────────────────
  useEffect(() => {
    const productId = searchParams.get('productId');
    const productName = searchParams.get('productName');
    const productImage = searchParams.get('productImage');

    if (productId && productName) {
      setFormData((prev) => ({
        ...prev,
        title: t('community.prefill_title', { productName }),
        description: `I'm looking for a custom product similar to the ${productName} (Product ID: ${productId}). ${
          productImage
            ? 'Please see the reference image for the style I prefer.'
            : 'I can provide more details about the design I have in mind.'
        }\n\nPlease let me know if you can create something similar with custom modifications.`,
      }));
    }
  }, [searchParams]);

  // ── Derived timeline string ────────────────────────────────────────────────
  const timelineString = `${formData.timelineValue || '1'} ${formData.timelineUnit || 'weeks'}`;

  // ── Category name for preview ──────────────────────────────────────────────
  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(formData.categoryId))?.name || '';

  // ── Skills toggle ──────────────────────────────────────────────────────────
  const toggleSkill = useCallback((skillKey: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skillKey) ? prev.filter((s) => s !== skillKey) : [...prev, skillKey]
    );
  }, []);

  // ── Inputs ─────────────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Keep timeline string in sync
      if (name === 'timelineValue' || name === 'timelineUnit') {
        next.timeline = `${name === 'timelineValue' ? value : prev.timelineValue} ${
          name === 'timelineUnit' ? value : prev.timelineUnit
        }`;
      }
      return next;
    });
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBudgetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        [name]: name === 'min' || name === 'max' ? parseFloat(value) || 0 : value,
      },
    }));
  };

  // ── Image handling ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const processFiles = useCallback(
    (files: File[]) => {
      setValidationErrors((prev) => ({ ...prev, images: '' }));
      const valid: File[] = [];
      const invalid: { name: string; reason: string }[] = [];

      files.forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          invalid.push({ name: file.name, reason: 'size' });
          return;
        }
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          invalid.push({ name: file.name, reason: 'type' });
          return;
        }
        valid.push(file);
      });

      if (invalid.length > 0) {
        if (invalid.some((f) => f.reason === 'size')) {
          setValidationErrors((prev) => ({ ...prev, images: t('community.error_image_size') }));
        } else {
          setValidationErrors((prev) => ({ ...prev, images: t('community.error_image_type') }));
        }
        if (valid.length === 0) return;
      }

      setFormData((prev) => ({ ...prev, images: [...prev.images, ...valid] }));
      setPreviewImages((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    },
    [t]
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragActive) setIsDragActive(true);
    },
    [isDragActive]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) processFiles(files);
    },
    [processFiles]
  );

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
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
    if (formData.budget.min > 0 && formData.budget.max > 0 && formData.budget.min > formData.budget.max) {
      errors.budget = t(
        'community.error_invalid_budget',
        'Minimum budget cannot be greater than maximum'
      );
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      const firstError = document.querySelector('.error-field');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category_id', formData.categoryId);
      data.append('timeline', timelineString);
      data.append('timeline_value', formData.timelineValue);
      data.append('timeline_unit', formData.timelineUnit);
      data.append('budget', JSON.stringify(formData.budget));
      data.append('budget_min', formData.budget.min.toString());
      data.append('budget_max', formData.budget.max.toString());
      data.append('budget_currency', formData.budget.currency);

      // Append required_skills[] to FormData
      requiredSkills.forEach((skill) => {
        data.append('required_skills[]', skill);
      });

      formData.images.forEach((image, idx) => {
        data.append(`images[${idx}]`, image);
      });

      const created = await createCommunityPost(data);
      setSubmittedPostId(created?.id ?? null);
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const serverErrors = err.response.data.errors;
        const mapped: typeof validationErrors = {};
        if (serverErrors.title) mapped.title = serverErrors.title[0];
        if (serverErrors.description) mapped.description = serverErrors.description[0];
        if (serverErrors.category_id) mapped.categoryId = serverErrors.category_id[0];
        setValidationErrors(mapped);
        document.querySelector('.error-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setError(err.message || t('community.error_creating_post', 'Error creating post'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-5 w-5" />
      </div>
    );
  }

  // ── SUCCESS STATE ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        {/* Hero band */}
        <section className="bg-indigo-700 text-white py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-amber-300 text-xs uppercase tracking-[0.18em] font-medium mb-2">
              {t('openSouk.eyebrow', 'OPEN SOUK')}
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('community.request_posted', 'Request Posted')}
            </h1>
          </div>
        </section>

        {/* Success card */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            className="max-w-md w-full bg-white rounded-2xl ring-1 ring-amber-200 shadow-sm overflow-hidden text-center"
          >
            {/* Indigo accent strip */}
            <div className="h-1.5 bg-indigo-700 w-full" />

            <div className="p-8 sm:p-10">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 ring-2 ring-emerald-200 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>

              <h2
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('community.success_title', 'Your request is live!')}
              </h2>

              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                {t(
                  'community.success_body',
                  'Artisans can now see and respond to your request. You will be notified when proposals arrive.'
                )}
              </p>

              {/* Status pill */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {t('community.status_open', 'Open for proposals')}
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {submittedPostId && (
                  <Link
                    href={`/community/posts/${submittedPostId}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-full transition-colors duration-200"
                  >
                    {t('community.view_request', 'View my request')}
                    <ChevronRight size={16} />
                  </Link>
                )}
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-white ring-1 ring-amber-200 hover:ring-amber-300 text-gray-700 text-sm font-semibold rounded-full transition-colors duration-200"
                >
                  {t('community.browse_souk', 'Browse Open Souk')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── FORM STATE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Editorial Hero Band */}
      <section className="bg-indigo-700 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            {t('common.back_to', 'Back to')} {t('openSouk.brand', 'Open Souk')}
          </Link>
          <p className="text-amber-300 text-xs uppercase tracking-[0.18em] font-medium mb-2">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold leading-tight mb-2"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('community.create_request', 'Post a Bespoke Request')}
          </h1>
          {/* AI chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={11} className="shrink-0" />
              {t('ai.chip.suggestedMeasurements', 'AI suggested measurements')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={11} className="shrink-0" />
              {t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}
            </span>
          </div>
        </div>
      </section>

      {/* Two-column layout: form + aside */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 items-start">
          {/* ── FORM COLUMN ─────────────────────────────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl ring-1 ring-amber-200 overflow-hidden shadow-sm">

              {/* Form header */}
              <div className="px-6 py-5 border-b border-amber-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {user?.full_name_en?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {t('community.what_is_custom_request', 'What is your custom request?')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('community.create_request_subtitle', 'Describe what you need — artisans will respond with proposals')}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="divide-y divide-amber-100">

                {/* ── SECTION: Images ──────────────────────────────────────── */}
                <section className="px-6 py-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-indigo-700" />
                      {t('community.section_photos', 'Reference Photos')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('community.photos_help', 'Photos help artisans understand your vision')}
                    </p>
                  </div>

                  {/* Drag & Drop area */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={[
                      'relative group cursor-pointer flex flex-col justify-center items-center p-8 border-2 border-dashed rounded-2xl transition-all duration-200',
                      isDragActive
                        ? 'border-indigo-400 bg-indigo-50'
                        : validationErrors.images
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-amber-200 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/60',
                    ].join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-label={t('community.drop_zone_label', 'Image drop zone')}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) processFiles(Array.from(e.target.files));
                        (e.target as HTMLInputElement).value = '';
                      }}
                    />
                    <div className="mb-3 rounded-full bg-white ring-1 ring-amber-200 p-3 shadow-sm">
                      <ImageIcon size={26} className="text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-indigo-700 mb-1">
                      {isDragActive
                        ? t('community.drag_photos_here', 'Drop photos here')
                        : t('community.drag_drop_images', 'Drag & drop photos here')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('community.or_click_to_select', 'or click to browse files')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 font-mono tracking-wide uppercase">
                      {t('community.image_formats', 'JPG, PNG, WEBP — max 5 MB each')}
                    </p>
                  </div>

                  {validationErrors.images && (
                    <p className="mt-2 text-xs text-rose-700">{validationErrors.images}</p>
                  )}

                  {previewImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-gray-500 mb-3">
                        {t('community.uploaded_images', 'Uploaded')} ({previewImages.length})
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {previewImages.map((src, i) => (
                          <div key={i} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={t('community.image_preview_alt', { index: i + 1 })}
                              className="w-full aspect-square object-cover rounded-xl ring-1 ring-amber-200"
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              className="absolute -top-2 -end-2 w-6 h-6 bg-rose-700 text-white rounded-full flex items-center justify-center hover:bg-rose-800 transition-colors shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                              aria-label={t('common.remove', 'Remove')}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

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
                        validationErrors.title ? 'border-rose-300 bg-rose-50' : 'border-amber-200 bg-white',
                      ].join(' ')}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      {validationErrors.title ? (
                        <p className="text-xs text-rose-700">{validationErrors.title}</p>
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
                      className={[
                        'w-full px-4 py-3 border rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 resize-none',
                        validationErrors.description ? 'border-rose-300 bg-rose-50' : 'border-amber-200 bg-white',
                      ].join(' ')}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      {validationErrors.description ? (
                        <p className="text-xs text-rose-700">{validationErrors.description}</p>
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
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                      <Tag size={14} className="text-indigo-700" />
                      {t('community.category_label', 'Category')}
                      <span className="text-rose-600">*</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('community.pick_category', 'Select the category that best matches your request')}
                    </p>
                  </div>

                  <div className={validationErrors.categoryId ? 'error-field' : ''}>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      disabled={loadingCategories}
                      className={[
                        'w-full px-4 py-3 border rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white',
                        validationErrors.categoryId ? 'border-rose-300 bg-rose-50' : 'border-amber-200',
                      ].join(' ')}
                    >
                      <option value="">{t('community.select_category', 'اختار الصنف')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {isRTL ? category.name_ar : category.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.categoryId && (
                      <p className="mt-1.5 text-xs text-rose-700">{validationErrors.categoryId}</p>
                    )}
                  </div>
                </section>

                {/* ── SECTION: Required Skills ─────────────────────────────── */}
                <section className="px-6 py-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                      <Wrench size={14} className="text-indigo-700" />
                      {t('community.skills_label', 'Required Skills')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t(
                        'community.skills_help',
                        'Tag the crafts you need — sellers with matching expertise will be highlighted'
                      )}
                    </p>
                  </div>

                  {/* Skill chips */}
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t('community.skills_label', 'Required Skills')}>
                    {AVAILABLE_SKILLS.map((skill) => {
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
                              ? 'bg-indigo-700 text-white ring-1 ring-indigo-700'
                              : 'bg-white text-gray-700 ring-1 ring-amber-200 hover:ring-indigo-300 hover:text-indigo-700',
                          ].join(' ')}
                        >
                          {selected && <CheckCircle size={11} className="shrink-0" />}
                          {isRTL ? skill.ar : skill.en}
                        </button>
                      );
                    })}
                  </div>

                  {requiredSkills.length > 0 && (
                    <p className="mt-3 text-xs text-indigo-700 font-medium">
                      {requiredSkills.length} {t('community.skills_selected', 'skill(s) selected')}
                    </p>
                  )}
                </section>

                {/* ── SECTION: Budget ──────────────────────────────────────── */}
                <section className="px-6 py-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                      <Wallet size={14} className="text-indigo-700" />
                      {t('community.budget_section', 'Budget Range')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('community.budget_guidance', 'Setting a clear budget attracts more focused bids')}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="min" className="block text-xs font-medium text-gray-700 mb-1.5">
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
                        className="w-full px-3 py-3 border border-amber-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="max" className="block text-xs font-medium text-gray-700 mb-1.5">
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
                        className="w-full px-3 py-3 border border-amber-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="currency" className="block text-xs font-medium text-gray-700 mb-1.5">
                        {t('community.currency', 'Currency')}
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.budget.currency}
                        onChange={handleBudgetChange}
                        className="w-full px-3 py-3 border border-amber-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                      >
                        <option value="MAD">MAD</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  {validationErrors.budget && (
                    <p className="mt-2 text-xs text-rose-700">{validationErrors.budget}</p>
                  )}

                  {/* Budget hint */}
                  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 ring-1 ring-amber-200">
                    <Sparkles size={13} className="text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800">
                      {t('community.budget_hint', 'Setting a clear budget attracts more focused bids.')}
                    </p>
                  </div>
                </section>

                {/* ── SECTION: Timeline ────────────────────────────────────── */}
                <section className="px-6 py-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-700" />
                      {t('community.timeline_section', 'Timeline')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('community.timeline_estimate', 'How long do you need for completion?')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      id="timelineValue"
                      name="timelineValue"
                      value={formData.timelineValue}
                      onChange={handleInputChange}
                      placeholder="1"
                      min="1"
                      className="w-full px-4 py-3 border border-amber-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                    />
                    <select
                      id="timelineUnit"
                      name="timelineUnit"
                      value={formData.timelineUnit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-amber-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 bg-white"
                    >
                      <option value="days">{t('community.timeline_days', 'Days')}</option>
                      <option value="weeks">{t('community.timeline_weeks', 'Weeks')}</option>
                      <option value="months">{t('community.timeline_months', 'Months')}</option>
                    </select>
                  </div>
                </section>

                {/* ── SECTION: Submit ──────────────────────────────────────── */}
                <section className="px-6 py-6 bg-amber-50/40">
                  {error && (
                    <div className="mb-5 p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl">
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 text-center sm:text-start">
                      {t('community.sellers_will_contact', 'Artisans will respond to your request with proposals')}
                    </p>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-300 text-white rounded-full text-sm font-semibold transition-colors duration-200 shrink-0"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          {t('common.submitting', 'Submitting…')}
                        </>
                      ) : (
                        t('community.submit_request', 'نشر الطلب')
                      )}
                    </button>
                  </div>
                </section>
              </form>
            </div>
          </div>

          {/* ── PREVIEW COLUMN (lg+) ─────────────────────────────────────── */}
          <PreviewAside
            title={formData.title}
            description={formData.description}
            categoryName={selectedCategoryName}
            budget={formData.budget}
            timeline={timelineString}
            requiredSkills={requiredSkills.map(
              (key) =>
                (isRTL
                  ? AVAILABLE_SKILLS.find((s) => s.key === key)?.ar
                  : AVAILABLE_SKILLS.find((s) => s.key === key)?.en) || key
            )}
            imageCount={previewImages.length}
            isRTL={isRTL}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
