'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
  CheckCircle2,
  AlertCircle,
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

// ─── Quick-start request templates ───────────────────────────────────────────
// Tapping one prefills the form for a common Moroccan custom-fashion request so
// the buyer never faces a blank page. Everything stays editable afterwards.
// `categoryKeywords` are matched (best-effort) against the live category list.
interface RequestTemplate {
  key: string;
  emoji: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  skills: string[];
  budget: { min: number; max: number };
  timelineValue: string;
  timelineUnit: 'days' | 'weeks' | 'months';
  categoryKeywords: string[];
}

const REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    key: 'caftan',
    emoji: '👗',
    titleAr: 'قفطان مخصص على قياسي',
    titleEn: 'Custom caftan made to measure',
    descAr: 'بغيت قفطان مخصص على قياسي. عندي فكرة على اللون والتطريز اللي بغيت. غادي نوفر القياسات والتفاصيل. شنو تنصحوني وشحال الثمن؟',
    descEn: "I'd like a custom caftan made to my measurements. I have a colour and embroidery style in mind and will share exact measurements. What do you recommend, and what's your price?",
    skills: ['caftan', 'embroidery', 'tailoring'],
    budget: { min: 800, max: 2500 },
    timelineValue: '3',
    timelineUnit: 'weeks',
    categoryKeywords: ['caftan', 'قفطان', 'kaftan'],
  },
  {
    key: 'takchita',
    emoji: '💍',
    titleAr: 'تكشيطة العرس',
    titleEn: 'Wedding takchita',
    descAr: 'كنقلب على تكشيطة للعرس، راقية ومطرزة. بغيت شي حاجة فريدة على قياسي فأجل العرس. عافاك عطيني اقتراحاتك مع تصاور ديال خدمتك السابقة.',
    descEn: "Looking for an elegant, embroidered wedding takchita — something unique, made to measure, ready before the wedding date. Please share suggestions and photos of your past work.",
    skills: ['caftan', 'embroidery', 'weaving'],
    budget: { min: 2000, max: 6000 },
    timelineValue: '4',
    timelineUnit: 'weeks',
    categoryKeywords: ['takchita', 'تكشيطة', 'caftan', 'قفطان'],
  },
  {
    key: 'djellaba',
    emoji: '🧥',
    titleAr: 'جلابة رجالية على القياس',
    titleEn: "Men's djellaba, tailored",
    descAr: 'بغيت جلابة رجالية مخيطة على قياسي، بقماش جيد. نقدر نوفر القياسات واللون. شحال الثمن وشحال ياخد من الوقت؟',
    descEn: "I want a men's djellaba tailored to my measurements in good fabric. I can provide measurements and colour. What's the price and how long does it take?",
    skills: ['djellaba', 'tailoring', 'weaving'],
    budget: { min: 500, max: 1500 },
    timelineValue: '2',
    timelineUnit: 'weeks',
    categoryKeywords: ['djellaba', 'جلابة', 'jellaba'],
  },
  {
    key: 'gandoura',
    emoji: '🧵',
    titleAr: 'قندورة/عبايا مطرزة',
    titleEn: 'Embroidered gandoura / abaya',
    descAr: 'كنقلب على قندورة مطرزة على قياسي. عندي فكرة على الطراز والألوان. شاركني اقتراحاتك.',
    descEn: "Looking for an embroidered gandoura made to measure. I have a style and colours in mind — share your suggestions.",
    skills: ['embroidery', 'tailoring'],
    budget: { min: 600, max: 2000 },
    timelineValue: '3',
    timelineUnit: 'weeks',
    categoryKeywords: ['gandoura', 'قندورة', 'abaya', 'عباية'],
  },
  {
    key: 'babouche',
    emoji: '👞',
    titleAr: 'بلغة جلدية مخصصة',
    titleEn: 'Custom leather babouche',
    descAr: 'بغيت بلغة جلدية مخصصة، بلون وقياس معينين. واش تقدر تصاوبها ليا؟ شحال الثمن؟',
    descEn: "I'd like a custom pair of leather babouche in a specific colour and size. Can you make them for me, and what's the price?",
    skills: ['leather'],
    budget: { min: 200, max: 600 },
    timelineValue: '1',
    timelineUnit: 'weeks',
    categoryKeywords: ['babouche', 'بلغة', 'leather', 'جلد'],
  },
  {
    key: 'jewelry',
    emoji: '💎',
    titleAr: 'مجوهرات مخصصة',
    titleEn: 'Custom jewelry',
    descAr: 'كنقلب على قطعة مجوهرات مخصصة (خاتم/عقد). عندي تصميم فبالي ونقدر نوفر تصاور. شنو تنصحوني؟',
    descEn: "Looking for a custom jewelry piece (ring/necklace). I have a design in mind and can share references. What do you recommend?",
    skills: ['jewelry'],
    budget: { min: 500, max: 3000 },
    timelineValue: '2',
    timelineUnit: 'weeks',
    categoryKeywords: ['jewelry', 'مجوهرات', 'jewellery'],
  },
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
    t: TFunction<any, any>;
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
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-3.5 bg-indigo-950 flex items-center gap-2">
          <Eye size={13} className="text-indigo-300 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
            {t('community.preview_label', 'Live Preview')}
          </span>
        </div>

        <div className="p-5 space-y-3.5">
          {!hasContent ? (
            <div className="text-center py-8">
              <div className="w-11 h-11 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-3">
                <Eye size={18} className="text-amber-300" />
              </div>
              <p className="text-xs text-gray-500">
                {t('community.preview_empty', 'Fill in the form to see a preview')}
              </p>
            </div>
          ) : (
            <>
              {/* Status pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                {t('community.status_open', 'Open for proposals')}
              </span>

              {title && (
                <h3
                  className="text-base font-bold text-gray-900 leading-snug"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {title}
                </h3>
              )}

              {description && (
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {description}
                </p>
              )}

              {(budget?.min || budget?.max) ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl ring-1 ring-amber-100">
                  <Wallet size={13} className="text-amber-700 shrink-0" />
                  <span className="text-sm font-bold text-amber-900">
                    {budget.min > 0 ? `${budget.min}` : '?'} – {budget.max > 0 ? `${budget.max}` : '?'}{' '}
                    <span className="font-normal text-amber-700 text-xs">{budget.currency}</span>
                  </span>
                </div>
              ) : null}

              {timeline && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={13} className="text-indigo-700 shrink-0" />
                  <span>{t('community.timeline_prefix', 'Within')} {timeline}</span>
                </div>
              )}

              {categoryName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag size={13} className="text-indigo-700 shrink-0" />
                  <span>{categoryName}</span>
                </div>
              )}

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium ring-1 ring-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {imageCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ImageIcon size={12} className="text-amber-500 shrink-0" />
                  <span>
                    {imageCount} {t('community.images_attached', 'image(s) attached')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-4 px-4 py-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200">
        <div className="flex items-start gap-2.5">
          <Sparkles size={13} className="text-amber-600 mt-0.5 shrink-0" />
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

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/community/posts/create');
    }
  }, [isAuthenticated, router]);

  // t is intentionally omitted — re-fetching categories on every language change is wasteful;
  // labels come from API category data, not from the i18n translation function.
  /* eslint-disable react-hooks/exhaustive-deps */
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
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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
  }, [searchParams, t]);

  const timelineString = `${formData.timelineValue || '1'} ${formData.timelineUnit || 'weeks'}`;

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(formData.categoryId))?.name || '';

  const toggleSkill = useCallback((skillKey: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skillKey) ? prev.filter((s) => s !== skillKey) : [...prev, skillKey]
    );
  }, []);

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Prefill the form from a quick-start template. Everything stays editable, and
  // the category is auto-matched to the live list on a best-effort basis.
  const applyTemplate = useCallback(
    (tpl: RequestTemplate) => {
      const matched = categories.find((c) =>
        tpl.categoryKeywords.some((kw) => (c.name || '').toLowerCase().includes(kw.toLowerCase()))
      );
      setFormData((prev) => ({
        ...prev,
        title: isRTL ? tpl.titleAr : tpl.titleEn,
        description: isRTL ? tpl.descAr : tpl.descEn,
        categoryId: matched ? String(matched.id) : prev.categoryId,
        budget: { ...prev.budget, min: tpl.budget.min, max: tpl.budget.max },
        timelineValue: tpl.timelineValue,
        timelineUnit: tpl.timelineUnit,
        timeline: `${tpl.timelineValue} ${tpl.timelineUnit}`,
      }));
      setRequiredSkills(tpl.skills);
      setValidationErrors({});
      setActiveTemplate(tpl.key);
    },
    [categories, isRTL]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
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
      <div className="min-h-screen bg-canvas flex flex-col">
        <div className="bg-indigo-950 text-white py-4 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-amber-400 text-xs uppercase tracking-[0.18em] font-semibold">
              {t('openSouk.eyebrow', 'OPEN SOUK')}
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="max-w-md w-full bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden text-center"
          >
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-indigo-600 w-full" />

            <div className="p-8 sm:p-10">
              <div className="w-16 h-16 rounded-full bg-emerald-50 ring-2 ring-emerald-200 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={30} className="text-emerald-600" />
              </div>

              <h2
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('community.success_title', 'Your request is live!')}
              </h2>

              <p className="text-sm text-gray-600 mb-7 leading-relaxed">
                {t(
                  'community.success_body',
                  'Artisans can now see and respond to your request. You will be notified when proposals arrive.'
                )}
              </p>

              <div className="flex items-center justify-center gap-2 mb-7">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  {t('community.status_open', 'Open for proposals')}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {submittedPostId && (
                  <Link
                    href={`/community/posts/${submittedPostId}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-full transition-colors duration-200"
                  >
                    {t('community.view_request', 'View my request')}
                    <ChevronRight size={15} />
                  </Link>
                )}
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-white ring-1 ring-gray-200 hover:ring-gray-300 text-gray-700 text-sm font-semibold rounded-full transition-colors duration-200"
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
    <div className="min-h-screen bg-canvas">
      {/* Editorial Hero Band */}
      <section className="bg-indigo-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft size={15} />
            {t('common.back_to', 'Back to')} {t('openSouk.brand', 'Open Souk')}
          </Link>
          <p className="text-amber-400 text-[10px] uppercase tracking-[0.2em] font-semibold mb-2">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('community.create_request', 'Post a Bespoke Request')}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={10} className="shrink-0" />
              {t('ai.chip.suggestedMeasurements', 'AI suggested measurements')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={10} className="shrink-0" />
              {t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 items-start">
          {/* ── FORM COLUMN ─────────────────────────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden shadow-sm">

              {/* Form header */}
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">
                      {user?.full_name_en?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {t('community.what_is_custom_request', 'What is your custom request?')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('community.create_request_subtitle', 'Describe what you need — artisans will respond with proposals')}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="divide-y divide-gray-100">

                {/* ── SECTION: Quick-start templates ───────────────────── */}
                <section className="px-6 py-6 bg-gradient-to-br from-indigo-50/60 to-amber-50/40">
                  <SectionHeading
                    icon={<Sparkles size={14} />}
                    title={t('community.templates_title', 'Start from a template')}
                    subtitle={t('community.templates_hint', 'Tap one to prefill the form — then edit anything you like')}
                  />
                  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {REQUEST_TEMPLATES.map((tpl) => {
                      const active = activeTemplate === tpl.key;
                      return (
                        <button
                          type="button"
                          key={tpl.key}
                          onClick={() => applyTemplate(tpl)}
                          className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                            active
                              ? 'bg-indigo-700 text-white ring-1 ring-indigo-700'
                              : 'bg-white text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-50 hover:ring-indigo-300'
                          }`}
                        >
                          <span className="text-base leading-none">{tpl.emoji}</span>
                          {isRTL ? tpl.titleAr : tpl.titleEn}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── SECTION: Reference Photos ────────────────────────── */}
                <section className="px-6 py-6">
                  <SectionHeading
                    icon={<ImageIcon size={14} />}
                    title={t('community.section_photos', 'Reference Photos')}
                    subtitle={t('community.photos_help', 'Photos help artisans understand your vision — adds 3× more bids')}
                  />

                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={[
                      'relative cursor-pointer flex flex-col justify-center items-center p-8 border-2 border-dashed rounded-2xl transition-all duration-200',
                      isDragActive
                        ? 'border-indigo-400 bg-indigo-50'
                        : validationErrors.images
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/20',
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
                    <div className="mb-3 rounded-full bg-white ring-1 ring-gray-200 p-3 shadow-sm">
                      <ImageIcon
                        size={24}
                        className={isDragActive ? 'text-indigo-500' : 'text-amber-400'}
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">
                      {isDragActive
                        ? t('community.drag_photos_here', 'Drop photos here')
                        : t('community.drag_drop_images', 'Drag & drop photos here')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('community.or_click_to_select', 'or click to browse files')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 font-mono tracking-wide">
                      JPG · PNG · WEBP · max 5 MB
                    </p>
                  </div>

                  {validationErrors.images && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-700">
                      <AlertCircle size={12} className="shrink-0" />
                      {validationErrors.images}
                    </p>
                  )}

                  {previewImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-gray-400 mb-2.5">
                        {previewImages.length} {t('community.images_attached', 'image(s) attached')}
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {previewImages.map((src, i) => (
                          <div key={i} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={t('community.image_preview_alt', { index: i + 1 })}
                              className="w-full aspect-square object-cover rounded-xl ring-1 ring-gray-200"
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(i); }}
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

                {/* ── SECTION: Title & Description ─────────────────────── */}
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
                        validationErrors.title ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 bg-white hover:border-gray-300',
                      ].join(' ')}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      {validationErrors.title ? (
                        <p className="text-xs text-rose-700 flex items-center gap-1">
                          <AlertCircle size={11} className="shrink-0" />
                          {validationErrors.title}
                        </p>
                      ) : <span />}
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
                        validationErrors.description ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 bg-white hover:border-gray-300',
                      ].join(' ')}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      {validationErrors.description ? (
                        <p className="text-xs text-rose-700 flex items-center gap-1">
                          <AlertCircle size={11} className="shrink-0" />
                          {validationErrors.description}
                        </p>
                      ) : <span />}
                      <span className="text-[10px] text-gray-400 font-mono">
                        {formData.description.length}/2000
                      </span>
                    </div>
                  </div>
                </section>

                {/* ── SECTION: Category ────────────────────────────────── */}
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
                        validationErrors.categoryId ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 hover:border-gray-300',
                        loadingCategories ? 'opacity-60 cursor-wait' : '',
                      ].join(' ')}
                    >
                      <option value="">
                        {loadingCategories
                          ? t('common.loading', 'Loading…')
                          : t('community.select_category', 'اختار الصنف')}
                      </option>
                      {categories.map((category) => (
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

                {/* ── SECTION: Required Skills ─────────────────────────── */}
                <section className="px-6 py-6">
                  <SectionHeading
                    icon={<Wrench size={14} />}
                    title={t('community.skills_label', 'Required Skills')}
                    subtitle={t('community.skills_help', 'Tag the crafts you need — sellers with matching expertise will be highlighted')}
                  />

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

                {/* ── SECTION: Budget ──────────────────────────────────── */}
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

                {/* ── SECTION: Timeline ────────────────────────────────── */}
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

                {/* ── SECTION: Submit ──────────────────────────────────── */}
                <section className="px-6 py-6 bg-gray-50">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5 p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl flex items-start gap-2.5"
                      >
                        <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-700">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 text-center sm:text-start">
                      {t('community.sellers_will_contact', 'Artisans will respond to your request with proposals')}
                    </p>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-300 text-white rounded-full text-sm font-semibold transition-colors duration-200 shrink-0 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner className="h-4 w-4" />
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

          {/* ── PREVIEW COLUMN (lg+) ─────────────────────────────────── */}
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
