'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Scissors, Sparkles, ArrowRight, ShieldCheck, Star, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

interface ArtSlideProps {
  /** Which slide to render: 1 | 2 | 3 */
  slide: 1 | 2 | 3;
}

export function ArtSlide({ slide }: ArtSlideProps) {
  const { t, i18n } = useTranslation();
  const isArabicScript = ['ar', 'ma'].includes(i18n.language);
  const [imgError, setImgError] = useState(false);

  // ── SLIDE 1: Royal Emerald Gold Hijab Caftan (High Fashion Editorial) ───────
  if (slide === 1) {
    return (
      <div
        dir={isArabicScript ? 'rtl' : 'ltr'}
        className="relative isolate overflow-hidden h-[380px] sm:h-[480px] lg:h-[560px] flex items-center bg-indigo-950"
      >
        {/* Background photo + dark gradient scrim */}
        <div className="absolute inset-0 -z-10">
          {!imgError ? (
            <Image
              src="/images/hero-hijab-caftan-gold.png"
              alt={t('home.hero.slide1_img_alt', 'Royal Emerald Moroccan Caftan with Silk Hijab')}
              fill
              priority
              sizes="100vw"
              onError={() => setImgError(true)}
              className="object-cover object-top sm:object-center transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-indigo-950 to-indigo-900" />
          )}

          {/* Luxury dual gradient overlays — bottom-up + inline-start for high text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/95 via-indigo-950/45 to-transparent sm:via-indigo-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-950/60 to-transparent rtl:bg-gradient-to-l" />

          {/* Decorative Zellige Tile Motif */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            aria-hidden="true"
            style={{
              backgroundImage: "url('/motifs/zellige-tile.svg')",
              backgroundSize: '120px 120px',
              backgroundRepeat: 'repeat',
            }}
          />
        </div>

        {/* Floating Glassmorphism Detail Card — Top right (Desktop) */}
        <div
          className="hidden lg:flex absolute top-10 end-12 z-20 items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3.5 shadow-2xl text-white max-w-xs"
          aria-hidden="true"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-amber-300 uppercase">
              {t('home.hero.slide1_badge', 'Haute Couture')}
            </p>
            <p className="text-xs text-white/90 font-medium leading-snug">
              {t('home.hero.slide1_badge_desc', '100% Pure Velvet & Hand-Embroidered Gold Sfifa')}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10">
          <div className="max-w-xl sm:max-w-2xl">
            {/* Eyebrow chip */}
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40 shadow-lg mb-3">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-hidden="true" />
              {t('home.hero.art_slide1_eyebrow', 'Royal Heritage Collection')}
            </span>

            {/* Headline with Playfair Display / Arabic Calligraphy styling */}
            <h1
              className={`mt-2 text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white ${
                isArabicScript ? 'font-arabic' : ''
              }`}
              style={isArabicScript ? undefined : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('home.hero.art_slide1_headline', 'Haute Couture Moroccan Caftans')}
            </h1>

            {/* Subline */}
            <p className="mt-3.5 text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-lg font-normal">
              {t('home.hero.art_slide1_subline', 'Hand-finished by Morocco’s most distinguished master artisans. Timeless royal elegance paired with modern modesty.')}
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/products?category=caftan"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold text-amber-950 transition-all duration-300 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[46px]"
              >
                {t('home.hero.art_slide1_cta', 'Shop Caftan Collection')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>

              <Link
                href="/services/tailoring"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-white border border-white/30 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[46px]"
              >
                <Scissors className="h-4 w-4 text-amber-300" aria-hidden="true" />
                {t('home.hero.art_slide1_secondary_cta', 'Custom Tailoring')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SLIDE 2: Dusty Rose & Ivory Bridal / Festive Hijab Caftan ──────────────
  if (slide === 2) {
    return (
      <div
        dir={isArabicScript ? 'rtl' : 'ltr'}
        className="relative isolate overflow-hidden h-[380px] sm:h-[480px] lg:h-[560px] flex items-center bg-stone-900"
      >
        {/* Background photo + scrim */}
        <div className="absolute inset-0 -z-10">
          {!imgError ? (
            <Image
              src="/images/hero-hijab-caftan-rose.png"
              alt={t('home.hero.slide2_img_alt', 'Dusty Rose Silk Moroccan Caftan with Hijab')}
              fill
              priority
              sizes="100vw"
              onError={() => setImgError(true)}
              className="object-cover object-top sm:object-center transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-950 via-stone-900 to-amber-950" />
          )}

          {/* Scrim overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-transparent rtl:bg-gradient-to-l" />
        </div>

        {/* Floating Glassmorphism Detail Card */}
        <div
          className="hidden lg:flex absolute top-10 end-12 z-20 items-center gap-3 rounded-2xl bg-stone-900/40 backdrop-blur-md border border-white/15 p-3.5 shadow-2xl text-white max-w-xs"
          aria-hidden="true"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-rose-300 uppercase">
              {t('home.hero.slide2_badge', 'Made to Measure')}
            </p>
            <p className="text-xs text-white/90 font-medium leading-snug">
              {t('home.hero.slide2_badge_desc', 'Hand-tailored for your wedding & special celebrations')}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10">
          <div className="max-w-xl sm:max-w-2xl">
            {/* Eyebrow chip */}
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-400/40 shadow-lg mb-3">
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.hero.art_slide2_eyebrow', 'Bridal & Festive Couture')}
            </span>

            {/* Headline */}
            <h2
              className={`mt-2 text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white ${
                isArabicScript ? 'font-arabic' : ''
              }`}
              style={isArabicScript ? undefined : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('home.hero.art_slide2_headline', 'Bespoke Bridal & Occasionwear')}
            </h2>

            {/* Subline */}
            <p className="mt-3.5 text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-lg font-normal">
              {t('home.hero.art_slide2_subline', 'Custom fitted to your exact measurements, crafted with premium silk, pearls, and golden Mdamma belts.')}
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/services/tailoring"
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-rose-400 hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[46px]"
              >
                {t('home.hero.art_slide2_cta', 'Start a Tailoring Order')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>

              <Link
                href="/products?category=festive"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-white border border-white/30 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[46px]"
              >
                {t('home.hero.art_slide2_secondary_cta', 'Explore Festive Range')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SLIDE 3: Open Souk — Community Briefs & Bespoke Requests ──────────────
  return (
    <div
      dir={isArabicScript ? 'rtl' : 'ltr'}
      className="relative isolate overflow-hidden h-[380px] sm:h-[480px] lg:h-[560px] flex items-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-amber-950"
    >
      {/* Decorative motifs */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        aria-hidden="true"
        style={{
          backgroundImage: "url('/motifs/zellige-tile.svg')",
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_80%_20%,_rgba(245,158,11,0.25)_0,_transparent_60%)]"
      />

      {/* Floating Glassmorphism Detail Card */}
      <div
        className="hidden lg:flex absolute top-10 end-12 z-20 items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3.5 shadow-2xl text-white max-w-xs"
        aria-hidden="true"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-amber-300 uppercase">
            {t('home.hero.slide3_badge', 'Open Souk Marketplace')}
          </p>
          <p className="text-xs text-white/90 font-medium leading-snug">
            {t('home.hero.slide3_badge_desc', 'Post your custom caftan design & get competitive artisan offers')}
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10">
        <div className="max-w-xl sm:max-w-2xl">
          {/* Eyebrow chip */}
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40 shadow-lg mb-3">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {t('home.openSouk.eyebrow', 'Community Marketplace')}
          </span>

          {/* Headline */}
          <h2
            className={`mt-2 text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white ${
              isArabicScript ? 'font-arabic' : ''
            }`}
            style={isArabicScript ? undefined : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('home.hero.art_slide3_headline', 'Open Souk — Post Your Dream Caftan Brief')}
          </h2>

          {/* Subline */}
          <p className="mt-3.5 text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-lg font-normal">
            {t('home.hero.art_slide3_subline', 'Have a specific design in mind? Upload your picture or description and let verified Moroccan ateliers submit bids for your custom piece.')}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/community/posts/create"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold text-amber-950 transition-all duration-300 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[46px]"
            >
              {t('home.hero.art_slide3_cta', 'Post a Brief Now')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>

            <Link
              href="/community"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-white border border-white/30 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[46px]"
            >
              {t('home.hero.art_slide3_secondary_cta', 'Browse Open Requests')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignArtSlides() {
  return (
    <>
      <ArtSlide slide={1} />
      <ArtSlide slide={2} />
      <ArtSlide slide={3} />
    </>
  );
}

