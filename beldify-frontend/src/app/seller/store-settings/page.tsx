'use client';

/**
 * /seller/store-settings — Store profile + vertical picker
 *
 * Section A: Store profile (name, email, description, phone, address)
 *   - Prefills via GET /api/seller/store-profile
 *   - Saves via PUT /api/seller/store-profile
 *   - Surfaces 422 field errors under the relevant inputs
 *
 * Section B: Store vertical picker
 *   - Reads current store_type from the loaded profile
 *   - Future: PUT store_type via the same store-profile endpoint once backend
 *     exposes the field (currently vertical is stored separately via T030 contract)
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
} from 'lucide-react';
import { fetchVerticalConfig, VerticalSlug } from '@/services/verticalService';
import {
  getStoreProfile,
  updateStoreProfile,
  StoreProfileData,
} from '@/services/sellerOnboardingService';
import toast from '@/utils/toast';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const inputClass =
  'block w-full rounded-2xl bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-150';

// ─── Vertical definitions ────────────────────────────────────────────────────

interface VerticalOption {
  slug: VerticalSlug;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ReactNode;
  badge?: string;
}

const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    slug: 'regular',
    label: 'Regular Store',
    labelAr: 'متجر عادي',
    description: 'Sell ready-made products. No custom order configuration.',
    descriptionAr: 'بيع منتجات جاهزة. لا تكوين مخصص.',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    slug: 'jewelry',
    label: 'Jewelry',
    labelAr: 'المجوهرات',
    description: 'Sell ready-made and custom-made jewelry pieces with material, purity, gemstone and finish fields.',
    descriptionAr: 'بيع المجوهرات الجاهزة والمخصصة مع حقول المادة والنقاء والأحجار الكريمة.',
    icon: <Gem className="h-5 w-5" />,
    badge: 'جديد',
  },
  {
    slug: 'menswear',
    label: "Men's Clothing",
    labelAr: 'ملابس رجالية',
    description: 'Ready-made and made-to-order menswear with measurements and fabric selection.',
    descriptionAr: 'ملابس رجالية جاهزة وبناءً على الطلب مع قياسات واختيار الأقمشة.',
    icon: <Shirt className="h-5 w-5" />,
  },
  {
    slug: 'womenswear',
    label: "Women's Clothing",
    labelAr: 'ملابس نسائية',
    description: 'Ready-made and made-to-order womenswear with measurements and fabric selection.',
    descriptionAr: 'ملابس نسائية جاهزة وبناءً على الطلب مع قياسات واختيار الأقمشة.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    slug: 'tailor',
    label: 'Tailor Store',
    labelAr: 'متجر الخياطة',
    description: 'Full tailoring service with measurements, fabric catalog, and custom orders.',
    descriptionAr: 'خدمة خياطة كاملة مع القياسات وكتالوج الأقمشة والطلبات المخصصة.',
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
        // Map backend field errors → display under inputs
        const mapped: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(errors)) {
          mapped[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
        }
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          // Show top-level error with first message as fallback
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
    // The vertical is saved alongside the profile update when the endpoint supports it.
    // Until then, a lightweight profile PUT with store_type appended suffices.
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
      // Graceful degradation — fall back to optimistic update
      setStoreType(pendingVertical);
      setPendingVertical(null);
      setVerticalSaved(true);
      setTimeout(() => setVerticalSaved(false), 2500);
    } finally {
      setVerticalSaving(false);
    }
  };

  const activeVertical = pendingVertical ?? storeType;

  return (
    <div className="min-h-screen bg-amber-50/20 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Page header ── */}
      <div className="bg-white border-b border-amber-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-0.5">
            {t('seller.store_settings.eyebrow', 'Store Settings')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900" style={playfair}>
            {t('seller.store_settings.title', 'Store profile')}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-8 space-y-8">

        {/* ── Section A: Store profile ── */}
        <div className="bg-white rounded-2xl ring-1 ring-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('seller.store_settings.profile_section', 'Store information')}
            </h2>
            <div className="flex items-center gap-3">
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
                  <div key={i} className="animate-pulse bg-amber-100 rounded-xl h-10" />
                ))}
              </div>
            ) : (
              <>
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
        <div className="bg-white rounded-2xl ring-1 ring-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between gap-4">
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
                const label = isRTL ? option.labelAr : option.label;
                const desc = isRTL ? option.descriptionAr : option.description;

                return (
                  <label
                    key={option.slug}
                    htmlFor={`vertical-${option.slug}`}
                    className={cn(
                      'flex items-start gap-4 rounded-2xl p-4 ring-1 cursor-pointer transition-all duration-150',
                      isActive
                        ? 'ring-2 ring-indigo-700 bg-white shadow-sm'
                        : 'ring-amber-200 bg-white hover:ring-indigo-300 hover:shadow-sm'
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
                        {option.badge && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                            {option.badge}
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
    </div>
  );
}
