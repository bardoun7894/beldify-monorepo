'use client';

/**
 * SplitCanvasSlide — unified hero slide component for the 010 revamp.
 *
 * Renders any HeroSlideData as a 50/50 split-canvas slide:
 *  - Leading (start) or trailing (end): image panel (next/image fill, object-cover)
 *  - Opposite half: text panel on bg-canvas (near-white)
 *
 * Layout — LOGICAL (RTL-first):
 *  - Mobile: flex-col (image stacks on top, text below)
 *  - Desktop (lg+): flex layout based on imageSide prop, with RTL inversion:
 *    - imageSide='start' LTR: image on left | RTL: image on right  (lg:flex-row  + rtl:lg:flex-row-reverse)
 *    - imageSide='end'   LTR: image on right| RTL: image on left   (lg:flex-row-reverse + rtl:lg:flex-row)
 *
 * Atlas token compliance:
 *  - NO raw indigo-* or amber-* class literals
 *  - NO hex colors
 *  - Primary: hsl(var(--primary)) — Atlas deep indigo (primary token)
 *  - Secondary/CTA: hsl(var(--secondary)) — Atlas Saffron Amber (CTA / accents ONLY — 10%)
 *  - Canvas background: bg-canvas
 *  - Heading font: font-heading
 *  - 60-30-10: canvas = 60%, indigo = 30%, amber = 10% (accent/CTA only, no full-amber panels)
 *
 * Handles all three kinds:
 *  - 'banner' — DB-driven, uses next/image + title/subtitle/CTA
 *  - 'product' — product photo, name, price, shop CTA
 *  - 'art'    — pure CSS variant (1, 2, 3) — no photos needed
 *
 * FIX 3 — i18n: art slide strings are resolved via t() using titleKey/subtitleKey/ctaKey
 *   from HeroSlideData, with the static English strings as fallback. This makes
 *   art slides locale-reactive without breaking heroCompose's pure-function contract.
 *
 * a11y:
 *  - CTA has min-h-[44px] touch target
 *  - Images have meaningful alt text
 *  - priority on first slide
 */

import Image from 'next/image';
import Link from 'next/link';
import { Truck, Scissors, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { HeroSlideData } from './heroCompose';

interface SplitCanvasSlideProps {
  slide: HeroSlideData;
  /** Whether this is the first slide — enables next/image priority */
  isFirst?: boolean;
}

// ─── Art Variant Panels ────────────────────────────────────────────────────

function ArtVariant1() {
  const { t } = useTranslation();
  return (
    <div
      className="relative isolate overflow-hidden w-full h-full flex items-center justify-center"
      style={{ background: 'hsl(var(--primary))' }}
    >
      {/* Zellige motif overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage: "url('/motifs/zellige-tile.svg')",
          backgroundSize: '80px 80px',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Radial amber warmth accent */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 85% 90%, hsl(var(--secondary) / 0.25) 0, transparent 55%)',
        }}
      />
      {/* Decorative oversized icon */}
      <div
        aria-hidden="true"
        className="absolute -end-12 top-1/2 -translate-y-1/2 opacity-[0.06] motion-safe:animate-pulse"
      >
        <Truck className="h-64 w-64 text-white" strokeWidth={0.5} />
      </div>
      {/* Eyebrow chip */}
      <div className="relative z-10 mx-auto max-w-xs px-4 text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-[hsl(var(--secondary)/0.3)]"
          style={{
            background: 'hsl(var(--secondary) / 0.2)',
            color: 'hsl(var(--secondary))',
          }}
        >
          <Truck className="h-3.5 w-3.5" aria-hidden="true" />
          {t('home.trust.free_delivery', 'Free delivery +500 MAD')}
        </span>
      </div>
    </div>
  );
}

function ArtVariant2() {
  const { t } = useTranslation();
  return (
    <div
      className="relative isolate overflow-hidden w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-container)))' }}
    >
      {/* Decorative Scissors */}
      <div
        aria-hidden="true"
        className="absolute -start-16 top-1/2 -translate-y-1/2 -rotate-12 opacity-[0.08]"
      >
        <Scissors className="h-[200px] w-[200px] text-white" strokeWidth={0.4} />
      </div>
      <div
        aria-hidden="true"
        className="absolute -end-8 bottom-4 rotate-45 opacity-[0.12]"
      >
        <Scissors className="h-[160px] w-[160px] text-white" strokeWidth={0.5} />
      </div>
      {/* Amber radial accent */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 80%, hsl(var(--secondary) / 0.20) 0, transparent 55%)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-xs px-4 text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1"
          style={{
            background: 'hsl(var(--secondary) / 0.2)',
            color: 'hsl(var(--secondary))',
          }}
        >
          <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
          {t('home.tailoring.badge_ar', 'خياطة على القياس')}
        </span>
      </div>
    </div>
  );
}

/**
 * ArtVariant3 — Open Souk slide image panel.
 *
 * FIX 2: Redesigned to match the 60-30-10 Atlas rule.
 * Uses deep-indigo primary background (same as ArtVariant1/2), NOT a full-amber/saffron fill.
 * Amber is restricted to the CTA button in the text panel — never as a full background.
 */
function ArtVariant3() {
  const { t } = useTranslation();
  return (
    <div
      className="relative isolate overflow-hidden w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-container)))' }}
    >
      {/* Users icon — decorative */}
      <div
        aria-hidden="true"
        className="absolute -end-10 top-1/2 -translate-y-1/2 opacity-[0.10]"
      >
        <Users
          className="h-[200px] w-[200px] text-white"
          strokeWidth={0.5}
        />
      </div>
      {/* Subtle amber radial warmth — accent only, not dominant */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 15% 85%, hsl(var(--secondary) / 0.18) 0, transparent 50%)',
        }}
      />
      {/* Zellige motif overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: "url('/motifs/zellige-tile.svg')",
          backgroundSize: '80px 80px',
          backgroundRepeat: 'repeat',
        }}
      />
      <div className="relative z-10 mx-auto max-w-xs px-4 text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1"
          style={{
            background: 'hsl(var(--secondary) / 0.2)',
            color: 'hsl(var(--secondary))',
          }}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {t('home.openSouk.eyebrow', 'Community marketplace')}
        </span>
      </div>
    </div>
  );
}

function ArtPanel({ variant }: { variant: 1 | 2 | 3 }) {
  if (variant === 1) return <ArtVariant1 />;
  if (variant === 2) return <ArtVariant2 />;
  return <ArtVariant3 />;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function SplitCanvasSlide({ slide, isFirst = false }: SplitCanvasSlideProps) {
  const { t } = useTranslation();

  const isArt = slide.kind === 'art';
  const isEnd = slide.imageSide === 'end';

  // FIX 3 — locale-reactive strings for art slides.
  // Resolve via t() if i18n keys are present, falling back to the static English strings.
  const resolvedTitle = slide.titleKey ? t(slide.titleKey, slide.title) : slide.title;
  const resolvedSubtitle = slide.subtitleKey
    ? t(slide.subtitleKey, slide.subtitle ?? '')
    : slide.subtitle;
  const resolvedCtaText = slide.ctaKey ? t(slide.ctaKey, slide.ctaText ?? '') : slide.ctaText;

  // FIX 1 — RTL logical mirroring.
  // Physical flex-row/flex-row-reverse only works for LTR. To support RTL (Arabic),
  // we swap the direction using the [dir=rtl]: Tailwind variant:
  //   imageSide='start': image is on the leading (start) edge
  //     → LTR: flex-row (image first)   | RTL: flex-row-reverse (image on visual right = logical start)
  //   imageSide='end': image is on the trailing (end) edge
  //     → LTR: flex-row-reverse         | RTL: flex-row (image on visual left = logical end)
  const flexClass = isEnd
    ? 'lg:flex-row-reverse [dir=rtl]:lg:flex-row'
    : 'lg:flex-row [dir=rtl]:lg:flex-row-reverse';

  return (
    <div
      className={[
        'flex flex-col w-full h-full',
        flexClass,
      ].join(' ')}
    >
      {/* ── Image / Art Panel (50%) ─────────────────────────────────────── */}
      <div className="relative w-full lg:w-1/2 h-[180px] sm:h-[220px] lg:h-full min-h-[180px] overflow-hidden">
        {isArt && slide.artVariant ? (
          <ArtPanel variant={slide.artVariant} />
        ) : (
          slide.imageUrl && (
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              priority={isFirst}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          )
        )}
      </div>

      {/* ── Text Panel (50%) ────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 bg-canvas px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-14">
        {/* Eyebrow */}
        {slide.eyebrow && (
          <span
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1"
            style={{
              background: 'hsl(var(--primary) / 0.08)',
              color: 'hsl(var(--primary))',
              outline: '1px solid hsl(var(--primary) / 0.15)',
            }}
          >
            {slide.eyebrow}
          </span>
        )}

        {/* Headline */}
        <h2
          className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold leading-[1.1] tracking-tight"
          style={{ color: 'hsl(var(--primary))' }}
        >
          {resolvedTitle}
        </h2>

        {/* Subtitle */}
        {resolvedSubtitle && (
          <p
            className="mt-3 text-sm sm:text-base leading-relaxed max-w-md"
            style={{ color: 'hsl(var(--primary) / 0.7)' }}
          >
            {resolvedSubtitle}
          </p>
        )}

        {/* Price (product slides) */}
        {slide.kind === 'product' && slide.price !== undefined && (
          <p
            className="mt-2 text-lg font-semibold"
            style={{ color: 'hsl(var(--secondary))' }}
          >
            {slide.price.toLocaleString()} MAD
          </p>
        )}

        {/* CTA */}
        {resolvedCtaText && slide.ctaHref && (
          <div className="mt-6">
            <Link
              href={slide.ctaHref}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 min-h-[44px] focus:outline-none focus-visible:ring-2"
              style={{
                background: 'hsl(var(--secondary))',
                color: 'hsl(var(--on-secondary))',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
                (e.currentTarget as HTMLAnchorElement).style.transform = '';
              }}
            >
              {resolvedCtaText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
