'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ClipboardCheck, BadgeCheck, ShoppingBag } from 'lucide-react';

export default function SellersPage() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: ClipboardCheck,
      step: '01',
      title: t('sellers.steps.apply.title', 'Apply'),
      body: t(
        'sellers.steps.apply.body',
        'Complete our short application at beldify.com/seller/register. Tell us about your atelier, the pieces you make, and attach a few photos. Most applications are reviewed within 3–5 business days.'
      ),
    },
    {
      icon: BadgeCheck,
      step: '02',
      title: t('sellers.steps.verify.title', 'Get verified'),
      body: t(
        'sellers.steps.verify.body',
        'A Beldify curator reviews your craft and brand story. Once approved you receive your Verified badge, which builds immediate trust with buyers browsing the marketplace.'
      ),
    },
    {
      icon: ShoppingBag,
      step: '03',
      title: t('sellers.steps.sell.title', 'Start selling'),
      body: t(
        'sellers.steps.sell.body',
        'List products, set your prices, and reach thousands of buyers across 23 cities worldwide. We handle payments, and transfer your earnings bi-weekly with no hidden fees.'
      ),
    },
  ];

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
            {t('sellers.eyebrow', 'SELL ON BELDIFY')}
          </p>
          <h1
            className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('sellers.headline', 'Bring your atelier')}
            <span className="block text-amber-300">
              {t('sellers.headlineLine2', 'to the world.')}
            </span>
          </h1>
          <p className="mt-5 text-indigo-100 max-w-xl text-base sm:text-lg leading-relaxed">
            {t(
              'sellers.sub',
              'Beldify connects Moroccan ateliers with buyers across 23 cities. Join 120+ verified sellers already growing their business on our platform.'
            )}
          </p>
          <Link
            href="/seller/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
          >
            {t('sellers.cta.apply', 'Apply to sell')}
          </Link>
        </div>
      </section>

      {/* 3-step explainer */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
            {t('sellers.howItWorks.eyebrow', 'HOW IT WORKS')}
          </p>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('sellers.howItWorks.title', 'Three simple steps')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, step, title, body }) => (
            <div
              key={step}
              className="rounded-2xl bg-white ring-1 ring-amber-200/60 shadow-sm px-6 py-7 flex flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 text-amber-700">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span
                  className="text-3xl font-bold text-amber-500 leading-none"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {step}
                </span>
              </div>
              <h3
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Commission strip */}
      <section className="bg-amber-50 border-y border-amber-200/60">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {t('sellers.commission.eyebrow', 'TRANSPARENT FEES')}
            </p>
            <h3
              className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('sellers.commission.headline', '10–15 % commission. Nothing else.')}
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-lg">
              {t(
                'sellers.commission.body',
                'No setup fee. No monthly subscription. No listing fee. You only pay Beldify when you make a sale — and we publish the exact rates by category on our seller help page.'
              )}
            </p>
          </div>
          <Link
            href="/seller/register"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800"
          >
            {t('sellers.commission.cta', 'Apply to sell')}
          </Link>
        </div>
      </section>

      {/* Testimonial quote block */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-8 py-10">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-400 font-medium mb-6">
            {t('sellers.testimonial.eyebrow', 'FROM OUR SELLERS')}
          </p>
          <div className="space-y-8">
            {[
              {
                quote: t(
                  'sellers.testimonial.1.quote',
                  '"Joining Beldify transformed my small workshop into a thriving business. I now sell my hand-embroidered caftans to customers across Europe and the Middle East."'
                ),
                author: t('sellers.testimonial.1.author', 'Fatima Zahra'),
                role: t('sellers.testimonial.1.role', 'Caftan designer, Fez'),
              },
              {
                quote: t(
                  'sellers.testimonial.2.quote',
                  '"The support from the Beldify team has been exceptional. They helped me improve my product photography and descriptions — my sales doubled in the first month."'
                ),
                author: t('sellers.testimonial.2.author', 'Kamal Idrissi'),
                role: t('sellers.testimonial.2.role', 'Traditional jewellery maker, Tangier'),
              },
            ].map(({ quote, author, role }) => (
              <blockquote key={author} className="border-l-4 border-amber-400 pl-5">
                <p
                  className="text-lg sm:text-xl font-medium text-gray-900 italic leading-snug"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {quote}
                </p>
                <footer className="mt-3 text-sm text-indigo-700 font-semibold">
                  {author}
                  <span className="ml-2 font-normal text-gray-500">{role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('sellers.finalCta.headline', 'Ready to grow your atelier?')}
          </h2>
          <p className="mt-4 text-indigo-100 max-w-md mx-auto">
            {t(
              'sellers.finalCta.sub',
              'Applications are reviewed within 3–5 days. Join 120+ verified sellers and start reaching buyers worldwide.'
            )}
          </p>
          <Link
            href="/seller/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
          >
            {t('sellers.finalCta.cta', 'Apply to sell')}
          </Link>
        </div>
      </section>
    </main>
  );
}
