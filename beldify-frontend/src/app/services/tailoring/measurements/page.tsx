'use client';

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import MeasurementForm from '@/components/tailoring/MeasurementForm';
import toast from '@/utils/toast';

const MEASUREMENTS_STORAGE_KEY = 'beldify:tailoring:measurements';

export default function MeasurementsPage() {
  const { t } = useTranslation();

  // bug 11: the form's save/add-to-cart buttons were no-ops because the page passed
  // no handlers. Bind them: persist the measurement set locally (no save endpoint
  // exists yet) and confirm to the user.
  const handleSave = useCallback(
    (values: Record<string, string>, unit: string) => {
      try {
        const payload = { values, unit, savedAt: new Date().toISOString() };
        window.localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(payload));
        toast.success(t('tailoring.measurements.saved', 'Measurements saved'));
      } catch {
        toast.error(t('tailoring.measurements.saveError', 'Could not save measurements'));
      }
    },
    [t]
  );

  const handleAddToCart = useCallback(
    (values: Record<string, string>, unit: string) => {
      handleSave(values, unit);
      toast.success(t('tailoring.measurements.addedToCart', 'Measurements added to your order'));
    },
    [handleSave, t]
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Editorial hero strip — Atlas indigo-950 dark surface ── */}
      <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-14">
          {/* Breadcrumbs — direction driven by the i18n locale on <html> */}
          <nav
            aria-label={t('tailoring.measurements.breadcrumbLabel', 'Breadcrumb')}
            className="mb-6 text-sm text-indigo-200 flex flex-wrap items-center gap-1.5"
          >
            <Link href="/" className="hover:text-white transition-colors">
              {t('tailoring.measurements.breadcrumbHome', 'Home')}
            </Link>
            <span className="text-indigo-400" aria-hidden>/</span>
            <Link href="/services/tailoring" className="hover:text-white transition-colors">
              {t('tailoring.measurements.breadcrumbTailoring', 'Tailoring')}
            </Link>
            <span className="text-indigo-400" aria-hidden>/</span>
            <span className="text-white font-medium">
              {t('tailoring.measurements.breadcrumb', 'Measurements')}
            </span>
          </nav>

          {/* Page heading */}
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-3">
              {t('tailoring.measurements.eyebrow', 'BESPOKE FIT')}
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-balance"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('tailoring.measurements.title', 'Custom kaftan measurements')}
            </h1>
            <p className="mt-4 text-indigo-200 text-base sm:text-lg leading-relaxed">
              {t(
                'tailoring.measurements.subtitle',
                'Enter your measurements precisely for a perfect fit. Follow the visual guide for each measurement.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        {/* Wrapper card provides amber-200 border and rounded-2xl for page-level Atlas compliance */}
        <div className="rounded-2xl ring-1 ring-amber-200/40 bg-white/60 p-1 shadow-atlas-sm">
          <MeasurementForm onSave={handleSave} onAddToCart={handleAddToCart} />
        </div>
      </main>
    </div>
  );
}
