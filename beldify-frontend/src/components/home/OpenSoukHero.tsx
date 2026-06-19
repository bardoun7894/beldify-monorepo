'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Megaphone, HandCoins, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

/**
 * OpenSoukHero — homepage showcase for Beldify's reverse marketplace (the core
 * differentiator). A bold full-width band: on the left the value prop + CTAs,
 * on the right a connected 3-step stepper (amber beads on a gradient rail):
 * Post your brief → Ateliers come to you → Choose & order.
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

  const steps = [
    { Icon: Megaphone, title: t('openSouk.flowPostTitle', 'Post your request'), body: t('openSouk.flowPostBody', '') },
    { Icon: HandCoins, title: t('openSouk.flowBidsTitle', 'Ateliers come to you'), body: t('openSouk.flowBidsBody', '') },
    { Icon: CheckCircle2, title: t('openSouk.flowChooseTitle', 'Choose & order'), body: t('openSouk.flowChooseBody', '') },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
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

          {/* Connected 3-step stepper */}
          <motion.ol variants={container} className="relative">
            {/* vertical rail linking the beads */}
            <span
              aria-hidden
              className="pointer-events-none absolute start-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-amber-300/60 via-white/25 to-amber-300/30"
            />

            {steps.map(({ Icon, title, body }, i) => (
              <motion.li
                key={title}
                variants={item}
                className="relative flex gap-4 pb-4 last:pb-0"
              >
                {/* numbered bead on the rail */}
                <div className="relative flex w-[54px] shrink-0 justify-center pt-3.5">
                  <span className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-indigo-950 text-base font-bold text-amber-300 ring-1 ring-amber-300/40 shadow-atlas-sm">
                    {i + 1}
                  </span>
                </div>

                {/* card */}
                <div className="flex-1 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/[0.1] hover:ring-white/25">
                  <p className="flex items-center gap-2 text-sm font-bold leading-tight text-white">
                    <Icon className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                    {title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-snug text-indigo-100/85">{body}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </motion.div>
      </div>
    </section>
  );
}
