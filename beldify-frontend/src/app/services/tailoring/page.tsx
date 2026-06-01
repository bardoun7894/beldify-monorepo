'use client';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Ruler, Send, Package } from 'lucide-react';

const galleryImages = [
  {
    src: 'https://pro.beldify.com/storage/categories/category_7.jpg',
    alt: "Men's traditional djellaba atelier",
  },
  {
    src: 'https://pro.beldify.com/storage/categories/category_8.jpg',
    alt: 'Hand-embroidered caftan detail',
  },
  {
    src: 'https://pro.beldify.com/storage/categories/category_14.jpg',
    alt: 'Wedding takchita in progress',
  },
  {
    src: 'https://pro.beldify.com/storage/categories/category_4.jpg',
    alt: 'Brocade weaving, Fez atelier',
  },
];

const steps = [
  {
    icon: Ruler,
    number: '01',
    title: 'Pick your tailor',
    body: 'Browse verified ateliers in Fez, Marrakech, Casablanca and Tetouan. Each listing shows specialities, reviews, and current availability.',
  },
  {
    icon: Send,
    number: '02',
    title: 'Send your measurements',
    body: 'Use our guided measurement form — no tape-measure experience needed. Or book a 15-minute video call with your tailor for a guided session.',
  },
  {
    icon: Package,
    number: '03',
    title: 'Receive your piece',
    body: 'Your garment is hand-finished and shipped worldwide. Most bespoke orders arrive in 2–4 weeks. One free alteration round is included.',
  },
];

export default function TailoringPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-amber-50/40 text-gray-900">
      {/* Editorial hero strip — DESIGN.md §6.4 */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">
            {t('tailoring.eyebrow', 'BESPOKE')}
          </p>
          <h1
            className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
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
          <Link
            href="/shops?type=tailor"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
          >
            {t('tailoring.heroCta', 'Start a tailoring order')}
          </Link>
        </div>
      </section>

      {/* 3-step flow — reusing indigo strip pattern from homepage */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_80%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_20%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium">
              {t('tailoring.howItWorks.eyebrow', 'THE PROCESS')}
            </p>
            <h2
              className="mt-2 text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('tailoring.howItWorks.title', 'How it works')}
            </h2>
          </div>
          <ul className="space-y-4 max-w-2xl mx-auto">
            {steps.map(({ icon: Icon, number, title, body }, i) => (
              <li
                key={number}
                className="flex gap-5 rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-gray-900 font-bold">
                  {i + 1}
                </span>
                <div>
                  <p
                    className="font-semibold text-white text-base"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {t(`tailoring.steps.${i}.title`, title)}
                  </p>
                  <p className="mt-1 text-sm text-indigo-100/80">
                    {t(`tailoring.steps.${i}.body`, body)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="text-center mt-10">
            <Link
              href="/shops?type=tailor"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
            >
              {t('tailoring.stepsCta', 'Start a tailoring order')}
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery row */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-[#855300] font-medium">
            {t('tailoring.gallery.eyebrow', 'OUR ATELIERS')}
          </p>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('tailoring.gallery.title', 'Crafted in Morocco')}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {galleryImages.map(({ src, alt }) => (
            <div
              key={src}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-amber-200/60 shadow-sm"
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width:640px) 25vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-8 py-10 text-center">
          <h3
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('tailoring.finalCta.headline', 'Ready for something made just for you?')}
          </h3>
          <p className="mt-3 text-sm text-gray-600 max-w-md mx-auto">
            {t(
              'tailoring.finalCta.sub',
              'Browse our tailors, share your measurements, and receive a hand-finished piece in 2–4 weeks.'
            )}
          </p>
          <Link
            href="/shops?type=tailor"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {t('tailoring.finalCta.cta', 'Start a tailoring order')}
          </Link>
        </div>
      </section>
    </main>
  );
}
