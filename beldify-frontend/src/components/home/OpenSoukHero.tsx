'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, BadgeCheck, Clock } from 'lucide-react';

/**
 * OpenSoukHero — homepage showcase for Beldify's reverse marketplace (the core
 * differentiator). A bold full-width band: on the left the value prop + CTAs,
 * on the right a live "offers preview" that SHOWS the reverse auction — you post
 * one brief and verified Tetouani ateliers send competing offers (price + delay).
 *
 * The offers are illustrative (atelier names are brand proper-nouns, prices are
 * sample numbers) — a product preview from the buyer's point of view, who is the
 * one who sees every offer they receive.
 *
 * Not a popup: this is the headline value prop, placed inline in the homepage.
 */
export default function OpenSoukHero() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const isArabicScript = ['ar', 'ma'].includes(i18n.language);
  const serif = isArabicScript
    ? undefined
    : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' as const };

  // Illustrative incoming offers (the reverse auction, made visible).
  const offers = [
    { initials: 'AA', name: 'Atelier Andaloussi', price: '1 180', days: 6, best: true },
    { initials: 'DS', name: 'Dar Soraya', price: '1 350', days: 4 },
    { initials: 'KT', name: 'Khyata Tetouan', price: '1 090', days: 8 },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  };
  const offerItem = {
    hidden: { opacity: 0, y: reduce ? 0 : 14, scale: reduce ? 1 : 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 px-6 py-12 sm:px-12 sm:py-16 shadow-atlas-lg ring-1 ring-white/10">
        {/* Layered decoration */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:22px_22px]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-28 -end-20 h-80 w-80 rounded-full bg-amber-400/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -start-16 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />

        <motion.div
          className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={container}
        >
          {/* Copy */}
          <motion.div variants={container}>
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/20 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300/70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
              </span>
              {t('openSouk.eyebrow', 'OPEN SOUK')}
            </motion.span>

            <motion.h2
              variants={item}
              lang={isArabicScript ? 'ar' : undefined}
              className={`mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.1] text-white ${isArabicScript ? 'font-arabic' : ''}`}
              style={serif}
            >
              {t('openSouk.headline', 'Post your brief. Ateliers come to you.')}
            </motion.h2>

            <motion.p variants={item} className="mt-4 max-w-md text-base leading-relaxed text-indigo-100/90">
              {t('openSouk.subtitle', 'A reverse marketplace where Tetouani ateliers compete to make your piece.')}
            </motion.p>

            <motion.div
              variants={item}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300/10 px-3 py-2 text-[12px] font-medium text-amber-100 ring-1 ring-amber-300/25"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
              <span>{t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}</span>
            </motion.div>

            <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/community"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-indigo-800 shadow-atlas-sm transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-indigo-800"
              >
                {t('openSouk.postCta', 'Post to the Open Souk')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white/90 ring-1 ring-white/25 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {t('openSouk.browseCta', 'Browse open requests')}
              </Link>
            </motion.div>
          </motion.div>

          {/* Live offers preview — the reverse auction, made visible */}
          <motion.div variants={item} className="relative" aria-hidden>
            <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-amber-300/10 blur-2xl" />

            <motion.div
              variants={container}
              className="relative rounded-3xl bg-white/[0.07] p-4 sm:p-5 ring-1 ring-white/15 backdrop-blur-md shadow-atlas-xl"
            >
              {/* Brief header */}
              <motion.div variants={item} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200">
                    {t('openSouk.previewLabel', 'Your request')}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {t('openSouk.previewItem', 'Custom embroidered caftan')}
                  </p>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-lg bg-amber-300/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-300/25">
                  {t('openSouk.previewBudgetLabel', 'Budget')} · 1 200 MAD
                </span>
              </motion.div>

              {/* Live "replied" indicator */}
              <motion.div variants={item} className="mt-3 flex items-center gap-2 text-[11px] font-medium text-indigo-100">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300/70 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-300" />
                </span>
                {t('openSouk.previewReplied', { n: 5, defaultValue: '{{n}} ateliers replied' })}
              </motion.div>

              {/* Offer rows */}
              <div className="mt-3 space-y-2">
                {offers.map((o) => (
                  <motion.div
                    key={o.name}
                    variants={offerItem}
                    className={`flex items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5 ring-1 ${o.best ? 'ring-amber-300/40' : 'ring-white/10'}`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-bold text-indigo-950">
                      {o.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-[13px] font-semibold text-white">
                        <span className="truncate">{o.name}</span>
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-indigo-200">
                        <Clock className="h-3 w-3 shrink-0" />
                        {o.days} {t('openSouk.previewDaysShort', 'd')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{o.price}</span>
                      <span className="text-[10px] text-indigo-300">MAD</span>
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-300 rtl:rotate-180" />
                    </div>
                  </motion.div>
                ))}

                {/* more-offers hint (3 shown + 2 = the 5 in the header) */}
                <motion.div variants={item} className="flex items-center justify-center gap-2 pt-1 text-[11px] font-medium text-indigo-300">
                  <span className="flex -space-x-1.5 rtl:space-x-reverse">
                    {[0, 1].map((i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-300/80 to-amber-500/80 ring-2 ring-indigo-900"
                      />
                    ))}
                  </span>
                  <span>+2</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
