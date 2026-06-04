'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Megaphone, HandCoins, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

/**
 * OpenSoukHero — homepage showcase for Beldify's reverse marketplace (the core
 * differentiator). A bold full-width band with an animated 3-step explainer:
 * Post your request → Ateliers come to you → Choose & order.
 *
 * Not a popup: this is the headline value prop, placed inline in the homepage.
 */
export default function OpenSoukHero() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const steps = [
    { Icon: Megaphone, title: t('openSouk.flowPostTitle', 'Post your request'), body: t('openSouk.flowPostBody', '') },
    { Icon: HandCoins, title: t('openSouk.flowBidsTitle', 'Ateliers come to you'), body: t('openSouk.flowBidsBody', '') },
    { Icon: CheckCircle2, title: t('openSouk.flowChooseTitle', 'Choose & order'), body: t('openSouk.flowChooseBody', '') },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 px-6 py-12 sm:px-12 sm:py-16 shadow-atlas-md">
        {/* Decorative glows */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-16 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -start-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Copy */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={container}
          >
            <motion.span
              variants={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/20"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('openSouk.eyebrow', 'OPEN SOUK')}
            </motion.span>

            <motion.h2
              variants={item}
              className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.1] text-white"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('openSouk.headline', 'Post your brief. Ateliers come to you.')}
            </motion.h2>

            <motion.p variants={item} className="mt-4 max-w-md text-base leading-relaxed text-indigo-100">
              {t('openSouk.subtitle', 'A reverse marketplace where Tetouani ateliers compete to make your piece.')}
            </motion.p>

            <motion.div variants={item} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[12px] text-indigo-100 ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
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

          {/* Animated 3-step explainer */}
          <motion.ol
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={container}
            className="relative flex flex-col gap-3"
          >
            {steps.map(({ Icon, title, body }, i) => (
              <motion.li
                key={title}
                variants={item}
                className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm"
              >
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-indigo-800 ring-1 ring-white/40">
                  <Icon className="h-5.5 w-5.5" aria-hidden />
                  <span className="absolute -top-2 -start-2 grid h-6 w-6 place-items-center rounded-full bg-indigo-950 text-[11px] font-bold text-amber-300 ring-2 ring-white/20">
                    {i + 1}
                  </span>
                </span>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-white leading-tight">{title}</p>
                  <p className="mt-1 text-[13px] text-indigo-100 leading-snug">{body}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
