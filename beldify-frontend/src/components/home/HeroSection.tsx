'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y, Keyboard } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import CampaignArtSlides, { ArtSlide } from './CampaignArtSlides';
import BrandHeroSlide from './BrandHeroSlide';
import ProductHeroSlides, { type HeroProductItem } from './ProductHeroSlides';
import { Sparkles } from 'lucide-react';
import '@/i18n/config';

// Swiper CSS — import core + pagination + navigation module styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
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
  /**
   * Usable product items for the product-photo hero carousel.
   * Pre-filtered by HomeContent: real images only, no placeholder-product.svg,
   * capped at 4. When ≥2 items are present and mode is not campaign+banners,
   * ProductHeroSlides renders instead of the art carousel.
   */
  products?: HeroProductItem[];
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
  const { t, i18n } = useTranslation();
  const isArabicScript = ['ar', 'ma'].includes(i18n.language);
  const alignment = positionClasses(banner.text_position);

  return (
    <div
      dir={isArabicScript ? 'rtl' : 'ltr'}
      className="relative isolate overflow-hidden h-[300px] sm:h-[400px] lg:h-[480px] flex items-center"
    >
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
        {/* Gradient scrim — bottom-up + start-side for legibility on busy images */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/85 via-indigo-950/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 to-transparent rtl:bg-gradient-to-l" />
      </div>

      {/* Content */}
      <div className={`mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 sm:py-14 lg:py-16 flex flex-col ${alignment}`}>
        <div className="max-w-lg">
          {/* Eyebrow chip — consistent with ProductHeroSlides and ArtSlides */}
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t('home.hero.banner_eyebrow', 'Featured collection')}
          </span>
          <h2
            className={`mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-white ${isArabicScript ? 'font-arabic' : ''}`}
            lang={isArabicScript ? 'ar' : undefined}
            style={isArabicScript ? undefined : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
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
 * Decision logic (priority order):
 *  1. mode 'campaign' AND banners.length > 0 → campaign banner Swiper carousel
 *     (art slides 0-2 + DB banners 3..N — unchanged behavior)
 *  2. products ≥ 2 (usable, pre-filtered by HomeContent) → ProductHeroSlides
 *     (product-photo hero — sells better than art slides)
 *  3. last-resort fallback → CampaignArtSlides art carousel
 *     (pure CSS/SVG, no photos needed)
 *
 * Carousel specs (campaign banner path):
 *  - autoplay delay: 6000ms, pauseOnMouseEnter: true
 *  - loop: true
 *  - Pagination dots: white/40 inactive, amber-500 active;
 *    slide-3 amber bg inverts dots to indigo-950
 *  - RTL: Swiper reads `dir` from the DOM
 *  - prefers-reduced-motion: autoplay disabled
 */
export default function HeroSection({ hero, products = [] }: HeroSectionProps) {
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
  const showProductHero = !showDBBanners && products.length >= 2;

  // ── Path 2 — ProductHeroSlides (product-photo carousel, best for conversion) ─
  if (showProductHero) {
    return <ProductHeroSlides products={products} />;
  }

  // ── Path 1 + 3 — campaign banner carousel OR art-slides fallback ──────────
  // Path 1: campaign banners present → art slides (0-2) + DB banner slides (3-N)
  // Path 3: no banners, <2 products → art slides only (last-resort fallback)
  return (
    <section
      className="relative h-[300px] sm:h-[400px] lg:h-[480px]"
      aria-label={t('home.hero.section_label', 'Hero')}
    >
      {/* Atlas dot styling — override default swiper blue with brand tokens */}
      {/* Navigation arrow override — hidden on mobile, shown on lg+ */}
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          position: relative;
          background: rgba(255,255,255,0.4);
          opacity: 1;
          width: 8px;
          height: 8px;
          transition: background 200ms, transform 200ms;
        }
        /* Visual dot stays 8px (Atlas), but the tap target grows to 44px —
           WCAG 2.5.5 target size on a real device without changing the look. */
        .hero-swiper .swiper-pagination-bullet::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 44px;
          height: 44px;
          transform: translate(-50%, -50%);
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
        /* Navigation buttons — hidden on mobile, visible on lg+ */
        .hero-swiper .swiper-button-prev,
        .hero-swiper .swiper-button-next {
          display: none;
        }
        @media (min-width: 1024px) {
          .hero-swiper .swiper-button-prev,
          .hero-swiper .swiper-button-next {
            display: flex;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(4px);
            color: white;
            border: 1px solid rgba(255,255,255,0.25);
            transition: background 200ms;
          }
          .hero-swiper .swiper-button-prev:hover,
          .hero-swiper .swiper-button-next:hover {
            background: rgba(255,255,255,0.25);
          }
          .hero-swiper .swiper-button-prev:focus-visible,
          .hero-swiper .swiper-button-next:focus-visible {
            outline: 2px solid rgb(245 158 11); /* amber-500 */
            outline-offset: 2px;
          }
          .hero-swiper .swiper-button-prev::after,
          .hero-swiper .swiper-button-next::after {
            font-size: 14px;
            font-weight: 700;
          }
        }
      `}</style>

      <Swiper
        className="hero-swiper h-full"
        modules={[Autoplay, Pagination, Navigation, A11y, Keyboard]}
        loop
        autoplay={
          reducedMotion
            ? false
            : { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }
        }
        pagination={{ clickable: true }}
        navigation
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
        {/* Art slides 0-2 — always present (default hero for brand mode + fallback) */}
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
