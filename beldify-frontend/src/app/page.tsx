import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Lock, RotateCcw, Headphones, MapPin, BadgeCheck, ArrowRight, Sparkles } from 'lucide-react';
import FeaturedSections from '@/components/home/FeaturedSections';
import MegaOffers from '@/components/MegaOffers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Newsletter from '@/components/Newsletter';
import logger from '@/utils/consoleLogger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com';

async function getHomeData() {
  try {
    const response = await import('./api/home/route');
    const handler = response.GET;
    if (handler) {
      const result = await handler();
      return await result.json();
    }
    throw new Error('API handler not found');
  } catch (error) {
    logger.error('Error fetching home data:', error);
    return {
      bestSellers: [], newArrivals: [], recommendedTailors: [],
      recommendedSellers: [], specialOffers: [],
    };
  }
}

type Category = {
  id: number;
  name_en: string;
  name_ar?: string;
  image: string;
  slug?: string;
  itemCount?: number;
  subCategories?: Category[];
  subcategories?: Category[];
};

async function getTopCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories/topCategories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.categories || json.data || [];
    // Flatten subcategories into a single list, cap at 8
    const flat: Category[] = [];
    for (const parent of items) {
      const subs = parent.subCategories || parent.subcategories || [];
      for (const s of subs) flat.push(s);
    }
    return flat.slice(0, 8);
  } catch (e) {
    logger.error('Failed to load top categories:', e);
    return [];
  }
}

export default async function Home() {
  const [data, categories] = await Promise.all([getHomeData(), getTopCategories()]);

  return (
    <main className="min-h-screen bg-amber-50/40 text-gray-900">
      {/* Announcement strip */}
      <div className="bg-gray-900 text-amber-50 py-2 text-center text-xs font-medium tracking-wide">
        Free shipping across Morocco on orders over 500 MAD — Free returns within 14 days
      </div>

      {/* Hero */}
      {/* NOTE: hero copy is inlined as RSC content (not wrapped in t()) because
          extracting into a 'use client' subcomponent that calls useTranslation
          triggers a Next.js 15 dev-mode RSC→Client webpack-manifest error on this
          page. Revisit via server-side locale detection + props, or next-intl. */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-atelier.jpg"
            alt="Moroccan atelier"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Authentic Moroccan craftsmanship
            </span>

            {/* Bilingual etymology lockup — intentionally bilingual regardless of page locale (DESIGN.md §12) */}
            <div className="flex items-baseline gap-3 flex-wrap mb-4 mt-4" aria-label="Beldify — Beldi reimagined">
              <span dir="rtl" lang="ar" className="font-arabic text-3xl font-semibold text-gray-900 leading-tight">
                بلدي
              </span>
              <span className="text-amber-400 text-2xl select-none" aria-hidden="true">×</span>
              <span
                dir="ltr"
                lang="en"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                className="text-3xl font-bold text-indigo-700 italic leading-tight"
              >
                ify
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              beldi (بلدي) — local, artisan, of the country
            </p>

            <h1
              className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-serif font-bold leading-[1.05] tracking-tight text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              Worn for centuries.
              <span className="block text-indigo-700">Made for today.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-700 max-w-lg">
              Discover caftans, djellabas, and tailoring from Morocco’s finest ateliers — delivered worldwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Shop the marketplace
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 transition hover:bg-gray-50"
              >
                Meet the tailors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI personalisation chip shelf — rendered unconditionally on first ship */}
      {/* TODO: gate by browsing history signal once wired (hasHistory context/signal does not yet exist) */}
      <div className="mx-auto max-w-7xl px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200 animate-fade-in-up">
            <Sparkles size={12} className="shrink-0" />
            AI styled for you
          </span>
        </div>
      </div>

      {/* Trust strip */}
      <section className="border-y border-amber-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs sm:text-sm">
          {([
            { label: 'Verified Sellers', Icon: ShieldCheck },
            { label: 'Secure Payments', Icon: Lock },
            { label: 'Free 14-day Returns', Icon: RotateCcw },
            { label: 'Support AR / FR / EN', Icon: Headphones },
          ] as const).map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-gray-700">
              <span className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center ring-1 ring-amber-200">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Browse the souk */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-medium">Browse</p>
            <h2
              className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              The souk
            </h2>
          </div>
          <Link href="/categories" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900">
            View all →
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">Categories will appear here.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug || c.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-amber-200/60 bg-amber-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Image
                  src={c.image}
                  alt={c.name_en}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {typeof c.itemCount === 'number' && c.itemCount > 0 && (
                  <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm">
                    {c.itemCount} items
                  </span>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3
                    className="text-white text-xl sm:text-2xl font-semibold leading-tight drop-shadow-sm"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {c.name_en}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tailoring CTA strip */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">Bespoke</p>
            <h2
              className="mt-2 text-3xl sm:text-4xl font-bold leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              Want it tailored to you?
            </h2>
            <p className="mt-4 text-indigo-100 max-w-md">
              Match with a Moroccan tailor, send your measurements, and receive a fitted piece in 2–4 weeks.
            </p>
            <Link
              href="/tailoring"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
            >
              Start a tailoring order
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <ul className="space-y-3 text-sm text-indigo-100/90">
            {[
              ['Pick your tailor', 'Browse verified ateliers across Tetouan, Fez, Casablanca.'],
              ['Send measurements', 'Use our guided form or upload an existing pattern.'],
              ['Receive your piece', 'Hand-finished and shipped to your door in 2–4 weeks.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-gray-900 font-bold">{i + 1}</span>
                <div>
                  <p className="font-semibold text-white">{t}</p>
                  <p className="text-indigo-100/80">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mega offers (existing component, reused) */}
      {data.megaOffers && data.megaOffers.length > 0 && (
        <Suspense fallback={<LoadingSpinner />}>
          <MegaOffers megaOffers={data.megaOffers || []} />
        </Suspense>
      )}

      {/* Featured products (existing component, reused) */}
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedSections
          bestSellers={data.bestSellers}
          newArrivals={data.newArrivals}
          mensTraditional={data.mensTraditional}
          womensTraditional={data.womensTraditional}
          childrensTraditional={data.childrensTraditional}
        />
      </Suspense>

      {/* Featured ateliers — editorial horizontal cards */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-medium">Curated</p>
            <h2
              className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              Hand-picked ateliers
            </h2>
          </div>
          <Link href="/shops" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900">
            All ateliers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { name: 'Maison Tetouan', city: 'Tetouan', img: 'https://pro.beldify.com/storage/categories/category_7.jpg', specialty: 'Tarz-tetouani embroidery' },
            { name: 'Dar Fes Atelier', city: 'Fez', img: '/images/hero-atelier.jpg', specialty: 'Brocade & gold thread' },
            { name: 'Casablanca Couture', city: 'Casablanca', img: 'https://pro.beldify.com/storage/categories/category_14.jpg', specialty: 'Wedding & bespoke' },
            { name: 'Dar Marrakech', city: 'Marrakech', img: 'https://pro.beldify.com/storage/categories/category_4.jpg', specialty: 'Caftan & takchita' },
          ].map((a) => (
            <Link
              key={a.name}
              href="/shops"
              className="group relative overflow-hidden rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
                <Image
                  src={a.img}
                  alt={a.name}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.2} />
                  Verified
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-lg font-semibold text-gray-900"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {a.name}
                </h3>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-gray-500"><MapPin className="h-3.5 w-3.5" /> {a.city}</span>
                  <span className="text-amber-700 font-medium">{a.specialty}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The Journal */}
      <section className="bg-white border-t border-amber-100">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-medium">Read</p>
              <h2
                className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                The journal
              </h2>
            </div>
            <Link href="/journal" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900">
              All stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: 'Craft',
                title: 'Inside a Fez brocade atelier',
                excerpt: 'How fourth-generation weavers in Fez still hand-thread gold into festival caftans.',
                author: 'Imane Bennani',
                readTime: '6 min read',
                img: 'https://pro.beldify.com/storage/categories/category_4.jpg',
              },
              {
                tag: 'Wedding',
                title: 'A takchita built in 3 fittings',
                excerpt: 'Following one bride from sketch to ceremony with Maison Marrakech.',
                author: 'Salma El Aoud',
                readTime: '8 min read',
                img: 'https://pro.beldify.com/storage/categories/category_14.jpg',
              },
              {
                tag: 'Behind the seams',
                title: 'Sizing a djellaba, the Moroccan way',
                excerpt: 'A field guide to measurements that travel — with no tape measure surprises.',
                author: 'Karim Lahlou',
                readTime: '5 min read',
                img: 'https://pro.beldify.com/storage/categories/category_5.jpg',
              },
            ].map((a) => (
              <article key={a.title} className="group rounded-2xl overflow-hidden ring-1 ring-amber-100 bg-amber-50/30 hover:bg-amber-50 transition">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={a.img}
                    alt={a.title}
                    fill
                    sizes="(min-width:768px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                    {a.tag}
                  </span>
                  <h3
                    className="mt-3 text-xl font-semibold leading-snug text-gray-900"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{a.excerpt}</p>
                  <p className="mt-4 text-xs text-gray-500">{a.author} · {a.readTime}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Seller strip — for artisans and ateliers */}
      {/* Positioned after Journal (white bg) so two indigo-900 strips are never adjacent: Tailoring CTA → light sections → Journal (white) → Seller Strip → Newsletter */}
      <section className="py-16 bg-indigo-900 text-white relative overflow-hidden">
        {/* Zellige motif overlay — 10% opacity, pointer-events-none (DESIGN.md §13.2) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/motifs/zellige-tile.svg')",
            backgroundSize: '120px 120px',
            backgroundRepeat: 'repeat',
            opacity: 0.10,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
            For artisans &amp; ateliers
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4 max-w-xl"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            Sell your craft. Reach Morocco and beyond.
          </h2>
          <p className="text-indigo-200 text-base mb-8 max-w-lg">
            Beldify gives Tetouani ateliers and independent artisans a professional storefront with AI-assisted listings, order management, and direct buyer messaging.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="https://pro.beldify.com"
              className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-full bg-amber-400 text-gray-900 font-semibold text-sm hover:bg-amber-300 transition-colors duration-200"
            >
              Open your boutique
            </a>
            {/* AI seller chip */}
            <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-indigo-700 text-white text-xs font-medium">
              <Sparkles size={12} className="shrink-0" />
              AI-assisted listings
            </span>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Suspense fallback={<LoadingSpinner />}>
        <Newsletter />
      </Suspense>
    </main>
  );
}
