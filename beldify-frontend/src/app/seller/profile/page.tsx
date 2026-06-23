'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getStoreProfile,
  updateStoreProfile,
  StoreProfileData,
} from '@/services/sellerOnboardingService';
import toast from '@/utils/toast';
import {
  ArrowLeft,
  Upload,
  Store,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'block w-full rounded-2xl bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-150';

interface FormState {
  name: string;
  email: string;
  phone: string;
  description: string;
  address: string;
  city: string;
  country: string;
  shipping_policy: string;
  return_policy: string;
  logo: File | null;
  banner: File | null;
  logoPreview: string | null;
  bannerPreview: string | null;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  description: '',
  address: '',
  city: '',
  country: '',
  shipping_policy: '',
  return_policy: '',
  logo: null,
  banner: null,
  logoPreview: null,
  bannerPreview: null,
};

export default function SellerProfilePage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionPct, setCompletionPct] = useState<number | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); }, []);

  // Fetch profile on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    getStoreProfile()
      .then((res) => {
        const d: StoreProfileData = res.data;
        setForm((prev) => ({
          ...prev,
          name: d.name ?? '',
          email: d.contact_email ?? '',
          phone: d.contact_phone ?? '',
          description: d.description ?? '',
          address: d.address ?? '',
          city: d.store_locations?.[0]?.city ?? '',
          country: d.store_locations?.[0]?.country ?? '',
          shipping_policy: d.shipping_policy ?? '',
          return_policy: d.return_policy ?? '',
          logoPreview: d.store_logo ?? null,
          bannerPreview: d.store_banner ?? null,
        }));
        setCompletionPct(d.profile_completion_percentage ?? null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          router.replace('/seller/register');
        } else if (err?.response?.status === 403) {
          setSuspended(true);
        } else {
          setError(t('seller.profile.fetch_error', 'Could not load your profile.'));
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, router, t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field: 'logo' | 'banner') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      [field]: file,
      [`${field}Preview`]: previewUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await updateStoreProfile({
        name: form.name,
        email: form.email,
        description: form.description || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        logo: form.logo,
        banner: form.banner,
        store_location:
          form.city || form.country
            ? { city: form.city, country: form.country }
            : undefined,
        shipping_policy: form.shipping_policy || undefined,
        return_policy: form.return_policy || undefined,
      });
      const newPct = res.data?.profile_completion_percentage ?? null;
      setCompletionPct(newPct);
      toast.success(t('seller.profile.save_success', 'Profile saved!'));
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => router.push('/seller/onboarding'), 800);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setSuspended(true);
      } else if (err?.response?.status === 422) {
        const errors = err.response.data?.errors || {};
        const first = Object.values(errors)[0];
        const msg = Array.isArray(first) ? first[0] : (err.response.data?.message ?? null);
        setError(msg || t('seller.profile.validation_error', 'Please check your input.'));
      } else {
        setError(t('seller.profile.save_error', 'Failed to save. Please try again.'));
        toast.error(t('seller.profile.save_error', 'Failed to save. Please try again.'));
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
          <Store className="w-10 h-10 text-indigo-600 mb-6" aria-hidden="true" />
          <h1 className="text-xl font-bold text-gray-900 mb-3 font-heading">
            {t('seller.profile.login_title', 'Sign in to edit your profile')}
          </h1>
          <Link
            href="/login?redirect=/seller/profile"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors mt-4"
          >
            {t('seller.profile.sign_in', 'Sign in')}
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
          <h1 className="text-xl font-bold text-gray-900 mb-3 font-heading">
            {t('seller.profile.suspended_title', 'Your store is suspended')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('seller.profile.suspended_body', 'Please contact support to resolve this.')}
          </p>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-4 animate-pulse">
          <div className="h-8 bg-amber-100 rounded-2xl w-1/2" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-white rounded-2xl ring-1 ring-gray-200" />
          ))}
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
              {t('seller.profile.eyebrow', 'Store Profile')}
            </p>
            <h1 className="text-xl font-bold text-gray-900 font-heading">
              {t('seller.profile.title', 'Complete your profile')}
            </h1>
          </div>
          {completionPct !== null && (
            <span className="ms-auto text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-full px-3 py-1">
              {completionPct}%
            </span>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Store name */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('seller.profile.section_basic', 'Basic info')}
            </h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.store_name_label', 'Store name')}
                <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder={t('seller.profile.store_name_placeholder', 'Your store name')}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.contact_email_label', 'Contact email')}
                <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="contact@store.ma"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.contact_phone_label', 'Phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+212 6 00 00 00 00"
                className={inputClass}
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.description_label', 'Store description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder={t(
                  'seller.profile.description_placeholder',
                  'Tell buyers about your store and what makes it special...'
                )}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('seller.profile.section_location', 'Location')}
            </h2>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.address_label', 'Address')}
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder={t('seller.profile.address_placeholder', 'Street address')}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('seller.profile.city_label', 'City')}
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Fès"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('seller.profile.country_label', 'Country')}
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Morocco"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('seller.profile.section_images', 'Images')}
            </h2>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seller.profile.logo_label', 'Store logo')}
                <span className="text-gray-400 font-normal text-xs ms-1">
                  ({t('common.optional', 'optional')}, max 2 MB)
                </span>
              </label>
              {form.logoPreview && (
                <div className="mb-3 w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-gray-200">
                  <Image
                    src={form.logoPreview}
                    alt={t('seller.profile.logo_preview_alt', 'Store logo')}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <label
                htmlFor="logo"
                className="flex items-center gap-3 p-4 rounded-2xl ring-1 ring-dashed ring-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <Upload className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-gray-600">
                  {form.logo
                    ? form.logo.name
                    : t('seller.profile.logo_hint', 'JPG or PNG, max 2 MB')}
                </span>
                <input
                  ref={logoInputRef}
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleFileChange('logo')}
                />
              </label>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seller.profile.banner_label', 'Store banner')}
                <span className="text-gray-400 font-normal text-xs ms-1">
                  ({t('common.optional', 'optional')}, max 2 MB)
                </span>
              </label>
              {form.bannerPreview && (
                <div className="mb-3 h-24 rounded-2xl overflow-hidden ring-1 ring-gray-200">
                  <Image
                    src={form.bannerPreview}
                    alt={t('seller.profile.banner_preview_alt', 'Store banner')}
                    width={600}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <label
                htmlFor="banner"
                className="flex items-center gap-3 p-4 rounded-2xl ring-1 ring-dashed ring-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <Upload className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-gray-600">
                  {form.banner
                    ? form.banner.name
                    : t('seller.profile.banner_hint', 'Recommended 1440×400px')}
                </span>
                <input
                  ref={bannerInputRef}
                  type="file"
                  id="banner"
                  name="banner"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleFileChange('banner')}
                />
              </label>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('seller.profile.section_policies', 'Policies')}
            </h2>

            <div>
              <label htmlFor="shipping_policy" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.shipping_policy_label', 'Shipping policy')}
              </label>
              <textarea
                id="shipping_policy"
                name="shipping_policy"
                rows={3}
                value={form.shipping_policy}
                onChange={handleChange}
                placeholder={t('seller.profile.shipping_policy_placeholder', 'How do you ship? Estimated delivery time...')}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="return_policy" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.profile.return_policy_label', 'Return policy')}
              </label>
              <textarea
                id="return_policy"
                name="return_policy"
                rows={3}
                value={form.return_policy}
                onChange={handleChange}
                placeholder={t('seller.profile.return_policy_placeholder', 'What is your return and refund policy?')}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

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
                {t('seller.profile.saving', 'Saving...')}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                {t('seller.profile.save_cta', 'Save profile')}
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
