'use client';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function HeroContent() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-atelier.jpg"
            alt="Moroccan atelier"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-xl">
            {/* hero.eyebrow */}
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t('hero.eyebrow', 'Authentic Moroccan craftsmanship')}
            </span>

            {/* Bilingual etymology lockup — intentionally bilingual regardless of page locale (DESIGN.md §12) */}
            <div className="flex items-baseline gap-3 flex-wrap mb-4 mt-4" aria-label="Beldify — Beldi reimagined">
              <span dir="rtl" lang="ar" className="font-arabic text-3xl font-semibold text-gray-900 leading-tight">
                بلدي
              </span>
              <span className="text-amber-400 text-2xl select-none" aria-hidden="true">×</span>
              <span
                dir="ltr"
                lang="en"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                className="text-3xl font-bold text-indigo-700 italic leading-tight"
              >
                ify
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('brand.etymologySubtitle', 'beldi (بلدي) — local, artisan, of the country')}
            </p>

            {/* hero.headline */}
            <h1
              className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-serif font-bold leading-[1.05] tracking-tight text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('hero.headline', 'Worn for centuries.')}
              <span className="block text-indigo-700">{t('hero.headlineAccent', 'Made for today.')}</span>
            </h1>
            {/* hero.body */}
            <p className="mt-5 text-lg leading-relaxed text-gray-700 max-w-lg">
              {t('hero.body', "Discover caftans, djellabas, and tailoring from Morocco’s finest ateliers — delivered worldwide.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {t('hero.ctaPrimary', 'Shop the marketplace')}
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 transition hover:bg-gray-50"
              >
                {t('hero.ctaGhost', 'Meet the tailors')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI personalisation chip shelf — rendered unconditionally on first ship */}
      {/* TODO: gate by browsing history signal once wired (hasHistory context/signal does not yet exist) */}
      <div className="mx-auto max-w-7xl px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200 animate-fade-in-up">
            <Sparkles size={12} className="shrink-0" />
            {t('hero.aiChip', 'AI styled for you')}
          </span>
        </div>
      </div>
    </>
  );
}
