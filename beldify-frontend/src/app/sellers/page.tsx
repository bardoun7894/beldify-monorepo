'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ClipboardCheck, BadgeCheck, ShoppingBag } from 'lucide-react';

export default function SellersPage() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: ClipboardCheck,
      title: t('sellers.steps.apply.title', 'Apply'),
      body: t(
        'sellers.steps.apply.body',
        'Complete our short application at beldify.com/seller/register. Tell us about your atelier, the pieces you make, and attach a few photos. Most applications are reviewed within 3–5 business days.'
      ),
    },
    {
      icon: BadgeCheck,
      title: t('sellers.steps.verify.title', 'Get verified'),
      body: t(
        'sellers.steps.verify.body',
        'A Beldify curator reviews your craft and brand story. Once approved you receive your Verified badge, which builds immediate trust with buyers browsing the marketplace.'
      ),
    },
    {
      icon: ShoppingBag,
      title: t('sellers.steps.sell.title', 'Start selling'),
      body: t(
        'sellers.steps.sell.body',
        'List products, set your prices, and reach thousands of buyers across 23 cities worldwide. We handle payments, and transfer your earnings bi-weekly with no hidden fees.'
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-canvas text-gray-900">
      {/* Hero — generous, asymmetric, no eyebrow */}
      <section className="relative isolate overflow-hidden bg-indigo-950">
        {/* Subtle decorative wash — not glassmorphism, not gradient-clip text */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 8% 80%, hsl(38 92% 50% / 0.18) 0%, transparent 65%), radial-gradient(ellipse 55% 50% at 92% 10%, hsl(243 75% 51% / 0.25) 0%, transparent 60%)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:pt-28 lg:pb-28">
          {/* Left: editorial headline block */}
          <div className="lg:col-span-7">
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('sellers.headline', 'Bring your atelier')}
              <span className="block mt-1 text-amber-300">
                {t('sellers.headlineLine2', 'to the world.')}
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base sm:text-lg text-indigo-200 leading-relaxed">
              {t(
                'sellers.sub',
                'Beldify connects Moroccan ateliers with buyers across 23 cities. Join 120+ verified sellers already growing their business on our platform.'
              )}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/seller/register"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold text-amber-950 shadow-atlas-sm transition hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
              >
                {t('sellers.cta.apply', 'Apply to sell')}
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {t('sellers.cta.browse', 'Browse sellers')}
              </Link>
            </div>
          </div>

          {/* Right desktop: one editorial pull-stat + supporting lines —
              deliberately NOT a 3-card metric stack (breaks the template feel) */}
          <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:ps-8">
            <div className="rounded-2xl bg-white/8 ring-1 ring-white/12 px-8 py-8 backdrop-blur-sm">
              {/* Feature stat — large, leads the eye */}
              <p
                className="text-6xl font-bold leading-none text-amber-300"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                120+
              </p>
              <p className="mt-2 text-base text-indigo-100">
                {t('sellers.stat1', 'Verified ateliers already on the platform')}
              </p>

              {/* Supporting lines — quieter, no card chrome */}
              <dl className="mt-7 space-y-3 border-t border-white/12 pt-6">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-indigo-200">{t('sellers.stat2', 'Cities reached worldwide')}</dt>
                  <dd
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    23
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-indigo-200">{t('sellers.stat3', 'Commission — only when you sell')}</dt>
                  <dd
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    10–15%
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — 3-step, but without the 01/02/03 numbering scaffolding */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2
          className="text-3xl sm:text-4xl font-bold text-gray-900"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {t('sellers.howItWorks.title', 'Three steps to launch')}
        </h2>
        <p className="mt-3 text-gray-600 max-w-xl">
          {t('sellers.howItWorks.sub', 'From first application to your first sale, we guide you through every step.')}
        </p>

        {/* Asymmetric desktop layout — not a uniform 3-col grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
          {steps.map(({ icon: Icon, title, body }, idx) => (
            <div
              key={title}
              className={`group rounded-2xl bg-white ring-1 ring-amber-200/60 shadow-atlas-sm px-7 py-8 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md ${
                idx === 1 ? 'lg:mt-8' : idx === 2 ? 'lg:mt-4' : ''
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-100">
                <Icon className="h-6 w-6 text-indigo-700" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <h3
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent fees — horizontal split, no side-stripe */}
      <section className="bg-white border-y border-amber-200/60">
        <div className="mx-auto max-w-7xl px-6 py-14 grid gap-8 sm:grid-cols-2 sm:items-center">
          <div>
            <h3
              className="text-2xl sm:text-3xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('sellers.commission.headline', '10–15% commission. Nothing else.')}
            </h3>
            <p className="mt-3 text-sm text-gray-600 max-w-lg">
              {t(
                'sellers.commission.body',
                'No setup fee. No monthly subscription. No listing fee. You only pay Beldify when you make a sale — and we publish the exact rates by category on our seller help page.'
              )}
            </p>
          </div>
          <div className="sm:text-end">
            <Link
              href="/seller/register"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-7 py-3.5 text-sm font-semibold text-white shadow-atlas-sm transition hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2"
            >
              {t('sellers.commission.cta', 'Apply to sell')}
            </Link>
          </div>
        </div>
      </section>

      {/* Seller voices — no side-stripe blockquote */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2
          className="text-3xl sm:text-4xl font-bold text-gray-900"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {t('sellers.testimonial.heading', 'Sellers speak for themselves')}
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            {
              quote: t(
                'sellers.testimonial.1.quote',
                'Joining Beldify transformed my small workshop into a thriving business. I now sell my hand-embroidered caftans to customers across Europe and the Middle East.'
              ),
              author: t('sellers.testimonial.1.author', 'Fatima Zahra'),
              role: t('sellers.testimonial.1.role', 'Caftan designer, Fez'),
            },
            {
              quote: t(
                'sellers.testimonial.2.quote',
                'The support from the Beldify team has been exceptional. They helped me improve my product photography and descriptions — my sales doubled in the first month.'
              ),
              author: t('sellers.testimonial.2.author', 'Kamal Idrissi'),
              role: t('sellers.testimonial.2.role', 'Traditional jewellery maker, Tangier'),
            },
          ].map(({ quote, author, role }) => (
            <figure
              key={author}
              className="rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 px-8 py-8"
            >
              <blockquote>
                <p
                  className="text-lg sm:text-xl font-medium text-gray-900 leading-snug"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  &ldquo;{quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-200 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-700" aria-hidden="true">
                    {author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-700">{author}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Final CTA strip */}
      <section className="relative isolate overflow-hidden bg-indigo-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 85% 50%, hsl(38 92% 50% / 0.15) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('sellers.finalCta.headline', 'Ready to grow your atelier?')}
          </h2>
          <p className="mt-4 text-indigo-200 max-w-md mx-auto text-sm sm:text-base">
            {t(
              'sellers.finalCta.sub',
              'Applications are reviewed within 3–5 days. Join 120+ verified sellers and start reaching buyers worldwide.'
            )}
          </p>
          <Link
            href="/seller/register"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-amber-500 px-9 py-4 text-sm font-bold text-amber-950 shadow-atlas-md transition hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
          >
            {t('sellers.finalCta.cta', 'Apply to sell')}
          </Link>
        </div>
      </section>
    </main>
  );
}
