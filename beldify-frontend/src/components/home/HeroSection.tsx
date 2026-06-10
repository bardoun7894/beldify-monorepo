'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, A11y, Keyboard } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import CampaignArtSlides, { ArtSlide } from './CampaignArtSlides';
import BrandHeroSlide from './BrandHeroSlide';
import '@/i18n/config';

// Swiper CSS — import core + pagination module styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/a11y';

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  /** 'left' | 'right' | 'center' — maps to logical CSS (start/end) so RTL flips correctly */
  text_position: string;
}

export interface HeroConfig {
  mode: 'brand' | 'campaign';
  banners: HeroBanner[];
}

interface HeroSectionProps {
  hero: HeroConfig;
}

/**
 * Resolve text_position value to Tailwind logical alignment classes.
 * 'left' → items-start / text-start (logical: start of inline axis)
 * 'right' → items-end / text-end
 * 'center' → items-center / text-center
 * RTL-safe: CSS logical properties mean start=right and end=left in RTL.
 */
function positionClasses(text_position: string): string {
  switch (text_position) {
    case 'right':
      return 'items-end text-end';
    case 'center':
      return 'items-center text-center';
    case 'left':
    default:
      return 'items-start text-start';
  }
}

/**
 * BannerSlide — a single campaign banner slide (DB-driven).
 * Full-bleed next/image + indigo gradient + localized copy + amber CTA chip.
 */
function BannerSlide({ banner, isFirst }: { banner: HeroBanner; isFirst: boolean }) {
  const alignment = positionClasses(banner.text_position);

  return (
    <div className="relative isolate overflow-hidden min-h-[38vh] lg:min-h-[45vh] flex items-center">
      {/* Full-bleed background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          priority={isFirst}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradient overlay for legibility — indigo-950 dark to translucent */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/70 to-indigo-950/20" />
      </div>

      {/* Content */}
      <div className={`mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 sm:py-14 lg:py-16 flex flex-col ${alignment}`}>
        <div className="max-w-lg">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-white">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-3 text-base sm:text-lg text-white/80 leading-relaxed">
              {banner.subtitle}
            </p>
          )}
          {banner.button_text && banner.button_link && (
            <div className="mt-5">
              <Link
                href={banner.button_link}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              >
                {banner.button_text}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * HeroSection — the top-of-page hero component.
 *
 * Behavior (updated for campaign-art hero):
 *  - mode 'brand' OR banners.length === 0 → render CampaignArtSlides Swiper carousel
 *    (3 built-in art slides — no photos, pure CSS/SVG gradients)
 *  - mode 'campaign' AND banners.length > 0 → Swiper carousel:
 *      slides 0..2 = the 3 art slides (CampaignArtSlides)
 *      slides 3..N = one BannerSlide per DB banner
 *
 * Carousel specs:
 *  - autoplay delay: 6000ms, pauseOnMouseEnter: true
 *  - loop: true
 *  - Pagination dots:
 *      Slides 1-2 (indigo bg): white/40 inactive, amber-500 active
 *      Slide 3 (amber bg): indigo-950/30 inactive, indigo-950 active
 *  - RTL: Swiper reads `dir` from the DOM
 *  - prefers-reduced-motion: autoplay disabled
 */
export default function HeroSection({ hero }: HeroSectionProps) {
  const { t } = useTranslation();
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion on mount (client-only)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const showDBBanners = hero.mode === 'campaign' && hero.banners.length > 0;

  // Both brand mode AND campaign mode (no banners) → render built-in art carousel
  // Campaign mode with DB banners → art slides first, then DB banner slides
  return (
    <section
      className="relative min-h-[38vh] lg:min-h-[45vh]"
      aria-label={t('home.hero.section_label', 'Hero')}
    >
      {/* Atlas dot styling — override default swiper blue with brand tokens */}
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.4);
          opacity: 1;
          width: 8px;
          height: 8px;
          transition: background 200ms, transform 200ms;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: rgb(245 158 11); /* amber-500 */
          transform: scale(1.25);
        }
        /* Slide 3 (amber background) — invert dots to indigo-950 for visibility */
        .hero-swiper-slide-3-active .swiper-pagination-bullet {
          background: rgba(30, 27, 75, 0.30); /* indigo-950/30 */
        }
        .hero-swiper-slide-3-active .swiper-pagination-bullet-active {
          background: rgb(30 27 75); /* indigo-950 */
        }
      `}</style>

      <Swiper
        className="hero-swiper h-full"
        modules={[Autoplay, Pagination, A11y, Keyboard]}
        loop
        autoplay={
          reducedMotion
            ? false
            : { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }
        }
        pagination={{ clickable: true }}
        a11y={{
          prevSlideMessage: t('home.hero.carousel_prev', 'Previous slide'),
          nextSlideMessage: t('home.hero.carousel_next', 'Next slide'),
        }}
        keyboard={{ enabled: true }}
        onSlideChange={(swiper) => {
          // Toggle amber-slide dot variant on slide index 2 (0-based = slide 3)
          const container = swiper.el;
          const realIdx = swiper.realIndex;
          if (realIdx === 2) {
            container.classList.add('hero-swiper-slide-3-active');
          } else {
            container.classList.remove('hero-swiper-slide-3-active');
          }
        }}
      >
        {/* Art slides 0-2 — always present (default hero for brand mode) */}
        <SwiperSlide>
          <ArtSlide slide={1} />
        </SwiperSlide>
        <SwiperSlide>
          <ArtSlide slide={2} />
        </SwiperSlide>
        <SwiperSlide>
          <ArtSlide slide={3} />
        </SwiperSlide>

        {/* DB campaign banners — only rendered when mode=campaign AND banners exist */}
        {showDBBanners && hero.banners.map((banner, idx) => (
          <SwiperSlide key={banner.id}>
            <BannerSlide banner={banner} isFirst={idx === 0} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
