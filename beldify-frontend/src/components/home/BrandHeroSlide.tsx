'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

/**
 * BrandHeroSlide — the existing brand hero section extracted verbatim from
 * HomeContent. Visually identical to the old inline hero. Used as slide 0 in
 * campaign carousel mode and as the standalone hero in brand mode.
 *
 * Compact heights: min-h-[38vh] mobile, lg:min-h-[45vh] desktop.
 * The outer <section> wrapper is omitted here so HeroSection can decide
 * whether to wrap in Swiper or directly in a <section>.
 */
export default function BrandHeroSlide() {
  const { t } = useTranslation();

  return (
    <div className="relative isolate overflow-hidden min-h-[38vh] lg:min-h-[45vh] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-atelier.jpg"
          alt="Moroccan atelier — artisan at work"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark indigo editorial overlay — directional gradient so the dark stop
            sits under the end-aligned copy. RTL override flips to gradient-to-r
            so the opaque end stays under the right-aligned Darija headline. */}
        <div className="absolute inset-0 bg-gradient-to-l from-indigo-950/90 via-indigo-950/75 to-indigo-950/40 [dir=rtl]:bg-gradient-to-r" />
        {/* Ambient radial warmth — bottom right */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,_rgba(245,158,11,0.18)_0,_transparent_60%)]"
        />
      </div>

      {/* Hero content — compact for marketplace. Darija headline + one CTA pair. */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 sm:py-14 lg:py-16 flex justify-end">
        <div className="max-w-lg text-end">
          {/* Eyebrow — amber parchment chip */}
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-200 ring-1 ring-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {t('home.hero.eyebrow', 'Authentic Moroccan craftsmanship')}
          </span>

          {/* Arabic primary headline */}
          <h1
            dir="rtl"
            lang="ar"
            className="font-arabic mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white"
          >
            لباس ديال زمان.
            <br />
            <span className="text-amber-400">مصنوع لليوم.</span>
          </h1>

          {/* Search entry — navigates to /products?q= on submit */}
          <form
            action="/products"
            method="get"
            role="search"
            className="mt-5 flex items-center gap-2 max-w-md ms-auto"
            aria-label={t('home.hero.search_label', 'Search the marketplace')}
          >
            <label htmlFor="hero-search" className="sr-only">
              {t('home.hero.search_placeholder', 'Search caftans, djellabas…')}
            </label>
            <input
              id="hero-search"
              type="search"
              name="q"
              placeholder={t('home.hero.search_placeholder', 'Search caftans, djellabas…')}
              className="flex-1 min-w-0 rounded-xl bg-indigo-800 border border-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400/60 transition-colors duration-200"
            />
            <button
              type="submit"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              aria-label={t('home.hero.search_btn', 'Search')}
            >
              {t('home.hero.search_btn', 'Search')}
            </button>
          </form>

          {/* Single CTA pair */}
          <div className="mt-5 flex flex-wrap gap-3 justify-end">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-atlas-sm transition-all duration-200 hover:bg-indigo-800 hover:-translate-y-0.5 hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2 focus:ring-offset-indigo-950"
              aria-label={t('home.hero.cta_shop', 'Shop the marketplace')}
            >
              {t('home.hero.cta_shop', 'Shop the marketplace')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-900 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 transition-all duration-200 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label={t('home.hero.cta_tailors', 'Meet the tailors')}
            >
              {t('home.hero.cta_tailors', 'Meet the tailors')}
            </Link>
          </div>

          {/* Discovery chip */}
          <div className="mt-4 flex justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium ring-1 ring-amber-500/25 animate-fade-in-up">
              <Sparkles size={12} className="shrink-0" aria-hidden="true" />
              {t('home.hero.discovery_chip', 'Smart discovery — find your style')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
