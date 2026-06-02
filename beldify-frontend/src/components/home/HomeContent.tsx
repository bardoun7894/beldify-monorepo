'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  RotateCcw,
  Headphones,
  MapPin,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  Scissors,
  Package,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';
import FeaturedSections from '@/components/home/FeaturedSections';
import MegaOffers from '@/components/MegaOffers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Newsletter from '@/components/Newsletter';

type Category = {
  id: number;
  name_en: string;
  name_ar?: string;
  image: string;
  slug?: string;
  itemCount?: number;
  subCategories?: Category[];
  subcategories?: Category[];
};

interface HomeData {
  bestSellers?: unknown[];
  newArrivals?: unknown[];
  recommendedTailors?: unknown[];
  recommendedSellers?: unknown[];
  specialOffers?: unknown[];
  megaOffers?: unknown[];
  mensTraditional?: unknown[];
  womensTraditional?: unknown[];
  childrensTraditional?: unknown[];
}

interface HomeContentProps {
  categories: Category[];
  data: HomeData;
}

export default function HomeContent({ categories, data }: HomeContentProps) {
  const { t } = useTranslation();

  const ateliers = [
    { name: 'Maison Tetouan', city: 'Tetouan', img: 'https://pro.beldify.com/storage/categories/category_7.jpg', specialty: 'Tarz-tetouani', rating: 4.9 },
    { name: 'Dar Fes Atelier', city: 'Fez', img: '/images/hero-atelier.jpg', specialty: 'Brocade & gold thread', rating: 4.8 },
    { name: 'Casablanca Couture', city: 'Casablanca', img: 'https://pro.beldify.com/storage/categories/category_14.jpg', specialty: 'Wedding & bespoke', rating: 4.7 },
    { name: 'Dar Marrakech', city: 'Marrakech', img: 'https://pro.beldify.com/storage/categories/category_4.jpg', specialty: 'Caftan & takchita', rating: 4.8 },
  ];

  const journal = [
    { tag: 'Craft', title: 'Inside a Fez brocade atelier', excerpt: 'How fourth-generation weavers in Fez still hand-thread gold into festival caftans.', author: 'Imane Bennani', readTime: '6 min', img: 'https://pro.beldify.com/storage/categories/category_4.jpg' },
    { tag: 'Wedding', title: 'A takchita built in 3 fittings', excerpt: 'Following one bride from sketch to ceremony with Maison Marrakech.', author: 'Salma El Aoud', readTime: '8 min', img: 'https://pro.beldify.com/storage/categories/category_14.jpg' },
    { tag: 'Heritage', title: 'Sizing a djellaba, the Moroccan way', excerpt: 'A field guide to measurements that travel — with no tape measure surprises.', author: 'Karim Lahlou', readTime: '5 min', img: 'https://pro.beldify.com/storage/categories/category_5.jpg' },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden min-h-[85vh] flex items-center">
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
          {/* Dark indigo editorial overlay — logical-direction aware so the dark,
              legible stop always lands under the end-aligned headline: to-left on
              LTR (copy on the right), to-right on RTL (copy on the left). */}
          <div className="absolute inset-0 bg-gradient-to-l [dir=rtl]:bg-gradient-to-r from-indigo-950/90 via-indigo-950/60 to-indigo-950/10" />
          {/* Ambient radial warmth — bottom right */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,_rgba(245,158,11,0.18)_0,_transparent_60%)]"
          />
        </div>

        {/* Hero content — END-aligned on LTR (right side), START-aligned on RTL */}
        <div className="mx-auto max-w-7xl w-full px-6 py-24 sm:py-32 lg:py-40 flex justify-end">
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
              className="font-arabic mt-5 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white"
            >
              تُلبَس منذ قرون.
              <br />
              <span className="text-amber-400">مصنوعة لليوم.</span>
            </h1>

            {/* English subtitle — italic, lighter weight */}
            <p className="mt-3 text-lg font-medium text-white/70 italic tracking-wide">
              {t('home.hero.subtitle', 'Worn for centuries. Made for today.')}
            </p>

            {/* Etymology lockup */}
            <div
              className="flex items-baseline gap-3 flex-wrap-reverse mt-5 mb-2 justify-end"
              aria-label="Beldify — Beldi reimagined"
            >
              <span
                dir="ltr"
                lang="en"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                className="text-2xl font-bold text-amber-400 italic leading-tight"
              >
                ify
              </span>
              <span className="text-amber-500/60 text-xl select-none" aria-hidden="true">×</span>
              <span dir="rtl" lang="ar" className="font-arabic text-2xl font-semibold text-white leading-tight">
                بلدي
              </span>
            </div>
            <p className="text-xs text-white/65 mb-8 tracking-wide">
              {t('home.hero.etymology', 'beldi (بلدي) — local, artisan, of the country')}
            </p>

            <p className="mt-4 text-base leading-relaxed text-white/80 max-w-md ms-auto">
              {t('home.hero.description', "Caftans, djellabas, and bespoke tailoring from Morocco’s finest ateliers — delivered worldwide.")}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3 justify-end">
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
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label={t('home.hero.cta_tailors', 'Meet the tailors')}
              >
                {t('home.hero.cta_tailors', 'Meet the tailors')}
              </Link>
            </div>

            {/* AI personalisation chip */}
            <div className="mt-6 flex justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium ring-1 ring-amber-500/25 animate-fade-in-up">
                <Sparkles size={12} className="shrink-0" aria-hidden="true" />
                {t('home.hero.ai_chip', 'AI styled for you')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section
        className="border-y border-amber-200/40 bg-amber-50/60 backdrop-blur"
        aria-label="Why shop with Beldify"
      >
        <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {([
            { labelKey: 'home.trust.verified_sellers', labelFallback: 'Verified sellers', labelAr: 'بائعون موثوقون', Icon: ShieldCheck },
            { labelKey: 'home.trust.secure_payments', labelFallback: 'Secure payments', labelAr: 'دفع آمن', Icon: Lock },
            { labelKey: 'home.trust.returns', labelFallback: '14-day returns', labelAr: 'إرجاع 14 يوماً', Icon: RotateCcw },
            { labelKey: 'home.trust.support', labelFallback: 'Support AR / FR / EN', labelAr: 'دعم متعدد اللغات', Icon: Headphones },
          ] as const).map(({ labelKey, labelFallback, labelAr, Icon }) => (
            <div key={labelKey} className="flex flex-col items-center gap-2 text-center">
              <span className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center ring-1 ring-amber-200 text-indigo-700">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-700 leading-snug">
                <span lang="ar" dir="rtl" className="block font-arabic text-gray-900">{labelAr}</span>
                <span className="text-gray-500">{t(labelKey, labelFallback)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY RAIL ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              <span dir="rtl" lang="ar" className="font-arabic text-gray-900">تسوق في السوق</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t('home.categories.subtitle', 'Browse the souk')}</p>
          </div>
          <Link
            href="/categories"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
          >
            كل الأصناف <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
            <Package className="h-10 w-10 text-amber-500 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-gray-600">{t('home.categories.empty', 'Categories will appear here once the catalogue is live.')}</p>
          </div>
        ) : (
          <>
            {/* Mobile: 2-col grid; Tablet: 3-col; Desktop: editorial 4-col with a
                wider featured lead tile (idx 0 spans 2 cols) so the rail reads as
                brand-editorial, not a flat equal product grid. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[1fr] gap-3 sm:gap-5">
              {categories.map((c, idx) => {
                const featured = idx === 0 && categories.length >= 4;
                return (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug || c.id}`}
                  className={`group relative overflow-hidden rounded-2xl ring-1 ring-amber-200/50 bg-amber-50 shadow-atlas-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-indigo-700/30 ${featured ? 'sm:col-span-2 lg:col-span-2' : ''}`}
                  style={{ aspectRatio: featured ? '8/5' : '4/5' }}
                >
                  <Image
                    src={c.image}
                    alt={c.name_ar || c.name_en}
                    fill
                    sizes={featured ? '(min-width:1024px) 50vw, (min-width:640px) 66vw, 100vw' : '(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw'}
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {typeof c.itemCount === 'number' && c.itemCount > 0 && (
                    <span className="absolute top-3 end-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-gray-900 shadow-sm">
                      {c.itemCount}
                    </span>
                  )}
                  <div className="absolute bottom-4 start-4 end-4">
                    <h3
                      className="text-white font-semibold leading-tight drop-shadow-sm"
                      style={{
                        fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
                        fontSize: featured ? '1.75rem' : '1.125rem',
                      }}
                    >
                      {c.name_ar || c.name_en}
                    </h3>
                  </div>
                </Link>
                );
              })}
            </div>
            {/* Mobile "View all" */}
            <div className="mt-6 sm:hidden text-center">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                كل الأصناف <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedSections
          bestSellers={data.bestSellers}
          newArrivals={data.newArrivals}
          mensTraditional={data.mensTraditional}
          womensTraditional={data.womensTraditional}
          childrensTraditional={data.childrensTraditional}
        />
      </Suspense>

      {/* ── SPECIAL OFFERS (2-col editorial) ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — dark indigo editorial card */}
          <div className="relative overflow-hidden rounded-2xl bg-indigo-950 ring-1 ring-white/10 shadow-atlas-lg">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
            />
            {/* Zellige motif overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                backgroundImage: "url('/motifs/zellige-tile.svg')",
                backgroundSize: '100px 100px',
                backgroundRepeat: 'repeat',
                opacity: 0.08,
              }}
            />
            <div className="relative px-8 py-16 sm:px-12 sm:py-20">
              <h2
                className="text-3xl sm:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('home.offers.editorial_title', 'Traditional Elegance')}
              </h2>
              <p className="mt-4 text-indigo-200 text-base max-w-sm">
                {t('home.offers.editorial_description', 'Our finest ready-to-wear Moroccan creations — seasonal caftans and djellabas.')}
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
                aria-label={t('home.offers.cta_shop_collection', 'Shop the collection')}
              >
                {t('home.offers.cta_shop_collection', 'Shop the collection')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right — warm parchment card with image */}
          <div className="relative overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-amber-200 shadow-atlas-md">
            <div className="absolute inset-0">
              <Image
                src="https://pro.beldify.com/storage/categories/category_5.jpg"
                alt="Collection festive"
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 to-amber-50/95" />
            </div>
            <div className="relative px-8 py-16 sm:px-12 sm:py-20">
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                مجموعة المناسبات
              </h2>
              <p className="mt-4 text-gray-600 text-base max-w-sm">
                قفاطين وتكشيطات مثالية للأعراس والاحتفالات — مُطرَّزة بيدين تتشقّق من الحب.
              </p>
              <Link
                href="/products?category=festive"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-800 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 min-h-[44px]"
                aria-label="Explore festive collection"
              >
                {t('home.offers.cta_explore', 'Explore now')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MEGA OFFERS ───────────────────────────────────────────────────── */}
      {data.megaOffers && data.megaOffers.length > 0 && (
        <Suspense fallback={<LoadingSpinner />}>
          <MegaOffers megaOffers={data.megaOffers || []} />
        </Suspense>
      )}

      {/* ── TAILORING CTA ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
        />
        {/* Zellige motif overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: "url('/motifs/zellige-tile.svg')",
            backgroundSize: '120px 120px',
            backgroundRepeat: 'repeat',
            opacity: 0.07,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 mb-5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              خياطة بالمقاس
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('home.tailoring.headline', 'Want it tailored to you?')}
            </h2>
            <p className="mt-4 text-indigo-200 text-base max-w-md leading-relaxed">
              {t('home.tailoring.description', 'Match with a Moroccan tailor, send your measurements, and receive a fitted piece in 2–4 weeks.')}
            </p>
            <Link
              href="/tailoring"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              aria-label={t('home.tailoring.cta', 'Start a tailoring order')}
            >
              {t('home.tailoring.cta', 'Start a tailoring order')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Steps */}
          <ol className="space-y-4" aria-label="How tailoring works">
            {[
              {
                step: t('home.tailoring.step1_title', 'Pick your tailor'),
                detail: t('home.tailoring.step1_detail', 'Browse verified ateliers across Tetouan, Fez, Casablanca.'),
              },
              {
                step: t('home.tailoring.step2_title', 'Send measurements'),
                detail: t('home.tailoring.step2_detail', 'Use our guided form or upload an existing pattern.'),
              },
              {
                step: t('home.tailoring.step3_title', 'Receive your piece'),
                detail: t('home.tailoring.step3_detail', 'Hand-finished and shipped to your door in 2–4 weeks.'),
              },
            ].map(({ step, detail }, i) => (
              <li key={step} className="flex gap-4 rounded-xl bg-white/5 ring-1 ring-white/10 px-5 py-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950 font-bold text-sm"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-white text-sm">{step}</p>
                  <p className="text-indigo-200/80 text-sm mt-0.5">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ATELIERS RAIL ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              <span dir="rtl" lang="ar" className="font-arabic">ورشات مختارة</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t('home.ateliers.subtitle', 'Curated ateliers')}</p>
          </div>
          <Link
            href="/shops"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
            aria-label={t('home.ateliers.view_all', 'All ateliers')}
          >
            {t('home.ateliers.view_all', 'All ateliers')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* 4-col desktop; 2-col mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {ateliers.map((a) => (
            <Link
              key={a.name}
              href="/shops"
              className="group relative overflow-hidden rounded-2xl ring-1 ring-amber-200/50 bg-amber-50 shadow-atlas-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
                <Image
                  src={a.img}
                  alt={a.name}
                  fill
                  sizes="(min-width:1024px) 25vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                {/* Verified badge */}
                <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.2} aria-hidden="true" />
                  Verified
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-base font-semibold text-gray-900 leading-snug"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {a.name}
                </h3>
                <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {a.city}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                    {a.rating}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-indigo-700 font-medium">{a.specialty}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── THE JOURNAL ───────────────────────────────────────────────────── */}
      <section className="bg-amber-50/60 border-t border-amber-200/40">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                <span dir="rtl" lang="ar" className="font-arabic">المجلة</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500">{t('home.journal.subtitle', 'Stories from the atelier')}</p>
            </div>
            <Link
              href="/journal"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
            >
              {t('home.journal.view_all', 'All stories')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Asymmetric: 1 tall left + 2 stacked right on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {journal.map((a, idx) => (
              <article
                key={a.title}
                className={`group rounded-2xl overflow-hidden ring-1 ring-amber-200/50 bg-white shadow-atlas-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md ${idx === 0 ? 'md:row-span-2 md:flex md:flex-col' : ''}`}
              >
                <div className={`relative overflow-hidden ${idx === 0 ? 'md:flex-1' : 'aspect-[16/10]'}`}>
                  <Image
                    src={a.img}
                    alt={a.title}
                    fill
                    sizes="(min-width:768px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 start-3">
                    <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                      {a.tag}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    className="text-lg font-semibold leading-snug text-gray-900 group-hover:text-indigo-700 transition-colors duration-200"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">{a.excerpt}</p>
                  <p className="mt-4 text-xs text-gray-500">
                    {a.author} &middot; {a.readTime} {t('home.journal.read_time_suffix', 'read')}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELLER/ARTISAN CTA STRIP ──────────────────────────────────────── */}
      <section className="relative py-20 bg-indigo-950 text-white overflow-hidden">
        {/* Zellige motif overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: "url('/motifs/zellige-tile.svg')",
            backgroundSize: '120px 120px',
            backgroundRepeat: 'repeat',
            opacity: 0.10,
          }}
        />
        {/* Amber radial ambient */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_30%_50%,_rgba(245,158,11,0.15)_0,_transparent_60%)]"
        />
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('home.seller.headline_line1', 'Sell your craft.')}
              <br />
              <span className="text-amber-400">{t('home.seller.headline_line2', 'Reach Morocco and beyond.')}</span>
            </h2>
            <p className="text-indigo-200 text-base mb-8 max-w-md leading-relaxed">
              {t('home.seller.description', 'Beldify gives Tetouani ateliers and independent artisans a professional storefront with AI-assisted listings, order management, and direct buyer messaging.')}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://pro.beldify.com"
                className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-xl bg-amber-500 text-amber-950 font-semibold text-sm hover:bg-amber-400 transition-all duration-200 hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                aria-label={t('home.seller.cta', 'Open your boutique')}
              >
                {t('home.seller.cta', 'Open your boutique')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium ring-1 ring-amber-500/25">
                <Sparkles size={12} className="shrink-0" aria-hidden="true" />
                {t('home.seller.ai_chip', 'AI-assisted listings')}
              </span>
            </div>
          </div>

          {/* Seller proof — a single weighted lead stat (the genuinely useful
              MAD price range) over two supporting proof points, so it reads as a
              pitch with hierarchy rather than a flat 4-up vanity metric band. */}
          <div className="space-y-4">
            {/* Lead — price range in MAD, the stat a prospective seller actually cares about */}
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-6 py-6">
              <p className="text-xs uppercase tracking-wide text-indigo-300/80">{t('home.seller.stat_range_label', 'Typical listing range')}</p>
              <p
                className="mt-1.5 text-3xl sm:text-4xl font-bold text-amber-400"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                <span className="currency-mad">299–5,999 درهم</span>
              </p>
              <p dir="rtl" lang="ar" className="text-xs text-indigo-300/70 font-arabic mt-1">
                نطاق الأسعار النموذجي للبائعين
              </p>
            </div>
            {/* Supporting — two lighter proof points */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '+2,400', labelKey: 'home.seller.stat_sellers_label', labelFallback: 'Active sellers', labelAr: 'بائع نشيط' },
                { value: '14-day returns', labelKey: 'home.seller.stat_protection_label', labelFallback: 'Buyer protection', labelAr: 'حماية المشتري' },
              ].map((s) => (
                <div
                  key={s.value}
                  className="rounded-xl bg-white/5 ring-1 ring-white/10 px-5 py-4"
                >
                  <p className="text-xl font-semibold text-white">{s.value}</p>
                  <p className="text-xs text-indigo-200 mt-1">{t(s.labelKey, s.labelFallback)}</p>
                  <p dir="rtl" lang="ar" className="text-xs text-indigo-300/70 font-arabic mt-0.5">{s.labelAr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <Suspense fallback={<LoadingSpinner />}>
        <Newsletter />
      </Suspense>
    </main>
  );
}
