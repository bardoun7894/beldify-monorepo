'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import { Shop } from '@/lib/types/shop';
import { shopService } from '@/services/shopService';
import { useParams, useRouter } from 'next/navigation';
import { getImageUrl, handleImageError } from '@/utils/imageUtils';
import { default as ProductCard } from '@/components/products/ProductCard';
import ShareButton from '@/components/share/ShareButton';
import FollowShopButton from './FollowShopButton';
import {
  Star,
  BadgeCheck,
  MapPin,
  MessageCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import logger from '@/utils/consoleLogger';
import toast from '@/utils/toast';

// ─── helpers ────────────────────────────────────────────────────────────────

function yearsOnBeldify(createdAt: string | undefined): number {
  if (!createdAt) return 1;
  const created = new Date(createdAt).getFullYear();
  const now = new Date().getFullYear();
  return Math.max(1, now - created);
}

function extractCity(shop: Shop): string {
  const raw =
    (shop as any).city ||
    shop.location ||
    shop.profile?.location ||
    shop.profile?.address ||
    '';
  if (!raw) return 'Morocco';
  return raw.split(',')[0].trim() || 'Morocco';
}

const ATELIER_IMAGES = [
  'https://pro.beldify.com/storage/categories/category_4_caftan.png',
  'https://pro.beldify.com/storage/categories/category_7_jabador.png',
  'https://pro.beldify.com/storage/categories/category_14_wedding-dresses.png',
  'https://pro.beldify.com/storage/categories/category_8_mens-kandora.png',
];


const TABS = [
  { id: 'all', label: 'All Products' },
  { id: 'caftans', label: 'Caftans' },
  { id: 'mens', label: "Men's" },
  { id: 'bespoke', label: 'Bespoke' },
  { id: 'reviews', label: 'Reviews' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// Only pills that map to a real product field — fabricated festival/new/sale removed
const FILTER_PILLS = [
  { id: 'bespoke', label: 'Bespoke only' },
];

type SortBy = 'featured' | 'price_asc' | 'price_desc' | 'newest';

function productPrice(p: any): number {
  const raw = p?.price ?? p?.sale_price ?? p?.current_price ?? 0;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}


// ─── Loading skeleton ────────────────────────────────────────────────────────
function ShopProfileSkeleton() {
  return (
    <div className="bg-canvas min-h-screen">
      {/* Cover skeleton */}
      <div className="h-72 sm:h-[28rem] bg-gray-100 animate-pulse" />
      {/* Stats card skeleton */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="rounded-2xl bg-gray-100 h-28 animate-pulse" />
      </div>
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-6 pt-12 space-y-4">
        <div className="h-8 w-48 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-4 w-full max-w-md rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

// ─── auth helper (preserved from original) ───────────────────────────────────
async function verifyAuthentication(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const sources = ['authToken', 'auth_token', 'token', 'access_token'];
  let token: string | null = null;
  for (const src of sources) {
    const found = localStorage.getItem(src);
    if (found) { token = found; break; }
  }
  if (!token) return false;
  try {
    return token.length >= 10 && token !== 'null' && token !== 'undefined';
  } catch { return false; }
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const params = useParams();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [otherShops, setOtherShops] = useState<{ name: string; subtitle: string }[]>([]);

  // Timer refs so navigation/state-update timers don't fire after unmount and
  // are reset (not stacked) on rapid taps.
  const loginRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followVerifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followVerifyCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (loginRedirectTimerRef.current) clearTimeout(loginRedirectTimerRef.current);
      if (followVerifyTimerRef.current) clearTimeout(followVerifyTimerRef.current);
      followVerifyCancelledRef.current = true;
    };
  }, []);

  // ── follow helpers (preserved from original) ──────────────────────────────

  const checkFollowStatus = async (shopId: number) => {
    try {
      const isAuth = await verifyAuthentication();
      if (!isAuth) { setIsFollowing(false); return; }
      const res = await shopService.checkFollowing(shopId);
      if (res.error) { setIsFollowing(false); return; }
      if (res.isAuthenticated !== false) {
        setIsFollowing(res.data?.isFollowing || false);
      } else {
        setIsFollowing(false);
      }
    } catch { setIsFollowing(false); }
  };

  const handleFollow = async () => {
    if (!shop?.id || isFollowActionLoading) return;
    const isAuth = await verifyAuthentication();
    if (!isAuth) {
      toast.error(t('shop.toast.loginToFollow', 'Please login to follow this shop'), { duration: 3000, position: 'bottom-center', id: 'auth-login-required' });
      const currentPath = window.location.pathname;
      if (loginRedirectTimerRef.current) clearTimeout(loginRedirectTimerRef.current);
      loginRedirectTimerRef.current = setTimeout(
        () => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`),
        1500
      );
      return;
    }
    setIsFollowActionLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      const res = prev ? await shopService.unfollowShop(shop.id) : await shopService.followShop(shop.id);
      if (res?.error) { setIsFollowing(prev); toast.error(res.error || t('shop.toast.actionFailed', 'Action failed')); return; }
      if (res?.isAuthenticated === false) {
        setIsFollowing(prev);
        toast.error(t('shop.toast.authError', 'Authentication error. Please login again'), { duration: 3000, id: 'auth-error' });
        if (loginRedirectTimerRef.current) clearTimeout(loginRedirectTimerRef.current);
        loginRedirectTimerRef.current = setTimeout(
          () => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`),
          1500
        );
        return;
      }
      toast.success(t('shop.toast.followSuccess', 'Successfully {{action}} shop', { action: prev ? 'unfollowed' : 'followed' }), { duration: 2000, id: 'follow-success' });
      if (followVerifyTimerRef.current) clearTimeout(followVerifyTimerRef.current);
      followVerifyTimerRef.current = setTimeout(async () => {
        if (followVerifyCancelledRef.current) return;
        try {
          const ver = await shopService.checkFollowing(shop.id);
          if (followVerifyCancelledRef.current) return;
          if (ver.data?.isFollowing !== undefined) setIsFollowing(ver.data.isFollowing);
        } catch { /* silent */ }
      }, 1000);
    } catch { setIsFollowing(isFollowing); toast.error(t('shop.toast.genericError', 'An error occurred')); }
    finally { setIsFollowActionLoading(false); }
  };

  // ── fetch ──────────────────────────────────────────────────────────────────

  // "Discover more ateliers" — live shops list (replaces a hardcoded slug list
  // that could 404). Section hides itself when the fetch fails or comes back empty.
  useEffect(() => {
    if (!params?.name) return;
    const current = decodeURIComponent(params.name as string).toLowerCase();
    let cancelled = false;
    shopService
      .getShops({ per_page: 8 })
      .then((res) => {
        if (cancelled) return;
        const shops: any[] = res?.data?.shops ?? [];
        setOtherShops(
          shops
            .filter((s) => (s?.name ?? '').toLowerCase() !== current)
            .slice(0, 4)
            .map((s) => ({
              name: s.name ?? s.profile?.store_name ?? '',
              subtitle: s.store_type?.name ?? s.profile?.address?.city ?? '',
            }))
            .filter((s) => s.name)
        );
      })
      .catch(() => {
        if (!cancelled) setOtherShops([]);
      });
    return () => {
      cancelled = true;
    };
  }, [params?.name]);

  useEffect(() => {
    if (!params?.name) return;
    const fetchShop = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const storeName = decodeURIComponent(params.name as string);
        logger.log('Fetching shop with name:', storeName);
        const response = await shopService.getShopByName(storeName);
        if (response.error) { setError(response.error.message); return; }
        if (response.data?.store) {
          const shopData: Shop = {
            ...response.data.store,
            created_at: (response.data.store as any).created_at || new Date().toISOString(),
            updated_at: (response.data.store as any).updated_at || new Date().toISOString(),
            store_type: { id: 0, name: '', name_ar: undefined, slug: '', capabilities: [] },
            profile: {
              store_name: '',
              store_name_ar: undefined,
              store_logo: null,
              cover_image: undefined,
              description: null,
              description_ar: undefined,
              contact_email: null,
              contact_phone: null,
              website: null,
              address: undefined,
              location: undefined,
              business_hours: {},
              shipping_methods: [],
              payment_methods: [],
              return_policy: null,
              shipping_policy: null,
              is_verified: false,
              is_featured: undefined,
              status: 'suspended',
              social_media: {},
              business_categories: [],
              rating: 0,
              total_reviews: 0,
              total_sales: 0,
              store_locations: [],
            },
            status: '',
            is_active: false,
          };
          setShop(shopData);
          if (response.data.store.id) await checkFollowStatus(response.data.store.id);
        } else {
          setError(t('shops.not_found'));
        }
      } catch (err: any) {
        logger.error('Error in fetchShop:', err);
        setError(t('shops.error_message'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchShop();
  }, [params?.name, t]);

  // ── derived data ───────────────────────────────────────────────────────────

  const allProducts = shop?.products || [];
  const tabFiltered = activeTab === 'reviews'
    ? []
    : allProducts.filter((p) => {
        if (activeTab === 'all') return true;
        const cat = (p.category || p.category_name || '').toLowerCase();
        if (activeTab === 'caftans') return cat.includes('caftan') || cat.includes('kaftan');
        if (activeTab === 'mens') return cat.includes('men') || cat.includes('djellaba');
        if (activeTab === 'bespoke') return cat.includes('bespoke') || p.is_bespoke;
        return true;
      });

  // Apply active filter pills (only mappable fields) then sort — client-side
  // over already-fetched data; no data-fetching change.
  const pillFiltered = activeFilters.has('bespoke')
    ? tabFiltered.filter((p) => (p as any).is_bespoke)
    : tabFiltered;

  const filteredProducts = [...pillFiltered].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return productPrice(a) - productPrice(b);
      case 'price_desc':
        return productPrice(b) - productPrice(a);
      case 'newest':
        return (
          new Date((b as any).created_at || 0).getTime() -
          new Date((a as any).created_at || 0).getTime()
        );
      default:
        return 0; // featured — preserve API order
    }
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const rating = shop?.rating ?? shop?.profile?.rating ?? 0;
  const reviewsCount = shop?.reviews_count ?? shop?.total_reviews ?? shop?.profile?.total_reviews ?? 0;
  const productsCount = shop?.products_count ?? allProducts.length;
  const years = yearsOnBeldify(shop?.created_at);
  const isVerified = shop?.is_verified ?? shop?.profile?.is_verified ?? false;
  const rawCity = shop ? extractCity(shop) : 'Morocco';
  const city = rawCity === 'Morocco' ? t('shop.city.default', 'Morocco') : rawCity;

  const rawDescription = shop?.description ?? shop?.profile?.description ?? '';
  const descParagraphs = rawDescription
    ? rawDescription.split(/\n\n+/).filter(Boolean)
    : [t('shop.description.fallback', 'This atelier brings the finest Moroccan craftsmanship directly to you. Each piece is hand-stitched with care and precision.')];

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── loading / error ────────────────────────────────────────────────────────

  if (isLoading) return <ShopProfileSkeleton />;

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas gap-5 px-6">
        <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-atlas-sm px-10 py-12 flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <p
            className="text-5xl font-bold text-indigo-700"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            aria-hidden="true"
          >
            404
          </p>
          <p className="text-xl font-semibold text-gray-900">{error || t('shops.not_found', 'Shop not found')}</p>
          <p className="text-gray-600 text-sm">{t('shops.try_again', 'Please try again later')}</p>
          <Link
            href="/shops"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-700 px-7 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2"
          >
            {t('shops.browse', 'Browse ateliers')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  const shopId = shop?.id;

  // BreadcrumbList + Store JSON-LD — mirrors the rich-result coverage the
  // /category/[slug] and /products pages emit. AggregateRating only emitted when
  // the seller has real reviews (Google rejects schemas with rating but no count).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com';
  const shopUrl = `${siteUrl}/shops/${encodeURIComponent(shop.name)}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('navigation.home', 'Home'), item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: t('navigation.stores', 'Shops'), item: `${siteUrl}/shops` },
      { '@type': 'ListItem', position: 3, name: shop.name, item: shopUrl },
    ],
  };
  const storeImage =
    shop.cover_image ||
    shop.profile?.cover_image ||
    shop.profile?.store_logo ||
    undefined;
  const storeJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    url: shopUrl,
    ...(storeImage ? { image: storeImage } : {}),
    ...(rawDescription ? { description: rawDescription } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: rawCity,
      addressCountry: 'MA',
    },
  };
  if (rating > 0 && reviewsCount > 0) {
    storeJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      reviewCount: reviewsCount,
      bestRating: '5',
      worstRating: '1',
    };
  }
  const itemListJsonLd =
    allProducts.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: allProducts.slice(0, 24).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${siteUrl}/products/${p.id}`,
            name: p.name,
          })),
        }
      : null;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-canvas min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      {/* ── 1. Cover Hero ──────────────────────────────────────────────────── */}
      <section className="relative h-72 sm:h-[28rem] overflow-hidden bg-indigo-950">
        <Image
          src={getImageUrl(shop.cover_image || shop.profile?.cover_image, '/images/hero-atelier.jpg')}
          alt={t('shop.cover_alt', 'Atelier cover — {{name}}', { name: shop.name })}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          onError={handleImageError}
        />
        {/* Gradient overlay — bottom-up indigo wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, hsl(246 50% 21% / 0.90) 0%, hsl(243 75% 51% / 0.40) 50%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        {/* Verified badge — top end (RTL-safe) */}
        {isVerified && (
          <div className="absolute top-6 end-6 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-atlas-sm">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('shop.verified', 'Verified by Beldify')}
            </span>
          </div>
        )}

        {/* Bottom content — city + shop name + tagline */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="max-w-7xl mx-auto px-6 pb-8">
            <div className="flex items-center gap-1.5 mb-3 text-amber-300">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">{city}</span>
            </div>
            <h1
              className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-sm"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {shop.name}
            </h1>
            <p className="mt-2 text-indigo-100 text-base sm:text-lg max-w-xl leading-snug">
              {(shop as any).tagline || t('shop.tagline_default', "Hand-stitched caftans & traditional men's wear")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Stats strip (overlapping card) ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 sm:-mt-14 relative z-10">
        <div className="bg-white ring-1 ring-gray-200 rounded-2xl px-6 py-5 shadow-atlas-md">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 divide-x divide-gray-100 rtl:divide-x-reverse">
            {/* Rating */}
            <div className="text-center px-4">
              <dt className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                {reviewsCount > 0
                  ? t('shop.stats.reviews', '{{count}} reviews', { count: reviewsCount })
                  : t('shop.stats.no_reviews', 'No reviews yet')}
              </dt>
              <dd
                className="mt-1 text-3xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {rating > 0 ? rating.toFixed(1) : '—'}{' '}
                <span className="text-amber-500 text-2xl" aria-hidden="true">★</span>
              </dd>
            </div>
            {/* Products */}
            <div className="text-center px-4">
              <dt className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                {t('shop.stats.products', 'Products')}
              </dt>
              <dd
                className="mt-1 text-3xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {productsCount || '—'}
              </dd>
            </div>
            {/* Years */}
            <div className="text-center px-4">
              <dt className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                {t('shop.stats.years', 'Years on Beldify')}
              </dt>
              <dd
                className="mt-1 text-3xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {years}
              </dd>
            </div>
            {/* Response time — only show if data implies it (static label only) */}
            <div className="text-center px-4">
              <dt className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                {t('shop.stats.response', 'Response')}
              </dt>
              <dd
                className="mt-1 text-3xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('shop.stats.response_value', 'Fast')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── 3. About / atelier story ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-start">
        {/* Left: text */}
        <div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('shop.about_heading', 'Inside {{name}}', { name: shop.name })}
          </h2>
          <div className="mt-6 space-y-4 max-w-prose">
            {descParagraphs.map((para, i) => (
              <p key={i} className="text-gray-600 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Follow CTA — investment framing per hooked §1 ethics spec */}
          <FollowShopButton
            shopName={shop.name}
            isFollowing={isFollowing}
            isLoading={isFollowActionLoading}
            onToggle={handleFollow}
            className="mt-8"
          />

          {/* Share the atelier — sellers paste this into their bio/Status to
              funnel their own audience into Beldify. */}
          <ShareButton
            className="mt-8 ltr:ml-3 rtl:mr-3 align-top"
            title={shop?.name}
            label={t('share.share_shop', 'Share atelier')}
          />
        </div>

        {/* Right: 2×2 staggered image grid */}
        <div className="grid grid-cols-2 gap-4">
          {ATELIER_IMAGES.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm ${
                i === 1 ? 'mt-8' : i === 2 ? '-mt-8' : ''
              }`}
              style={{ aspectRatio: '4/5' }}
            >
              <Image
                src={src}
                alt={t('shop.atelier_image_alt', 'Atelier interior {{n}}', { n: i + 1 })}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
                onError={handleImageError}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Tab strip ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-16 z-30 bg-gray-50 backdrop-blur border-y border-gray-200"
        role="tablist"
        aria-label={t('shop.tabs_label', 'Product categories')}
      >
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setVisibleCount(8);
                if (tab.id === 'reviews') {
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`whitespace-nowrap text-sm pb-3 -mb-px pt-3 px-3 transition font-medium focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:rounded-sm ${
                activeTab === tab.id
                  ? 'text-indigo-700 border-b-2 border-indigo-700 font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t(`shop.tab.${tab.id}`, tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Filter pills + sort ─────────────────────────────────────────── */}
      {activeTab !== 'reviews' && (
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                onClick={() => toggleFilter(pill.id)}
                aria-pressed={activeFilters.has(pill.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition font-medium focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-1 ${
                  activeFilters.has(pill.id)
                    ? 'bg-indigo-700 text-white'
                    : 'bg-amber-50 ring-1 ring-amber-200 text-gray-900 hover:bg-amber-100'
                }`}
              >
                {t(`shop.filter.${pill.id}`, pill.label)}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortBy); setVisibleCount(8); }}
            className="shrink-0 rounded-full bg-white ring-1 ring-gray-200 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-700"
            aria-label={t('shop.sort_label', 'Sort products')}
          >
            <option value="featured">{t('shop.sort.featured', 'Featured')}</option>
            <option value="price_asc">{t('shop.sort.price_asc', 'Price: low to high')}</option>
            <option value="price_desc">{t('shop.sort.price_desc', 'Price: high to low')}</option>
            <option value="newest">{t('shop.sort.newest', 'Newest')}</option>
          </select>
        </div>
      )}

      {/* ── 6. Products grid ───────────────────────────────────────────────── */}
      {activeTab !== 'reviews' && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white ring-1 ring-gray-200 rounded-2xl shadow-atlas-sm text-center px-6">
              <p className="text-gray-600 text-sm">
                {t('shop.no_products_found', 'No products found in this category.')}
              </p>
            </div>
          )}

          {/* Load more */}
          {visibleCount < filteredProducts.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + 8)}
                className="rounded-full bg-white ring-1 ring-indigo-700 text-indigo-700 px-8 py-3 text-sm font-semibold hover:bg-indigo-50 transition focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2"
              >
                {t('shop.load_more', 'Load more')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 7. Reviews section ─────────────────────────────────────────────── */}
      <section
        id="reviews"
        className="bg-white border-y border-gray-200 py-16"
        aria-labelledby="reviews-heading"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2
            id="reviews-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('shop.reviews_heading', 'Voices from our shoppers')}
          </h2>

          {reviewsCount > 0 ? (
            /* Honest aggregate only — individual review fetching has no backend
               endpoint yet, so no per-review cards are fabricated. */
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-200 px-6 py-12 text-center">
              <div className="flex gap-1 mb-4" aria-hidden="true">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`h-6 w-6 ${j < Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {rating > 0 ? rating.toFixed(1) : '—'} · {t('shop.reviews_aggregate', '{{count}} verified reviews', { count: reviewsCount })}
              </p>
              <p className="mt-2 max-w-xs text-sm text-gray-600">
                {t('shop.reviews_aggregate_sub', 'Ratings are collected from verified buyers after delivery.')}
              </p>
            </div>
          ) : (
            /* Designed empty state — no fabricated testimonials when there are no reviews */
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-200 px-6 py-16 text-center">
              <div
                className="h-14 w-14 rounded-full bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center mb-5"
                aria-hidden="true"
              >
                <Star className="h-7 w-7 text-amber-500" aria-hidden="true" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {t('shop.no_reviews_title', 'No reviews yet')}
              </p>
              <p className="mt-2 max-w-xs text-sm text-gray-600">
                {t('shop.no_reviews_sub', 'Be the first to share your experience with this atelier.')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 8. Bespoke / contact strip ────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-indigo-950 py-16"
        aria-labelledby="bespoke-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 55% 60% at 15% 80%, hsl(38 92% 50% / 0.18) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 85% 20%, hsl(243 75% 51% / 0.20) 0%, transparent 55%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: CTA */}
          <div>
            <h2
              id="bespoke-heading"
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('shop.bespoke_heading', 'Have something specific in mind?')}
            </h2>
            <p className="mt-4 text-indigo-200 max-w-md leading-relaxed text-sm sm:text-base">
              {t(
                'shop.bespoke_sub',
                'Commission a custom piece tailored exactly to your measurements and vision, crafted with ancestral techniques.',
              )}
            </p>
            <Link
              href={shopId ? `/community/messages/${shopId}` : '/contact'}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-amber-950 hover:bg-amber-400 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('shop.message_atelier', 'Message the atelier')}
            </Link>
          </div>

          {/* Right: process steps — plain list, no 01/02/03 scaffold */}
          <div className="border-t md:border-t-0 md:border-s border-white/15 pt-8 md:pt-0 md:ps-12 space-y-7">
            {[
              {
                title: t('shop.step1_title', 'Send measurements'),
                desc: t('shop.step1_desc', 'Share your dimensions and design vision via direct message.'),
              },
              {
                title: t('shop.step2_title', 'Confirm design'),
                desc: t('shop.step2_desc', 'Review fabric swatches and finalise the bespoke details.'),
              },
              {
                title: t('shop.step3_title', 'Hand delivered'),
                desc: t('shop.step3_desc', 'Your piece is hand-stitched and delivered worldwide in 3–4 weeks.'),
              },
            ].map((step) => (
              <div key={step.title} className="flex gap-4 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                <div>
                  <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                  <p className="mt-1 text-xs text-indigo-200 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Discover more ateliers (live shops; hidden when none) ───────── */}
      {otherShops.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="discover-heading">
          <h2
            id="discover-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('shop.discover_more', 'Discover more ateliers')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {otherShops.map((atelier) => (
              <Link
                key={atelier.name}
                href={`/shops/${encodeURIComponent(atelier.name)}`}
                className="group bg-white ring-1 ring-gray-200 rounded-2xl p-5 text-center hover:-translate-y-0.5 hover:shadow-atlas-md transition-all duration-200 shadow-atlas-sm focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2"
              >
                <div
                  className="h-14 w-14 rounded-full bg-amber-100 ring-1 ring-amber-200 mx-auto mb-3 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-lg font-bold text-amber-800">
                    {atelier.name.charAt(0)}
                  </span>
                </div>
                <h4
                  className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {atelier.name}
                </h4>
                {atelier.subtitle && (
                  <p className="mt-1 text-xs text-gray-500">{atelier.subtitle}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
