'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import MeasurementForm from '@/components/tailoring/MeasurementForm';

export default function MeasurementsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-amber-50/40">
      {/* ── Editorial hero strip — Atlas indigo pattern ── */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#3b3b6d_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-14">
          {/* Breadcrumbs */}
          <nav
            dir="rtl"
            aria-label={t('tailoring.measurements.breadcrumbLabel', 'مسار التنقل')}
            className="mb-6 text-sm text-indigo-300 flex flex-wrap items-center gap-1.5"
          >
            <Link
              href="/"
              className="hover:text-white transition-colors"
            >
              {t('tailoring.measurements.breadcrumbHome', 'الرئيسية')}
            </Link>
            <span className="text-indigo-500" aria-hidden>/</span>
            <Link
              href="/services/tailoring"
              className="hover:text-white transition-colors"
            >
              {t('tailoring.measurements.breadcrumbTailoring', 'التفصيل')}
            </Link>
            <span className="text-indigo-500" aria-hidden>/</span>
            <span className="text-white font-medium">
              {t('tailoring.measurements.breadcrumb', 'أخذ المقاسات')}
            </span>
          </nav>

          {/* Page heading */}
          <div dir="rtl" className="text-right max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-3">
              {t('tailoring.measurements.eyebrow', 'مقاسات مخصصة')}
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: '"IBM Plex Sans Arabic", ui-sans-serif, sans-serif' }}
            >
              {t('tailoring.measurements.title', 'تفصيل القفطان المخصص')}
            </h1>
            <p className="mt-4 text-indigo-200 text-base sm:text-lg leading-relaxed">
              {t('tailoring.measurements.subtitle', 'أدخلي مقاساتك بدقة لضمان ملاءمة مثالية لقفطانك. يرجى اتباع الدليل المرئي لكل مقاس.')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        {/* Wrapper card provides amber-200 border and rounded-2xl for page-level Atlas compliance */}
        <div className="rounded-2xl ring-1 ring-amber-200/40 bg-white/60 p-1 shadow-[0px_4px_20px_rgba(37,37,85,0.05)]">
          <MeasurementForm />
        </div>
      </main>
    </div>
  );
}
