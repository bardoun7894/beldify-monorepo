'use client';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Ruler, Send, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const galleryImages = [
  {
    src: 'https://pro.beldify.com/storage/categories/category_7_jabador.png',
    alt: "Men's traditional djellaba atelier",
  },
  {
    src: 'https://pro.beldify.com/storage/categories/category_8_mens-kandora.png',
    alt: 'Hand-embroidered caftan detail',
  },
  {
    src: 'https://pro.beldify.com/storage/categories/category_14_wedding-dresses.png',
    alt: 'Wedding takchita in progress',
  },
  {
    src: 'https://pro.beldify.com/storage/categories/category_4_caftan.png',
    alt: 'Brocade weaving, Fez atelier',
  },
];

const steps = [
  {
    icon: Ruler,
    title: 'Pick your tailor',
    body: 'Browse verified ateliers in Fez, Marrakech, Casablanca and Tetouan. Each listing shows specialities, reviews, and current availability.',
  },
  {
    icon: Send,
    title: 'Send your measurements',
    body: 'Use our guided measurement form — no tape-measure experience needed. Or book a 15-minute video call with your tailor for a guided session.',
  },
  {
    icon: Package,
    title: 'Receive your piece',
    body: 'Your garment is hand-finished and shipped worldwide. Most bespoke orders arrive in 2–4 weeks. One free alteration round is included.',
  },
];

const PLAYFAIR = '"Playfair Display", ui-serif, Georgia, serif';

export default function TailoringPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-canvas text-gray-900">
      {/* ── Editorial hero — dark indigo-950 strip, asymmetric 12-col on desktop ── */}
      <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
        {/* Zellige motif overlay (§13.1) */}
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-motif-zellige" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 lg:items-center gap-10 lg:gap-12">
            {/* Copy — 7 of 12 cols, left-weighted editorial */}
            <div className="lg:col-span-7">
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">
                {t('tailoring.eyebrow', 'BESPOKE')}
              </p>
              <h1
                className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance"
                style={{ fontFamily: PLAYFAIR }}
              >
                {t('tailoring.headline', 'Tailored to you,')}
                <span className="block text-amber-300">
                  {t('tailoring.headlineLine2', 'by hand.')}
                </span>
              </h1>
              <p className="mt-5 text-indigo-100 max-w-xl text-base sm:text-lg leading-relaxed">
                {t(
                  'tailoring.sub',
                  'Our 120+ verified ateliers create bespoke Moroccan garments to your exact measurements — shipped anywhere in the world. No fitting room required.'
                )}
              </p>
              <Button asChild variant="accent" size="lg" className="mt-8 rounded-full">
                <Link href="/shops?type=tailor">
                  {t('tailoring.heroCta', 'Start a tailoring order')}
                </Link>
              </Button>
            </div>

            {/* Atelier image — 5 of 12 cols, the asymmetric counterweight */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-atlas-lg">
                <Image
                  src="https://pro.beldify.com/storage/categories/category_8_mens-kandora.png"
                  alt={t('tailoring.heroImageAlt', 'Hand-embroidered caftan detail, Moroccan atelier')}
                  fill
                  sizes="(min-width:1024px) 40vw, 100vw"
                  priority
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 via-transparent to-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works — parchment process section, editorial alternating rows ── */}
      <section className="bg-amber-50">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <h2
              className="text-3xl sm:text-4xl font-bold text-indigo-950 text-balance"
              style={{ fontFamily: PLAYFAIR }}
            >
              {t('tailoring.howItWorks.title', 'How it works')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-indigo-900/70 leading-relaxed">
              {t(
                'tailoring.howItWorks.intro',
                'Three steps from your measurements to a hand-finished Moroccan piece.'
              )}
            </p>
          </div>

          <ol className="mt-12 space-y-10 lg:space-y-14">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className={`flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8 ${
                  i % 2 === 1 ? 'sm:flex-row-reverse' : ''
                }`}
              >
                <div className="flex items-center gap-4 sm:w-1/3 sm:shrink-0">
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-950 text-amber-300 shadow-atlas-sm"
                    aria-hidden
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span
                    className="text-4xl font-bold text-amber-500/80 tabular-nums"
                    style={{ fontFamily: PLAYFAIR }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="sm:w-2/3">
                  <h3
                    className="text-xl font-bold text-indigo-950"
                    style={{ fontFamily: PLAYFAIR }}
                  >
                    {t(`tailoring.steps.${i}.title`, title)}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-indigo-900/75 leading-relaxed max-w-prose">
                    {t(`tailoring.steps.${i}.body`, body)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12">
            <Button asChild variant="accent" size="lg" className="rounded-full">
              <Link href="/shops?type=tailor">
                {t('tailoring.stepsCta', 'Start a tailoring order')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Gallery row ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2
            className="text-3xl sm:text-4xl font-bold text-indigo-950 text-balance"
            style={{ fontFamily: PLAYFAIR }}
          >
            {t('tailoring.gallery.title', 'Crafted in Morocco')}
          </h2>
          <span className="hidden h-px flex-1 bg-amber-200/70 sm:block" aria-hidden />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {galleryImages.map(({ src, alt }, i) => (
            <div
              key={src}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm hover-lift"
            >
              <Image
                src={src}
                alt={t(`tailoring.gallery.alt.${i}`, alt)}
                fill
                sizes="(min-width:640px) 25vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 shadow-atlas-sm px-8 py-10 text-center">
          <h3
            className="text-2xl sm:text-3xl font-bold text-indigo-950 text-balance"
            style={{ fontFamily: PLAYFAIR }}
          >
            {t('tailoring.finalCta.headline', 'Ready for something made just for you?')}
          </h3>
          <p className="mt-3 text-sm text-indigo-900/70 max-w-md mx-auto">
            {t(
              'tailoring.finalCta.sub',
              'Browse our tailors, share your measurements, and receive a hand-finished piece in 2–4 weeks.'
            )}
          </p>
          <Button asChild variant="default" size="lg" className="mt-6 rounded-full">
            <Link href="/shops?type=tailor">
              {t('tailoring.finalCta.cta', 'Start a tailoring order')}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
