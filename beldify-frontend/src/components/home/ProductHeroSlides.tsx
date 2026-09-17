'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y, Keyboard } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import '@/i18n/config';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/a11y';

export interface HeroProductItem {
  id: number;
  name: string;
  name_ar?: string | null;
  price: number;
  /** Current/sale price — if set and lower than price, shows discount badge */
  compare_price?: number | string | null;
  discount_price?: number | string | null;
  has_discount?: boolean;
  image: string;
}

interface ProductHeroSlidesProps {
  products: HeroProductItem[];
}

/**
 * ProductHeroSlides — product-driven hero carousel.
 *
 * Renders up to 4 product slides, each with:
 *  - Full-bleed product image (next/image fill, object-cover)
 *  - Gradient scrim for text legibility
 *  - Locale-aware product name (name_ar for Arabic-script locales, name otherwise)
 *  - Price with .currency-mad convention
 *  - Discount badge (rose-700) when a compare/discount price exists
 *  - CTA button deep-linking to /products/{id}
 *
 * Heights match CampaignArtSlides: h-[260px] / sm:h-[340px] / lg:h-[400px]
 * Autoplay: 5000ms, pauseOnMouseEnter, loop
 * prefers-reduced-motion: autoplay disabled
 * RTL: Swiper reads dir from DOM; logical CSS properties used throughout
 */
export default function ProductHeroSlides({ products }: ProductHeroSlidesProps) {
  const { t, i18n } = useTranslation();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const lang = i18n.language || 'en';
  const isArabicScript = lang === 'ar' || lang === 'ma';
  const isRTL = isArabicScript;

  const displayName = (p: HeroProductItem) =>
    isArabicScript ? (p.name_ar || p.name) : p.name;

  /** Resolve the original/compare price for discount badge */
  const resolveDiscount = (p: HeroProductItem): { hasDiscount: boolean; pct: number } => {
    const currentPrice = Number(p.price) || 0;
    if (p.has_discount && p.discount_price) {
      const original = currentPrice; // price is already the full price
      const sale = Number(p.discount_price) || 0;
      if (original > sale && original > 0) {
        return { hasDiscount: true, pct: Math.round((1 - sale / original) * 100) };
      }
    }
    if (p.compare_price) {
      const compareNum = Number(p.compare_price) || 0;
      if (compareNum > currentPrice && compareNum > 0) {
        return { hasDiscount: true, pct: Math.round((1 - currentPrice / compareNum) * 100) };
      }
    }
    return { hasDiscount: false, pct: 0 };
  };

  /** Format price in locale-appropriate MAD string */
  const formatMAD = (price: number) => {
    const locale = isArabicScript ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'MAD',
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return `${price} MAD`;
    }
  };

  return (
    <section
      className="relative h-[300px] sm:h-[400px] lg:h-[480px]"
      aria-label={t('home.hero.section_label', 'Hero')}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Atlas dot styling — amber-500 active, white/40 inactive */}
      {/* Navigation arrow override — subtle translucent circles, lg+ only */}
      <style>{`
        .product-hero-swiper .swiper-pagination-bullet {
          position: relative;
          background: rgba(255,255,255,0.4);
          opacity: 1;
          width: 8px;
          height: 8px;
          transition: background 200ms, transform 200ms;
        }
        /* Visual dot stays 8px (Atlas), but the tap target grows to 44px —
           WCAG 2.5.5 target size on a real device without changing the look. */
        .product-hero-swiper .swiper-pagination-bullet::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 44px;
          height: 44px;
          transform: translate(-50%, -50%);
        }
        .product-hero-swiper .swiper-pagination-bullet-active {
          background: rgb(245 158 11); /* amber-500 */
          transform: scale(1.25);
        }
        .product-hero-swiper .swiper-button-prev,
        .product-hero-swiper .swiper-button-next {
          display: none;
        }
        @media (min-width: 1024px) {
          .product-hero-swiper .swiper-button-prev,
          .product-hero-swiper .swiper-button-next {
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
          .product-hero-swiper .swiper-button-prev:hover,
          .product-hero-swiper .swiper-button-next:hover {
            background: rgba(255,255,255,0.25);
          }
          .product-hero-swiper .swiper-button-prev:focus-visible,
          .product-hero-swiper .swiper-button-next:focus-visible {
            outline: 2px solid rgb(245 158 11); /* amber-500 */
            outline-offset: 2px;
          }
          .product-hero-swiper .swiper-button-prev::after,
          .product-hero-swiper .swiper-button-next::after {
            font-size: 14px;
            font-weight: 700;
          }
        }
      `}</style>

      <Swiper
        className="product-hero-swiper h-full"
        modules={[Autoplay, Pagination, Navigation, A11y, Keyboard]}
        loop
        autoplay={
          reducedMotion
            ? false
            : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
        }
        pagination={{ clickable: true }}
        navigation
        a11y={{
          prevSlideMessage: t('home.hero.carousel_prev', 'Previous slide'),
          nextSlideMessage: t('home.hero.carousel_next', 'Next slide'),
        }}
        keyboard={{ enabled: true }}
      >
        {products.map((product, idx) => {
          const { hasDiscount, pct } = resolveDiscount(product);
          const salePrice =
            product.has_discount && product.discount_price
              ? Number(product.discount_price)
              : Number(product.price);
          const name = displayName(product);

          return (
            <SwiperSlide key={product.id}>
              <div className="relative h-[300px] sm:h-[400px] lg:h-[480px] overflow-hidden">
                {/* Full-bleed product image */}
                <div className="absolute inset-0 -z-10">
                  <Image
                    src={product.image}
                    alt={name}
                    fill
                    priority={idx === 0}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                  {/* Gradient scrim — bottom-up (primary legibility) + start-side (busy images) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/85 via-indigo-950/25 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 to-transparent rtl:bg-gradient-to-l" />
                </div>

                {/* Discount badge — top-end, rose-700 matching ProductCard convention */}
                {hasDiscount && pct > 0 && (
                  <div className="absolute top-3 end-3 z-10">
                    <span className="inline-flex items-center rounded-full bg-rose-700 px-2.5 py-1 text-xs font-bold text-white tabular-nums shadow-sm">
                      -{pct}%
                    </span>
                  </div>
                )}

                {/* Content — bottom-anchored text + CTA */}
                <div className="absolute inset-0 flex items-end pb-8 sm:pb-10 lg:pb-14">
                  <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
                    <div className="max-w-lg">
                      {/* Eyebrow chip — consistent with ArtSlide eyebrow style */}
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('home.hero.product_eyebrow', 'Handcrafted in Morocco')}
                      </span>

                      {/* Product name — locale-aware */}
                      <h2
                        className="mt-3 text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight text-white"
                        dir={isArabicScript ? 'rtl' : 'ltr'}
                        lang={isArabicScript ? 'ar' : undefined}
                        style={isArabicScript ? undefined : {
                          fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
                        }}
                      >
                        {name}
                      </h2>

                      {/* Price row */}
                      <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                        <span className="currency-mad text-amber-300 font-extrabold text-lg sm:text-xl tabular-nums">
                          {formatMAD(salePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-white/55 line-through text-sm tabular-nums">
                            {formatMAD(Number(product.price))}
                          </span>
                        )}
                      </div>

                      {/* CTA — deep link to product page */}
                      <div className="mt-4">
                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-amber-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
                        >
                          {t('home.hero.cta_shop', 'Shop now')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
