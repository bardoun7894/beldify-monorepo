'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getOnboardingStatus,
  OnboardingStatusData,
} from '@/services/sellerOnboardingService';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Store,
  Package,
  AlertCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellerOnboardingPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [status, setStatus] = useState<OnboardingStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    getOnboardingStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setError(t('seller.onboarding.fetch_error', 'Could not load onboarding status.')))
      .finally(() => setLoading(false));
  }, [isAuthenticated, t]);

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 ring-2 ring-indigo-200 flex items-center justify-center mb-6">
            <Store className="w-8 h-8 text-indigo-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 font-heading">
            {t('seller.onboarding.login_title', 'Sign in to view your seller journey')}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {t('seller.onboarding.login_body', 'You need to be signed in to access the seller onboarding dashboard.')}
          </p>
          <Link
            href="/login?redirect=/seller/onboarding"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors"
          >
            {t('seller.onboarding.sign_in', 'Sign in')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-4 animate-pulse">
          <div className="h-8 bg-amber-100 rounded-2xl w-2/3" />
          <div className="h-4 bg-amber-100 rounded-2xl w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl ring-1 ring-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !status) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm">
            {error || t('seller.onboarding.unknown_error', 'An unknown error occurred.')}
          </div>
        </div>
      </div>
    );
  }

  // ── Not started — redirect to register ───────────────────────────────────
  if (status.store_status === 'not_started') {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 ring-2 ring-amber-200 flex items-center justify-center mb-6">
            <Store className="w-8 h-8 text-amber-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 font-heading">
            {t('seller.onboarding.not_started_title', "You haven't applied yet")}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {t('seller.onboarding.not_started_body', 'Apply to become a seller on Beldify and start your journey.')}
          </p>
          <Link
            href="/seller/register"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors"
          >
            {t('seller.onboarding.apply_cta', 'Apply to sell')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-2">
            {t('seller.onboarding.eyebrow', 'Seller Journey')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">
            {t('seller.onboarding.title', 'Your Seller Onboarding')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('seller.onboarding.subtitle', 'Track your progress and complete each step to go live.')}
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Approval status banner */}
        <StatusBanner status={status} t={t as (key: string, fallback?: string) => string} />

        {/* Progress bar */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              {t('seller.onboarding.overall_progress', 'Overall progress')}
            </span>
            <span className="text-sm font-semibold text-indigo-700 tabular-nums">
              {status.overall_percentage}%
            </span>
          </div>
          <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
            <div
              role="progressbar"
              aria-valuenow={status.overall_percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-full bg-indigo-700 rounded-full transition-all duration-500"
              style={{ width: `${status.overall_percentage}%` }}
            />
          </div>

          {/* Inline stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {t('seller.onboarding.profile_pct', 'Profile')}
              </p>
              <p className="text-base font-semibold text-gray-800 tabular-nums">
                {status.profile_completion_percentage}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {t('seller.onboarding.products_count', 'Products')}
              </p>
              <p className="text-base font-semibold text-gray-800 tabular-nums">
                {status.products_count}
              </p>
            </div>
          </div>
        </div>

        {/* Step checklist */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm divide-y divide-gray-100">
          {status.steps.map((step, i) => {
            const isDone = step.status === 'done';
            // Determine CTA for actionable steps
            let ctaHref: string | null = null;
            if (!isDone) {
              if (step.key === 'profile_complete') ctaHref = '/seller/profile';
              if (step.key === 'first_product') ctaHref = '/seller/products/new';
            }

            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-center gap-4 px-6 py-4',
                  i === 0 && 'rounded-t-2xl',
                  i === status.steps.length - 1 && 'rounded-b-2xl'
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle
                      className="w-6 h-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="w-6 h-6 text-amber-300"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isDone ? 'text-gray-500 line-through' : 'text-gray-800'
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {/* CTA */}
                {ctaHref && (
                  <Link
                    href={ctaHref}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {step.key === 'profile_complete'
                      ? t('seller.onboarding.complete_profile_cta', 'Complete profile')
                      : t('seller.onboarding.add_product_cta', 'Add product')}
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ── Status banner ─────────────────────────────────────────────────────────────

function StatusBanner({
  status,
  t,
}: {
  status: OnboardingStatusData;
  t: (key: string, fallback?: string) => string;
}) {
  if (status.store_status === 'active') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200"
      >
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            {t('seller.onboarding.status_active_title', 'Your store is approved and live!')}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {t('seller.onboarding.status_active_body', 'Buyers can discover and purchase your products.')}
          </p>
        </div>
      </div>
    );
  }

  if (status.store_status === 'suspended') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200"
      >
        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-rose-800">
            {t('seller.onboarding.status_suspended_title', 'Your store has been suspended')}
          </p>
          <p className="text-xs text-rose-600 mt-0.5">
            {t('seller.onboarding.status_suspended_body', 'Please contact support to resolve this.')}
          </p>
        </div>
      </div>
    );
  }

  // pending (default)
  return (
    <div
      role="status"
      className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200"
    >
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {t('seller.onboarding.status_pending_title', 'Application under review')}
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          {status.needs_details
            ? t(
                'seller.onboarding.status_needs_details',
                'Please complete your profile to speed up the review.'
              )
            : t(
                'seller.onboarding.status_pending_body',
                'We will notify you once a decision has been made.'
              )}
        </p>
      </div>
    </div>
  );
}
