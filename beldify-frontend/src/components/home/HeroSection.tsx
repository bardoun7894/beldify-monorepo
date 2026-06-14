'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, A11y, Keyboard } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import SplitCanvasSlide from './SplitCanvasSlide';
import HeroSearchBar from './HeroSearchBar';
import { heroCompose } from './heroCompose';
import type { HeroProductItem } from './heroCompose';
import '@/i18n/config';

// Swiper CSS
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
  /** 'left' | 'right' | 'center' — maps to logical imageSide in heroCompose */
  text_position: string;
}

export interface HeroConfig {
  mode: 'brand' | 'campaign';
  banners: HeroBanner[];
}

interface HeroSectionProps {
  hero: HeroConfig;
  /**
   * Usable product items for the hero carousel.
   * Pre-filtered by HomeContent: real images only, no placeholder-product.svg,
   * capped at 4. heroCompose will take at most 2.
   */
  products?: HeroProductItem[];
}

/**
 * HeroSection — unified hero component (010 revamp).
 *
 * Uses heroCompose() to build a HeroSlideData[] from config + products,
 * then renders a single Swiper of SplitCanvasSlide components.
 *
 * No more 3-way if/else — heroCompose handles ordering and fallbacks:
 *   banners → products → art slides (always ≥1 slide, cap ≤6)
 *
 * Carousel specs:
 *  - autoplay delay: 6000ms, pauseOnMouseEnter: true
 *  - loop: true
 *  - Pagination dots: styled in globals.css with Atlas tokens (.hero-swiper)
 *  - RTL: Swiper reads dir from the DOM
 *  - prefers-reduced-motion: autoplay disabled
 *  - a11y: Swiper A11y labels from i18n
 *  - keyboard: enabled
 *
 * HeroSearchBar is rendered below the carousel as a persistent search entry point.
 */
export default function HeroSection({ hero, products = [] }: HeroSectionProps) {
  const { t } = useTranslation();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const slides = heroCompose(hero, products);

  return (
    <section
      aria-label={t('home.hero.section_label', 'Hero')}
      className="flex flex-col"
    >
      {/* Hero Carousel */}
      <div className="relative min-h-[38vh] lg:min-h-[45vh]">
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
        >
          {slides.map((slide, idx) => (
            <SwiperSlide
              key={slide.id}
            >
              <SplitCanvasSlide slide={slide} isFirst={idx === 0} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Search Bar — persistent, below carousel */}
      <div className="bg-canvas border-b px-4 sm:px-6 py-3" style={{ borderColor: 'hsl(var(--outline) / 0.12)' }}>
        <div className="mx-auto max-w-2xl">
          <HeroSearchBar />
        </div>
      </div>
    </section>
  );
}
