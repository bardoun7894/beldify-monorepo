'use client';

/**
 * /seller/store-settings — Store profile + vertical picker
 *
 * Section A: Store profile (name, email, description, phone, address)
 *   - Prefills via GET /api/seller/store-profile
 *   - Saves via PUT /api/seller/store-profile
 *   - Surfaces 422 field errors under the relevant inputs
 *   - AI "Generate with AI" button → store creator — fills description + shows extras
 *
 * Section B: Store vertical picker
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gem,
  Scissors,
  Shirt,
  ShoppingBag,
  Users,
  CheckCircle2,
  ChevronRight,
  Save,
  X,
  Copy,
} from 'lucide-react';
import { fetchVerticalConfig, VerticalSlug } from '@/services/verticalService';
import {
  getStoreProfile,
  updateStoreProfile,
  StoreProfileData,
} from '@/services/sellerOnboardingService';
import toast from '@/utils/toast';
import { cn } from '@/lib/utils';
import { AiGenerateButton } from '@/components/seller/AiGenerateButton';
import { InsufficientCreditsModal } from '@/components/seller/InsufficientCreditsModal';
import { getSellerCredits, FeatureCosts } from '@/services/sellerCreditService';
import {
  generateStoreProfile,
  StoreProfileResult,
  InsufficientCreditsError,
} from '@/services/sellerAiService';

const inputClass =
  'block w-full rounded-2xl bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-150';

// ─── Vertical definitions ────────────────────────────────────────────────────

interface VerticalOption {
  slug: VerticalSlug;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  icon: React.ReactNode;
  badgeKey?: string;
  badgeFallback?: string;
}

const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    slug: 'regular',
    labelKey: 'seller.store_settings.verticals.regular',
    labelFallback: 'Regular Store',
    descKey: 'seller.store_settings.verticals.regular_desc',
    descFallback: 'Sell ready-made products. No custom order configuration.',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    slug: 'jewelry',
    labelKey: 'seller.store_settings.verticals.jewelry',
    labelFallback: 'Jewelry',
    descKey: 'seller.store_settings.verticals.jewelry_desc',
    descFallback: 'Sell ready-made and custom-made jewelry pieces with material, purity, gemstone and finish fields.',
    icon: <Gem className="h-5 w-5" />,
    badgeKey: 'seller.store_settings.verticals.new_badge',
    badgeFallback: 'New',
  },
  {
    slug: 'menswear',
    labelKey: 'seller.store_settings.verticals.menswear',
    labelFallback: "Men's Clothing",
    descKey: 'seller.store_settings.verticals.menswear_desc',
    descFallback: 'Ready-made and made-to-order menswear with measurements and fabric selection.',
    icon: <Shirt className="h-5 w-5" />,
  },
  {
    slug: 'womenswear',
    labelKey: 'seller.store_settings.verticals.womenswear',
    labelFallback: "Women's Clothing",
    descKey: 'seller.store_settings.verticals.womenswear_desc',
    descFallback: 'Ready-made and made-to-order womenswear with measurements and fabric selection.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    slug: 'tailor',
    labelKey: 'seller.store_settings.verticals.tailor',
    labelFallback: 'Tailor Store',
    descKey: 'seller.store_settings.verticals.tailor_desc',
    descFallback: 'Full tailoring service with measurements, fabric catalog, and custom orders.',
    icon: <Scissors className="h-5 w-5" />,
  },
];

// ─── Profile form state ───────────────────────────────────────────────────────

interface ProfileForm {
  name: string;
  email: string;
  description: string;
  phone: string;
  address: string;
}

const emptyProfile: ProfileForm = {
  name: '',
  email: '',
  description: '',
  phone: '',
  address: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function StoreSettingsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Vertical state ────────────────────────────────────────────────────────
  const [storeType, setStoreType] = useState<VerticalSlug>('regular');
  const [pendingVertical, setPendingVertical] = useState<VerticalSlug | null>(null);
  const [configPreview, setConfigPreview] = useState<string[]>([]);
  const [verticalSaving, setVerticalSaving] = useState(false);
  const [verticalSaved, setVerticalSaved] = useState(false);

  // ── AI state ──────────────────────────────────────────────────────────────
  const [costs, setCosts] = useState<FeatureCosts | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<StoreProfileResult | null>(null);

  // AI generation inputs
  const [aiWhatYouSell, setAiWhatYouSell] = useState('');
  const [aiCity, setAiCity] = useState('');
  const [aiStyle, setAiStyle] = useState('');

  // InsufficientCreditsModal state
  const [creditsModal, setCreditsModal] = useState<{
    open: boolean;
    cost?: number;
    balance?: number;
    feature?: string;
  }>({ open: false });

  // ── Load profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    getStoreProfile()
      .then((res) => {
        const d: StoreProfileData = res.data;
        setProfile({
          name: d.name ?? '',
          email: d.contact_email ?? '',
          description: d.description ?? '',
          phone: d.contact_phone ?? '',
          address: d.address ?? '',
        });
        // Sync vertical from profile if present
        if ((d as any).store_type) {
          setStoreType((d as any).store_type as VerticalSlug);
        }
      })
      .catch(() => {
        // Non-fatal — new store may have no profile yet; allow editing
      })
      .finally(() => setProfileLoading(false));
  }, []);

  // Fetch AI costs on mount
  useEffect(() => {
    getSellerCredits()
      .then((data) => setCosts(data.costs))
      .catch(() => {});
  }, []);

  // ── Fetch field preview when vertical selected ────────────────────────────
  useEffect(() => {
    if (!pendingVertical) return;
    fetchVerticalConfig(pendingVertical).then(config => {
      setConfigPreview(config.fields.map(f => f.label));
    });
  }, [pendingVertical]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleProfileSave = async () => {
    setProfileError(null);
    setFieldErrors({});
    setProfileSaving(true);
    try {
      await updateStoreProfile({
        name: profile.name,
        email: profile.email,
        description: profile.description || undefined,
        phone: profile.phone || undefined,
        address: profile.address || undefined,
      });
      setProfileSaved(true);
      toast.success(t('seller.store_settings.profile_saved', 'Store profile saved!'));
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      if (err?.response?.status === 422) {
        const errors = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(errors)) {
          mapped[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
        }
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          const firstMsg = Object.values(mapped)[0];
          setProfileError(firstMsg);
        } else {
          setProfileError(
            err.response.data?.message ?? t('seller.store_settings.validation_error', 'Please check your input.')
          );
        }
      } else {
        setProfileError(
          t('seller.store_settings.save_error', 'Failed to save profile. Please try again.')
        );
        toast.error(t('seller.store_settings.save_error', 'Failed to save profile. Please try again.'));
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVerticalSelect = (slug: VerticalSlug) => {
    setPendingVertical(slug);
    setConfigPreview([]);
  };

  const handleVerticalSave = async () => {
    if (!pendingVertical) return;
    setVerticalSaving(true);
    try {
      await updateStoreProfile({
        name: profile.name || 'My Store',
        email: profile.email || '',
        ...({ store_type: pendingVertical } as any),
      });
      setStoreType(pendingVertical);
      setPendingVertical(null);
      setVerticalSaved(true);
      toast.success(t('seller.store_settings.vertical_saved', 'Store type updated!'));
      setTimeout(() => setVerticalSaved(false), 2500);
    } catch {
      toast.error(t('seller.store_settings.vertical_save_error', 'Failed to update store type. Please try again.'));
    } finally {
      setVerticalSaving(false);
    }
  };

  // ── AI handlers ───────────────────────────────────────────────────────────

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    setAiResult(null);
    try {
      const res = await generateStoreProfile({
        what_you_sell: aiWhatYouSell || profile.description || profile.name || 'handmade products',
        city: aiCity || undefined,
        style: aiStyle || undefined,
        locale: (i18n.language as any) || 'en',
      });
      setAiResult(res.result);
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

  const applyDescription = (text: string) => {
    setProfile(prev => ({ ...prev, description: text }));
    toast.success(t('ai.applied', 'Applied to store description.'));
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('ai.copied', 'Copied!'));
    } catch {
      toast.error(t('ai.copy_failed', 'Could not copy to clipboard.'));
    }
  };

  const activeVertical = pendingVertical ?? storeType;

  return (
    <div className="min-h-screen bg-background pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-0.5">
            {t('seller.store_settings.eyebrow', 'Store Settings')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">
            {t('seller.store_settings.title', 'Store profile')}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-8 space-y-8">

        {/* ── Section A: Store profile ── */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('seller.store_settings.profile_section', 'Store information')}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <AiGenerateButton
                label={t('ai.generate_store', 'Generate with AI')}
                cost={costs?.store_creator ?? 2}
                onClick={handleAiGenerate}
                loading={aiGenerating}
              />
              {profileSaved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {t('seller.store_settings.saved', 'Saved')}
                </span>
              )}
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={profileSaving || profileLoading}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                  profileSaving || profileLoading
                    ? 'bg-indigo-400 text-white cursor-wait'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
                )}
              >
                <Save className="h-4 w-4" aria-hidden />
                {profileSaving
                  ? t('seller.store_settings.saving', 'Saving…')
                  : t('seller.store_settings.save_cta', 'Save')}
              </button>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            {profileError && (
              <div className="p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700" role="alert">
                {profileError}
              </div>
            )}

            {profileLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-10" />
                ))}
              </div>
            ) : (
              <>
                {/* AI generation inputs — shown as inline panel */}
                <div className="rounded-2xl bg-indigo-50/70 ring-1 ring-indigo-200 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-medium">
                    {t('ai.store_gen_section', 'AI generation inputs (optional)')}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="ai-what-you-sell">
                        {t('ai.what_you_sell', 'What do you sell?')}
                      </label>
                      <input
                        id="ai-what-you-sell"
                        type="text"
                        value={aiWhatYouSell}
                        onChange={(e) => setAiWhatYouSell(e.target.value)}
                        placeholder={t('ai.what_you_sell_placeholder', 'e.g. handmade jewelry')}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="ai-city">
                        {t('ai.city', 'City')}
                      </label>
                      <input
                        id="ai-city"
                        type="text"
                        value={aiCity}
                        onChange={(e) => setAiCity(e.target.value)}
                        placeholder={t('ai.city_placeholder', 'e.g. Marrakech')}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="ai-style">
                        {t('ai.style', 'Style')}
                      </label>
                      <input
                        id="ai-style"
                        type="text"
                        value={aiStyle}
                        onChange={(e) => setAiStyle(e.target.value)}
                        placeholder={t('ai.style_placeholder', 'e.g. traditional')}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* AI results panel */}
                {aiResult && (
                  <div className="rounded-2xl bg-white ring-1 ring-indigo-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-semibold">
                        {t('ai.store_results_title', 'AI generated store content')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAiResult(null)}
                        aria-label={t('common.dismiss', 'Dismiss')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Name ideas */}
                    {aiResult.name_ideas?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          {t('ai.name_ideas', 'Name ideas')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.name_ideas.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => copyText(name)}
                              aria-label={t('ai.copy_name', 'Copy {{name}}', { name })}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 ring-1 ring-indigo-200 px-3 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-100 transition-colors"
                            >
                              <Copy className="w-3 h-3" aria-hidden="true" />
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Slogan */}
                    {aiResult.slogan && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-gray-700">
                            {t('ai.slogan', 'Slogan')}
                          </p>
                          <button
                            type="button"
                            onClick={() => copyText(aiResult.slogan)}
                            aria-label={t('ai.copy_slogan', 'Copy slogan')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            {t('common.copy', 'Copy')}
                          </button>
                        </div>
                        <p className="text-sm text-gray-800 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-3 py-2 italic">
                          {aiResult.slogan}
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    {aiResult.description && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-gray-700">
                            {t('ai.description', 'Description')}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => applyDescription(aiResult.description)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              {t('ai.apply', 'Apply')}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyText(aiResult.description)}
                              aria-label={t('ai.copy_description', 'Copy description')}
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              {t('common.copy', 'Copy')}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-3 py-2">
                          {aiResult.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Store name */}
                <div>
                  <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.store_settings.name_label', 'Store name')}
                    <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="store-name"
                    name="name"
                    type="text"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder={t('seller.store_settings.name_placeholder', 'e.g. Atlas Bijoux')}
                    className={cn(inputClass, fieldErrors.name ? 'ring-rose-300 focus:ring-rose-400/40' : '')}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Contact email */}
                <div>
                  <label htmlFor="store-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.store_settings.email_label', 'Contact email')}
                  </label>
                  <input
                    id="store-email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="store@example.com"
                    className={cn(inputClass, fieldErrors.email ? 'ring-rose-300 focus:ring-rose-400/40' : '')}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="store-description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.store_settings.description_label', 'Store description')}
                    <span className="text-gray-400 font-normal text-xs ms-1">
                      ({t('common.optional', 'optional')})
                    </span>
                  </label>
                  <textarea
                    id="store-description"
                    name="description"
                    rows={3}
                    value={profile.description}
                    onChange={handleProfileChange}
                    placeholder={t('seller.store_settings.description_placeholder', 'Tell buyers about your store...')}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="store-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.store_settings.phone_label', 'Phone number')}
                    <span className="text-gray-400 font-normal text-xs ms-1">
                      ({t('common.optional', 'optional')})
                    </span>
                  </label>
                  <input
                    id="store-phone"
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="+212 6xx-xxxxxx"
                    className={inputClass}
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="store-address" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('seller.store_settings.address_label', 'Address')}
                    <span className="text-gray-400 font-normal text-xs ms-1">
                      ({t('common.optional', 'optional')})
                    </span>
                  </label>
                  <input
                    id="store-address"
                    name="address"
                    type="text"
                    value={profile.address}
                    onChange={handleProfileChange}
                    placeholder={t('seller.store_settings.address_placeholder', 'Street, city, country')}
                    className={inputClass}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Section B: Vertical picker ── */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {t('seller.store_settings.vertical_section', 'Store type')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t(
                  'seller.store_settings.vertical_hint',
                  'Determines fields shown in your product form and custom-order requests.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {verticalSaved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {t('seller.store_settings.saved', 'Saved')}
                </span>
              )}
              {pendingVertical && (
                <button
                  type="button"
                  onClick={handleVerticalSave}
                  disabled={verticalSaving}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                    verticalSaving
                      ? 'bg-indigo-400 text-white cursor-wait'
                      : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
                  )}
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {verticalSaving
                    ? t('seller.store_settings.saving', 'Saving…')
                    : t('seller.store_settings.save_cta', 'Save')}
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <fieldset className="space-y-3">
              <legend className="sr-only">
                {t('seller.store_settings.vertical_legend', 'Store vertical')}
              </legend>

              {VERTICAL_OPTIONS.map(option => {
                const isActive = activeVertical === option.slug;
                const label = t(option.labelKey, option.labelFallback);
                const desc = t(option.descKey, option.descFallback);

                return (
                  <label
                    key={option.slug}
                    htmlFor={`vertical-${option.slug}`}
                    className={cn(
                      'flex items-start gap-4 rounded-2xl p-4 ring-1 cursor-pointer transition-all duration-150',
                      isActive
                        ? 'ring-2 ring-indigo-700 bg-white shadow-sm'
                        : 'ring-gray-200 bg-white hover:ring-indigo-300 hover:shadow-sm'
                    )}
                  >
                    <input
                      type="radio"
                      id={`vertical-${option.slug}`}
                      name="store_type"
                      value={option.slug}
                      checked={isActive}
                      onChange={() => handleVerticalSelect(option.slug)}
                      className="sr-only"
                    />

                    <div
                      className={cn(
                        'mt-0.5 shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
                        isActive ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-700'
                      )}
                      aria-hidden
                    >
                      {option.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('font-semibold text-gray-900', isActive && 'text-indigo-700')}>
                          {label}
                        </span>
                        {option.badgeKey && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                            {t(option.badgeKey, option.badgeFallback ?? 'New')}
                          </span>
                        )}
                        {storeType === option.slug && !pendingVertical && (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">
                            {t('seller.store_settings.current_badge', 'Current')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 leading-snug">{desc}</p>
                    </div>

                    <ChevronRight
                      className={cn(
                        'mt-1 shrink-0 h-4 w-4 transition-colors rtl:rotate-180',
                        isActive ? 'text-indigo-700' : 'text-gray-300'
                      )}
                      aria-hidden
                    />
                  </label>
                );
              })}
            </fieldset>

            {/* Field preview */}
            {pendingVertical && configPreview.length > 0 && (
              <div className="mt-6 rounded-2xl bg-indigo-50/70 ring-1 ring-indigo-200 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-medium mb-3">
                  {t('seller.store_settings.fields_for_vertical', 'Fields for this vertical')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {configPreview.map(fieldLabel => (
                    <span
                      key={fieldLabel}
                      className="inline-flex items-center rounded-full bg-white ring-1 ring-indigo-200 px-3 py-1 text-xs font-medium text-indigo-800"
                    >
                      {fieldLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pendingVertical && configPreview.length === 0 && pendingVertical === 'regular' && (
              <div className="mt-6 rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-5">
                <p className="text-sm text-gray-500">
                  {t(
                    'seller.store_settings.regular_hint',
                    'Regular stores have no custom fields — ready-made products only.'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
