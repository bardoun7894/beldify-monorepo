'use client';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Scissors, Handshake, Ruler, Users } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { value: '23', label: t('about.stats.cities', 'cities') },
    { value: '120+', label: t('about.stats.ateliers', 'ateliers') },
    { value: '14-day', label: t('about.stats.returns', 'returns') },
  ];

  const values = [
    {
      icon: Scissors,
      title: t('about.values.craftsmanship.title', 'Craftsmanship first'),
      body: t(
        'about.values.craftsmanship.body',
        'Every piece on Beldify is hand-finished by a verified Moroccan artisan. We work directly with ateliers in Fez, Marrakech, Casablanca and Tetouan to ensure the traditions of zellige stitching, brocade weaving and hand-embroidery survive another generation.'
      ),
      image: 'https://pro.beldify.com/storage/categories/category_7_jabador.png',
      imageAlt: t('about.values.craftsmanship.imageAlt', 'A tailor working on a djellaba in a Fez atelier'),
    },
    {
      icon: Handshake,
      title: t('about.values.fairTrade.title', 'Fair trade, transparent prices'),
      body: t(
        'about.values.fairTrade.body',
        'We publish our commission rates openly (10–15 %) and pay sellers bi-weekly. No hidden fees, no race to the bottom on price. When you buy on Beldify, the artisan receives a living wage and keeps full creative control.'
      ),
      image: 'https://pro.beldify.com/storage/categories/category_14_wedding-dresses.png',
      imageAlt: t('about.values.fairTrade.imageAlt', 'A seller reviewing an order on a phone'),
      reverse: true,
    },
    {
      icon: Ruler,
      title: t('about.values.tailoring.title', 'Bespoke tailoring, made simple'),
      body: t(
        'about.values.tailoring.body',
        'Our guided measurement form and video call option mean you never need to set foot in a medina to get a piece fitted perfectly. Pick your tailor, share your measurements, receive your garment in 2–4 weeks.'
      ),
      image: 'https://pro.beldify.com/storage/categories/category_4_caftan.png',
      imageAlt: t('about.values.tailoring.imageAlt', 'Measuring tape on a caftan fabric'),
    },
    {
      icon: Users,
      title: t('about.values.community.title', 'A community, not just a marketplace'),
      body: t(
        'about.values.community.body',
        'Beldify started as a WhatsApp group between three friends who were tired of seeing their grandmothers\' atelier struggle to reach customers abroad. Today we are a platform connecting 120+ ateliers with shoppers in 23 cities worldwide — and growing.'
      ),
      image: 'https://pro.beldify.com/storage/categories/category_8_mens-kandora.png',
      imageAlt: t('about.values.community.imageAlt', 'Community of Moroccan artisans'),
      reverse: true,
    },
  ];

  return (
    <main className="min-h-screen bg-canvas text-gray-900">
      {/* Editorial hero strip — DESIGN.md §6.4 */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">
            {t('about.eyebrow', 'OUR STORY')}
          </p>
          <h1
            className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('about.headline', 'Crafted in Morocco,')}
            <span className="block text-amber-300">
              {t('about.headlineLine2', 'worn anywhere.')}
            </span>
          </h1>
          <p className="mt-5 text-indigo-100 max-w-xl text-base sm:text-lg leading-relaxed">
            {t(
              'about.sub',
              'Beldify was founded by a small team with deep roots in Morocco\'s artisan communities. Our mission: make authentic Moroccan tailoring and fashion accessible to the world — fairly, beautifully, without compromise.'
            )}
          </p>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-3 gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span
                className="text-4xl sm:text-5xl font-bold text-amber-500"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {value}
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Alternating value sections */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-20">
        {values.map(({ icon: Icon, title, body, image, imageAlt, reverse }, i) => (
          <div
            key={title}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center${
              reverse ? ' lg:[direction:rtl]' : ''
            }`}
          >
            {/* Text col — always LTR inside */}
            <div className={reverse ? 'lg:[direction:ltr]' : ''}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 text-amber-700">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h2
                className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {title}
              </h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-gray-700">{body}</p>
            </div>
            {/* Image col */}
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm${
                reverse ? ' lg:[direction:ltr]' : ''
              }`}
            >
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </section>

      {/* CTA strip */}
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
            {t('about.cta.headline', 'Ready to explore?')}
          </h2>
          <p className="mt-4 text-indigo-100 max-w-md mx-auto">
            {t('about.cta.sub', 'Browse verified ateliers, discover new arrivals, or start a bespoke tailoring order today.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
            >
              {t('about.cta.shop', 'Shop the marketplace')}
            </Link>
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              {t('about.cta.ateliers', 'Meet the ateliers')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
