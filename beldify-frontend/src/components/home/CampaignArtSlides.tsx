'use client';

import Link from 'next/link';
import { Scissors, Truck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

/**
 * CampaignArtSlides — three built-in art slides for the default hero.
 *
 * Pure CSS/SVG art — NO photos. Replaces the dark photo hero (BrandHeroSlide)
 * with a Homzmart-style campaign carousel that works without any DB banners.
 *
 * Slide 1 — FREE DELIVERY: indigo-950→indigo-800 gradient + amber starburst
 * Slide 2 — TAILORING: indigo-900→indigo-700 gradient + oversized Lucide icons
 * Slide 3 — OPEN SOUK: amber-500→amber-600 gradient + indigo typography (inverted)
 *
 * Used by HeroSection as the default when mode=brand OR banners=[].
 * Also rendered as slide 0 in the campaign carousel.
 *
 * Heights: mobile h-[300px], tablet h-[400px], desktop h-[480px]
 * prefers-reduced-motion: decorative animations are suppressed via Tailwind
 * motion-safe: prefix on all animated classes.
 */

interface ArtSlideProps {
  /** Which slide to render: 1 | 2 | 3 */
  slide: 1 | 2 | 3;
}

export function ArtSlide({ slide }: ArtSlideProps) {
  const { t } = useTranslation();

  if (slide === 1) {
    return (
      <div className="relative isolate overflow-hidden h-[300px] sm:h-[400px] lg:h-[480px] flex items-center bg-gradient-to-br from-indigo-950 to-indigo-800">
        {/* Amber starburst/zellige pattern overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.10]"
          style={{
            backgroundImage: "url('/motifs/zellige-tile.svg')",
            backgroundSize: '80px 80px',
            backgroundRepeat: 'repeat',
          }}
        />
        {/* Radial amber warmth — bottom right */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_85%_90%,_rgba(245,158,11,0.25)_0,_transparent_55%)]"
        />

        {/* Truck icon — decorative oversized shape */}
        <div aria-hidden="true" className="absolute -end-12 top-1/2 -translate-y-1/2 opacity-[0.06] motion-safe:animate-pulse">
          <Truck className="h-64 w-64 text-amber-400" strokeWidth={0.5} />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10">
          <div className="max-w-xl">
            {/* Eyebrow chip */}
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.trust.free_delivery', 'Free delivery +500 MAD')}
            </span>

            {/* Headline */}
            <h2 className="mt-3 text-2xl sm:text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white">
              {t('home.hero.art_slide1_headline', 'Free delivery over 500 MAD')}
            </h2>

            {/* Subline */}
            <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-md">
              {t('home.hero.art_slide1_subline', 'Caftans and djellabas from trusted Moroccan ateliers')}
            </p>

            {/* CTA */}
            <div className="mt-5">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              >
                {t('home.hero.art_slide1_cta', 'Shop now')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slide === 2) {
    return (
      <div className="relative isolate overflow-hidden h-[300px] sm:h-[400px] lg:h-[480px] flex items-center bg-gradient-to-br from-indigo-900 to-indigo-700">
        {/* Oversized decorative Scissors icon — rotated, low opacity */}
        <div
          aria-hidden="true"
          className="absolute -start-16 top-1/2 -translate-y-1/2 -rotate-12 opacity-[0.08]"
        >
          <Scissors className="h-[200px] w-[200px] text-amber-200" strokeWidth={0.4} />
        </div>
        {/* Second Scissors — end side */}
        <div
          aria-hidden="true"
          className="absolute -end-8 bottom-4 rotate-45 opacity-[0.12]"
        >
          <Scissors className="h-[160px] w-[160px] text-white" strokeWidth={0.5} />
        </div>

        {/* Amber radial accent */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_80%,_rgba(245,158,11,0.20)_0,_transparent_55%)]"
        />

        {/* Content */}
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10">
          <div className="max-w-xl">
            {/* Eyebrow chip */}
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.tailoring.badge_ar', 'خياطة على القياس')}
            </span>

            {/* Headline */}
            <h2 className="mt-3 text-2xl sm:text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white">
              {t('home.hero.art_slide2_headline', 'Tailored to your measurements')}
            </h2>

            {/* Subline */}
            <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-md">
              {t('home.hero.art_slide2_subline', 'Choose your atelier, send your measurements, receive your piece at home')}
            </p>

            {/* CTA */}
            <div className="mt-5">
              <Link
                href="/services/tailoring"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              >
                {t('home.hero.art_slide2_cta', 'Start a tailoring order')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Slide 3 — OPEN SOUK (inverted: amber background, indigo typography)
  return (
    <div className="relative isolate overflow-hidden h-[300px] sm:h-[400px] lg:h-[480px] flex items-center bg-gradient-to-br from-amber-500 to-amber-600">
      {/* Indigo starburst/zellige pattern overlay on amber bg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage: "url('/motifs/zellige-tile.svg')",
          backgroundSize: '80px 80px',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Oversized Users icon — decorative */}
      <div
        aria-hidden="true"
        className="absolute -end-10 top-1/2 -translate-y-1/2 opacity-[0.12]"
      >
        <Users className="h-[200px] w-[200px] text-indigo-950" strokeWidth={0.5} />
      </div>
      {/* Radial depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_80%_20%,_rgba(67,56,202,0.15)_0,_transparent_50%)]"
      />

      {/* Content — indigo-950 typography on amber bg */}
      {/* Pagination dot variant for amber background: indigo dots */}
      <div
        className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10"
        data-slide-theme="amber"
      >
        <div className="max-w-xl">
          {/* Eyebrow chip — indigo on amber */}
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-950/10 px-3.5 py-1.5 text-xs font-medium text-indigo-950 ring-1 ring-indigo-950/20">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {t('home.openSouk.eyebrow', 'Community marketplace')}
          </span>

          {/* Headline — indigo-950 on amber */}
          <h2 className="mt-3 text-2xl sm:text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-indigo-950">
            {t('home.hero.art_slide3_headline', 'Open Souk — post your brief and let ateliers compete')}
          </h2>

          {/* Subline */}
          <p className="mt-3 text-sm sm:text-base text-indigo-950/70 leading-relaxed max-w-md">
            {t('home.hero.art_slide3_subline', 'Our artisans compete for your project')}
          </p>

          {/* CTA — indigo-950 bg white text */}
          <div className="mt-5">
            <Link
              href="/community/posts/create"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-950 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-800 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-950/40 min-h-[44px]"
            >
              {t('home.hero.art_slide3_cta', 'Post a brief now')}
            </Link>
          </div>
        </div>
      </div>

      {/*
        Dot color hint for slide 3 (amber bg):
        HeroSection reads [data-slide-theme="amber"] siblings to apply
        indigo-950 active dot color via the .hero-swiper-amber class.
      */}
    </div>
  );
}

/**
 * CampaignArtSlides — renders all 3 art slides as a fragment.
 * Used as the default hero content in HeroSection when there are no DB banners.
 * When used inside Swiper, each slide is wrapped in <SwiperSlide> by HeroSection.
 */
export default function CampaignArtSlides() {
  return (
    <>
      <ArtSlide slide={1} />
      <ArtSlide slide={2} />
      <ArtSlide slide={3} />
    </>
  );
}
