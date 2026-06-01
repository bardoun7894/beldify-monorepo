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
    <main className="min-h-screen bg-background text-foreground">
      {/* Announcement strip */}
      <div dir="rtl" className="bg-[hsl(var(--primary))] text-white py-2 text-center text-xs font-medium tracking-wide">
        شحن مجاني داخل المغرب للطلبات فوق 500 درهم — إرجاع مجاني خلال 14 يوماً
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
          {/* JOB 2a: dark photographic hero — Atlas indigo gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-atlas-primary/[0.85] via-atlas-primary/[0.5] to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.15] px-3 py-1 text-xs font-medium text-white ring-1 ring-white/[0.3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--secondary))]" />
              Authentic Moroccan craftsmanship
            </span>

            {/* JOB 2b: Arabic-primary headline hierarchy */}
            {/* Arabic H1 — primary, large, uses font-arabic (no Playfair — Playfair has no Arabic glyphs) */}
            <h1
              dir="rtl"
              lang="ar"
              className="font-arabic mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white"
            >
              تُلبَس منذ قرون. مصنوعة لليوم.
            </h1>

            {/* English — secondary sub-label */}
            <p className="mt-3 text-lg font-medium text-white/85 italic">
              Worn for centuries. Made for today.
            </p>

            {/* Bilingual etymology lockup — intentionally bilingual regardless of page locale (DESIGN.md §12) */}
            <div className="flex items-baseline gap-3 flex-wrap mb-4 mt-6" aria-label="Beldify — Beldi reimagined">
              <span dir="rtl" lang="ar" className="font-arabic text-3xl font-semibold text-white leading-tight">
                بلدي
              </span>
              <span className="text-[hsl(var(--secondary))] text-2xl select-none" aria-hidden="true">×</span>
              <span
                dir="ltr"
                lang="en"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                className="text-3xl font-bold text-white italic leading-tight"
              >
                ify
              </span>
            </div>
            <p className="text-sm text-white/75 mb-6">
              beldi (بلدي) — local, artisan, of the country
            </p>

            <p className="mt-5 text-lg leading-relaxed text-white/85 max-w-lg">
              Discover caftans, djellabas, and tailoring from Morocco’s finest ateliers — delivered worldwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--on-secondary))] shadow-atlas-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--secondary))] focus:ring-offset-2"
              >
                Shop the marketplace
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.15] px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/[0.4] transition hover:bg-white/[0.25]"
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
          <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-atlas-primary/[0.1] text-[hsl(var(--primary))] text-xs font-medium ring-1 ring-atlas-primary/[0.2] animate-fade-in-up">
            <Sparkles size={12} className="shrink-0" />
            AI styled for you
          </span>
        </div>
      </div>

      {/* Trust strip */}
      <section className="border-y border-outline/20 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs sm:text-sm">
          {([
            { label: 'Verified Sellers', Icon: ShieldCheck },
            { label: 'Secure Payments', Icon: Lock },
            { label: 'Free 14-day Returns', Icon: RotateCcw },
            { label: 'Support AR / FR / EN', Icon: Headphones },
          ] as const).map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="h-10 w-10 rounded-full bg-atlas-primary/[0.1] text-[hsl(var(--primary))] flex items-center justify-center ring-1 ring-atlas-primary/[0.2]">
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
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--secondary))] font-medium">السوق</p>
            <h2
              className="mt-1 text-3xl sm:text-4xl font-bold text-[hsl(var(--primary))]"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              مجموعات السوق
            </h2>
          </div>
          <Link href="/categories" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] hover:text-primary-container">
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
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-outline/20 bg-background shadow-atlas-sm transition hover:-translate-y-0.5 hover:shadow-atlas-md"
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
                  <span className="absolute top-3 end-3 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-on-surface shadow-sm">
                    {c.itemCount} items
                  </span>
                )}
                <div className="absolute bottom-4 start-4 end-4">
                  <h3
                    className="text-white text-xl sm:text-2xl font-semibold leading-tight drop-shadow-sm"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {c.name_ar || c.name_en}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tailoring CTA strip */}
      <section className="relative isolate overflow-hidden bg-[hsl(var(--primary))] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#fea619_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#3b3b6d_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--secondary))] font-medium">خياطة</p>
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--on-secondary))] transition hover:opacity-90"
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
              <li key={t} className="flex gap-4 rounded-xl bg-card/5 ring-1 ring-white/10 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--on-secondary))] font-bold">{i + 1}</span>
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
            <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--secondary))] font-medium">حُراس التراث</p>
            <h2
              className="mt-1 text-3xl sm:text-4xl font-bold text-[hsl(var(--primary))]"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              ورشات مختارة
            </h2>
          </div>
          <Link href="/shops" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] hover:text-primary-container">
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
              className="group relative overflow-hidden rounded-2xl ring-1 ring-outline/20 bg-card shadow-atlas-sm transition hover:-translate-y-0.5 hover:shadow-atlas-md"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
                <Image
                  src={a.img}
                  alt={a.name}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary))] shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-[hsl(var(--secondary))]" strokeWidth={2.2} />
                  Verified
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-lg font-semibold text-[hsl(var(--primary))]"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {a.name}
                </h3>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-on-surface-variant"><MapPin className="h-3.5 w-3.5" /> {a.city}</span>
                  <span className="text-[hsl(var(--secondary))] font-medium">{a.specialty}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The Journal */}
      <section className="bg-background border-t border-outline/15">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--secondary))] font-medium">المجلة</p>
              <h2
                className="mt-1 text-3xl sm:text-4xl font-bold text-[hsl(var(--primary))]"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                المجلة
              </h2>
            </div>
            <Link href="/journal" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] hover:text-primary-container">
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
              <article key={a.title} className="group rounded-2xl overflow-hidden ring-1 ring-outline/15 bg-background hover:bg-card shadow-atlas-sm transition">
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
                  <span className="inline-flex items-center rounded-full bg-atlas-primary/[0.1] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">
                    {a.tag}
                  </span>
                  <h3
                    className="mt-3 text-xl font-semibold leading-snug text-[hsl(var(--primary))]"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{a.excerpt}</p>
                  <p className="mt-4 text-xs text-on-surface-variant">{a.author} · {a.readTime}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Seller strip — for artisans and ateliers */}
      {/* Positioned after Journal (white bg) so two indigo-900 strips are never adjacent: Tailoring CTA → light sections → Journal (white) → Seller Strip → Newsletter */}
      <section className="py-16 bg-[hsl(var(--primary))] text-white relative overflow-hidden">
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
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--secondary))] font-medium mb-3">
            للحرفيين والورشات
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
              className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--on-secondary))] font-semibold text-sm hover:opacity-90 transition-opacity duration-200"
            >
              Open your boutique
            </a>
            {/* AI seller chip */}
            <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-medium">
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
