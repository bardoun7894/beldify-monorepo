'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface AuthBrandPanelProps {
  heading: string;
  subtext: string;
  bullets?: string[];
}

/**
 * AuthBrandPanel — shared presentational left-panel for all auth pages.
 *
 * Desktop only (hidden on mobile — each page shows its own mobile wordmark).
 * Uses the Atlas editorial design: indigo-950 dark surface, Playfair Display
 * headline, heritage atelier imagery with indigo scrim, amber accent bullets.
 *
 * Presentational only — no logic, no data fetching, no side effects.
 */
export default function AuthBrandPanel({ heading, subtext, bullets }: AuthBrandPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="hidden lg:flex lg:w-5/12 xl:w-[46%] relative flex-col bg-indigo-950 text-white overflow-hidden">
      {/* Heritage background — atelier photography with indigo scrim */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-atelier.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-30"
          sizes="(max-width: 1280px) 41vw, 46vw"
        />
        {/* Indigo scrim for readability */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-indigo-950/70 via-indigo-950/60 to-indigo-950/80"
        />
        {/* Amber warmth accent — top-left focal glow.
            #f59e0b and #4338ca are the literal Atlas amber-500 / indigo-700
            token values (Tailwind cannot emit gradient color stops from class
            names here), NOT arbitrary hex — keep them in sync with the tokens. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 25% 30%, #f59e0b 0, transparent 55%), radial-gradient(circle at 75% 75%, #4338ca 0, transparent 55%)',
          }}
        />
      </div>

      {/* Zellige motif watermark — subtle texture */}
      <div
        aria-hidden
        className="absolute bottom-0 end-0 w-64 h-64 opacity-[0.04]"
        style={{
          backgroundImage: 'url(/motifs/zellige-tile.svg)',
          backgroundSize: '64px 64px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative z-10 flex flex-col h-full px-12 py-12 xl:px-14 xl:py-14">
        {/* Wordmark */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded-lg"
        >
          <span
            className="text-2xl font-bold text-white tracking-tight group-hover:text-amber-200 transition-colors duration-200"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            Beldify
          </span>
          <span className="text-amber-400/70 text-lg" aria-hidden>
            ·
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-indigo-300 font-medium mt-0.5">
            بلدي
          </span>
        </Link>

        {/* Editorial copy — pushed to bottom */}
        <div className="mt-auto">
          <h1
            className="text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight text-white mb-4"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {heading}
          </h1>
          <p className="text-indigo-200 text-base xl:text-lg leading-relaxed mb-8 max-w-xs">
            {subtext}
          </p>

          {bullets && bullets.length > 0 && (
            <ul className="space-y-2.5" aria-label={t('auth.account_benefits', 'Account benefits')}>
              {bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-indigo-100"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0"
                    aria-hidden
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {/* Trust strip */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-xs text-indigo-400 tracking-[0.12em] uppercase">
              الصناعة المغربية الأصيلة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
