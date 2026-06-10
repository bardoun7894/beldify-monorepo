'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { submitStoreRequest, StoreRequestPayload } from '@/services/sellerService';
import {
  Store,
  ArrowRight,
  CheckCircle,
  Upload,
  ExternalLink,
  ShieldCheck,
  Star,
  Globe,
} from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// Map business_type strings to backend store_type_id values
const BUSINESS_TYPE_TO_STORE_TYPE: Record<string, number> = {
  individual: 1,
  company: 2,
  cooperative: 3,
};

const COUNTRIES = [
  { code: 'MA', name: 'Morocco' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

interface FormState {
  store_name: string;
  business_type: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  logo: File | null;
}

const initialForm: FormState = {
  store_name: '',
  business_type: '',
  country: 'MA',
  contact_email: '',
  contact_phone: '',
  description: '',
  logo: null,
};

// ── Seller dashboard entry URL ────────────────────────────────────────────────
// GET /seller/enter is a Blade web route (not under /api).
// It logs the user into the web guard via Sanctum cookie and redirects to
// /seller/dashboard. We use window.location.href so the browser performs a
// full-page navigation — the session cookie is set by the redirect response.
const SELLER_ENTER_URL = `${process.env.NEXT_PUBLIC_API_URL}/seller/enter`;

export default function SellerRegisterPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputClass =
    'block w-full rounded-2xl bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-150';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, logo: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.business_type) {
      setErrorMsg(t('seller.register.validation_business_type', 'Please select a business type'));
      return;
    }
    if (!form.country) {
      setErrorMsg(t('seller.register.validation_country', 'Please select a country'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: StoreRequestPayload = {
        store_type_id: BUSINESS_TYPE_TO_STORE_TYPE[form.business_type] ?? 1,
        business_type: form.business_type,
        country: form.country,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
        description: form.description || undefined,
        ...(form.logo ? { logo: form.logo } : {}),
      };

      const result = await submitStoreRequest(payload);
      if (result.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(result.message || t('seller.register.error_generic', 'Something went wrong. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = SELLER_ENTER_URL;
  };

  // ── Unauthenticated state — prompt to log in ──────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-indigo-50 ring-2 ring-indigo-200 flex items-center justify-center mb-8 shadow-atlas-sm">
            <Store className="w-9 h-9 text-indigo-700" aria-hidden="true" />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance"
            style={playfair}
          >
            {t('seller.register.login_prompt_title', 'Sign in to continue')}
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
            {t(
              'seller.register.login_prompt_body',
              'You need an account to apply as a seller. Sign in or create a free account first.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?redirect=/seller/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
            >
              {t('seller.register.login_cta', 'Sign in')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link
              href="/register?redirect=/seller/register"
              className="inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-gray-800 ring-1 ring-amber-200 rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400/50"
            >
              {t('seller.register.register_cta', 'Create account')}
            </Link>
          </div>
        </div>

        <BenefitsStrip t={t} />
      </div>
    );
  }

  // ── Pending/submitted state ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 ring-4 ring-indigo-100 flex items-center justify-center mb-8">
            <CheckCircle className="w-10 h-10 text-indigo-700" strokeWidth={1.5} aria-hidden="true" />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance"
            style={playfair}
          >
            {t('seller.register.pending_title', 'Application received!')}
          </h1>
          <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
            {t(
              'seller.register.pending_body',
              'Your store application is under review. We will notify you by email within 3–5 business days once a decision is made.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/seller/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
            >
              {t('seller.register.track_application_cta', 'Track your application')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-gray-800 ring-1 ring-amber-200 rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400/50"
            >
              {t('seller.register.pending_cta', 'Back to home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated — already a seller (user has seller role) ──────────────
  const isSeller = user?.role === 'seller' || (user as any)?.is_seller === true;
  if (isAuthenticated && isSeller) {
    return (
      <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 ring-2 ring-amber-200 flex items-center justify-center mb-8 shadow-atlas-sm">
            <Store className="w-9 h-9 text-amber-600" aria-hidden="true" />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance"
            style={playfair}
          >
            {t('seller.register.already_seller_title', 'You already have a seller account')}
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
            {t(
              'seller.register.already_seller_body',
              'Access your seller dashboard to manage products, orders, and earnings.'
            )}
          </p>

          {/* Go to seller dashboard — full-page navigation via window.location.href */}
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
          >
            {t('seller.register.dashboard_cta', 'Go to seller dashboard')}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // ── Authenticated — show onboarding form ─────────────────────────────────
  return (
    <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero header */}
      <div className="bg-indigo-950 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, hsl(var(--amber-500)) 0, transparent 45%), radial-gradient(circle at 80% 60%, hsl(var(--indigo-500)) 0, transparent 50%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-4">
            {t('seller.register.title', 'Become a Seller')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-balance" style={playfair}>
            {t('seller.register.subtitle', 'Apply to join Beldify and sell your Moroccan crafts to buyers worldwide.')}
          </h1>
        </div>
      </div>

      {/* Form container */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-8 shadow-atlas-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6" style={playfair}>
            {t('seller.register.form_title', 'Tell us about your store')}
          </h2>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700" role="alert">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Store name */}
            <div>
              <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.store_name_label', 'Store name')}
              </label>
              <input
                type="text"
                id="store_name"
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                placeholder={t('seller.register.store_name_placeholder', 'Your atelier or business name')}
                className={inputClass}
              />
            </div>

            {/* Business type */}
            <div>
              <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.business_type_label', 'Business type')}
                <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
              </label>
              <select
                id="business_type"
                name="business_type"
                value={form.business_type}
                onChange={handleChange}
                required
                className={`${inputClass} appearance-none`}
              >
                <option value="">{t('common.select_option', 'Select an option')}</option>
                <option value="individual">{t('seller.register.business_type_individual', 'Individual / Freelancer')}</option>
                <option value="company">{t('seller.register.business_type_company', 'Registered company')}</option>
                <option value="cooperative">{t('seller.register.business_type_cooperative', 'Cooperative')}</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.country_label', 'Country')}
                <span className="text-rose-500 ms-1" aria-hidden="true">*</span>
              </label>
              <select
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                required
                className={`${inputClass} appearance-none`}
              >
                <option value="">{t('common.select_option', 'Select an option')}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {t(`countries.${c.code}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact email */}
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.contact_email_label', 'Contact email')}
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder={t('seller.register.contact_email_placeholder', 'contact@yourbusiness.com')}
                className={inputClass}
                autoComplete="email"
              />
            </div>

            {/* Contact phone */}
            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.contact_phone_label', 'Contact phone')}
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                placeholder={t('seller.register.contact_phone_placeholder', '+212 6 00 00 00 00')}
                className={inputClass}
                autoComplete="tel"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.description_label', 'About your store')}
                <span className="text-gray-400 font-normal text-xs ms-1">
                  ({t('common.optional', 'optional')})
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder={t(
                  'seller.register.description_placeholder',
                  'Describe your products, craftsmanship, and what makes your store unique...'
                )}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('seller.register.logo_label', 'Store logo')}
                <span className="text-gray-400 font-normal text-xs ms-1">
                  ({t('common.optional', 'optional')})
                </span>
              </label>
              <label
                htmlFor="logo"
                className="flex items-center gap-3 p-4 rounded-2xl ring-1 ring-dashed ring-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors duration-150"
              >
                <Upload className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-gray-600">
                  {form.logo
                    ? form.logo.name
                    : t('seller.register.logo_hint', 'JPG or PNG, max 2 MB')}
                </span>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={handleLogoChange}
                />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 text-sm font-semibold transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
            >
              {isSubmitting ? (
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
                  {t('seller.register.submitting', 'Submitting...')}
                </>
              ) : (
                <>
                  {t('seller.register.submit_cta', 'Apply to sell')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dashboard entry — only shown to users who already have a seller account */}
        {isSeller && (
          <div className="mt-6 bg-white rounded-2xl ring-1 ring-gray-200 p-6 shadow-atlas-sm text-center">
            <p className="text-sm text-gray-600 mb-3">
              {t('seller.register.already_seller_body', 'Access your seller dashboard to manage products, orders, and earnings.')}
            </p>
            <button
              onClick={handleGoToDashboard}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
              data-testid="seller-dashboard-entry"
            >
              {t('seller.register.dashboard_cta', 'Go to seller dashboard')}
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </main>

      <BenefitsStrip t={t} />
    </div>
  );
}

// ── Benefits strip ────────────────────────────────────────────────────────────
function BenefitsStrip({ t }: { t: (k: string, fb: string) => string }) {
  const items = [
    {
      icon: <Globe className="w-6 h-6 text-amber-500" aria-hidden="true" />,
      label: t('seller.register.benefit_global', 'Global reach — sell to buyers worldwide'),
    },
    {
      icon: <Star className="w-6 h-6 text-amber-500" aria-hidden="true" />,
      label: t('seller.register.benefit_quality', 'Curated platform for Moroccan craftsmanship'),
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-500" aria-hidden="true" />,
      label: t('seller.register.benefit_secure', 'Secure payments and buyer protection'),
    },
  ];

  return (
    <section className="bg-gray-50 border-t border-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 flex-shrink-0">
              {icon}
            </div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
