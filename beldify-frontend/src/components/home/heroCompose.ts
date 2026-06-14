/**
 * heroCompose — pure helper that builds the HeroSlideData[] array from
 * HeroConfig (DB banners + mode) and an optional product list.
 *
 * Ordering: banners → products → art slides
 * Cap: ≤6 total slides
 * Guarantee: always ≥1 slide (art slides fill the gap when nothing else is present)
 * Dedupe: slide ids are namespaced (banner-N, product-N, art-N) — no collisions
 *
 * NOTE: This is a pure function — no hooks, no side effects. Safe to import in
 * server and client components alike.
 */

import type { HeroConfig, HeroBanner } from './HeroSection';

/**
 * HeroProductItem — shape consumed by heroCompose for product slides.
 * Defined here (single source of truth) so that HeroSection and HomeContent
 * can import it without depending on the now-deleted ProductHeroSlides.tsx.
 */
export interface HeroProductItem {
  id: number;
  name: string;
  name_ar?: string | null;
  price: number;
  compare_price?: number | string | null;
  discount_price?: number | string | null;
  has_discount?: boolean;
  image: string;
}

export type HeroSlideKind = 'banner' | 'product' | 'art';

export interface HeroSlideData {
  id: string;
  kind: HeroSlideKind;
  /** Which half the image occupies. 'start' = image on leading side, 'end' = image on trailing side. */
  imageSide: 'start' | 'end';
  title: string;
  subtitle?: string;
  eyebrow?: string;
  ctaText?: string;
  ctaHref: string;
  imageUrl?: string;
  /** Only present when kind='art' */
  artVariant?: 1 | 2 | 3;
  /** Price for product slides */
  price?: number;
  /**
   * i18n keys for art slides — resolved via t() in SplitCanvasSlide so strings
   * are locale-reactive. Present only for kind='art' slides.
   * The fallback (title/subtitle/ctaText) is used if t() returns the key itself.
   */
  titleKey?: string;
  subtitleKey?: string;
  ctaKey?: string;
}

/**
 * Map text_position from the DB to the logical imageSide convention.
 *
 * text_position names the TEXT side; imageSide names the IMAGE side.
 * API 'right' → image on the trailing side ('end'); 'left'/default → image on the leading side ('start').
 */
function toImageSide(text_position: string): 'start' | 'end' {
  switch (text_position) {
    case 'right':
      return 'end';
    case 'left':
    default:
      return 'start';
  }
}

/** Art slide definitions (static, always available as fallback) */
const ART_SLIDES: HeroSlideData[] = [
  {
    id: 'art-1',
    kind: 'art',
    imageSide: 'end',
    title: 'Free delivery over 500 MAD',
    subtitle: 'Caftans and djellabas from trusted Moroccan ateliers',
    eyebrow: 'Free delivery +500 MAD',
    ctaText: 'Shop now',
    ctaHref: '/products',
    artVariant: 1,
    titleKey: 'home.hero.art_slide1_headline',
    subtitleKey: 'home.hero.art_slide1_subline',
    ctaKey: 'home.hero.art_slide1_cta',
  },
  {
    id: 'art-2',
    kind: 'art',
    imageSide: 'start',
    title: 'Tailored to your measurements',
    subtitle: 'Choose your atelier, send your measurements, receive your piece at home',
    eyebrow: 'Bespoke tailoring',
    ctaText: 'Start a tailoring order',
    ctaHref: '/services/tailoring',
    artVariant: 2,
    titleKey: 'home.hero.art_slide2_headline',
    subtitleKey: 'home.hero.art_slide2_subline',
    ctaKey: 'home.hero.art_slide2_cta',
  },
  {
    id: 'art-3',
    kind: 'art',
    imageSide: 'end',
    title: 'Open Souk — post your brief and let ateliers compete',
    subtitle: 'Our artisans compete for your project',
    eyebrow: 'Community marketplace',
    ctaText: 'Post a brief now',
    ctaHref: '/community/posts/create',
    artVariant: 3,
    titleKey: 'home.hero.art_slide3_headline',
    subtitleKey: 'home.hero.art_slide3_subline',
    ctaKey: 'home.hero.art_slide3_cta',
  },
];

function bannerToSlide(banner: HeroBanner): HeroSlideData {
  return {
    id: `banner-${banner.id}`,
    kind: 'banner',
    imageSide: toImageSide(banner.text_position),
    title: banner.title,
    subtitle: banner.subtitle,
    ctaText: banner.button_text,
    ctaHref: banner.button_link || '/products',
    imageUrl: banner.image_url,
  };
}

function productToSlide(product: HeroProductItem): HeroSlideData {
  return {
    id: `product-${product.id}`,
    kind: 'product',
    imageSide: 'end',
    title: product.name,
    ctaText: 'View product',
    ctaHref: `/products/${product.id}`,
    imageUrl: product.image,
    price: product.price,
  };
}

/**
 * Compose the final HeroSlideData[] from config + products.
 *
 * @param hero - HeroConfig (mode + banners from /api/hero-config)
 * @param products - Pre-filtered HeroProductItem[] (max 4 recommended images)
 * @returns HeroSlideData[] of length [1, 6]
 */
export function heroCompose(hero: HeroConfig, products: HeroProductItem[]): HeroSlideData[] {
  const MAX_SLIDES = 6;
  const MAX_PRODUCTS = 2;
  const slides: HeroSlideData[] = [];

  // 1. Banners first (campaign mode only)
  if (hero.mode === 'campaign' && hero.banners.length > 0) {
    for (const banner of hero.banners) {
      if (slides.length >= MAX_SLIDES) break;
      slides.push(bannerToSlide(banner));
    }
  }

  // 2. Product slides (cap at MAX_PRODUCTS)
  const productSlots = Math.min(products.length, MAX_PRODUCTS);
  for (let i = 0; i < productSlots; i++) {
    if (slides.length >= MAX_SLIDES) break;
    slides.push(productToSlide(products[i]));
  }

  // 3. Fill remaining slots with art slides (guarantee ≥1 total)
  for (const artSlide of ART_SLIDES) {
    if (slides.length >= MAX_SLIDES) break;
    slides.push(artSlide);
  }

  // If somehow still empty (shouldn't happen given art slides), add first art slide
  if (slides.length === 0) {
    slides.push(ART_SLIDES[0]);
  }

  return slides;
}
