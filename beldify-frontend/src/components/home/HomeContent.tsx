'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  RotateCcw,
  Headphones,
  Truck,
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
import OpenSoukHero from '@/components/home/OpenSoukHero';
import HeroSection from '@/components/home/HeroSection';
import MegaOffers from '@/components/MegaOffers';
import type { HeroConfig } from '@/components/home/HeroSection';
import type { HeroProductItem } from '@/components/home/ProductHeroSlides';
import DiscoverFeed from '@/components/home/DiscoverFeed';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Newsletter from '@/components/Newsletter';
import PostCard from '@/components/community/PostCard';
import type { CommunityPost } from '@/types/community';
import CategoryCard from '@/components/home/CategoryCard';
import RecentlyViewedRail from '@/components/home/RecentlyViewedRail';
import FollowedShopsRail from '@/components/home/FollowedShopsRail';

type Category = {
  id: number;
  name_en: string;
  name_ar?: string;
  image: string;
  slug?: string;
  itemCount?: number;
  sub_categories?: Category[];
  subCategories?: Category[];
  subcategories?: Category[];
};

// Backend shape confirmed from RecommendedController.php
interface RecommendedTailor {
  id: number;
  name: string;
  rating: number;
  profile_image: string;
  speciality?: string;
  experience_years?: number;
}

interface HomeData {
  bestSellers?: unknown[];
  newArrivals?: unknown[];
  recommendedTailors?: RecommendedTailor[];
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
  openSoukPosts?: CommunityPost[];
  hero?: HeroConfig;
}

export default function HomeContent({ categories, data, openSoukPosts = [], hero = { mode: 'brand', banners: [] } }: HomeContentProps) {
  const { t, i18n } = useTranslation();

  // Arabic-script locales (Modern Standard + Darija) read category names from
  // name_ar; Latin locales (en/fr/es) prefer name_en. Falls back across the
  // pair so a card never renders blank when one language is missing.
  const lang = i18n.language || 'en';
  const isArabicScript = lang.startsWith('ar') || lang === 'ma';
  const catName = (c: Category) =>
    isArabicScript ? c.name_ar || c.name_en : c.name_en || c.name_ar;

  // Track which category grid tiles have a broken image so we can swap to the
  // neutral letter-tile fallback. Key = category id (number → string).
  const [catImageError, setCatImageError] = useState<Record<number, boolean>>({});

  // Track which journal article images failed
  const [journalImgError, setJournalImgError] = useState<Record<number, boolean>>({});

  // Static fallback ateliers — used when the API returns an empty array.
  // Backend shape confirmed: RecommendedController returns { id, name, rating,
  // profile_image, speciality, experience_years }. The live data replaces this
  // when /api/recommended-tailors responds successfully.
  const staticAteliers = [
    { name: 'Maison Tetouan', city: 'Tetouan', img: 'https://pro.beldify.com/storage/categories/category_7_jabador.png', specialty: 'Tarz-tetouani', rating: 4.9 },
    { name: 'Dar Fes Atelier', city: 'Fez', img: '/images/hero-atelier.jpg', specialty: 'Brocade & gold thread', rating: 4.8 },
    { name: 'Casablanca Couture', city: 'Casablanca', img: 'https://pro.beldify.com/storage/categories/category_14_wedding-dresses.png', specialty: 'Wedding & bespoke', rating: 4.7 },
    { name: 'Dar Marrakech', city: 'Marrakech', img: 'https://pro.beldify.com/storage/categories/category_4_caftan.png', specialty: 'Caftan & takchita', rating: 4.8 },
  ];

  // Map live recommended-tailors to atelier card shape. profile_image is the
  // atelier's photo, speciality maps to specialty. City is not provided by the
  // endpoint; omit it (empty string) until a location field is available.
  const liveAteliers = (data.recommendedTailors ?? []).map((tailor) => ({
    name: tailor.name,
    city: '',
    img: tailor.profile_image || '/images/placeholder-product.svg',
    specialty: tailor.speciality || '',
    rating: tailor.rating,
  }));

  const ateliers = liveAteliers.length > 0 ? liveAteliers : staticAteliers;

  // NOTE: `journal` is intentionally static. There is no backend /journal or
  // /blog endpoint. These are editorial placeholders. When a CMS or blog API is
  // available, replace this array with a dynamic fetch. Do not add a backend
  // call here without an actual endpoint to target.
  const journal = [
    {
      tag: t('home.journal.article1_tag'),
      title: t('home.journal.article1_title'),
      excerpt: t('home.journal.article1_excerpt'),
      author: 'Imane Bennani',
      readTime: '6',
      img: 'https://pro.beldify.com/storage/categories/category_4_caftan.png',
    },
    {
      tag: t('home.journal.article2_tag'),
      title: t('home.journal.article2_title'),
      excerpt: t('home.journal.article2_excerpt'),
      author: 'Salma El Aoud',
      readTime: '8',
      img: 'https://pro.beldify.com/storage/categories/category_14_wedding-dresses.png',
    },
    {
      tag: t('home.journal.article3_tag'),
      title: t('home.journal.article3_title'),
      excerpt: t('home.journal.article3_excerpt'),
      author: 'Karim Lahlou',
      readTime: '5',
      img: 'https://pro.beldify.com/storage/categories/category_5_womens-djellaba.png',
    },
  ];

  // ── Hero product filtering ────────────────────────────────────────────────
  // Build a list of up to 4 product slides for ProductHeroSlides.
  // Rules (defensive — backend now filters, but keep client-side guard):
  //  1. Pull from bestSellers first, fall back to newArrivals
  //  2. Filter out items without a real image:
  //     - falsy / empty string
  //     - equals the branded placeholder
  //     - obviously-dead patterns (data:, blob:)
  //  3. Cap at 4 items (carousel max)
  // HeroSection decides whether to render ProductHeroSlides (≥2 items) or fall
  // back to CampaignArtSlides (<2 items).
  const PLACEHOLDER_SVG = 'placeholder-product.svg';
  const isUsableImage = (img?: string | null): boolean => {
    if (!img || img.trim() === '') return false;
    if (img.includes(PLACEHOLDER_SVG)) return false;
    if (img.startsWith('data:') || img.startsWith('blob:')) return false;
    return true;
  };

  const rawHeroPool = [
    ...(Array.isArray(data.bestSellers) ? data.bestSellers : []),
    ...(Array.isArray(data.newArrivals) ? data.newArrivals : []),
  ] as Array<{
    id: number;
    name: string;
    name_ar?: string | null;
    price: number;
    compare_price?: number | string | null;
    discount_price?: number | string | null;
    has_discount?: boolean;
    image?: string | null;
    main_image?: string | null;
  }>;

  const heroProducts: HeroProductItem[] = rawHeroPool
    .filter((p) => {
      const img = p.main_image || p.image;
      return isUsableImage(img);
    })
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      name: p.name,
      name_ar: p.name_ar ?? null,
      price: Number(p.price) || 0,
      compare_price: p.compare_price,
      discount_price: p.discount_price,
      has_discount: p.has_discount,
      image: (p.main_image || p.image) as string,
    }));

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      {/* Delegated to HeroSection — campaign banners > product hero > art fallback */}
      <HeroSection hero={hero} products={heroProducts} />

      {/* ── CATEGORY CHIPS RAIL ───────────────────────────────────────────── */}
      {/* On mobile (< lg) the rail sticks under the header (64px) so users can
          browse categories while scrolling the page. Desktop: static position,
          the rail scrolls away with the page content. The z-30 keeps it below
          the site header (z-40) but above cards/images. */}
      {categories.length > 0 && (
        <section
          className="border-b border-gray-100 bg-white sticky top-[64px] z-30 lg:static lg:z-auto"
          aria-label={t('home.categories.rail_label', 'Browse categories')}
        >
          <div
            className="-mx-0 flex gap-3 lg:gap-6 overflow-x-auto snap-x snap-mandatory px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:mx-auto lg:w-fit lg:max-w-7xl lg:px-6"
            role="list"
          >
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug || c.id}`}
                role="listitem"
                className="group snap-start shrink-0 flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 rounded-xl"
                aria-label={catName(c)}
              >
                <span className="relative flex h-14 w-14 lg:h-[68px] lg:w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-50 ring-1 ring-gray-200 transition-all duration-200 group-hover:ring-indigo-700 group-hover:ring-2 group-hover:-translate-y-0.5">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 68px, 56px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span
                  className={`text-[11px] font-medium text-gray-700 group-hover:text-indigo-700 text-center leading-tight line-clamp-2 max-w-[84px] transition-colors duration-200 ${isArabicScript ? 'font-arabic' : ''}`}
                  dir={isArabicScript ? 'rtl' : 'ltr'}
                >
                  {catName(c)}
                </span>
              </Link>
            ))}
            <Link
              href="/categories"
              className="group snap-start shrink-0 flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 rounded-xl"
            >
              <span className="flex h-14 w-14 lg:h-[68px] lg:w-[68px] items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-200 transition-all duration-200 group-hover:bg-indigo-700 group-hover:ring-indigo-700 group-hover:-translate-y-0.5">
                <ArrowRight className="h-5 w-5 text-indigo-700 group-hover:text-white rtl:rotate-180 transition-colors duration-200" aria-hidden="true" />
              </span>
              <span className={`text-[11px] font-medium text-indigo-700 text-center leading-tight line-clamp-2 max-w-[84px] ${isArabicScript ? 'font-arabic' : ''}`}>
                {t('home.categories.viewAll', 'All categories')}
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* ── SHOP-BY-OCCASION GRID ──────────────────────────────────────────── */}
      {/* 4 occasion tiles: 2-col mobile → 4-col desktop, aspect 4/5.          */}
      {/* Full-bleed image + gradient scrim + label, matches cat grid treatment. */}
      <OccasionGrid categories={categories} isArabicScript={isArabicScript} />


      {/* ── CATEGORY GRID (editorial, below fold) ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {isArabicScript ? (
                <span dir="rtl" lang="ar" className="font-arabic text-gray-900">
                  {t('home.categories.title', 'تسوق في السوق')}
                </span>
              ) : (
                <span style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
                  {t('home.categories.title', 'Shop the souk')}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t('home.categories.subtitle', 'Browse the souk')}</p>
          </div>
          <Link
            href="/categories"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
          >
            {t('home.categories.viewAll', 'All categories')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-gray-50 ring-1 ring-gray-200">
            <Package className="h-10 w-10 text-amber-500 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-gray-600">{t('home.categories.empty', 'Categories will appear here once the catalogue is live.')}</p>
          </div>
        ) : (
          <>
            {/* Mobile: 2-col grid; Tablet: 3-col; Desktop: editorial 4-col with a
                wider featured lead tile (idx 0 spans 2 cols) so the rail reads as
                brand-editorial, not a flat equal product grid.
                Each tile is a rich CategoryCard: Playfair title + product count
                + subcategory quick-chips (up to 3) + Atlas design tokens. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[1fr] gap-3 sm:gap-5">
              {categories.map((c, idx) => {
                const featured = idx === 0 && categories.length >= 4;
                const imgFailed = catImageError[c.id] || !c.image;
                return (
                  <div
                    key={c.id}
                    className={featured ? 'sm:col-span-2 lg:col-span-2' : ''}
                  >
                    <CategoryCard
                      id={c.id}
                      name_en={c.name_en}
                      name_ar={c.name_ar}
                      image={c.image}
                      slug={c.slug}
                      itemCount={c.itemCount}
                      sub_categories={c.sub_categories}
                      subCategories={c.subCategories}
                      subcategories={c.subcategories}
                      featured={featured}
                      isArabicScript={isArabicScript}
                      imgFailed={imgFailed}
                      onImageError={(id) => setCatImageError((prev) => ({ ...prev, [id]: true }))}
                    />
                  </div>
                );
              })}
            </div>
            {/* Mobile "View all" */}
            <div className="mt-6 sm:hidden text-center">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                {t('home.categories.viewAll', 'All categories')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── OPEN SOUK (reverse marketplace — core differentiator) ──────────── */}
      <OpenSoukHero />

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedSections
          bestSellers={data.bestSellers as any[]}
          newArrivals={data.newArrivals as any[]}
          mensTraditional={data.mensTraditional as any[]}
          womensTraditional={data.womensTraditional as any[]}
          childrensTraditional={data.childrensTraditional as any[]}
        />
      </Suspense>

      {/* ── SPECIAL OFFERS (2-col editorial) ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
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
          <div className="relative overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200 shadow-atlas-md">
            <div className="absolute inset-0">
              <Image
                src="https://pro.beldify.com/storage/categories/category_5_womens-djellaba.png"
                alt={t('home.offers.festive_title', 'Occasions Collection')}
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-white/95" />
            </div>
            <div className="relative px-8 py-16 sm:px-12 sm:py-20">
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('home.offers.festive_title', 'كوليكسيون المناسبات')}
              </h2>
              <p className="mt-4 text-gray-600 text-base max-w-sm">
                {t('home.offers.festive_description', 'قفاطين وتكاشط للأعراس والمناسبات، مطرّزين باليد وبالحب.')}
              </p>
              <Link
                href="/products?category=festive"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-800 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 min-h-[44px]"
                aria-label={t('home.offers.cta_explore_aria', 'Explore festive collection')}
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
          <MegaOffers megaOffers={(data.megaOffers || []) as any[]} />
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
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 mb-5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.tailoring.badge_ar', 'خياطة على القياس')}
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
              href="/services/tailoring"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              aria-label={t('home.tailoring.cta', 'Start a tailoring order')}
            >
              {t('home.tailoring.cta', 'Start a tailoring order')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Steps */}
          <ol className="space-y-4" aria-label={t('home.tailoring.steps_label', 'How tailoring works')}>
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
              <li key={step} className="flex gap-4 rounded-xl bg-indigo-900 ring-1 ring-white/10 px-5 py-4">
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

      {/* ── OPEN SOUK RAIL ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 mb-4 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.openSouk.eyebrow', 'Community marketplace')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {isArabicScript ? (
                <span dir="rtl" lang="ar" className="font-arabic text-gray-900">
                  {t('home.openSouk.headingAr', 'أحدث الطلبات')}
                </span>
              ) : (
                <span style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
                  {t('home.openSouk.title', 'Latest open requests')}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('home.openSouk.subtitle', 'Open briefs waiting for offers — be the first to respond')}
            </p>
          </div>
          <Link
            href="/community"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
            aria-label={t('home.openSouk.browseCta', 'Browse the souk')}
          >
            {t('home.openSouk.browseCta', 'Browse the souk')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {openSoukPosts.length === 0 ? (
          /* ── Open Souk empty state: illustrative example cards ─────────── */
          <div className="space-y-8">
            {/* Helper text */}
            <p className="text-sm text-gray-500 text-center">
              {t('home.openSouk.emptyBody', 'No open briefs yet. Be the first to post one and let ateliers come to you.')}
            </p>

            {/* Three non-clickable example request cards (clearly labelled) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
              {[
                {
                  title: t('home.openSouk.exampleTitle1', 'قفطان للعرس'),
                  budget: t('home.openSouk.exampleBudget1', '2,000 – 4,000 درهم'),
                  tag: t('home.openSouk.exampleTag1', 'نساء'),
                },
                {
                  title: t('home.openSouk.exampleTitle2', 'جلابة رجالية صوف'),
                  budget: t('home.openSouk.exampleBudget2', '800 – 1,200 درهم'),
                  tag: t('home.openSouk.exampleTag2', 'رجال'),
                },
                {
                  title: t('home.openSouk.exampleTitle3', 'تكشيطة على القياس'),
                  budget: t('home.openSouk.exampleBudget3', '3,000 – 5,000 درهم'),
                  tag: t('home.openSouk.exampleTag3', 'نساء'),
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  /* pointer-events-none: cards are purely illustrative — not clickable */
                  className="pointer-events-none select-none rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-5 opacity-75"
                >
                  {/* "مثال" chip — makes it obvious this is illustrative */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-500 ring-1 ring-indigo-100">
                      {t('home.openSouk.exampleChip', 'مثال')}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 leading-snug mb-2" dir="rtl">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-500" dir="rtl">
                    {t('home.openSouk.exampleBudgetLabel', 'الميزانية')}:{' '}
                    <span className="font-medium text-gray-700">{card.budget}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* CTA — نشر أول طلب */}
            <div className="text-center">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
                aria-label={t('home.openSouk.emptyCta', 'Be the first to post a brief')}
              >
                {t('home.openSouk.emptyCta', 'نشر أول طلب')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {openSoukPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* CTAs — primary post brief + secondary browse */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
                aria-label={t('home.openSouk.postCta', 'Post your brief')}
              >
                {t('home.openSouk.postCta', 'Post your brief')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 transition-all duration-200 hover:bg-indigo-50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 min-h-[44px]"
                aria-label={t('home.openSouk.browseCta', 'Browse the souk')}
              >
                {t('home.openSouk.browseCta', 'Browse the souk')}
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── ATELIERS RAIL ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              <span dir="rtl" lang="ar" className="font-arabic">{t('home.ateliers.headingAr', 'ورشات مختارة')}</span>
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
              className="group relative overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-white shadow-atlas-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
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
                <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.2} aria-hidden="true" />
                  {t('shop.verified', 'Verified')}
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
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                <span dir="rtl" lang="ar" className="font-arabic">{t('home.journal.headingAr', 'المجلة')}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500">{t('home.journal.subtitle', 'Stories from the atelier')}</p>
            </div>
            <Link
              href="/community"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
            >
              {t('home.journal.view_all', 'All stories')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Asymmetric: 1 tall left + 2 stacked right on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {journal.map((a, idx) => {
              const journalFallback = journalImgError[idx] || !a.img;
              return (
              <article
                key={a.title}
                className={`group rounded-2xl overflow-hidden ring-1 ring-gray-200 bg-white shadow-atlas-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md ${idx === 0 ? 'md:row-span-2 md:flex md:flex-col' : ''}`}
              >
                <div className={`relative overflow-hidden ${idx === 0 ? 'md:flex-1' : 'aspect-[16/10]'}`}>
                  {journalFallback ? (
                    /* Neutral fallback when journal image is dead or missing */
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl font-bold text-indigo-700/20 select-none" aria-hidden="true">
                        {a.tag?.charAt(0).toUpperCase() ?? 'J'}
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={a.img}
                      alt={a.title}
                      fill
                      sizes="(min-width:768px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      onError={() => setJournalImgError((prev) => ({ ...prev, [idx]: true }))}
                    />
                  )}
                  <div className="absolute top-3 start-3">
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
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
              );
            })}
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
            <div className="rounded-2xl bg-indigo-900 ring-1 ring-white/10 px-6 py-6">
              <p className="text-xs uppercase tracking-wide text-indigo-300/80">{t('home.seller.stat_range_label', 'Typical listing range')}</p>
              <p
                className="mt-1.5 text-3xl sm:text-4xl font-bold text-amber-400"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                <span className="currency-mad">{t('home.seller.stat_range_value', '299–5,999 MAD')}</span>
              </p>
              <p className="text-xs text-indigo-300/70 mt-1">
                {t('home.seller.stat_range_hint', 'What sellers typically charge')}
              </p>
            </div>
            {/* Supporting — two proof points using honest, non-fabricated copy */}
            <div className="grid grid-cols-2 gap-4">
              {[
                // "Growing community" — qualitative; avoids inventing a seller count
                // that is not sourced from the API. Update with a real figure once
                // a /api/stats or similar endpoint provides one.
                { value: t('home.seller.stat_sellers_value', 'Growing'), labelKey: 'home.seller.stat_sellers_label', labelFallback: 'Seller community' },
                { value: t('home.seller.stat_protection_value', '14-day'), labelKey: 'home.seller.stat_protection_label', labelFallback: 'Buyer protection' },
              ].map((s) => (
                <div
                  key={s.labelKey}
                  className="rounded-xl bg-indigo-900 ring-1 ring-white/10 px-5 py-4"
                >
                  <p className="text-xl font-semibold text-white">{s.value}</p>
                  <p className="text-xs text-indigo-200 mt-1">{t(s.labelKey, s.labelFallback)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP (reassurance close, before the discover feed) ──────── */}
      {/* Closing reassurance beat after the editorial/merchandising sections,
          placed just above the infinite Discover feed so it is actually seen
          rather than buried below an endless scroll. Elevated white Atlas cards
          with a Playfair / Arabic section heading and indigo brand tiles. */}
      <section className="bg-gray-50 border-t border-gray-100" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-9 sm:mb-12">
            <h2 id="trust-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isArabicScript ? (
                <span dir="rtl" lang="ar" className="font-arabic">
                  {t('home.trust.label', 'علاش تشري من Beldify')}
                </span>
              ) : (
                <span style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
                  {t('home.trust.label', 'Why shop with Beldify')}
                </span>
              )}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
            {([
              { labelKey: 'home.trust.free_delivery', labelFallback: 'Free delivery +500 MAD', subKey: 'home.trust.delivery_sub', subFallback: 'In major cities in 48 hours', Icon: Truck },
              { labelKey: 'home.trust.returns', labelFallback: '14-day returns', subKey: 'home.trust.returns_sub', subFallback: 'No fees, no hassle', Icon: RotateCcw },
              { labelKey: 'home.trust.verified_sellers', labelFallback: 'Verified sellers', subKey: 'home.trust.sellers_sub', subFallback: 'Workshops inspected one by one', Icon: ShieldCheck },
              { labelKey: 'home.trust.support', labelFallback: 'Support AR / FR / EN', subKey: 'home.trust.support_sub', subFallback: 'WhatsApp, phone, email', Icon: Headphones },
            ] as const).map(({ labelKey, labelFallback, subKey, subFallback, Icon }) => (
              <div
                key={labelKey}
                className="flex flex-col items-center gap-3 text-center rounded-2xl bg-white ring-1 ring-gray-200 shadow-atlas-sm px-4 py-6 sm:px-6 sm:py-8"
              >
                <span className="h-12 w-12 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center text-indigo-700">
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-gray-900 leading-snug">
                  {t(labelKey, labelFallback)}
                </span>
                <span className="text-xs text-gray-500 leading-relaxed">
                  {t(subKey, subFallback)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FROM SHOPS YOU FOLLOW ────────────────────────────────────────── */}
      <FollowedShopsRail />

      {/* ── DISCOVER FEED (infinite "more to love" feed) ─────────────────── */}
      <Suspense fallback={<LoadingSpinner />}>
        <DiscoverFeed />
      </Suspense>

      {/* ── RECENTLY VIEWED ──────────────────────────────────────────────── */}
      <RecentlyViewedRail />

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <Suspense fallback={<LoadingSpinner />}>
        <Newsletter />
      </Suspense>
    </div>
  );
}

// ─── Shop-by-Occasion Grid ──────────────────────────────────────────────────
// 4 tiles in a 2-col/4-col responsive grid. Full-bleed image + gradient scrim
// + bottom-anchored label + hover lift + image zoom — identical treatment to
// the editorial category grid above.

interface OccasionTileProps {
  href: string;
  image: string;
  label: string;
  desc: string;
  cta: string;
  index: string;
  isArabicScript: boolean;
}

function OccasionTile({ href, image, label, desc, cta, index, isArabicScript }: OccasionTileProps) {
  const [imgError, setImgError] = useState(false);
  const initial = label.charAt(0).toUpperCase();
  const showImage = !imgError && !!image;

  return (
    <Link
      href={href}
      aria-label={desc ? `${label} — ${desc}` : label}
      className="group relative block overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2 bg-white"
      style={{ aspectRatio: '4/5' }}
    >
      {showImage ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-4xl font-bold text-indigo-700/30 select-none" aria-hidden="true">
            {initial}
          </span>
        </div>
      )}

      {/* Richer, taller scrim so the multi-line copy stays legible over any image */}
      {showImage && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Editorial index number, top-start corner */}
      <span
        aria-hidden="true"
        className="absolute top-3 start-3.5 text-sm font-semibold tabular-nums text-white/45"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {index}
      </span>

      {/* Content block: title + tagline + persistent CTA */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <h3
          dir={isArabicScript ? 'rtl' : 'ltr'}
          className={`text-lg sm:text-xl font-semibold leading-tight text-white ${isArabicScript ? 'font-arabic' : ''}`}
          style={{
            fontFamily: isArabicScript ? undefined : '"Playfair Display", ui-serif, Georgia, serif',
            textShadow: '0 1px 8px rgba(0,0,0,0.55)',
          }}
        >
          {label}
        </h3>

        {desc && (
          <p
            dir={isArabicScript ? 'rtl' : 'ltr'}
            className={`mt-1 text-xs sm:text-[13px] leading-snug text-white/75 line-clamp-2 ${isArabicScript ? 'font-arabic' : ''}`}
          >
            {desc}
          </p>
        )}

        <span
          dir={isArabicScript ? 'rtl' : 'ltr'}
          className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white ${isArabicScript ? 'font-arabic' : 'uppercase tracking-[0.14em]'}`}
        >
          <span className="relative">
            {cta}
            <span
              className="absolute -bottom-0.5 start-0 h-px w-0 bg-amber-400 transition-all duration-300 group-hover:w-full"
              aria-hidden="true"
            />
          </span>
          <ArrowRight
            className="h-3.5 w-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

interface OccasionGridProps {
  categories: Category[];
  isArabicScript: boolean;
}

function OccasionGrid({ categories, isArabicScript }: OccasionGridProps) {
  const { t } = useTranslation();

  // Gifts tile: prefer a jewelry category image, fall back to caftan
  const jewelryCategory = categories.find(
    (c) => (c.slug || '').includes('jewelry') || (c.name_en || '').toLowerCase().includes('jewel')
  );
  const jewelryImage =
    jewelryCategory?.image ||
    'https://pro.beldify.com/storage/categories/category_4_caftan.png';

  const occasions = [
    {
      key: 'home.occasion.wedding',
      fallback: 'عرس',
      descKey: 'home.occasion.weddingDesc',
      descFallback: 'قفاطين، تكاشط وكسوة العرس',
      href: '/products?category=festive',
      image: 'https://pro.beldify.com/storage/categories/category_14_wedding-dresses.png',
    },
    {
      key: 'home.occasion.eid',
      fallback: 'عيد',
      descKey: 'home.occasion.eidDesc',
      descFallback: 'كسوة العيد لكامل العائلة',
      href: '/categories/caftan',
      image: 'https://pro.beldify.com/storage/categories/category_4_caftan.png',
    },
    {
      key: 'home.occasion.summer',
      fallback: 'صيف',
      descKey: 'home.occasion.summerDesc',
      descFallback: 'جلابات خفيفة وأطقم ديال الصيف',
      href: '/categories/womens-djellaba',
      image: 'https://pro.beldify.com/storage/categories/category_5_womens-djellaba.png',
    },
    {
      key: 'home.occasion.gifts',
      fallback: 'هدايا',
      descKey: 'home.occasion.giftsDesc',
      descFallback: 'حلي وهدايا كيعجبو',
      href: '/categories/jewelry',
      image: jewelryImage,
    },
  ] as const;

  return (
    <section
      className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-0 sm:pt-16 sm:pb-0"
      aria-label={t('home.occasion.title', 'تسوق حسب المناسبة')}
    >
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          {/* Eyebrow dot */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span className={`text-xs text-amber-700 font-medium ${isArabicScript ? 'font-arabic' : 'uppercase tracking-[0.18em]'}`}>
              {t('home.occasion.subtitle', 'لكل مناسبة اللباس الكيف')}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {isArabicScript ? (
              <span dir="rtl" lang="ar" className="font-arabic text-gray-900">
                {t('home.occasion.title', 'تسوق حسب المناسبة')}
              </span>
            ) : (
              <span style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
                {t('home.occasion.title', 'Shop by occasion')}
              </span>
            )}
          </h2>
        </div>
        <Link
          href="/categories"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
        >
          {t('home.categories.viewAll', 'All categories')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>

      {/* 4-tile grid: 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {occasions.map((occ, i) => (
          <OccasionTile
            key={occ.key}
            href={occ.href}
            image={occ.image}
            label={t(occ.key, occ.fallback)}
            desc={t(occ.descKey, occ.descFallback)}
            cta={t('home.occasion.cta', 'تسوّق الآن')}
            index={String(i + 1).padStart(2, '0')}
            isArabicScript={isArabicScript}
          />
        ))}
      </div>
    </section>
  );
}

